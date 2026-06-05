import os
import uuid
from contextlib import asynccontextmanager
from pathlib import Path

import yaml
from fastapi import FastAPI, Depends, HTTPException, Cookie, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)


def _seed_from_yaml(db: Session) -> None:
    quiz_dir = Path(__file__).parent / "quizzes"
    if not quiz_dir.is_dir():
        return
    existing_titles = {q.title for q in db.query(models.Quiz.title).all()}
    for path in sorted(quiz_dir.glob("*.yaml")):
        data = yaml.safe_load(path.read_text())
        if data["title"] in existing_titles:
            continue
        quiz = models.Quiz(title=data["title"], description=data.get("description", ""))
        db.add(quiz)
        db.flush()
        for i, q in enumerate(data["questions"]):
            options = [str(o) for o in q["options"]]
            correct = str(q["correct"])
            db.add(models.Question(
                quiz_id=quiz.id,
                text=q["text"],
                options=options,
                correct_index=options.index(correct),
                order=i,
            ))
        existing_titles.add(data["title"])
    db.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db = next(get_db())
    try:
        _seed_from_yaml(db)
    finally:
        db.close()
    yield


app = FastAPI(title="Web Quiz API", lifespan=lifespan)

_cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SESSION_COOKIE = "quiz_session"


def get_session(response: Response, quiz_session: str | None = Cookie(default=None)) -> str:
    if quiz_session:
        return quiz_session
    new_id = str(uuid.uuid4())
    response.set_cookie(
        key=SESSION_COOKIE,
        value=new_id,
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 365,  # 1 year
    )
    return new_id


# ── Quizzes ───────────────────────────────────────────────────────────────────

@app.get("/api/quizzes", response_model=list[schemas.QuizSummary])
def list_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(models.Quiz).order_by(models.Quiz.created_at.desc()).all()
    result = []
    for q in quizzes:
        count = db.query(models.Question).filter(models.Question.quiz_id == q.id).count()
        result.append(schemas.QuizSummary(
            id=q.id,
            title=q.title,
            description=q.description,
            question_count=count,
            created_at=q.created_at,
        ))
    return result


@app.get("/api/quizzes/{quiz_id}", response_model=schemas.QuizDetail)
def get_quiz(quiz_id: str, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    questions = (
        db.query(models.Question)
        .filter(models.Question.quiz_id == quiz_id)
        .order_by(models.Question.order)
        .all()
    )
    return schemas.QuizDetail(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        questions=[schemas.QuestionOut.model_validate(q) for q in questions],
        created_at=quiz.created_at,
    )


@app.post("/api/quizzes", response_model=schemas.QuizSummary, status_code=201)
def create_quiz(payload: schemas.QuizCreate, db: Session = Depends(get_db)):
    if not payload.questions:
        raise HTTPException(status_code=422, detail="Quiz must have at least one question")
    quiz = models.Quiz(title=payload.title, description=payload.description)
    db.add(quiz)
    db.flush()
    for i, q in enumerate(payload.questions):
        question = models.Question(
            quiz_id=quiz.id,
            text=q.text,
            options=q.options,
            correct_index=q.correct_index,
            order=i,
        )
        db.add(question)
    db.commit()
    db.refresh(quiz)
    return schemas.QuizSummary(
        id=quiz.id,
        title=quiz.title,
        description=quiz.description,
        question_count=len(payload.questions),
        created_at=quiz.created_at,
    )


@app.delete("/api/quizzes/{quiz_id}", status_code=204)
def delete_quiz(quiz_id: str, db: Session = Depends(get_db)):
    quiz = db.query(models.Quiz).filter(models.Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
    db.query(models.Question).filter(models.Question.quiz_id == quiz_id).delete()
    db.query(models.Attempt).filter(models.Attempt.quiz_id == quiz_id).delete()
    db.delete(quiz)
    db.commit()


# ── Attempts ──────────────────────────────────────────────────────────────────

@app.post("/api/quizzes/{quiz_id}/submit", response_model=schemas.AttemptResult)
def submit_quiz(
    quiz_id: str,
    payload: schemas.SubmitAnswers,
    db: Session = Depends(get_db),
    session_id: str = Depends(get_session),
):
    questions = (
        db.query(models.Question)
        .filter(models.Question.quiz_id == quiz_id)
        .order_by(models.Question.order)
        .all()
    )
    if not questions:
        raise HTTPException(status_code=404, detail="Quiz not found")
    if len(payload.answers) != len(questions):
        raise HTTPException(
            status_code=422,
            detail=f"Expected {len(questions)} answers, got {len(payload.answers)}",
        )

    score = sum(
        1 for q, a in zip(questions, payload.answers) if q.correct_index == a
    )

    attempt = models.Attempt(
        quiz_id=quiz_id,
        session_id=session_id,
        answers=payload.answers,
        score=score,
        total=len(questions),
    )
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return schemas.AttemptResult(
        id=attempt.id,
        quiz_id=quiz_id,
        score=score,
        total=len(questions),
        answers=payload.answers,
        questions=[schemas.QuestionWithAnswer.model_validate(q) for q in questions],
        taken_at=attempt.taken_at,
    )


@app.get("/api/attempts", response_model=list[schemas.AttemptSummary])
def list_attempts(
    db: Session = Depends(get_db),
    session_id: str = Depends(get_session),
):
    attempts = (
        db.query(models.Attempt)
        .filter(models.Attempt.session_id == session_id)
        .order_by(models.Attempt.taken_at.desc())
        .all()
    )
    result = []
    for a in attempts:
        quiz = db.query(models.Quiz).filter(models.Quiz.id == a.quiz_id).first()
        result.append(schemas.AttemptSummary(
            id=a.id,
            quiz_id=a.quiz_id,
            quiz_title=quiz.title if quiz else "(deleted)",
            score=a.score,
            total=a.total,
            taken_at=a.taken_at,
        ))
    return result


@app.get("/api/attempts/{attempt_id}", response_model=schemas.AttemptResult)
def get_attempt(
    attempt_id: str,
    db: Session = Depends(get_db),
    session_id: str = Depends(get_session),
):
    attempt = db.query(models.Attempt).filter(models.Attempt.id == attempt_id).first()
    if not attempt or attempt.session_id != session_id:
        raise HTTPException(status_code=404, detail="Attempt not found")

    questions = (
        db.query(models.Question)
        .filter(models.Question.quiz_id == attempt.quiz_id)
        .order_by(models.Question.order)
        .all()
    )

    return schemas.AttemptResult(
        id=attempt.id,
        quiz_id=attempt.quiz_id,
        score=attempt.score,
        total=attempt.total,
        answers=attempt.answers,
        questions=[schemas.QuestionWithAnswer.model_validate(q) for q in questions],
        taken_at=attempt.taken_at,
    )

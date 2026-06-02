from datetime import datetime
from pydantic import BaseModel


# ── Question ──────────────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    text: str
    options: list[str]
    correct_index: int


class QuestionOut(BaseModel):
    id: str
    text: str
    options: list[str]
    order: int

    model_config = {"from_attributes": True}


class QuestionWithAnswer(QuestionOut):
    correct_index: int


# ── Quiz ──────────────────────────────────────────────────────────────────────

class QuizCreate(BaseModel):
    title: str
    description: str = ""
    questions: list[QuestionCreate]


class QuizSummary(BaseModel):
    id: str
    title: str
    description: str
    question_count: int
    created_at: datetime

    model_config = {"from_attributes": True}


class QuizDetail(BaseModel):
    id: str
    title: str
    description: str
    questions: list[QuestionOut]
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Attempt ───────────────────────────────────────────────────────────────────

class SubmitAnswers(BaseModel):
    answers: list[int]   # one chosen index per question, in order


class AttemptResult(BaseModel):
    id: str
    quiz_id: str
    score: int
    total: int
    answers: list[int]
    questions: list[QuestionWithAnswer]
    taken_at: datetime

    model_config = {"from_attributes": True}


class AttemptSummary(BaseModel):
    id: str
    quiz_id: str
    quiz_title: str
    score: int
    total: int
    taken_at: datetime

    model_config = {"from_attributes": True}

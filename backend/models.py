import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, JSON
from database import Base


def new_uuid():
    return str(uuid.uuid4())


class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=new_uuid)
    title = Column(String, nullable=False)
    description = Column(String, default="")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class Question(Base):
    __tablename__ = "questions"

    id = Column(String, primary_key=True, default=new_uuid)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    options = Column(JSON, nullable=False)   # list[str]
    correct_index = Column(Integer, nullable=False)
    order = Column(Integer, nullable=False, default=0)


class Attempt(Base):
    __tablename__ = "attempts"

    id = Column(String, primary_key=True, default=new_uuid)
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String, nullable=False, index=True)
    answers = Column(JSON, nullable=False)   # list[int] — chosen index per question
    score = Column(Integer, nullable=False)
    total = Column(Integer, nullable=False)
    taken_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

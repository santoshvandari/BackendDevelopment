import enum
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
from sqlmodel import SQLModel, Field, Relationship, Column, JSON


class QuestionType(str, enum.Enum):
    TEXT = "text"
    SINGLE_SELECT = "single_select"
    MULTI_SELECT = "multi_select"
    RATING = "rating"


class Survey(SQLModel, table=True):
    __tablename__ = "surveys"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(index=True)
    description: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    questions: List["Question"] = Relationship(
        back_populates="survey", cascade_delete=True
    )
    responses: List["SurveyResponse"] = Relationship(
        back_populates="survey", cascade_delete=True
    )


class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: Optional[int] = Field(default=None, primary_key=True)
    survey_id: int = Field(foreign_key="surveys.id", index=True)
    text: str
    question_type: QuestionType
    is_required: bool = Field(default=False)
    order: int = Field(default=0)
    conditional_logic: Optional[Dict[str, Any]] = Field(
        default=None, sa_column=Column(JSON)
    )

    # Relationships
    survey: Optional[Survey] = Relationship(back_populates="questions")
    options: List["QuestionOption"] = Relationship(
        back_populates="question", cascade_delete=True
    )
    answers: List["Answer"] = Relationship(
        back_populates="question", cascade_delete=True
    )


class QuestionOption(SQLModel, table=True):
    __tablename__ = "question_options"

    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="questions.id", index=True)
    label: str
    value: str
    order: int = Field(default=0)

    # Relationships
    question: Optional[Question] = Relationship(back_populates="options")


class SurveyResponse(SQLModel, table=True):
    __tablename__ = "survey_responses"

    id: Optional[int] = Field(default=None, primary_key=True)
    survey_id: int = Field(foreign_key="surveys.id", index=True)
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    # Relationships
    survey: Optional[Survey] = Relationship(back_populates="responses")
    answers: List["Answer"] = Relationship(
        back_populates="response", cascade_delete=True
    )


class Answer(SQLModel, table=True):
    __tablename__ = "answers"

    id: Optional[int] = Field(default=None, primary_key=True)
    response_id: int = Field(foreign_key="survey_responses.id", index=True)
    question_id: int = Field(foreign_key="questions.id", index=True)
    value: Any = Field(default=None, sa_column=Column(JSON))

    # Relationships
    response: Optional[SurveyResponse] = Relationship(back_populates="answers")
    question: Optional[Question] = Relationship(back_populates="answers")

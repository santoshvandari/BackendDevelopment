from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime
from models.survey import QuestionType


class QuestionOptionBase(BaseModel):
    label: str
    value: str
    order: int = 0


class QuestionOptionCreate(QuestionOptionBase):
    pass


class QuestionOptionRead(QuestionOptionBase):
    id: int
    question_id: int


class QuestionBase(BaseModel):
    text: str
    question_type: QuestionType
    is_required: bool = False
    order: int = 0
    conditional_logic: Optional[Dict[str, Any]] = None


class QuestionCreate(QuestionBase):
    options: Optional[List[QuestionOptionCreate]] = []


class QuestionRead(QuestionBase):
    id: int
    survey_id: int
    options: List[QuestionOptionRead] = []


class SurveyBase(BaseModel):
    title: str
    description: Optional[str] = None


class SurveyCreate(SurveyBase):
    questions: Optional[List[QuestionCreate]] = []


class SurveyUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    questions: Optional[List[QuestionCreate]] = None


class SurveyRead(SurveyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    questions: List[QuestionRead] = []


class SurveyListItem(SurveyBase):
    id: int
    created_at: datetime
    updated_at: datetime
    question_count: int = 0
    response_count: int = 0


class PaginatedSurveyResponse(BaseModel):
    items: List[SurveyListItem]
    total: int
    page: int
    page_size: int
    total_pages: int


class AnswerSubmission(BaseModel):
    question_id: int
    value: Any


class ResponseSubmit(BaseModel):
    answers: List[AnswerSubmission]


class AnswerRead(BaseModel):
    id: int
    question_id: int
    value: Any


class SurveyResponseRead(BaseModel):
    id: int
    survey_id: int
    submitted_at: datetime
    answers: List[AnswerRead] = []


class QuestionAnalytics(BaseModel):
    question_id: int
    text: str
    question_type: QuestionType
    total_answers: int
    data: Any


class SurveyAnalytics(BaseModel):
    survey_id: int
    survey_title: str
    total_responses: int
    question_analytics: List[QuestionAnalytics]

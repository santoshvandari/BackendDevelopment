from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func
from typing import List
import math
from datetime import datetime, timezone

from database import get_session
from models import Survey, Question, QuestionOption, SurveyResponse, Answer
from auth import get_current_active_user
from schema import (
    SurveyCreate,
    SurveyUpdate,
    SurveyRead,
    SurveyListItem,
    PaginatedSurveyResponse,
    ResponseSubmit,
    SurveyResponseRead,
    SurveyAnalytics,
    QuestionAnalytics,
    QuestionType,
    User,
)

router = APIRouter(prefix="/surveys", tags=["Surveys"])


@router.post("/", response_model=SurveyRead)
def create_survey(
    payload: SurveyCreate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_active_user),
):
    # Construct the entire question + option hierarchy in-memory
    new_questions: List[Question] = []
    if payload.questions:
        for q_data in payload.questions:
            options = [
                QuestionOption(
                    label=opt.label,
                    value=opt.value,
                    order=opt.order,
                )
                for opt in (q_data.options or [])
            ]
            new_questions.append(
                Question(
                    text=q_data.text,
                    question_type=q_data.question_type,
                    is_required=q_data.is_required,
                    order=q_data.order,
                    conditional_logic=q_data.conditional_logic,
                    options=options,
                )
            )

    survey = Survey(
        title=payload.title,
        description=payload.description,
        questions=new_questions,
    )

    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


@router.get("/", response_model=PaginatedSurveyResponse)
def list_surveys(
    page: int = Query(default=1, ge=1, description="Page number starting from 1"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    session: Session = Depends(get_session),
):
    total_count = session.exec(select(func.count(Survey.id))).one()
    if total_count == 0:
        return PaginatedSurveyResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=0,
        )

    offset = (page - 1) * page_size
    total_pages = math.ceil(total_count / page_size) if total_count > 0 else 0

    surveys = session.exec(
        select(Survey)
        .order_by(Survey.created_at.desc())
        .offset(offset)
        .limit(page_size)
    ).all()

    items = [
        SurveyListItem(
            id=s.id,
            title=s.title,
            description=s.description,
            created_at=s.created_at,
            updated_at=s.updated_at,
            question_count=len(s.questions),
            response_count=len(s.responses),
        )
        for s in surveys
    ]

    return PaginatedSurveyResponse(
        items=items,
        total=total_count,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{survey_id}", response_model=SurveyRead)
def get_survey(survey_id: int, session: Session = Depends(get_session)):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found"
        )
    return survey


@router.put("/{survey_id}", response_model=SurveyRead)
def update_survey(
    survey_id: int,
    payload: SurveyUpdate,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_active_user),
):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found"
        )

    if payload.title is not None:
        survey.title = payload.title
    if payload.description is not None:
        survey.description = payload.description

    survey.updated_at = datetime.now(timezone.utc)

    if payload.questions is not None:
        for old_q in list(survey.questions):
            session.delete(old_q)

        new_questions: List[Question] = []
        for q_data in payload.questions:
            options = [
                QuestionOption(
                    label=opt.label,
                    value=opt.value,
                    order=opt.order,
                )
                for opt in (q_data.options or [])
            ]
            new_questions.append(
                Question(
                    text=q_data.text,
                    question_type=q_data.question_type,
                    is_required=q_data.is_required,
                    order=q_data.order,
                    conditional_logic=q_data.conditional_logic,
                    options=options,
                )
            )
        survey.questions = new_questions

    session.add(survey)
    session.commit()
    session.refresh(survey)
    return survey


@router.delete("/{survey_id}")
def delete_survey(
    survey_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_active_user),
):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found"
        )
    session.delete(survey)
    session.commit()
    return {"message": "Survey deleted successfully", "id": survey_id}


@router.post(
    "/{survey_id}/responses",
    response_model=SurveyResponseRead,
)
def submit_response(
    survey_id: int, payload: ResponseSubmit, session: Session = Depends(get_session)
):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found"
        )

    submitted_question_ids = {a.question_id: a.value for a in payload.answers}
    for question in survey.questions:
        if question.is_required:
            val = submitted_question_ids.get(question.id)
            if val is None or val == "" or val == []:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Question '{question.text}' (id: {question.id}) is required.",
                )

    answers = [
        Answer(question_id=item.question_id, value=item.value)
        for item in payload.answers
    ]
    new_response = SurveyResponse(survey_id=survey.id, answers=answers)

    session.add(new_response)
    session.commit()
    session.refresh(new_response)
    return new_response


@router.get("/{survey_id}/analytics", response_model=SurveyAnalytics)
def get_survey_analytics(
    survey_id: int,
    session: Session = Depends(get_session),
    admin: User = Depends(get_current_active_user),
):
    survey = session.get(Survey, survey_id)
    if not survey:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Survey not found"
        )

    total_responses = len(survey.responses)
    analytics_items = []

    for q in survey.questions:
        q_answers = session.exec(select(Answer).where(Answer.question_id == q.id)).all()
        total_q_answers = len(q_answers)

        if q.question_type == QuestionType.TEXT:
            values = [
                ans.value
                for ans in q_answers
                if ans.value is not None and str(ans.value).strip() != ""
            ]
            analytics_items.append(
                QuestionAnalytics(
                    question_id=q.id,
                    text=q.text,
                    question_type=q.question_type,
                    total_answers=total_q_answers,
                    data={"responses": values},
                )
            )

        elif q.question_type == QuestionType.RATING:
            rating_values = []
            for ans in q_answers:
                try:
                    if ans.value is not None:
                        rating_values.append(float(ans.value))
                except (ValueError, TypeError):
                    pass
            avg_rating = (
                round(sum(rating_values) / len(rating_values), 2)
                if rating_values
                else 0.0
            )
            distribution = {str(i): rating_values.count(float(i)) for i in range(1, 6)}
            analytics_items.append(
                QuestionAnalytics(
                    question_id=q.id,
                    text=q.text,
                    question_type=q.question_type,
                    total_answers=total_q_answers,
                    data={"average": avg_rating, "distribution": distribution},
                )
            )

        elif q.question_type in (QuestionType.SINGLE_SELECT, QuestionType.MULTI_SELECT):
            counts = {opt.label: 0 for opt in q.options}
            for ans in q_answers:
                if isinstance(ans.value, list):
                    for v in ans.value:
                        counts[str(v)] = counts.get(str(v), 0) + 1
                elif ans.value is not None:
                    counts[str(ans.value)] = counts.get(str(ans.value), 0) + 1

            analytics_items.append(
                QuestionAnalytics(
                    question_id=q.id,
                    text=q.text,
                    question_type=q.question_type,
                    total_answers=total_q_answers,
                    data={"counts": counts},
                )
            )

    return SurveyAnalytics(
        survey_id=survey.id,
        survey_title=survey.title,
        total_responses=total_responses,
        question_analytics=analytics_items,
    )

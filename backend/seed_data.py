from sqlmodel import Session
from database.database import engine
from models import Survey, Question, QuestionOption, SurveyResponse, Answer
from schema.survey import QuestionType

def seed():
    with Session(engine) as session:
        # Survey 1: Product Feedback & User Experience
        s1 = Survey(
            title="Product Feedback & Experience Survey",
            description="Help us improve our platform by sharing your thoughts on performance, features, and overall satisfaction.",
        )
        q1_1 = Question(
            text="Overall, how satisfied are you with our platform?",
            question_type=QuestionType.RATING,
            is_required=True,
            order=0,
            conditional_logic=None,
        )
        q1_2 = Question(
            text="Which features do you find most valuable?",
            question_type=QuestionType.MULTI_SELECT,
            is_required=True,
            order=1,
            conditional_logic=None,
            options=[
                QuestionOption(label="Survey Builder", value="Survey Builder", order=0),
                QuestionOption(label="Analytics Dashboard", value="Analytics Dashboard", order=1),
                QuestionOption(label="Response Export", value="Response Export", order=2),
                QuestionOption(label="API Access", value="API Access", order=3),
            ],
        )
        q1_3 = Question(
            text="Would you recommend our product to a colleague?",
            question_type=QuestionType.SINGLE_SELECT,
            is_required=True,
            order=2,
            conditional_logic=None,
            options=[
                QuestionOption(label="Yes", value="Yes", order=0),
                QuestionOption(label="Maybe", value="Maybe", order=1),
                QuestionOption(label="No", value="No", order=2),
            ],
        )
        q1_4 = Question(
            text="What could we do to earn your full recommendation?",
            question_type=QuestionType.TEXT,
            is_required=False,
            order=3,
            conditional_logic={"depends_on_question_index": 2, "trigger_value": "No"},
        )
        q1_5 = Question(
            text="Any additional suggestions or comments for our team?",
            question_type=QuestionType.TEXT,
            is_required=False,
            order=4,
            conditional_logic=None,
        )
        s1.questions = [q1_1, q1_2, q1_3, q1_4, q1_5]
        session.add(s1)
        session.commit()
        session.refresh(s1)

        # Responses for Survey 1
        responses_s1 = [
            (5, ["Survey Builder", "Analytics Dashboard"], "Yes", None, "Super intuitive and fast!"),
            (4, ["Survey Builder"], "Yes", None, "Love the minimalist interface."),
            (4, ["Analytics Dashboard", "API Access"], "Yes", None, "Analytics are clean and clear."),
            (3, ["Survey Builder"], "Maybe", None, "Good start, would like more styling options."),
            (2, ["Response Export"], "No", "Needs more documentation and dark mode support.", "Please improve load times."),
            (5, ["Survey Builder", "Analytics Dashboard", "API Access"], "Yes", None, "Works seamlessly."),
            (4, ["Analytics Dashboard"], "Maybe", None, None),
        ]

        for r in responses_s1:
            rating_val, multi_val, rec_val, follow_val, comment_val = r
            answers = [
                Answer(question_id=s1.questions[0].id, value=rating_val),
                Answer(question_id=s1.questions[1].id, value=multi_val),
                Answer(question_id=s1.questions[2].id, value=rec_val),
            ]
            if follow_val:
                answers.append(Answer(question_id=s1.questions[3].id, value=follow_val))
            if comment_val:
                answers.append(Answer(question_id=s1.questions[4].id, value=comment_val))

            session.add(SurveyResponse(survey_id=s1.id, answers=answers))

        # Survey 2: Developer Tech Stack & Tools 2026
        s2 = Survey(
            title="Developer Tooling & Frameworks Survey",
            description="A quick poll on modern development workflows, frontend preferences, and backend technology choices.",
        )
        q2_1 = Question(
            text="What is your primary frontend framework?",
            question_type=QuestionType.SINGLE_SELECT,
            is_required=True,
            order=0,
            options=[
                QuestionOption(label="Next.js / React", value="Next.js / React", order=0),
                QuestionOption(label="Vue / Nuxt", value="Vue / Nuxt", order=1),
                QuestionOption(label="Svelte / SvelteKit", value="Svelte / SvelteKit", order=2),
                QuestionOption(label="Other", value="Other", order=3),
            ],
        )
        q2_2 = Question(
            text="Which backend technologies do you use in production?",
            question_type=QuestionType.MULTI_SELECT,
            is_required=True,
            order=1,
            options=[
                QuestionOption(label="FastAPI / Python", value="FastAPI / Python", order=0),
                QuestionOption(label="Node.js / Express", value="Node.js / Express", order=1),
                QuestionOption(label="Go", value="Go", order=2),
                QuestionOption(label="Rust", value="Rust", order=3),
            ],
        )
        q2_3 = Question(
            text="How would you rate your developer experience with fullstack TypeScript?",
            question_type=QuestionType.RATING,
            is_required=True,
            order=2,
        )
        q2_4 = Question(
            text="What is the single biggest pain point in your daily development routine?",
            question_type=QuestionType.TEXT,
            is_required=False,
            order=3,
        )
        s2.questions = [q2_1, q2_2, q2_3, q2_4]
        session.add(s2)
        session.commit()
        session.refresh(s2)

        # Responses for Survey 2
        responses_s2 = [
            ("Next.js / React", ["FastAPI / Python", "Node.js / Express"], 5, "Managing state across async boundaries"),
            ("Next.js / React", ["FastAPI / Python"], 4, "Deployments and environment parity"),
            ("Vue / Nuxt", ["Node.js / Express"], 4, "Context switching between databases"),
            ("Next.js / React", ["Go"], 5, "API contract maintenance between teams"),
            ("Svelte / SvelteKit", ["Rust", "FastAPI / Python"], 5, "Keeping up with rapid ecosystem updates"),
        ]

        for r in responses_s2:
            fe_val, be_val, rating_val, pain_val = r
            answers = [
                Answer(question_id=s2.questions[0].id, value=fe_val),
                Answer(question_id=s2.questions[1].id, value=be_val),
                Answer(question_id=s2.questions[2].id, value=rating_val),
                Answer(question_id=s2.questions[3].id, value=pain_val),
            ]
            session.add(SurveyResponse(survey_id=s2.id, answers=answers))

        session.commit()
        print("✓ Successfully inserted reference surveys and responses.")

if __name__ == "__main__":
    seed()

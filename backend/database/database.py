from sqlmodel import SQLModel, create_engine, Session, text
from typing import Generator
from config import settings

engine = create_engine(
    settings.DATABASE_URL,
    echo=False,
    pool_pre_ping=True
)


def verify_database_connection() -> None:
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session

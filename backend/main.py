from contextlib import asynccontextmanager
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from database import init_db, verify_database_connection
from routers import auth_router, survey_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        verify_database_connection()
        init_db()
        print("✓ Connected to database and initialized tables successfully.")
    except Exception as e:
        print(f"\n[ERROR] Database pre-flight connection failed: {e}")
        print("Please ensure your DATABASE_URL in .env is reachable.\n")
        sys.exit(1)

    yield


app = FastAPI(
    title="Survey Builder API",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router, prefix="/api")
app.include_router(survey_router, prefix="/api")


@app.get("/")
def root():
    return {"message": "Welcome to the Survey Builder API!"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "message": "Survey API is running cleanly."}

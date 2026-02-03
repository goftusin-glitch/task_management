import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy.exc import OperationalError

from database import engine, Base
from routers import auth, users, clients, tasks, expenses, stats, projects

# Import all models to ensure they are registered with SQLAlchemy
from models.user import User
from models.client import Client
from models.task import Task
from models.expense import Expense
from models.project import Project


def wait_for_db(max_retries: int = 30, retry_interval: int = 2):
    """Wait for database to be ready with retry logic."""
    for attempt in range(max_retries):
        try:
            # Try to connect to the database
            with engine.connect() as conn:
                conn.execute("SELECT 1")
            print("✓ Database connection established successfully!")
            return True
        except OperationalError as e:
            print(f"⏳ Waiting for database... attempt {attempt + 1}/{max_retries}")
            if attempt < max_retries - 1:
                time.sleep(retry_interval)
            else:
                print(f"✗ Failed to connect to database after {max_retries} attempts")
                raise e
    return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    # Startup: Wait for DB and create tables
    wait_for_db()
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created/verified successfully!")
    yield
    # Shutdown logic (if needed)


app = FastAPI(
    title="Task Management API",
    description="A comprehensive task management system with role-based access control",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for Docker deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(clients.router)
app.include_router(tasks.router)
app.include_router(expenses.router)
app.include_router(stats.router)
app.include_router(projects.router)


@app.get("/")
async def root():
    return {"message": "Task Management API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}

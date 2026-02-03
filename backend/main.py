from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, users, clients, tasks, expenses, stats, projects

# Import all models to ensure they are registered with SQLAlchemy
from models.user import User
from models.client import Client
from models.task import Task
from models.expense import Expense
from models.project import Project

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Task Management API",
    description="A comprehensive task management system with role-based access control",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000",  # Docker frontend
        "http://127.0.0.1:3000",  # Docker frontend
    ],
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

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.task import Task
from models.client import Client
from models.user import User
from schemas.task import TaskCreate, TaskUpdate, TaskResponse, TaskStatus
from services.auth import get_current_admin, get_current_user, check_page_access

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


def task_to_response(task: Task, db: Session) -> dict:
    """Convert task to response with client and assignee names"""
    client = db.query(Client).filter(Client.id == task.client_id).first()
    assignee = db.query(User).filter(User.id == task.assigned_to).first()
    return {
        "id": task.id,
        "client_id": task.client_id,
        "details": task.details,
        "assigned_to": task.assigned_to,
        "status": task.status,
        "start_date": task.start_date,
        "end_date": task.end_date,
        "created_by": task.created_by,
        "created_at": task.created_at,
        "updated_at": task.updated_at,
        "client_name": client.name if client else None,
        "assignee_name": assignee.name if assignee else None
    }


@router.get("/", response_model=List[TaskResponse])
async def get_all_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Admin only: Get all tasks"""
    tasks = db.query(Task).all()
    return [task_to_response(task, db) for task in tasks]


@router.get("/my-tasks", response_model=List[TaskResponse])
async def get_my_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access("my_task"))
):
    """Get tasks assigned to current user"""
    tasks = db.query(Task).filter(Task.assigned_to == current_user.id).all()
    return [task_to_response(task, db) for task in tasks]


@router.get("/my-progress", response_model=List[TaskResponse])
async def get_my_progress(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access("my_progress"))
):
    """Get in-progress tasks assigned to current user"""
    tasks = db.query(Task).filter(
        Task.assigned_to == current_user.id,
        Task.status == TaskStatus.in_progress
    ).all()
    return [task_to_response(task, db) for task in tasks]


@router.get("/completed", response_model=List[TaskResponse])
async def get_completed_tasks(
    db: Session = Depends(get_db),
    current_user: User = Depends(check_page_access("completed_task"))
):
    """Get completed tasks assigned to current user"""
    tasks = db.query(Task).filter(
        Task.assigned_to == current_user.id,
        Task.status == TaskStatus.completed
    ).all()
    return [task_to_response(task, db) for task in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Check if user has access to this task
    if not current_user.is_admin and task.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return task_to_response(task, db)


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Admin only: Create a new task"""
    # Verify client exists
    client = db.query(Client).filter(Client.id == task_data.client_id).first()
    if not client:
        raise HTTPException(status_code=400, detail="Client not found")
    
    # Verify assignee exists
    assignee = db.query(User).filter(User.id == task_data.assigned_to).first()
    if not assignee:
        raise HTTPException(status_code=400, detail="Assignee not found")
    
    task = Task(
        client_id=task_data.client_id,
        details=task_data.details,
        assigned_to=task_data.assigned_to,
        status=task_data.status,
        start_date=task_data.start_date,
        end_date=task_data.end_date,
        created_by=current_user.id
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task_to_response(task, db)


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: int,
    task_data: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Non-admins can only update their own tasks and only the status
    if not current_user.is_admin:
        if task.assigned_to != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied")
        # Non-admin can only update status
        if task_data.status is not None:
            task.status = task_data.status
    else:
        # Admin can update everything
        if task_data.client_id is not None:
            client = db.query(Client).filter(Client.id == task_data.client_id).first()
            if not client:
                raise HTTPException(status_code=400, detail="Client not found")
            task.client_id = task_data.client_id
        if task_data.details is not None:
            task.details = task_data.details
        if task_data.assigned_to is not None:
            assignee = db.query(User).filter(User.id == task_data.assigned_to).first()
            if not assignee:
                raise HTTPException(status_code=400, detail="Assignee not found")
            task.assigned_to = task_data.assigned_to
        if task_data.status is not None:
            task.status = task_data.status
        if task_data.start_date is not None:
            task.start_date = task_data.start_date
        if task_data.end_date is not None:
            task.end_date = task_data.end_date
    
    db.commit()
    db.refresh(task)
    return task_to_response(task, db)


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Admin only: Delete a task"""
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    db.delete(task)
    db.commit()
    return None

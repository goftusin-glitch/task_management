from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from enum import Enum


class TaskStatus(str, Enum):
    pending = "pending"
    in_progress = "in_progress"
    completed = "completed"


class TaskBase(BaseModel):
    client_id: int
    details: str
    assigned_to: int
    status: TaskStatus = TaskStatus.pending
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TaskCreate(TaskBase):
    pass


class TaskUpdate(BaseModel):
    client_id: Optional[int] = None
    details: Optional[str] = None
    assigned_to: Optional[int] = None
    status: Optional[TaskStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class TaskResponse(TaskBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    client_name: Optional[str] = None
    assignee_name: Optional[str] = None

    class Config:
        from_attributes = True

from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ProjectBase(BaseModel):
    name: str
    details: Optional[str] = None
    client_id: Optional[int] = None
    status: str = "active"


class ProjectCreate(ProjectBase):
    assigned_user_ids: List[int] = []


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    details: Optional[str] = None
    client_id: Optional[int] = None
    status: Optional[str] = None
    assigned_user_ids: Optional[List[int]] = None


class UserBrief(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True


class ClientBrief(BaseModel):
    id: int
    name: str
    phone: str

    class Config:
        from_attributes = True


class ProjectResponse(ProjectBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    assigned_users: List[UserBrief] = []
    client: Optional[ClientBrief] = None

    class Config:
        from_attributes = True

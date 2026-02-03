from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class ClientBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: str
    status: str = "active"
    custom_fields: Dict[str, Any] = {}


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
    custom_fields: Optional[Dict[str, Any]] = None


class ClientResponse(ClientBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

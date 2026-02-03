from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from decimal import Decimal


class ExpenseBase(BaseModel):
    details: str
    amount: Decimal
    custom_fields: Dict[str, Any] = {}


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    details: Optional[str] = None
    amount: Optional[Decimal] = None
    custom_fields: Optional[Dict[str, Any]] = None


class ExpenseResponse(ExpenseBase):
    id: int
    created_by: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey, JSON
from sqlalchemy.sql import func
from database import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    details = Column(String(2000), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    custom_fields = Column(JSON, default=dict)  # {"key": "value", ...}
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


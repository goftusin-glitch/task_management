from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.client import Client
from models.task import Task
from models.user import User
from services.auth import get_current_user
from typing import Dict

router = APIRouter(prefix="/api/stats", tags=["Stats"])

@router.get("/", response_model=Dict[str, int])
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    stats = {
        "clients_count": 0,
        "follow_ups_count": 0,
        "clients_pending_count": 0,
        "tasks_count": 0,
        "tasks_pending_count": 0,
        "users_count": 0
    }

    # Clients stats - Global for everyone with access? 
    # Usually dashboard shows what the user can see. 
    # Assuming if they can see dashboard, they see these numbers.
    
    # We will just count all for clients as clients are shared
    clients_query = db.query(Client)
    stats["clients_count"] = clients_query.count()
    stats["follow_ups_count"] = clients_query.filter(Client.status == "follow_up").count()
    stats["clients_pending_count"] = clients_query.filter(Client.status == "pending").count()

    # Tasks stats - Contextual
    tasks_query = db.query(Task)
    if not current_user.is_admin:
        tasks_query = tasks_query.filter(Task.assigned_to == current_user.id)
    
    stats["tasks_count"] = tasks_query.count()
    # For pending tasks
    # We need to re-apply the filter to a new query or just filter the base query
    # Making a new query is cleaner to avoid side effects if we chained methods (though count() is terminal)
    
    tasks_pending_query = db.query(Task)
    if not current_user.is_admin:
        tasks_pending_query = tasks_pending_query.filter(Task.assigned_to == current_user.id)
    
    # Check what 'pending' status key is used in TaskStatus. 
    # In Task model/schema, status is an Enum or string.
    # In tasks.py: 'pending', 'in_progress', 'completed'
    stats["tasks_pending_count"] = tasks_pending_query.filter(Task.status == "pending").count()

    # Users stats - Admin only
    if current_user.is_admin:
        stats["users_count"] = db.query(User).count()

    return stats

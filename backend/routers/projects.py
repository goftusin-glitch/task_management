from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.project import Project, project_users
from models.user import User
from models.client import Client
from schemas.project import ProjectCreate, ProjectUpdate, ProjectResponse
from services.auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.get("/", response_model=List[ProjectResponse])
async def get_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get projects - Admins see all, users see only assigned projects"""
    if current_user.is_admin:
        projects = db.query(Project).all()
    else:
        projects = db.query(Project).join(
            project_users, Project.id == project_users.c.project_id
        ).filter(project_users.c.user_id == current_user.id).all()
    return projects


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Check access - admin or assigned user
    if not current_user.is_admin:
        is_assigned = db.query(project_users).filter(
            project_users.c.project_id == project_id,
            project_users.c.user_id == current_user.id
        ).first()
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Access denied")
    
    return project


@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Create a project - Admin only"""
    # Validate client exists if provided
    if project_data.client_id:
        client = db.query(Client).filter(Client.id == project_data.client_id).first()
        if not client:
            raise HTTPException(status_code=400, detail="Client not found")
    
    # Validate assigned users exist
    assigned_users = []
    for user_id in project_data.assigned_user_ids:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=400, detail=f"User with ID {user_id} not found")
        assigned_users.append(user)
    
    project = Project(
        name=project_data.name,
        details=project_data.details,
        client_id=project_data.client_id,
        status=project_data.status,
        created_by=current_user.id
    )
    project.assigned_users = assigned_users
    
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: int,
    project_data: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Update a project - Admin only"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.details is not None:
        project.details = project_data.details
    if project_data.client_id is not None:
        if project_data.client_id > 0:
            client = db.query(Client).filter(Client.id == project_data.client_id).first()
            if not client:
                raise HTTPException(status_code=400, detail="Client not found")
            project.client_id = project_data.client_id
        else:
            project.client_id = None
    if project_data.status is not None:
        project.status = project_data.status
    if project_data.assigned_user_ids is not None:
        assigned_users = []
        for user_id in project_data.assigned_user_ids:
            user = db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(status_code=400, detail=f"User with ID {user_id} not found")
            assigned_users.append(user)
        project.assigned_users = assigned_users
    
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin)
):
    """Delete a project - Admin only"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    db.delete(project)
    db.commit()
    return None

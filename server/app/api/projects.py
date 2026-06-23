from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import uuid
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.db_models import User, Project
from app.schemas.pydantic_schemas import ProjectCreate, ProjectResponse

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_project = Project(
        name=project_in.name,
        description=project_in.description,
        org_id=current_user.org_id,
        user_id=current_user.id
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project

@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    projects = db.query(Project).filter(Project.org_id == current_user.org_id).all()
    return projects

@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    project = db.query(Project).filter(
        Project.id == project_id,
        Project.org_id == current_user.org_id
    ).first()
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    return project

from typing import Dict
from app.core.config import settings

@router.post("/settings")
def update_llm_settings(
    keys: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    if "openai_key" in keys:
        settings.OPENAI_API_KEY = keys["openai_key"] or None
    if "anthropic_key" in keys:
        settings.ANTHROPIC_API_KEY = keys["anthropic_key"] or None
    return {"status": "success"}

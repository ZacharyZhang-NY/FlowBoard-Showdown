from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.sprint import Sprint
from app.models.user import User
from app.schemas.sprint import SprintCreate, SprintUpdate, SprintResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/projects/{project_id}/sprints", response_model=dict)
def list_sprints(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    return {"data": [SprintResponse.model_validate(s).model_dump() for s in sprints]}


@router.post("/projects/{project_id}/sprints", response_model=dict)
def create_sprint(project_id: str, body: SprintCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = Sprint(project_id=project_id, **body.model_dump())
    db.add(sprint)
    db.commit()
    db.refresh(sprint)
    return {"data": SprintResponse.model_validate(sprint).model_dump()}


@router.get("/sprints/{sprint_id}", response_model=dict)
def get_sprint(sprint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return {"data": SprintResponse.model_validate(sprint).model_dump()}


@router.patch("/sprints/{sprint_id}", response_model=dict)
def update_sprint(sprint_id: str, body: SprintUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(sprint, key, value)
    db.commit()
    db.refresh(sprint)
    return {"data": SprintResponse.model_validate(sprint).model_dump()}


@router.delete("/sprints/{sprint_id}", response_model=dict)
def delete_sprint(sprint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    db.delete(sprint)
    db.commit()
    return {"data": {"deleted": True}}


@router.post("/sprints/{sprint_id}/start", response_model=dict)
def start_sprint(sprint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint.status = "active"
    sprint.start_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sprint)
    return {"data": SprintResponse.model_validate(sprint).model_dump()}


@router.post("/sprints/{sprint_id}/complete", response_model=dict)
def complete_sprint(sprint_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprint = db.query(Sprint).filter(Sprint.id == sprint_id).first()
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    sprint.status = "completed"
    sprint.end_date = datetime.now(timezone.utc)
    db.commit()
    db.refresh(sprint)
    return {"data": SprintResponse.model_validate(sprint).model_dump()}

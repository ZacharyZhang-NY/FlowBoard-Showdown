from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.label import Label
from app.models.user import User
from app.schemas.label import LabelCreate, LabelUpdate, LabelResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/projects/{project_id}/labels", response_model=dict)
def list_labels(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    labels = db.query(Label).filter(Label.project_id == project_id).all()
    return {"data": [LabelResponse.model_validate(l).model_dump() for l in labels]}


@router.post("/projects/{project_id}/labels", response_model=dict)
def create_label(project_id: str, body: LabelCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    label = Label(project_id=project_id, **body.model_dump())
    db.add(label)
    db.commit()
    db.refresh(label)
    return {"data": LabelResponse.model_validate(label).model_dump()}


@router.get("/labels/{label_id}", response_model=dict)
def get_label(label_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    return {"data": LabelResponse.model_validate(label).model_dump()}


@router.patch("/labels/{label_id}", response_model=dict)
def update_label(label_id: str, body: LabelUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(label, key, value)
    db.commit()
    db.refresh(label)
    return {"data": LabelResponse.model_validate(label).model_dump()}


@router.put("/labels/{label_id}", response_model=dict)
def replace_label(label_id: str, body: LabelCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    for key, value in body.model_dump().items():
        setattr(label, key, value)
    db.commit()
    db.refresh(label)
    return {"data": LabelResponse.model_validate(label).model_dump()}


@router.delete("/labels/{label_id}", response_model=dict)
def delete_label(label_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    db.delete(label)
    db.commit()
    return {"data": {"deleted": True}}

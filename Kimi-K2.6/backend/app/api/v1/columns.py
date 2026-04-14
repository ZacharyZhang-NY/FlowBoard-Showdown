from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.column import Column
from app.models.user import User
from app.schemas.column import ColumnCreate, ColumnUpdate, ColumnResponse
from app.core.security import get_current_user

router = APIRouter()


@router.post("/boards/{board_id}/columns", response_model=dict)
def create_column(board_id: str, body: ColumnCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    column = Column(board_id=board_id, **body.model_dump())
    db.add(column)
    db.commit()
    db.refresh(column)
    return {"data": ColumnResponse.model_validate(column).model_dump()}


@router.get("/boards/{board_id}/columns", response_model=dict)
def list_columns(board_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    columns = db.query(Column).filter(Column.board_id == board_id).order_by(Column.position).all()
    return {"data": [ColumnResponse.model_validate(c).model_dump() for c in columns]}


@router.get("/columns/{column_id}", response_model=dict)
def get_column(column_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    return {"data": ColumnResponse.model_validate(column).model_dump()}


@router.patch("/columns/{column_id}", response_model=dict)
def update_column(column_id: str, body: ColumnUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(column, key, value)
    db.commit()
    db.refresh(column)
    return {"data": ColumnResponse.model_validate(column).model_dump()}


@router.delete("/columns/{column_id}", response_model=dict)
def delete_column(column_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    column = db.query(Column).filter(Column.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    db.delete(column)
    db.commit()
    return {"data": {"deleted": True}}


@router.post("/columns/reorder", response_model=dict)
def reorder_columns(body: list[dict], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for item in body:
        col = db.query(Column).filter(Column.id == item["id"]).first()
        if col:
            col.position = item.get("position", col.position)
            col.board_id = item.get("board_id", col.board_id)
    db.commit()
    return {"data": {"reordered": True}}

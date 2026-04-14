from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.board import Board
from app.models.column import Column
from app.models.user import User
from app.schemas.board import BoardCreate, BoardUpdate, BoardResponse
from app.schemas.column import ColumnResponse
from app.schemas.issue import IssueResponse
from app.core.security import get_current_user

router = APIRouter()


@router.post("/projects/{project_id}/boards", response_model=dict)
def create_board(project_id: str, body: BoardCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    board = Board(project_id=project_id, **body.model_dump())
    db.add(board)
    db.commit()
    db.refresh(board)
    return {"data": BoardResponse.model_validate(board).model_dump()}


@router.get("/projects/{project_id}/boards", response_model=dict)
def list_boards(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    boards = db.query(Board).filter(Board.project_id == project_id).all()
    return {"data": [BoardResponse.model_validate(b).model_dump() for b in boards]}


@router.get("/boards/{board_id}", response_model=dict)
def get_board(board_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    result = BoardResponse.model_validate(board).model_dump()
    result["columns"] = []
    for col in board.columns:
        col_data = ColumnResponse.model_validate(col).model_dump()
        col_data["issues"] = [IssueResponse.model_validate(i).model_dump() for i in col.issues]
        result["columns"].append(col_data)
    return {"data": result}


@router.patch("/boards/{board_id}", response_model=dict)
def update_board(board_id: str, body: BoardUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(board, key, value)
    db.commit()
    db.refresh(board)
    return {"data": BoardResponse.model_validate(board).model_dump()}


@router.delete("/boards/{board_id}", response_model=dict)
def delete_board(board_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    board = db.query(Board).filter(Board.id == board_id).first()
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")
    db.delete(board)
    db.commit()
    return {"data": {"deleted": True}}

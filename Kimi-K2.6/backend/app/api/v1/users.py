from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import get_current_user, get_password_hash

router = APIRouter()


@router.get("/users", response_model=dict)
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    users = db.query(User).all()
    return {"data": [UserResponse.model_validate(u).model_dump() for u in users]}


@router.post("/users", response_model=dict)
def create_user(body: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = User(hashed_password=get_password_hash(body.password), **body.model_dump(exclude={"password"}))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"data": UserResponse.model_validate(user).model_dump()}


@router.get("/users/{user_id}", response_model=dict)
def get_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"data": UserResponse.model_validate(user).model_dump()}


@router.patch("/users/{user_id}", response_model=dict)
def update_user(user_id: str, body: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return {"data": UserResponse.model_validate(user).model_dump()}


@router.delete("/users/{user_id}", response_model=dict)
def delete_user(user_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"data": {"deleted": True}}

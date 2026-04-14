from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.core.security import create_access_token, verify_password, get_current_user

router = APIRouter()


@router.post("/auth/login", response_model=dict)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    access_token = create_access_token(subject=user.id)
    return {"data": {"access_token": access_token, "token_type": "bearer"}}


@router.get("/auth/me", response_model=dict)
def me(current_user: User = Depends(get_current_user)):
    return {"data": UserResponse.model_validate(current_user).model_dump()}

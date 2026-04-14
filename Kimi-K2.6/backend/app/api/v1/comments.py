from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.comment import Comment
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/issues/{issue_id}/comments", response_model=dict)
def list_comments(issue_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comments = db.query(Comment).filter(Comment.issue_id == issue_id).all()
    return {"data": [CommentResponse.model_validate(c).model_dump() for c in comments]}


@router.post("/issues/{issue_id}/comments", response_model=dict)
def create_comment(issue_id: str, body: CommentCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = Comment(issue_id=issue_id, author_id=current_user.id, **body.model_dump())
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {"data": CommentResponse.model_validate(comment).model_dump()}


@router.get("/comments/{comment_id}", response_model=dict)
def get_comment(comment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    return {"data": CommentResponse.model_validate(comment).model_dump()}


@router.patch("/comments/{comment_id}", response_model=dict)
def update_comment(comment_id: str, body: CommentUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(comment, key, value)
    db.commit()
    db.refresh(comment)
    return {"data": CommentResponse.model_validate(comment).model_dump()}


@router.delete("/comments/{comment_id}", response_model=dict)
def delete_comment(comment_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    comment = db.query(Comment).filter(Comment.id == comment_id).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(comment)
    db.commit()
    return {"data": {"deleted": True}}

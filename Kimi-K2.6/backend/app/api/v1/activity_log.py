from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.activity_log import ActivityLog
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/issues/{issue_id}/activity", response_model=dict)
def list_activity(issue_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    logs = db.query(ActivityLog).filter(ActivityLog.issue_id == issue_id).order_by(ActivityLog.created_at.desc()).all()
    return {"data": [ActivityLogResponse.model_validate(log).model_dump() for log in logs]}

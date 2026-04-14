from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.issue import Issue
from app.models.sprint import Sprint
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()


@router.get("/projects/{project_id}/reports/burndown", response_model=dict)
def burndown(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    total = sum(i.story_points or 0 for i in issues)
    done = sum(i.story_points or 0 for i in issues if i.status == "done")
    return {"data": {"total_points": total, "done_points": done, "remaining_points": total - done}}


@router.get("/projects/{project_id}/reports/velocity", response_model=dict)
def velocity(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    sprints = db.query(Sprint).filter(Sprint.project_id == project_id).all()
    result = []
    for sprint in sprints:
        issues = [i for i in sprint.issues if i.status == "done"]
        points = sum(i.story_points or 0 for i in issues)
        result.append({"sprint_id": sprint.id, "sprint_name": sprint.name, "completed_points": points, "completed_issues": len(issues)})
    return {"data": result}


@router.get("/projects/{project_id}/reports/distribution", response_model=dict)
def distribution(project_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issues = db.query(Issue).filter(Issue.project_id == project_id).all()
    by_status = {}
    by_priority = {}
    by_type = {}
    for i in issues:
        by_status[i.status] = by_status.get(i.status, 0) + 1
        by_priority[i.priority] = by_priority.get(i.priority, 0) + 1
        by_type[i.type] = by_type.get(i.type, 0) + 1
    return {"data": {"by_status": by_status, "by_priority": by_priority, "by_type": by_type}}

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.issue import Issue
from app.models.label import Label
from app.models.user import User
from app.schemas.issue import IssueCreate, IssueUpdate, IssueMove, IssueReorder, IssueResponse
from app.core.security import get_current_user

router = APIRouter()


@router.get("/projects/{project_id}/issues", response_model=dict)
def list_issues(
    project_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    status: str | None = Query(None),
    priority: str | None = Query(None),
    type: str | None = Query(None),
    assignee_id: str | None = Query(None),
    sprint_id: str | None = Query(None),
    q: str | None = Query(None),
):
    query = db.query(Issue).filter(Issue.project_id == project_id)
    if status:
        query = query.filter(Issue.status == status)
    if priority:
        query = query.filter(Issue.priority == priority)
    if type:
        query = query.filter(Issue.type == type)
    if assignee_id:
        query = query.filter(Issue.assignee_id == assignee_id)
    if sprint_id:
        query = query.filter(Issue.sprint_id == sprint_id)
    if q:
        query = query.filter(Issue.title.ilike(f"%{q}%"))
    issues = query.all()
    return {"data": [IssueResponse.model_validate(i).model_dump() for i in issues]}


@router.post("/projects/{project_id}/issues", response_model=dict)
def create_issue(project_id: str, body: IssueCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    count = db.query(Issue).filter(Issue.project_id == project_id).count()
    issue = Issue(project_id=project_id, number=count + 1, reporter_id=current_user.id, **body.model_dump())
    db.add(issue)
    db.commit()
    db.refresh(issue)
    return {"data": IssueResponse.model_validate(issue).model_dump()}


@router.get("/issues/{issue_id}", response_model=dict)
def get_issue(issue_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return {"data": IssueResponse.model_validate(issue).model_dump()}


@router.patch("/issues/{issue_id}", response_model=dict)
def update_issue(issue_id: str, body: IssueUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(issue, key, value)
    db.commit()
    db.refresh(issue)
    return {"data": IssueResponse.model_validate(issue).model_dump()}


@router.delete("/issues/{issue_id}", response_model=dict)
def delete_issue(issue_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    db.delete(issue)
    db.commit()
    return {"data": {"deleted": True}}


@router.post("/issues/{issue_id}/move", response_model=dict)
def move_issue(issue_id: str, body: IssueMove, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    issue.column_id = body.column_id
    issue.position = body.position
    db.commit()
    db.refresh(issue)
    return {"data": IssueResponse.model_validate(issue).model_dump()}


@router.post("/issues/reorder", response_model=dict)
def reorder_issues(body: list[IssueReorder], db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    for item in body:
        issue = db.query(Issue).filter(Issue.id == item.issue_id).first()
        if issue:
            issue.column_id = item.column_id
            issue.position = item.position
    db.commit()
    return {"data": {"reordered": True}}


@router.post("/issues/{issue_id}/labels", response_model=dict)
def attach_label(issue_id: str, body: dict, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    label = db.query(Label).filter(Label.id == body["label_id"]).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    if label not in issue.labels:
        issue.labels.append(label)
        db.commit()
    return {"data": {"attached": True}}


@router.delete("/issues/{issue_id}/labels/{label_id}", response_model=dict)
def detach_label(issue_id: str, label_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    issue = db.query(Issue).filter(Issue.id == issue_id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    label = db.query(Label).filter(Label.id == label_id).first()
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    if label in issue.labels:
        issue.labels.remove(label)
        db.commit()
    return {"data": {"detached": True}}

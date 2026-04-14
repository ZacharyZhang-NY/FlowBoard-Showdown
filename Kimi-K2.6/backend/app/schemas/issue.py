from datetime import datetime
from pydantic import BaseModel, ConfigDict


class IssueBase(BaseModel):
    title: str
    description: str | None = None
    status: str
    priority: str
    type: str
    position: int = 0
    story_points: int | None = None
    due_date: datetime | None = None


class IssueCreate(IssueBase):
    column_id: str | None = None
    sprint_id: str | None = None
    assignee_id: str | None = None


class IssueUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    priority: str | None = None
    type: str | None = None
    column_id: str | None = None
    sprint_id: str | None = None
    assignee_id: str | None = None
    position: int | None = None
    story_points: int | None = None
    due_date: datetime | None = None


class IssueMove(BaseModel):
    column_id: str
    position: int


class IssueReorder(BaseModel):
    issue_id: str
    column_id: str
    position: int


class IssueResponse(IssueBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    column_id: str | None = None
    sprint_id: str | None = None
    number: int
    assignee_id: str | None = None
    reporter_id: str
    created_at: datetime
    updated_at: datetime

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    pass


class CommentUpdate(BaseModel):
    content: str | None = None


class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issue_id: str
    author_id: str
    created_at: datetime
    updated_at: datetime

from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ActivityLogBase(BaseModel):
    action: str
    old_value: str | None = None
    new_value: str | None = None


class ActivityLogCreate(ActivityLogBase):
    pass


class ActivityLogResponse(ActivityLogBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    issue_id: str
    user_id: str
    created_at: datetime

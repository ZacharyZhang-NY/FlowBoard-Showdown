from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SprintBase(BaseModel):
    name: str
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str = "planned"


class SprintCreate(SprintBase):
    pass


class SprintUpdate(BaseModel):
    name: str | None = None
    goal: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None
    status: str | None = None


class SprintResponse(SprintBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    created_at: datetime

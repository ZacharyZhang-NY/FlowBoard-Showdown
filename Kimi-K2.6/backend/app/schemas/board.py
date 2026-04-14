from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BoardBase(BaseModel):
    name: str
    position: int = 0


class BoardCreate(BoardBase):
    pass


class BoardUpdate(BaseModel):
    name: str | None = None
    position: int | None = None


class BoardResponse(BoardBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    created_at: datetime

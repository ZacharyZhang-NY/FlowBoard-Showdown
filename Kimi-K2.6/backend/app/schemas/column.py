from pydantic import BaseModel, ConfigDict


class ColumnBase(BaseModel):
    name: str
    position: int = 0
    color: str | None = None
    wip_limit: int | None = None


class ColumnCreate(ColumnBase):
    pass


class ColumnUpdate(BaseModel):
    name: str | None = None
    position: int | None = None
    color: str | None = None
    wip_limit: int | None = None


class ColumnResponse(ColumnBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    board_id: str

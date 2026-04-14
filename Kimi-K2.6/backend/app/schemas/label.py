from pydantic import BaseModel, ConfigDict


class LabelBase(BaseModel):
    name: str
    color: str


class LabelCreate(LabelBase):
    pass


class LabelUpdate(BaseModel):
    name: str | None = None
    color: str | None = None


class LabelResponse(LabelBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str

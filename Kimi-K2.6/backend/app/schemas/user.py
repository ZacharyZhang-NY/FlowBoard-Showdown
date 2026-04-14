from datetime import datetime
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    name: str
    email: str
    email_verified: bool = False
    image: str | None = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    email_verified: bool | None = None
    image: str | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime

import uuid
from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.base import Base


class Label(Base):
    __tablename__ = "labels"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)
    color = Column(String, default="blue", nullable=False)

    project = relationship("Project", back_populates="labels")
    issues = relationship("Issue", secondary="issue_labels", back_populates="labels")

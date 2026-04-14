import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, Integer, Text, DateTime
from sqlalchemy.orm import relationship

from app.db.base import Base


class Issue(Base):
    __tablename__ = "issues"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)
    column_id = Column(String, ForeignKey("columns.id"), nullable=True)
    sprint_id = Column(String, ForeignKey("sprints.id"), nullable=True)
    number = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default="todo", nullable=False)
    priority = Column(String, default="medium", nullable=False)
    type = Column(String, default="task", nullable=False)
    assignee_id = Column(String, ForeignKey("users.id"), nullable=True)
    reporter_id = Column(String, ForeignKey("users.id"), nullable=False)
    position = Column(Integer, default=0, nullable=False)
    story_points = Column(Integer, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)

    project = relationship("Project", back_populates="issues")
    column = relationship("Column", back_populates="issues")
    sprint = relationship("Sprint", back_populates="issues")
    assignee = relationship("User", back_populates="assigned_issues", foreign_keys=[assignee_id])
    reporter = relationship("User", back_populates="reported_issues", foreign_keys=[reporter_id])
    comments = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    activity_logs = relationship("ActivityLog", back_populates="issue", cascade="all, delete-orphan")
    labels = relationship("Label", secondary="issue_labels", back_populates="issues")

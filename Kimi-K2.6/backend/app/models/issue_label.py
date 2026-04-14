import uuid
from sqlalchemy import Column, String, ForeignKey, PrimaryKeyConstraint

from app.db.base import Base


class IssueLabel(Base):
    __tablename__ = "issue_labels"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    issue_id = Column(String, ForeignKey("issues.id"), nullable=False)
    label_id = Column(String, ForeignKey("labels.id"), nullable=False)

    __table_args__ = (
        PrimaryKeyConstraint("id"),
    )

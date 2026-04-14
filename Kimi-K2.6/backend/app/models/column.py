import uuid
from sqlalchemy import Column, String, ForeignKey, Integer
from sqlalchemy.orm import relationship

from app.db.base import Base


class Column(Base):
    __tablename__ = "columns"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    board_id = Column(String, ForeignKey("boards.id"), nullable=False)
    name = Column(String, nullable=False)
    position = Column(Integer, default=0, nullable=False)
    color = Column(String, default="gray", nullable=True)
    wip_limit = Column(Integer, nullable=True)

    board = relationship("Board", back_populates="columns")
    issues = relationship("Issue", back_populates="column", order_by="Issue.position")

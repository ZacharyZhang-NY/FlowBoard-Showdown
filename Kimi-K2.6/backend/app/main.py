from datetime import datetime, timezone, timedelta
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.core.config import settings
from app.core.security import get_password_hash
from app.api.v1 import api_router
from app.db.base import Base, engine
from app.db.session import SessionLocal
from app.models.user import User
from app.models.project import Project
from app.models.board import Board
from app.models.column import Column
from app.models.sprint import Sprint
from app.models.label import Label
from app.models.issue import Issue
from app.models.issue_label import IssueLabel
from app.models.activity_log import ActivityLog

app = FastAPI(title="FlowBoard API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"error": str(exc)})


app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    _seed_database()


def _seed_database():
    db = SessionLocal()
    try:
        existing = db.query(User).first()
        if existing:
            return

        user = User(
            name="Zachary Zhang",
            email="test@zacharyzhang.com",
            hashed_password=get_password_hash("Test@TestModels"),
            email_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        project = Project(
            name="FlowBoard Demo",
            key="FB",
            description="Demo project for FlowBoard",
            created_by=user.id,
        )
        db.add(project)
        db.commit()
        db.refresh(project)

        board = Board(project_id=project.id, name="Main Board", position=0)
        db.add(board)
        db.commit()
        db.refresh(board)

        columns_data = [
            {"name": "To Do", "color": "gray", "position": 0},
            {"name": "In Progress", "color": "blue", "position": 1},
            {"name": "In Review", "color": "purple", "position": 2},
            {"name": "Done", "color": "green", "position": 3},
        ]
        cols = []
        for c in columns_data:
            col = Column(board_id=board.id, **c)
            db.add(col)
            cols.append(col)
        db.commit()
        for col in cols:
            db.refresh(col)

        today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        sprint = Sprint(
            project_id=project.id,
            name="Sprint 1",
            goal="Initial sprint for demo",
            start_date=today,
            end_date=today + timedelta(days=14),
            status="active",
        )
        db.add(sprint)
        db.commit()
        db.refresh(sprint)

        labels_data = [
            {"name": "frontend", "color": "blue"},
            {"name": "backend", "color": "green"},
            {"name": "bug", "color": "red"},
            {"name": "design", "color": "purple"},
            {"name": "infra", "color": "gray"},
        ]
        created_labels = []
        for l in labels_data:
            label = Label(project_id=project.id, **l)
            db.add(label)
            created_labels.append(label)
        db.commit()
        for label in created_labels:
            db.refresh(label)

        issues_seed = [
            {"title": "Set up project repository", "status": "done", "priority": "high", "type": "task", "column_idx": 3, "points": 3},
            {"title": "Design database schema", "status": "done", "priority": "high", "type": "task", "column_idx": 3, "points": 5},
            {"title": "Implement authentication", "status": "in_progress", "priority": "critical", "type": "feature", "column_idx": 1, "points": 8},
            {"title": "Create Kanban board UI", "status": "in_progress", "priority": "high", "type": "feature", "column_idx": 1, "points": 8},
            {"title": "Build issue detail page", "status": "todo", "priority": "medium", "type": "feature", "column_idx": 0, "points": 5},
            {"title": "Add drag and drop support", "status": "in_review", "priority": "high", "type": "feature", "column_idx": 2, "points": 5},
            {"title": "Fix login redirect bug", "status": "done", "priority": "medium", "type": "bug", "column_idx": 3, "points": 2},
            {"title": "Integrate Carbon Design System", "status": "done", "priority": "high", "type": "task", "column_idx": 3, "points": 5},
            {"title": "Write API documentation", "status": "todo", "priority": "low", "type": "task", "column_idx": 0, "points": 3},
            {"title": "Set up CI/CD pipeline", "status": "todo", "priority": "medium", "type": "task", "column_idx": 0, "points": 5},
            {"title": "Performance optimization", "status": "blocked", "priority": "high", "type": "improvement", "column_idx": 0, "points": 5},
            {"title": "User feedback survey", "status": "todo", "priority": "low", "type": "task", "column_idx": 0, "points": 2},
        ]

        for i, is_data in enumerate(issues_seed):
            column_id = cols[is_data["column_idx"]].id
            assignee_id = user.id if i % 3 == 0 else None
            due_date = today + timedelta(days=-1 if i < 4 else i + 3)

            issue = Issue(
                project_id=project.id,
                column_id=column_id,
                sprint_id=sprint.id,
                number=i + 1,
                title=is_data["title"],
                status=is_data["status"],
                priority=is_data["priority"],
                type=is_data["type"],
                assignee_id=assignee_id,
                reporter_id=user.id,
                position=i,
                story_points=is_data["points"],
                due_date=due_date,
            )
            db.add(issue)
            db.commit()
            db.refresh(issue)

            if i % 2 == 0 and created_labels:
                il = IssueLabel(issue_id=issue.id, label_id=created_labels[i % len(created_labels)].id)
                db.add(il)
                db.commit()

            log = ActivityLog(
                issue_id=issue.id,
                user_id=user.id,
                action="created",
                new_value=is_data["title"],
            )
            db.add(log)
            db.commit()
    finally:
        db.close()

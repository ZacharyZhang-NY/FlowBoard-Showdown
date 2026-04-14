from fastapi import APIRouter

from app.api.v1 import projects, boards, columns, issues, sprints, comments, labels, users, auth, activity_log, reports

api_router = APIRouter()

api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(boards.router, tags=["boards"])
api_router.include_router(columns.router, tags=["columns"])
api_router.include_router(issues.router, tags=["issues"])
api_router.include_router(sprints.router, tags=["sprints"])
api_router.include_router(comments.router, tags=["comments"])
api_router.include_router(labels.router, tags=["labels"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(activity_log.router, tags=["activity_log"])
api_router.include_router(reports.router, tags=["reports"])

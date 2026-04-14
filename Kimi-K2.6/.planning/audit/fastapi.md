# FastAPI Backend Audit Report

**Project:** FlowBoard  
**Audit Date:** 2026-04-14  
**Auditor:** Claude Code  
**Scope:** `backend/app/**/*.py`

---

## Executive Summary

**Verdict: NEEDS_WORK**

The FastAPI backend implements basic CRUD for all major entities, but it is currently an **incomplete, insecure scaffold**. It lacks authentication enforcement on every endpoint, has no authorization checks, is missing several required API routes (reports, activity logs, auth endpoints), and contains security gaps that make it unsuitable for production or integration with the Next.js frontend as specified in the PRD.

---

## Missing Features

### 1. Authentication & Auth Endpoints
- **No login endpoint** (`POST /auth/login` or `/api/auth/sign-in/email`). The PRD specifies BetterAuth-managed routes, but this FastAPI backend has no auth router at all.
- **No password field on `User` model**. `app/models/user.py` stores `name`, `email`, `image`, etc., but there is no `hashed_password` column. User creation in `app/api/v1/users.py` accepts `UserCreate` which also lacks a password field, making local credential-based auth impossible.
- **No session/token validation dependency**. No `get_current_user` or `require_auth` FastAPI dependency exists anywhere in the codebase.

### 2. Activity Log API
- **Missing route**: `GET /api/v1/issues/:id/activity` is defined in the PRD but has no corresponding router or handler.
- **Missing activity log generation**. No service layer writes to `ActivityLog` when issues are created, moved, assigned, or updated.

### 3. Reports API
- **Missing routes entirely**:
  - `GET /api/v1/projects/:id/reports/burndown`
  - `GET /api/v1/projects/:id/reports/velocity`
  - `GET /api/v1/projects/:id/reports/distribution`

### 4. Labels API Gaps
- **Missing `PUT /api/v1/labels/:id`**. The PRD requires full CRUD including update; `app/api/v1/labels.py` only has `GET`, `POST`, `DELETE`.

### 5. Issue-Label Management
- **No endpoints to attach/detach labels from issues**. The `issue_labels` association table (`app/models/issue_label.py`) exists in the DB, but there are no API routes to add or remove labels on an issue.

### 6. Issue List Filtering
- `GET /api/v1/projects/:id/issues` in `app/api/v1/issues.py` returns **all** issues with no query-parameter filtering (status, priority, type, assignee, sprint, label) as required by the PRD.

### 7. Seed / Bootstrap Data
- No seed script or startup seed logic exists in the FastAPI backend. The PRD requires a demo project, board, columns, sprint, issues, and labels on first boot.

### 8. `requirements.txt`
- The `backend/` directory has **no `requirements.txt`**, making environment reproduction impossible.

---

## Security Issues

### 1. Zero Authentication on All Endpoints
- **Every single API route is completely open**. Any client can list, create, update, or delete users, projects, boards, issues, etc.
- **Impact:** Complete data exposure and modification by unauthenticated actors.
- **Files affected:** All files under `app/api/v1/*.py`

### 2. Zero Authorization / Ownership Checks
- No verification that the requesting user owns the project, created the board, or is assigned to the issue.
- Example: `DELETE /users/{user_id}` in `app/api/v1/users.py` allows deletion of any user by anyone.

### 3. Hardcoded Default Secret Key
- `app/core/config.py` sets `secret_key: str = "nE5bdRLhdiiYErMyCvyShVWlz5tLUSNE"`.
- **Impact:** JWT tokens (if ever enforced) can be forged by anyone who reads the source code.

### 4. No Input Validation Beyond Pydantic
- String fields like `status`, `priority`, and `type` accept **any string value**. The PRD specifies enums (`todo | in_progress | in_review | done | blocked`, etc.), but the schemas and models do not enforce them.
- **Impact:** Invalid data can pollute the database, breaking frontend assumptions.

### 5. SQL Injection Risk in Raw `setattr` Patterns
- While SQLAlchemy ORM parametrization prevents direct injection, the ubiquitous `setattr(entity, key, value)` pattern in update endpoints (`app/api/v1/users.py`, `app/api/v1/projects.py`, `app/api/v1/issues.py`, etc.) allows mass-assignment of any model column if the Pydantic schema happens to include it. This is an architecture-level maintainability and security risk.

### 6. No Rate Limiting
- No rate-limiting middleware on login, user creation, or any other endpoint.

### 7. CORS Allows All Methods/Headers
- `app/main.py` configures `allow_methods=["*"]` and `allow_headers=["*"]` with the frontend URL. This is overly permissive.

---

## Integration Concerns (Next.js Frontend)

### 1. Auth Mismatch
- The PRD specifies **BetterAuth** with email/password login, session cookies, and a `/api/auth/` catch-all route in Next.js. This FastAPI backend uses a **custom JWT + password-hash approach** (`jose` + `passlib`) with no actual login endpoint wired up.
- **Integration path:** The frontend expects BetterAuth endpoints; the backend provides none. Either the backend must expose BetterAuth-compatible endpoints, or the frontend must switch to this custom JWT flow. Given the PRD mandate, the backend is the piece that needs to change.

### 2. Response Envelope Inconsistency
- The backend returns `{"data": ...}` on success, which matches the PRD's stated convention. However, error responses are plain FastAPI `HTTPException` JSON (`{"detail": ...}`) rather than the PRD-mandated `{"error": string}` envelope.
- **Fix needed:** Add a global exception handler in `app/main.py` to rewrite errors into the `{ error }` shape.

### 3. Missing `reporter_id` Auto-Population
- `POST /projects/{project_id}/issues` in `app/api/v1/issues.py` sets `number` automatically but does **not** set `reporter_id` to the current user. The frontend would have to pass it manually, which leaks auth responsibility to the client.

### 4. No Swagger / OpenAPI Customization
- The PRD wants JSDoc-driven Swagger inside Next.js at `/api/docs`. This backend exposes FastAPI's auto-generated `/docs`, but there is no integration with the Next.js page, and the route paths differ (`/api/v1/...` vs the PRD's expected structure).

### 5. Database Schema Divergence from PRD
| PRD (Drizzle) | FastAPI (SQLAlchemy) | Gap |
|---------------|----------------------|-----|
| `status` default `"todo"` | `status` nullable? No default in model | **Missing default** |
| `priority` default `"medium"` | `priority` nullable? No default in model | **Missing default** |
| `type` default `"task"` | `type` nullable? No default in model | **Missing default** |
| `color` default `"gray"` on `columns` | `color` nullable in model, no default | **Missing default** |
| `color` default `"blue"` on `labels` | `color` nullable? Actually `nullable=False` but no default in model | **Missing default** |
| `sprints.status` default `"planning"` | `status` default `"planned"` in model | **Wrong default** |
| `columns.wipLimit` | `wip_limit` nullable integer | OK |

These defaults matter because the frontend relies on them when creating records without explicit values.

### 6. ID Generation
- The PRD uses `randomUUID()` (string PKs) generated by Drizzle defaults. The FastAPI models define `id = Column(String, primary_key=True)` with **no default generator**. Every `POST` request must supply an `id` in the request body or the DB insert will fail.
- **Impact:** Frontend cannot create resources without pre-generating UUIDs.

---

## Required Fixes / Additions

### Critical (Blockers)

1. **Add `requirements.txt`**
   - Must pin `fastapi`, `uvicorn`, `sqlalchemy`, `pydantic-settings`, `python-jose[cryptography]`, `passlib[bcrypt]`, `python-multipart`.

2. **Fix Primary Key Defaults**
   - Use `default=uuid.uuid4` or a server-side default for all `id` columns in `app/models/*.py`.

3. **Add Missing Defaults to Models**
   - `Issue.status` -> `"todo"`
   - `Issue.priority` -> `"medium"`
   - `Issue.type` -> `"task"`
   - `Column.color` -> `"gray"`
   - `Label.color` -> `"blue"`
   - `Sprint.status` -> `"planning"` (not `"planned"`)

4. **Add Password Support to User Model & Schema**
   - Add `hashed_password: str` to `User` model.
   - Add `password: str` to `UserCreate` schema (write-only).

5. **Implement Auth Router**
   - `POST /auth/login` -> verify email/password, return JWT access token.
   - `POST /auth/register` (or disable it as PRD says sign-up disabled).
   - `GET /auth/me` -> return current user.
   - Create `get_current_user` dependency using `OAuth2PasswordBearer`.

6. **Enforce Authentication on ALL Routes**
   - Add `current_user: User = Depends(get_current_user)` to every endpoint.
   - Set `reporter_id` from `current_user.id` on issue creation.
   - Set `created_by` from `current_user.id` on project creation.
   - Set `author_id` from `current_user.id` on comment creation.

7. **Add Missing API Routes**
   - `GET /api/v1/issues/{issue_id}/activity`
   - `PUT /api/v1/labels/{label_id}`
   - `POST /api/v1/issues/{issue_id}/labels` (attach)
   - `DELETE /api/v1/issues/{issue_id}/labels/{label_id}` (detach)
   - `GET /api/v1/projects/{project_id}/reports/burndown`
   - `GET /api/v1/projects/{project_id}/reports/velocity`
   - `GET /api/v1/projects/{project_id}/reports/distribution`

8. **Add Global Exception Handler**
   - In `app/main.py`, override `add_exception_handler` to return `{"error": str(exc)}` for all unhandled exceptions and validation errors.

### High Priority

9. **Add Enum Validation**
   - Constrain `Issue.status` to `todo`, `in_progress`, `in_review`, `done`, `blocked`.
   - Constrain `Issue.priority` to `critical`, `high`, `medium`, `low`.
   - Constrain `Issue.type` to `task`, `bug`, `feature`, `improvement`.
   - Constrain `Sprint.status` to `planning`, `active`, `completed`.

10. **Add Query Filtering to Issue List**
    - Accept `status`, `priority`, `type`, `assignee_id`, `sprint_id`, `label_id`, `search` query params on `GET /api/v1/projects/{project_id}/issues`.

11. **Add Activity Log Generation**
    - On issue create, move, assign, status change, priority change, and comment create, insert an `ActivityLog` row.

12. **Add Seed Endpoint or Startup Seed Script**
    - On first startup (if no users exist), create the test account, demo project, board, columns, sprint, issues, and labels.

### Medium Priority

13. **Add Basic Ownership/Authorization Checks**
    - Before updating/deleting a project, verify `project.created_by == current_user.id`.
    - Before updating/deleting a comment, verify `comment.author_id == current_user.id`.

14. **Add Database Indexes**
    - SQLAlchemy models are missing explicit indexes on foreign keys (`project_id`, `column_id`, `sprint_id`, `assignee_id`) that the PRD requires for performance.

15. **CORS Hardening**
    - Restrict `allow_methods` to `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`.
    - Restrict `allow_headers` to `Authorization`, `Content-Type`.

---

## File-by-File Quick Reference

| File | Status | Notes |
|------|--------|-------|
| `app/main.py` | NEEDS_WORK | Missing auth, exception handler, seed logic. |
| `app/core/config.py` | NEEDS_WORK | Hardcoded secret key. |
| `app/core/security.py` | NEEDS_WORK | Only JWT creation; no verification or auth deps. |
| `app/db/base.py` | OK | Standard SQLAlchemy setup. |
| `app/db/session.py` | OK | Standard dependency. |
| `app/models/user.py` | NEEDS_WORK | Missing `hashed_password`. |
| `app/models/project.py` | OK | Missing indexes. |
| `app/models/board.py` | OK | Missing indexes. |
| `app/models/column.py` | NEEDS_WORK | Missing `color` default. |
| `app/models/issue.py` | NEEDS_WORK | Missing defaults for status/priority/type; missing indexes. |
| `app/models/sprint.py` | NEEDS_WORK | Wrong `status` default (`planned` vs `planning`). |
| `app/models/comment.py` | OK | Missing indexes. |
| `app/models/label.py` | NEEDS_WORK | Missing `color` default. |
| `app/models/activity_log.py` | OK | No routes consume it. |
| `app/models/issue_label.py` | OK | No routes manage it. |
| `app/schemas/*.py` | NEEDS_WORK | No enum constraints; `UserCreate` lacks password. |
| `app/api/v1/__init__.py` | OK | Standard router aggregation. |
| `app/api/v1/users.py` | NEEDS_WORK | No auth, no password handling. |
| `app/api/v1/projects.py` | NEEDS_WORK | No auth, no ownership checks. |
| `app/api/v1/boards.py` | NEEDS_WORK | No auth. |
| `app/api/v1/columns.py` | NEEDS_WORK | No auth. |
| `app/api/v1/issues.py` | NEEDS_WORK | No auth, no filtering, no reporter auto-set. |
| `app/api/v1/sprints.py` | NEEDS_WORK | No auth. |
| `app/api/v1/comments.py` | NEEDS_WORK | No auth. |
| `app/api/v1/labels.py` | NEEDS_WORK | Missing `PUT` route, no auth. |

---

*End of audit report.*

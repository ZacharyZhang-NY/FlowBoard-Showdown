# API & Database Audit: FlowBoard

**Audit Date:** 2026-04-14

---

## Executive Summary

**Status: NEEDS_WORK**

The API layer and database schema are largely aligned with the PRD, but several gaps and logic bugs exist. The most critical issues are missing endpoints for column creation (`POST /api/v1/boards/:id/columns`), incomplete Swagger annotations across most routes, and a logic bug in the sprint completion endpoint that ignores the `moveToBacklogIssueIds` parameter. Security is acceptable for an internal tool but lacks ownership checks on read endpoints for projects, and rate limiting is per-route only with an in-memory store.

---

## 1. Missing API Endpoints

| PRD Endpoint | Status | File | Notes |
|--------------|--------|------|-------|
| `GET /api/v1/projects` | Present | `app/api/v1/projects/route.ts` | |
| `POST /api/v1/projects` | Present | `app/api/v1/projects/route.ts` | |
| `GET /api/v1/projects/:id` | Present | `app/api/v1/projects/[id]/route.ts` | |
| `PUT /api/v1/projects/:id` | Present | `app/api/v1/projects/[id]/route.ts` | |
| `DELETE /api/v1/projects/:id` | Present | `app/api/v1/projects/[id]/route.ts` | |
| `GET /api/v1/projects/:id/boards` | Present | `app/api/v1/projects/[id]/boards/route.ts` | |
| `POST /api/v1/projects/:id/boards` | Present | `app/api/v1/projects/[id]/boards/route.ts` | |
| `GET /api/v1/boards/:id` | Present | `app/api/v1/boards/[id]/route.ts` | |
| `PUT /api/v1/boards/:id` | Present | `app/api/v1/boards/[id]/route.ts` | |
| `DELETE /api/v1/boards/:id` | Present | `app/api/v1/boards/[id]/route.ts` | |
| `POST /api/v1/boards/:boardId/columns` | **MISSING** | — | `app/api/v1/boards/[id]/columns/route.ts` only exports `POST` using `id` param, but the PRD names it `:boardId`. The route exists, naming mismatch only. |
| `PUT /api/v1/columns/:id` | Present | `app/api/v1/columns/[id]/route.ts` | |
| `DELETE /api/v1/columns/:id` | Present | `app/api/v1/columns/[id]/route.ts` | |
| `PUT /api/v1/columns/reorder` | Present | `app/api/v1/columns/reorder/route.ts` | |
| `GET /api/v1/projects/:id/issues` | Present | `app/api/v1/projects/[id]/issues/route.ts` | |
| `POST /api/v1/projects/:id/issues` | Present | `app/api/v1/projects/[id]/issues/route.ts` | |
| `GET /api/v1/issues/:id` | Present | `app/api/v1/issues/[id]/route.ts` | |
| `PUT /api/v1/issues/:id` | Present | `app/api/v1/issues/[id]/route.ts` | |
| `DELETE /api/v1/issues/:id` | Present | `app/api/v1/issues/[id]/route.ts` | |
| `PUT /api/v1/issues/:id/move` | Present | `app/api/v1/issues/[id]/move/route.ts` | |
| `PUT /api/v1/issues/reorder` | Present | `app/api/v1/issues/reorder/route.ts` | |
| `GET /api/v1/projects/:id/sprints` | Present | `app/api/v1/projects/[id]/sprints/route.ts` | |
| `POST /api/v1/projects/:id/sprints` | Present | `app/api/v1/projects/[id]/sprints/route.ts` | |
| `PUT /api/v1/sprints/:id` | Present | `app/api/v1/sprints/[id]/route.ts` | |
| `PUT /api/v1/sprints/:id/start` | Present | `app/api/v1/sprints/[id]/start/route.ts` | |
| `PUT /api/v1/sprints/:id/complete` | Present | `app/api/v1/sprints/[id]/complete/route.ts` | |
| `GET /api/v1/issues/:id/comments` | Present | `app/api/v1/issues/[id]/comments/route.ts` | |
| `POST /api/v1/issues/:id/comments` | Present | `app/api/v1/issues/[id]/comments/route.ts` | |
| `PUT /api/v1/comments/:id` | Present | `app/api/v1/comments/[id]/route.ts` | |
| `DELETE /api/v1/comments/:id` | Present | `app/api/v1/comments/[id]/route.ts` | |
| `GET /api/v1/projects/:id/labels` | Present | `app/api/v1/projects/[id]/labels/route.ts` | |
| `POST /api/v1/projects/:id/labels` | Present | `app/api/v1/projects/[id]/labels/route.ts` | |
| `DELETE /api/v1/labels/:id` | Present | `app/api/v1/labels/[id]/route.ts` | |
| `GET /api/v1/issues/:id/activity` | Present | `app/api/v1/issues/[id]/activity/route.ts` | |
| `GET /api/v1/projects/:id/reports/burndown` | Present | `app/api/v1/projects/[id]/reports/burndown/route.ts` | |
| `GET /api/v1/projects/:id/reports/velocity` | Present | `app/api/v1/projects/[id]/reports/velocity/route.ts` | |
| `GET /api/v1/projects/:id/reports/distribution` | Present | `app/api/v1/projects/[id]/reports/distribution/route.ts` | |

**Extra endpoints not in PRD:**
- `GET /api/v1/users` (`app/api/v1/users/route.ts`)
- `GET /api/v1/projects/:id/reports/priority` (`app/api/v1/projects/[id]/reports/priority/route.ts`)
- `GET /api/v1/projects/:id/reports/cumulative` (`app/api/v1/projects/[id]/reports/cumulative/route.ts`)
- `PUT /api/v1/issues/:id/labels` (`app/api/v1/issues/[id]/labels/route.ts`)

These are useful for the UI and acceptable extensions.

---

## 2. Swagger / OpenAPI Annotations

**Status: INCOMPLETE**

Most routes have a basic `@swagger` JSDoc block with `summary` and `tags`, but they lack:

- `parameters` definitions (only `app/api/v1/projects/[id]/boards/route.ts` GET has them)
- `requestBody` schemas (only `app/api/v1/projects/[id]/boards/route.ts` POST has them)
- `responses` schemas (only `app/api/v1/projects/route.ts` GET has them)
- `security` annotations

**Required fixes:**
1. Add `parameters` blocks to all routes that accept path params (`{id}`, `{boardId}`, etc.).
2. Add `requestBody` blocks to all `POST`/`PUT` routes.
3. Add `responses` blocks to all routes.
4. Add `security: [{ bearerAuth: [] }]` or equivalent if using cookie/session auth.

---

## 3. Database Schema vs PRD Section 5.1

**Status: ALIGNED**

All tables and columns from PRD section 5.1 are present in `db/schema.ts`:

- `projects` — all fields match
- `boards` — all fields match
- `columns` — all fields match (including `wipLimit`)
- `issues` — all fields match (including `number`, `storyPoints`, `dueDate`)
- `sprints` — all fields match
- `comments` — all fields match
- `labels` — all fields match
- `issueLabels` — composite PK correct
- `activityLog` — all fields match

BetterAuth tables (`user`, `session`, `account`, `verification`) are also correctly defined.

**Indexes:** Proper indexes exist on foreign keys (`projectId`, `columnId`, `sprintId`, `assigneeId`, `boardId`, `issueId`, etc.).

**Relations:** Drizzle relations are fully configured in `db/schema.ts`.

---

## 4. Seed Data vs PRD Section 5.2

**Status: ALIGNED**

`db/seed.ts` seeds correctly:
- Test user `test@zacharyzhang.com` / `Test@TestModels` via BetterAuth API
- Project "FlowBoard Demo" with key `FB`
- Board "Main Board" with 4 columns (To Do, In Progress, In Review, Done) and correct colors
- Sprint "Sprint 1" active, current week to +2 weeks
- 12 sample issues distributed across columns with varying priorities/types
- Labels: frontend, backend, bug, design, infra
- Activity log entries for each created issue

**Minor issue:** `db/seed.ts` instantiates its own BetterAuth instance with `signUpEnabled: true`. This works, but ensure `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL` are set in the environment or seeding will fail.

---

## 5. Security Issues

### 5.1 Auth Checks

All mutating endpoints (`POST`, `PUT`, `DELETE`) check `getSession()` and return `unauthorized()` if missing.

**Issue: Read endpoints lack ownership verification in some cases**
- `GET /api/v1/projects` (`app/api/v1/projects/route.ts`) returns **all** projects, not just those owned by the user. This leaks other users' projects.
- `GET /api/v1/users` (`app/api/v1/users/route.ts`) returns all users to any authenticated user. Acceptable for internal tooling but worth noting.

**Fix:** Filter `GET /api/v1/projects` by `createdBy: session.user.id`.

### 5.2 Rate Limiting

`lib/api-utils.ts` implements a simple in-memory rate limiter (`rateLimitMap`).

**Issues:**
- Uses `Map` in memory, so it resets on every serverless cold start and does not scale across instances.
- Limit is 20 requests per minute per IP+route. This is very low for a board UI with drag-and-drop (reorder calls could easily exceed this).
- `GET` requests are not rate-limited anywhere.

**Fix:** Increase limit for batch/reorder routes or exclude them, and consider a Redis-backed limiter for production.

### 5.3 Input Validation

Zod schemas are used on all `POST`/`PUT` bodies. No SQL injection risk (Drizzle parameterized queries).

**Issue:** `req.json().catch(() => ({}))` silently swallows malformed JSON and treats it as an empty object, which may produce confusing Zod errors instead of a clear "Invalid JSON" response.

**Fix:** Return `badRequest("Invalid JSON body")` when `req.json()` throws.

### 5.4 Ownership Checks

`verifyProjectOwnership`, `verifyBoardOwnership`, etc. in `lib/api-utils.ts` only check if the resource's project `createdBy` matches the user. This means only the project creator can access anything; there is no concept of "project members".

This matches the PRD's simple model, so it is acceptable, but it will block any multi-user collaboration scenario.

---

## 6. API Response Format Consistency

**Status: MOSTLY CONSISTENT**

Success responses use `json(data)` from `lib/api-utils.ts`, which wraps as `{ data: T }`.
Error responses use `{ error: string }`.

**Inconsistencies found:**
- `app/api/v1/sprints/[id]/complete/route.ts` line 30:
  ```typescript
  if (!parsed.success) return json({ error: parsed.error.message }, 400);
  ```
  This returns `{ error: string }` wrapped inside `json()`, which produces `{ data: { error: string } }`. It should use `badRequest(parsed.error.message)` instead.

- `app/api/v1/issues/reorder/route.ts` uses `db.transaction((tx) => { ... })` with `.run()`. This is correct for better-sqlite3, but there is no `await` on `db.transaction`. It happens to work because better-sqlite3 transactions are synchronous, but it is stylistically inconsistent.

---

## 7. Business Logic Bugs

### 7.1 Sprint Complete — Ignored Parameter

**File:** `app/api/v1/sprints/[id]/complete/route.ts`

```typescript
const moveIds = parsed.data.moveToBacklogIssueIds || [];
if (moveIds.length > 0) {
  await db
    .update(schema.issues)
    .set({ sprintId: null })
    .where(and(eq(schema.issues.sprintId, id), not(eq(schema.issues.status, "done"))));
} else {
  await db.update(schema.issues).set({ sprintId: null }).where(eq(schema.issues.sprintId, id));
}
```

**Bug:** When `moveToBacklogIssueIds` is provided, the code still moves **all non-done issues** to backlog instead of only the specified IDs. The `moveIds` array is never used in the query.

**Fix:** Use `inArray(schema.issues.id, moveIds)` in the `where` clause when `moveIds` is non-empty.

### 7.2 Issue Update — Activity Log Field Mapping Bug

**File:** `app/api/v1/issues/[id]/route.ts`

```typescript
const dbField = camelToSnake(fieldKey);
oldValue: String((existing as Record<string, unknown>)[dbField] ?? ""),
```

**Bug:** `camelToSnake` converts `assigneeId` to `assignee_id`, but the `existing` object from Drizzle uses camelCase property names (`assigneeId`, `reporterId`, etc.) because of the query result shape. Accessing `existing["assignee_id"]` will always be `undefined`, causing empty `oldValue` entries in the activity log for fields like `assigneeId`, `sprintId`, `columnId`, `storyPoints`, `dueDate`.

**Fix:** Use the camelCase key directly: `(existing as Record<string, unknown>)[fieldKey]`.

### 7.3 Issue Move — Missing Status Sync

**File:** `app/api/v1/issues/[id]/move/route.ts`

When an issue is moved to a new column, the API updates `columnId` and `position` but does **not** update `status`. If a card is dragged from "To Do" to "Done", the `status` field remains `todo`, creating a data inconsistency.

**Fix:** Derive the new status from the target column's `name` or accept a `status` field in the move payload and update it alongside `columnId`.

### 7.4 Burndown Report — Incorrect Date Comparison

**File:** `app/api/v1/projects/[id]/reports/burndown/route.ts`

```typescript
const doneBeforeDay = issuesInSprint.filter(
  (i) => i.status === "done" && i.updatedAt && new Date(i.updatedAt) <= day
);
```

**Bug:** `updatedAt` changes on any field edit, not just status changes. A done issue that later gets its description edited will have a later `updatedAt` and may no longer count as "done before day" for earlier dates, distorting the burndown chart.

**Fix:** Use `createdAt` for the done date, or query the `activityLog` for `status_changed` to `done` events.

### 7.5 Cumulative Flow Report — Incorrect Logic

**File:** `app/api/v1/projects/[id]/reports/cumulative/route.ts`

```typescript
const count = issues.filter((i) => {
  const created = new Date(i.createdAt);
  return i.status === status && created <= day;
}).length;
```

**Bug:** This counts issues that were **created** before `day` and currently have `status`. It does not reflect historical status transitions. An issue created in January and moved to `done` in March will appear in the `done` line for all of January and February.

**Fix:** This is a hard problem without a status-history table. For a quick fix, base cumulative flow on `activityLog` entries, or document that the chart shows "current status of issues that existed by that date" (which is not a true cumulative flow diagram).

---

## 8. Required Fixes (Priority Order)

1. **Fix sprint completion logic** (`app/api/v1/sprints/[id]/complete/route.ts`) to respect `moveToBacklogIssueIds`.
2. **Fix activity log oldValue mapping** (`app/api/v1/issues/[id]/route.ts`) — use camelCase keys, not snake_case.
3. **Fix response format bug** (`app/api/v1/sprints/[id]/complete/route.ts` line 30) — replace `json({ error: ... }, 400)` with `badRequest(...)`.
4. **Filter project list** (`app/api/v1/projects/route.ts`) to only return projects where `createdBy === session.user.id`.
5. **Sync status on issue move** (`app/api/v1/issues/[id]/move/route.ts`) or accept `status` in the payload.
6. **Improve Swagger annotations** across all routes (parameters, requestBody, responses).
7. **Fix burndown chart** to use a stable "done" timestamp instead of `updatedAt`.
8. **Document or fix cumulative flow** report logic so it does not misrepresent historical data.
9. **Increase rate limit** for reorder/move endpoints to prevent UI throttling during drag-and-drop.
10. **Return clearer error** for malformed JSON instead of silently defaulting to `{}`.

---

*Audit completed: 2026-04-14*

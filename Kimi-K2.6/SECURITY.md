# FlowBoard Security Audit

## Scope
Full-stack Next.js 16 application with SQLite persistence, BetterAuth authentication, and IBM Carbon Design System frontend.

## Findings & Mitigations

| # | Finding | Severity | Mitigation | Status |
|---|---|---|---|---|
| 1 | Missing edge auth protection (`middleware.ts` did not exist, `proxy.ts` was dead code) | Critical | Replaced with `proxy.ts` using Next.js 16 proxy convention. All non-public routes now redirect unauthenticated users to `/login` at the edge. | Resolved |
| 2 | No project-level authorization on API routes | Critical | Added ownership verification helpers (`verifyProjectOwnership`, `verifyBoardOwnership`, etc.) to all `/api/v1/*` routes. Users can only access resources they created. | Resolved |
| 3 | `GET /api/v1/boards/:id` only fetched issues for the first column | High | Fixed query to use `inArray(schema.issues.columnId, columnIds)` instead of `eq(columnIds[0])`. | Resolved |
| 4 | Auth instance re-initialized on HMR causing transient crashes | High | Cached BetterAuth instance on `globalThis` in `lib/auth.ts`. | Resolved |
| 5 | No rate limiting on mutations | High | Added in-memory rate limiting (20 requests/min per IP) on all mutation routes via `lib/api-utils.ts`. | Resolved |
| 6 | `BETTER_AUTH_SECRET` too short in `.env.example` | Medium | Updated `.env.example` to a 32-character secret. | Resolved |
| 7 | Unsanitized search query in issues list API | Medium | Added `escapeLike()` to escape `%`, `_`, and `\` before LIKE matching. | Resolved |
| 8 | Error responses leaked nested objects instead of plain strings | Low | Standardized API errors to `{ error: string }` format per PRD. | Resolved |
| 9 | Missing index on `activityLog.userId` | Low | Added `activityLog_userId_idx` to `db/schema.ts`. | Resolved |

## Remaining Recommendations
1. **HTTPS in production**: Ensure `BETTER_AUTH_URL` uses `https://` in production.
2. **Session hardening**: Consider lowering session expiry for increased security.
3. **Rate limiting scale**: Replace in-memory rate limiting with Redis or similar for multi-instance deployments.
4. **CSP headers**: Add Content-Security-Policy headers via `next.config.ts` for production builds.

## Verification
- `npx tsc --noEmit` passes.
- `npx next build` passes.
- `npm run dev` starts cleanly with automatic migrations and seeding.
- Auth edge protection verified: unauthenticated requests to `/dashboard` receive 307 redirect to `/login`.
- Swagger UI at `/api/docs` renders the complete OpenAPI 3.1.0 spec.

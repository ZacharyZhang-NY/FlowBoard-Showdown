# FlowBoard Rebuild Plan

## Phase 1: Critical Fixes (Unblock Current Usage)
1. Fix `AppShell.tsx` React hook violation
2. Fix API logic bugs: sprint complete, activity log mapping, issue move status sync
3. Fix API response format inconsistency in sprint complete
4. Fix `GET /api/v1/projects` to filter by current user
5. Fix burndown report date comparison bug
6. Add missing shared components: `EmptyState`, `UserAvatar`, `ConfirmModal`
7. Fix issue detail hardcoded project key and due date picker
8. Fix ReportsPage silent fetch errors

## Phase 2: Frontend Completeness & Carbon Compliance
1. Add label filter to BoardView
2. Wire IssueTable column sorting or remove misleading prop
3. Replace plain `<div>` empty states with Carbon `Tile` + icons
4. Extract report charts to `components/reports/*`
5. Add SprintBoard time-elapsed ProgressBar
6. Add Settings column reordering
7. Add Settings label color swatches
8. Fix IssueCard blank avatar fallback and Move to action
9. Standardize modal usage (ComposedModal)
10. Fix IssueTable checkbox propagation
11. Add Dashboard trend tag calculation
12. Add RecentActivity icons
13. Remove unused `SprintForm.tsx` or integrate it

## Phase 3: API Completeness & Swagger
1. Add missing swagger annotations (parameters, requestBody, responses) to all routes
2. Improve JSON parse error handling across all routes
3. Adjust rate limits for drag-and-drop endpoints
4. Add `POST /api/v1/boards/:id/columns` explicit route if naming mismatch exists
5. Verify cumulative flow report logic and document limitation or fix

## Phase 4: FastAPI Backend Hardening
1. Add `requirements.txt`
2. Fix SQLAlchemy model defaults (status, priority, type, color, sprint.status)
3. Fix PK defaults with `uuid.uuid4`
4. Add `hashed_password` to User model and auth router
5. Implement `get_current_user` dependency
6. Enforce auth on all FastAPI routes
7. Add missing routes: activity log, reports, label PUT, issue-label attach/detach
8. Add global exception handler for `{error: string}` format
9. Add enum validation in schemas
10. Add query filtering to issue list
11. Add basic ownership checks
12. Harden CORS

## Phase 5: Integration & Verification
1. Run `npm install && npm run dev` end-to-end
2. Verify all 18 PRD acceptance criteria
3. Verify `npm run build` passes
4. Verify `npx tsc --noEmit` passes
5. Verify FastAPI starts and endpoints respond correctly

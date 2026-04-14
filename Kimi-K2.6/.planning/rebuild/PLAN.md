# FlowBoard Rebuild Plan

## Phase 1: Critical Infrastructure & Security
1. Create `middleware.ts` for edge auth protection (replace dead `proxy.ts`)
2. Fix `.env.example` BETTER_AUTH_SECRET to 32+ chars
3. Fix `GET /api/v1/boards/:id` issue query bug (only first column issues fetched)
4. Cache auth instance globally to prevent HMR re-init crashes
5. Add missing `activityLog.userId` index in schema

## Phase 2: API Authorization & Completeness
1. Add project-level authorization to all `/api/v1/projects/:id/*` and child routes
2. Standardize error response format to `{ error: string }` per PRD
3. Fix `PUT /api/v1/issues/:id` activity logging for `dueDate` key mapping
4. Sanitize search query in issues list API
5. Add rate limiting to auth and sensitive mutation routes

## Phase 3: Frontend Carbon Compliance
1. Replace native `<select>` elements in Settings with Carbon `Dropdown`
2. Replace raw `<button>` in CommentList with Carbon `Button`
3. Use Carbon `PasswordInput` on login page
4. Fix responsive grid in issue detail (single column below md)
5. Fix reports page to use strict 2x3 grid layout

## Phase 4: Missing Features
1. Board view: add Filter dropdown, Search input, OverflowMenu on board header
2. Issue cards: add type icon and OverflowMenu on hover
3. Issues list: add toolbar filters and batch actions
4. Issue detail: add Assignee dropdown
5. Sprints: add StructuredList for active sprint issues, LineChart burndown, planning view with drag-to-sprint
6. Settings: add danger "Delete Project" button with confirmation modal

## Phase 5: Accessibility & Responsive Shell
1. Add dnd-kit screen reader announcements to BoardView
2. Make side nav collapsible below 1056px breakpoint
3. Add responsive margin handling for Content when side nav toggles

## Phase 6: Verification
1. Full TypeScript pass
2. End-to-end walkthrough of all acceptance criteria
3. Swagger docs verification

# PRD: FlowBoard - Team Project Management Board

## 1. Product Overview

FlowBoard is a team project management board with drag-and-drop Kanban, Sprint planning, and Issue tracking. The application uses IBM Carbon Design System for a disciplined, enterprise-grade UI. Built as a monolithic Next.js 16 full-stack application with SQLite persistence.

**Target Outcome**: A fully functional, visually polished project management tool that a single developer would need 5-7 days to build, completed by Kimi Code in a single session.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript | 5.x |
| UI System | IBM Carbon Design System (`@carbon/react`) | latest |
| Icons | `@carbon/icons-react` | latest |
| Drag & Drop | `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` | latest |
| Auth | BetterAuth | latest |
| ORM | Drizzle ORM | latest |
| Database | SQLite via `better-sqlite3` | latest |
| API Docs | `next-swagger-doc` + `swagger-ui-react` | latest |
| Charts | `@carbon/charts-react` | latest |
| Date Handling | `date-fns` | latest |
| Form Validation | `zod` | latest |

**No other dependencies allowed.** Do not install Tailwind CSS, shadcn/ui, Radix, or any CSS framework. All styling through Carbon's SCSS tokens and `@carbon/styles`.

---

## 3. Authentication

### 3.1 BetterAuth Configuration

```typescript
// lib/auth.ts
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: schema,
  }),
  emailAndPassword: {
    enabled: true,
    signUpEnabled: false, // Registration disabled
  },
});
```

### 3.2 Test Account (Seed on First Boot)

| Field | Value |
|-------|-------|
| Email | `test@zacharyzhang.com` |
| Password | `Test@TestModels` |
| Display Name | `Zachary Zhang` |
| Role | `admin` |

The application must seed this user on first startup if the users table is empty. Use a `db/seed.ts` script that runs automatically via a check in the auth initialization. **No registration page exists. The login page only shows email + password fields.**

### 3.3 Auth Pages

The login page (`/login`) uses Carbon's `TextInput`, `Button`, and `Form` components. On failed login, display an inline `InlineNotification` (kind="error"). On success, redirect to `/dashboard`.

All routes except `/login` and `/api/docs` require authentication. Use Next.js middleware for route protection.

---

## 4. IBM Carbon Design System Specification

### 4.1 Theme

Use the **Gray 10 (g10)** theme as the default light theme. Support theme switching to **Gray 90 (g90)** for dark mode.

```scss
// app/globals.scss
@use '@carbon/react/scss/themes';
@use '@carbon/react/scss/theme' with (
  $theme: themes.$g10
);
@use '@carbon/react';
```

### 4.2 Layout Shell

The application shell uses Carbon's UI Shell components:

```
+--------------------------------------------------+
| Header (HeaderName: "FlowBoard")        [Avatar] |
+--------+-----------------------------------------+
| SideNav |  Main Content Area                     |
| -----   |                                        |
| Boards  |                                        |
| Sprints |                                        |
| Issues  |                                        |
| Reports |                                        |
| Settings|                                        |
+--------+-----------------------------------------+
```

Components used:
- `Header`, `HeaderName`, `HeaderGlobalBar`, `HeaderGlobalAction`
- `SideNav`, `SideNavItems`, `SideNavLink`, `SideNavMenu`, `SideNavMenuItem`
- `Content` (for the main area with proper left padding)

### 4.3 Component Mapping

Every UI element must use a Carbon component. The mapping:

| UI Element | Carbon Component |
|-----------|-----------------|
| Navigation | `SideNav`, `SideNavLink` |
| Buttons | `Button` (primary/secondary/ghost/danger) |
| Forms | `Form`, `TextInput`, `TextArea`, `Select`, `DatePicker`, `NumberInput` |
| Tables | `DataTable`, `Table`, `TableHead`, `TableRow`, `TableCell`, `TableToolbar` |
| Modals | `Modal`, `ComposedModal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Notifications | `InlineNotification`, `ToastNotification` |
| Tags/Labels | `Tag` (various colors for priority/status) |
| Tabs | `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel` |
| Loading | `Loading`, `InlineLoading` |
| Dropdowns | `Dropdown`, `MultiSelect` |
| Breadcrumbs | `Breadcrumb`, `BreadcrumbItem` |
| Search | `Search` |
| Toggles | `Toggle` |
| Progress | `ProgressBar` |
| Overflow Menu | `OverflowMenu`, `OverflowMenuItem` |
| Tooltips | `Tooltip`, `DefinitionTooltip` |
| Empty States | `Tile` with icon illustration |
| Pagination | `Pagination` |

### 4.4 Spacing & Typography

Follow Carbon's spacing scale strictly:
- `$spacing-03` (8px) for tight spacing
- `$spacing-05` (16px) for standard spacing
- `$spacing-07` (32px) for section spacing
- `$spacing-09` (48px) for major section separation

Typography uses IBM Plex Sans through Carbon's type tokens:
- Page titles: `productive-heading-05`
- Section titles: `productive-heading-03`
- Body text: `body-long-01`
- Labels: `label-01`
- Helper text: `helper-text-01`

### 4.5 Color Usage for Status/Priority

Use Carbon's tag color variants consistently:

| Concept | Color | Carbon Tag Type |
|---------|-------|----------------|
| To Do | `gray` | `Tag kind="gray"` |
| In Progress | `blue` | `Tag kind="blue"` |
| In Review | `purple` | `Tag kind="purple"` |
| Done | `green` | `Tag kind="green"` |
| Blocked | `red` | `Tag kind="red"` |
| Priority: Critical | `red` | `Tag kind="red"` |
| Priority: High | `orange` | `Tag kind="warm-gray"` |
| Priority: Medium | `blue` | `Tag kind="blue"` |
| Priority: Low | `gray` | `Tag kind="gray"` |

### 4.6 Grid System

Use Carbon's 16-column CSS Grid (`@carbon/grid`):
- Dashboard: 4-column card layout (each card spans 4 columns)
- Board view: columns use flexible widths within the grid
- Settings/Forms: centered, 8-column max-width

---

## 5. Database Schema (Drizzle + SQLite)

### 5.1 Tables

```typescript
// db/schema.ts

// BetterAuth managed tables: user, session, account, verification

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  key: text("key").notNull().unique(), // e.g. "FLOW", used as issue prefix
  description: text("description"),
  createdBy: text("created_by").notNull().references(() => user.id),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const boards = sqliteTable("boards", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const columns = sqliteTable("columns", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  boardId: text("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull().default(0),
  color: text("color").notNull().default("gray"), // maps to Carbon tag color
  wipLimit: integer("wip_limit"), // optional WIP limit
});

export const issues = sqliteTable("issues", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  columnId: text("column_id").references(() => columns.id, { onDelete: "set null" }),
  sprintId: text("sprint_id").references(() => sprints.id, { onDelete: "set null" }),
  number: integer("number").notNull(), // auto-increment per project
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default("todo"), // todo | in_progress | in_review | done | blocked
  priority: text("priority").notNull().default("medium"), // critical | high | medium | low
  type: text("type").notNull().default("task"), // task | bug | feature | improvement
  assigneeId: text("assignee_id").references(() => user.id, { onDelete: "set null" }),
  reporterId: text("reporter_id").notNull().references(() => user.id),
  position: integer("position").notNull().default(0), // position within column
  storyPoints: integer("story_points"),
  dueDate: integer("due_date", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const sprints = sqliteTable("sprints", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  goal: text("goal"),
  startDate: integer("start_date", { mode: "timestamp" }),
  endDate: integer("end_date", { mode: "timestamp" }),
  status: text("status").notNull().default("planning"), // planning | active | completed
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const labels = sqliteTable("labels", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  color: text("color").notNull().default("blue"),
});

export const issueLabels = sqliteTable("issue_labels", {
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  labelId: text("label_id").notNull().references(() => labels.id, { onDelete: "cascade" }),
}, (table) => ({
  pk: primaryKey({ columns: [table.issueId, table.labelId] }),
}));

export const activityLog = sqliteTable("activity_log", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  issueId: text("issue_id").notNull().references(() => issues.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id),
  action: text("action").notNull(), // created | status_changed | assigned | commented | moved | priority_changed
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
```

### 5.2 Seed Data

On first boot, seed the following in addition to the test user:

**Project**: "FlowBoard Demo" (key: "FB")

**Board**: "Main Board" with 4 columns:
1. To Do (gray)
2. In Progress (blue)
3. In Review (purple)
4. Done (green)

**Sprint**: "Sprint 1" (active, current week to +2 weeks)

**Issues**: 12 sample issues distributed across columns, with varying priorities and types. Each issue prefixed with project key (e.g. FB-1, FB-2). Some assigned to the test user, some unassigned.

**Labels**: "frontend", "backend", "bug", "design", "infra"

---

## 6. API Design

### 6.1 REST Endpoints

All API routes under `/api/v1/`. Auth routes under `/api/auth/` managed by BetterAuth.

```
Authentication (BetterAuth):
POST   /api/auth/sign-in/email        Login
POST   /api/auth/sign-out              Logout
GET    /api/auth/get-session           Get current session

Projects:
GET    /api/v1/projects                List projects
POST   /api/v1/projects                Create project
GET    /api/v1/projects/:id            Get project
PUT    /api/v1/projects/:id            Update project
DELETE /api/v1/projects/:id            Delete project

Boards:
GET    /api/v1/projects/:id/boards              List boards
POST   /api/v1/projects/:id/boards              Create board
GET    /api/v1/boards/:id                        Get board with columns and issues
PUT    /api/v1/boards/:id                        Update board
DELETE /api/v1/boards/:id                        Delete board

Columns:
POST   /api/v1/boards/:boardId/columns          Create column
PUT    /api/v1/columns/:id                       Update column
DELETE /api/v1/columns/:id                       Delete column
PUT    /api/v1/columns/reorder                   Reorder columns

Issues:
GET    /api/v1/projects/:id/issues               List issues (filterable)
POST   /api/v1/projects/:id/issues               Create issue
GET    /api/v1/issues/:id                         Get issue detail
PUT    /api/v1/issues/:id                         Update issue
DELETE /api/v1/issues/:id                         Delete issue
PUT    /api/v1/issues/:id/move                    Move issue (column + position)
PUT    /api/v1/issues/reorder                     Batch reorder issues

Sprints:
GET    /api/v1/projects/:id/sprints              List sprints
POST   /api/v1/projects/:id/sprints              Create sprint
PUT    /api/v1/sprints/:id                        Update sprint
PUT    /api/v1/sprints/:id/start                  Start sprint
PUT    /api/v1/sprints/:id/complete               Complete sprint

Comments:
GET    /api/v1/issues/:id/comments               List comments
POST   /api/v1/issues/:id/comments               Create comment
PUT    /api/v1/comments/:id                       Update comment
DELETE /api/v1/comments/:id                       Delete comment

Labels:
GET    /api/v1/projects/:id/labels               List labels
POST   /api/v1/projects/:id/labels               Create label
DELETE /api/v1/labels/:id                         Delete label

Activity:
GET    /api/v1/issues/:id/activity               Get issue activity log

Reports:
GET    /api/v1/projects/:id/reports/burndown     Sprint burndown data
GET    /api/v1/projects/:id/reports/velocity      Velocity chart data
GET    /api/v1/projects/:id/reports/distribution  Issue distribution data
```

### 6.2 OpenAPI / Swagger

Serve Swagger UI at `/api/docs` using `next-swagger-doc` + `swagger-ui-react`.

Each API route must have JSDoc annotations for OpenAPI spec generation:

```typescript
/**
 * @swagger
 * /api/v1/projects:
 *   get:
 *     summary: List all projects
 *     tags: [Projects]
 *     responses:
 *       200:
 *         description: Array of projects
 */
```

The Swagger page (`/api/docs`) is publicly accessible (no auth required) for API exploration.

---

## 7. Pages & Features

### 7.1 Login (`/login`)

Carbon `Form` with:
- `TextInput` for email
- `PasswordInput` for password (Carbon's built-in password visibility toggle)
- `Button` (primary) "Sign In"
- `InlineNotification` for errors
- Centered layout, max-width 400px
- FlowBoard logo/name above the form

### 7.2 Dashboard (`/dashboard`)

The landing page after login. Shows project-level summary.

**Layout**: 4-column grid of `ClickableTile` components.

Cards:
1. **Open Issues** - count with `Tag` showing trend (up/down vs last week)
2. **Active Sprint** - name + progress `ProgressBar` (completed / total story points)
3. **My Assigned** - count of issues assigned to current user
4. **Overdue** - count of issues past due date, `Tag kind="red"` if > 0

Below the cards:
- **Recent Activity** feed: `StructuredList` showing last 20 activity log entries (icon + user + action + issue link + timestamp)
- **Issues by Status**: horizontal bar chart via `@carbon/charts-react` (`SimpleBarChart`)
- **Issues by Priority**: donut chart via `@carbon/charts-react` (`DonutChart`)

### 7.3 Board View (`/boards/:id`)

The core Kanban board page.

**Header section**:
- `Breadcrumb`: Project > Board Name
- `Button` (ghost) "Filter" with `Dropdown` for assignee, priority, type, label
- `Search` component for quick issue search
- `OverflowMenu` with board settings

**Board area**:
Each column rendered as a vertical droppable zone using `@dnd-kit/sortable`:

```
+----------+  +----------+  +----------+  +----------+
| To Do    |  |In Progress|  |In Review |  |  Done    |
| (3)      |  | (2)      |  | (1)      |  |  (4)     |
+----------+  +----------+  +----------+  +----------+
| [Card]   |  | [Card]   |  | [Card]   |  | [Card]   |
| [Card]   |  | [Card]   |  |          |  | [Card]   |
| [Card]   |  |          |  |          |  | [Card]   |
|          |  |          |  |          |  | [Card]   |
| + Add    |  | + Add    |  | + Add    |  | + Add    |
+----------+  +----------+  +----------+  +----------+
```

**Issue Card** (within columns):
- Rendered as Carbon `Tile` with click handler
- Shows: issue key (FB-1), title, priority `Tag`, type icon, assignee avatar (or blank circle), story points badge
- Drag handle on hover (grab cursor)
- `OverflowMenu` on hover: Edit, Move to, Delete

**Drag behavior**:
- Cards draggable between columns and within columns (reorder)
- Column headers show count and optional WIP limit indicator
- Smooth drop animation via dnd-kit's CSS transform approach
- On drop: `PUT /api/v1/issues/:id/move` called with new `columnId` and `position`

**Add Issue inline**:
- Click "+ Add" at bottom of column
- Expands inline `TextInput` for title
- Press Enter to create, Escape to cancel
- Created issue appears at bottom of that column

### 7.4 Issue Detail (`/issues/:id`)

Full-page view with two-column layout:

**Left column (10 cols):**
- Issue key + title (editable inline via `TextInput`)
- `TextArea` for description (editable)
- `Tabs`: Comments | Activity
  - Comments tab: list of comments with author, timestamp, content. `TextArea` + `Button` to add new comment
  - Activity tab: `StructuredList` of all activity log entries for this issue

**Right column (6 cols):**
- **Status**: `Dropdown` (todo/in_progress/in_review/done/blocked)
- **Priority**: `Dropdown` (critical/high/medium/low)
- **Type**: `Dropdown` (task/bug/feature/improvement)
- **Assignee**: `Dropdown` (list of project members)
- **Sprint**: `Dropdown` (list of sprints)
- **Story Points**: `NumberInput`
- **Due Date**: `DatePicker`
- **Labels**: `MultiSelect`
- **Created**: timestamp (read-only)
- **Updated**: timestamp (read-only)

All field changes auto-save on blur/change and log to activity.

### 7.5 Issues List (`/issues`)

Table view of all issues using Carbon `DataTable`.

**Toolbar**:
- `Search` for filtering
- `Dropdown` filters: Status, Priority, Type, Sprint, Assignee
- `Button` "New Issue" opens `ComposedModal`

**Table columns**: Key, Title, Status (Tag), Priority (Tag), Type, Assignee, Sprint, Story Points, Due Date, Updated

**Features**:
- Sortable columns (click header)
- `Pagination` component at bottom
- Row click navigates to issue detail
- Batch actions via `TableToolbar`: bulk status change, bulk assign, bulk move to sprint

### 7.6 Sprints (`/sprints`)

**Sprint list**: `Tabs` switching between Planning | Active | Completed sprints.

**Active Sprint view**:
- Sprint name, goal, date range with `ProgressBar` for time elapsed
- `StructuredList` of issues in this sprint grouped by status
- Burndown chart via `@carbon/charts-react` (`LineChart`)
- `Button` "Complete Sprint" (opens modal confirming which issues move back to backlog)

**Planning Sprint view**:
- Drag issues from backlog into sprint
- Total story points counter
- `Button` "Start Sprint" (opens modal for date range selection via `DatePicker`)

**Create Sprint**: `ComposedModal` with `TextInput` (name), `TextArea` (goal)

### 7.7 Reports (`/reports`)

Dashboard of charts using `@carbon/charts-react`:

1. **Burndown Chart** (`LineChart`): ideal line vs actual remaining story points per day
2. **Velocity Chart** (`GroupedBarChart`): story points completed per sprint (last 5 sprints)
3. **Issue Distribution** (`DonutChart`): issues by status
4. **Priority Breakdown** (`StackedBarChart`): issues by priority across sprints
5. **Cumulative Flow** (`AreaChart`): stacked area of issues in each status over time

Each chart in a `Tile` component. 2x3 grid layout.

### 7.8 Settings (`/settings`)

**Project Settings** tab:
- `TextInput` for project name, key
- `TextArea` for description
- `Button` (danger) "Delete Project" with confirmation `Modal`

**Board Settings** tab:
- Manage columns: reorder, rename, set WIP limits, set color
- `DataTable` with inline editing

**Labels** tab:
- CRUD for labels: name + color picker (using `Dropdown` with color swatches)

**Theme** tab:
- `Toggle` for dark mode (switches between g10 and g90 themes)

---

## 8. Project Structure

```
flowboard/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (app)/
│   │   ├── layout.tsx              # Shell with Header + SideNav
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── boards/
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── issues/
│   │   │   ├── page.tsx            # Issues list
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Issue detail
│   │   ├── sprints/
│   │   │   └── page.tsx
│   │   ├── reports/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── auth/
│   │   │   └── [...all]/
│   │   │       └── route.ts        # BetterAuth catch-all
│   │   ├── docs/
│   │   │   └── route.ts            # Swagger UI page
│   │   └── v1/
│   │       ├── projects/
│   │       │   ├── route.ts        # GET list, POST create
│   │       │   └── [id]/
│   │       │       ├── route.ts    # GET, PUT, DELETE
│   │       │       ├── boards/
│   │       │       │   └── route.ts
│   │       │       ├── issues/
│   │       │       │   └── route.ts
│   │       │       ├── sprints/
│   │       │       │   └── route.ts
│   │       │       ├── labels/
│   │       │       │   └── route.ts
│   │       │       └── reports/
│   │       │           ├── burndown/
│   │       │           │   └── route.ts
│   │       │           ├── velocity/
│   │       │           │   └── route.ts
│   │       │           └── distribution/
│   │       │               └── route.ts
│   │       ├── boards/
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       └── columns/
│   │       │           └── route.ts
│   │       ├── columns/
│   │       │   ├── [id]/
│   │       │   │   └── route.ts
│   │       │   └── reorder/
│   │       │       └── route.ts
│   │       ├── issues/
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── move/
│   │       │       │   └── route.ts
│   │       │       ├── comments/
│   │       │       │   └── route.ts
│   │       │       └── activity/
│   │       │           └── route.ts
│   │       ├── sprints/
│   │       │   └── [id]/
│   │       │       ├── route.ts
│   │       │       ├── start/
│   │       │       │   └── route.ts
│   │       │       └── complete/
│   │       │           └── route.ts
│   │       ├── comments/
│   │       │   └── [id]/
│   │       │       └── route.ts
│   │       └── labels/
│   │           └── [id]/
│   │               └── route.ts
│   ├── globals.scss
│   └── layout.tsx                  # Root layout
├── components/
│   ├── shell/
│   │   ├── AppHeader.tsx
│   │   ├── AppSideNav.tsx
│   │   └── ThemeProvider.tsx
│   ├── board/
│   │   ├── BoardView.tsx
│   │   ├── BoardColumn.tsx
│   │   ├── IssueCard.tsx
│   │   ├── InlineCreateIssue.tsx
│   │   └── BoardFilters.tsx
│   ├── issues/
│   │   ├── IssueTable.tsx
│   │   ├── IssueDetail.tsx
│   │   ├── IssueForm.tsx
│   │   ├── CommentList.tsx
│   │   └── ActivityFeed.tsx
│   ├── sprints/
│   │   ├── SprintList.tsx
│   │   ├── SprintBoard.tsx
│   │   └── SprintForm.tsx
│   ├── dashboard/
│   │   ├── StatCards.tsx
│   │   ├── RecentActivity.tsx
│   │   └── StatusChart.tsx
│   ├── reports/
│   │   ├── BurndownChart.tsx
│   │   ├── VelocityChart.tsx
│   │   └── DistributionChart.tsx
│   └── shared/
│       ├── EmptyState.tsx
│       ├── ConfirmModal.tsx
│       └── UserAvatar.tsx
├── lib/
│   ├── auth.ts                     # BetterAuth server config
│   ├── auth-client.ts              # BetterAuth client
│   └── utils.ts
├── db/
│   ├── index.ts                    # Drizzle client
│   ├── schema.ts                   # All table schemas
│   ├── seed.ts                     # Seed script
│   └── migrations/
├── hooks/
│   ├── use-issues.ts
│   ├── use-board.ts
│   ├── use-sprints.ts
│   └── use-projects.ts
├── types/
│   └── index.ts
├── middleware.ts                    # Auth route protection
├── drizzle.config.ts
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Board view renders within 200ms for up to 100 issues
- Drag operations must feel instant (optimistic UI updates, API call in background)
- SQLite queries use proper indexes on `projectId`, `columnId`, `sprintId`, `assigneeId`

### 9.2 Accessibility
- Carbon components provide WCAG 2.1 AA compliance out of the box
- All interactive elements keyboard-navigable
- dnd-kit provides keyboard drag-and-drop support (Space to pick up, Arrow keys to move, Space to drop)
- Screen reader announcements for drag operations via dnd-kit's `announcements` prop

### 9.3 Responsive
- Side navigation collapses to hamburger menu below 1056px (Carbon's `lg` breakpoint)
- Board view horizontally scrollable on smaller screens
- Issue detail switches to single-column layout below `md` breakpoint

### 9.4 Error Handling
- All API routes return consistent JSON: `{ data: T }` on success, `{ error: string }` on failure
- Client-side: Carbon `ToastNotification` for transient errors, `InlineNotification` for form validation
- Zod validation on all API inputs

---

## 10. Build & Run

```bash
# Install
npm install

# Generate auth schema
npx @better-auth/cli generate

# Generate migrations
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate

# Seed database
npx tsx db/seed.ts

# Dev server
npm run dev

# The app runs at http://localhost:3000
# Swagger docs at http://localhost:3000/api/docs
# Login with test@zacharyzhang.com / Test@TestModels
```

These steps should be automated: the `dev` script should check if the database exists and run migrations + seed if needed, so `npm run dev` is the only command required after `npm install`.

---

## 11. Acceptance Criteria

1. `npm install && npm run dev` starts the application with zero manual steps
2. Login with `test@zacharyzhang.com` / `Test@TestModels` succeeds and redirects to dashboard
3. No registration page or signup option exists
4. Dashboard displays stat cards, activity feed, and charts with seed data
5. Board view shows 4 columns with seed issues rendered as draggable cards
6. Dragging a card between columns updates the database and persists on refresh
7. Dragging a card within a column reorders and persists
8. Creating an issue inline from the board adds it to the correct column
9. Issue detail page shows all fields, editable, with auto-save
10. Comments can be added and appear in the activity feed
11. Issues list table is sortable, filterable, and paginated
12. Sprint can be created, started (sets date range), and completed
13. Reports page renders burndown, velocity, and distribution charts
14. Settings page allows theme toggle (light/dark), column management, and label management
15. Swagger UI at `/api/docs` renders the complete OpenAPI spec
16. All UI uses Carbon components exclusively (no raw HTML buttons, inputs, or custom-styled elements)
17. The Gray 10 theme is applied by default. Dark mode uses Gray 90
18. No Tailwind, no shadcn, no Radix. Only `@carbon/react` and `@carbon/styles`

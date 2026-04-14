# FlowBoard Frontend Audit

**Audit Date:** 2026-04-14
**Auditor:** Claude Code
**Scope:** Next.js 16 frontend against PRD.md

---

## Executive Summary

**Verdict: NEEDS_WORK**

The frontend implements most core pages and features, but has significant gaps in Carbon Design System compliance, missing PRD-specified components, and UI/UX issues. The codebase is generally well-structured with no god components, but several pages lack complete functionality and styling fidelity to the PRD.

---

## Missing Features (with PRD Reference)

### 1. Dashboard Missing Elements
- **Open Issues trend tag**: PRD 7.2 requires a `Tag` showing up/down trend vs last week. `StatCards.tsx` line 22-25 shows a hardcoded `<Tag type="blue">Current</Tag>` with no trend calculation.
- **Recent Activity icon**: PRD 7.2 specifies "icon + user + action + issue link + timestamp". `RecentActivity.tsx` has no icon column.

### 2. Board View Missing Elements
- **Filter dropdown for label**: PRD 7.3 requires assignee, priority, type, **label** filters. `BoardView.tsx` lines 209-269 only has assignee, priority, type — no label filter.
- **OverflowMenu actions are non-functional**: PRD 7.3 expects Edit, Move to, Delete. `IssueCard.tsx` line 85-89 "Move to" action has an empty `onClick` handler with `e.stopPropagation()` only.
- **No assignee avatar blank circle for unassigned**: PRD 7.3 says "assignee avatar (or blank circle)". `IssueCard.tsx` lines 110-126 only renders avatar when `issue.assignee` exists; no blank circle fallback.

### 3. Issues List Missing Elements
- **Column sorting is not implemented**: PRD 7.5 says "Sortable columns (click header)". `IssueTable.tsx` uses `DataTable` with `isSortable` prop but no custom sort state or handler is wired. The `getHeaderProps` spread does not connect to actual sorting logic.
- **TableToolbar batch actions via Carbon's built-in batch action pattern**: PRD 7.5 expects bulk actions via `TableToolbar`. The current implementation (lines 304-311) uses a custom div with buttons outside the `TableToolbar` component structure.

### 4. Sprints Missing Elements
- **Active Sprint time elapsed ProgressBar**: PRD 7.6 requires "date range with `ProgressBar` for time elapsed". `SprintBoard.tsx` does not show date range or ProgressBar.
- **Planning Sprint "Start Sprint" modal with DatePicker**: PRD 7.6 specifies a modal for date range selection. `SprintsPage.tsx` lines 132-161 has this, but the `SprintForm.tsx` component (which also has a DatePicker range) is **never used anywhere** in the codebase.
- **Active Sprint "Complete Sprint" confirmation about backlog**: PRD 7.6 says "opens modal confirming which issues move back to backlog". The current `SprintBoard.tsx` modal (lines 141-164) allows selecting incomplete issues, but the PRD wording implies a confirmation flow; current implementation is acceptable but basic.

### 5. Settings Missing Elements
- **Board Settings column reordering**: PRD 7.8 says "Manage columns: reorder, rename, set WIP limits, set color". `SettingsPage.tsx` Board tab (lines 120-183) has rename, color, WIP limit, but **no reordering** capability.
- **Labels tab color picker using Dropdown with color swatches**: PRD 7.8 expects color swatches. `SettingsPage.tsx` lines 190-201 and 147-161 use a plain text `Dropdown` with color name strings, no visual swatches.

### 6. Shared Components Missing
- PRD 8 lists `components/shared/EmptyState.tsx`, `ConfirmModal.tsx`, `UserAvatar.tsx`. These files **do not exist** in the codebase.
- PRD 8 lists `components/reports/*` chart components. These files **do not exist**; charts are inlined directly in `ReportsPage.tsx`.

---

## UI/UX Bugs Found

### 1. Sidebar / Layout Issues
- **AppShell.tsx line 17**: `useEffect` is called inside the `render` prop of `HeaderContainer`. This violates React rules (hooks must be at top level of function component, not inside nested render callbacks). It works by accident because the render callback is treated as a component by React, but it is architecturally incorrect and could break with React StrictMode or future versions.
- **Content padding may block on small screens**: `AppShell.tsx` line 40 sets `style={{ padding: "2rem" }}` on `Content`. Combined with `SideNav` rail, on narrow viewports the content area may be squeezed. The Carbon `Content` component normally handles left padding automatically based on side nav state; overriding it with a fixed `2rem` may cause overlap or overflow issues.

### 2. Scrolling / Board View
- **Board page height calculation is fragile**: `app/(app)/boards/[id]/page.tsx` line 11 uses `height: "calc(100vh - 6rem)"`. This is a magic number that may break if header height changes or if Carbon updates shell dimensions. The board should fill available space using flexbox within the `Content` area.
- **Kanban board horizontal scroll works, but columns have fixed width**: `globals.scss` line 42 sets `.kanban-column { flex: 0 0 280px }`. This is acceptable, but on very small screens 280px may exceed viewport width. PRD 9.3 says "Board view horizontally scrollable on smaller screens" — this is satisfied.

### 3. Login Page
- **No FlowBoard logo/name above the form as styled brand element**: PRD 7.1 says "FlowBoard logo/name above the form". `login/page.tsx` line 57-65 uses a plain `<h1>` with inline styles, not a logo or brand illustration.

### 4. Issue Detail Page
- **Due Date DatePicker does not show current value**: `IssueDetail.tsx` line 219-220 creates a `DatePicker` with no `value` or `datePickerValue` prop, so the existing due date is not pre-populated in the input.
- **Story Points NumberInput fires on every change**: `IssueDetail.tsx` line 215 `onChange` calls `handleChange` immediately. PRD 7.4 says "auto-save on blur/change". This is acceptable but may cause excessive API requests. Better to debounce or rely on blur.
- **Issue key is hardcoded as "FB"**: `IssueDetail.tsx` line 95 shows `FB-{issue.number}` instead of using the actual project key.

### 5. Dashboard Charts
- **Charts may flash/resize on mount**: `StatusChart.tsx` and `PriorityChart.tsx` use a `mounted` state to avoid SSR issues. This causes a brief "No data available" flash before the chart renders. A better pattern is to render the chart immediately if client-side or use a consistent placeholder.

---

## Carbon Design System Compliance Issues

### 1. Non-Carbon Elements / Raw HTML Used
- **Custom avatar in IssueCard**: `IssueCard.tsx` lines 111-126 uses a raw `<div>` with border-radius for avatars instead of a Carbon component or shared `UserAvatar`. There is no Carbon avatar component, but PRD requires consistent styling; the current inline styles bypass Carbon tokens for sizing.
- **Custom batch action bar in IssueTable**: `IssueTable.tsx` lines 304-311 uses a raw `<div>` with background `var(--cds-layer-hover)` instead of Carbon's `TableToolbarAction` / batch action pattern.
- **Custom Field wrapper in IssueDetail**: `IssueDetail.tsx` lines 247-253 uses a custom `Field` component with hardcoded font sizes instead of Carbon's `FormGroup` or `FormLabel` components.
- **Raw `<div>` empty states**: Multiple pages (`SprintsPage.tsx`, `BoardsRedirectPage.tsx`) return plain `<div>No boards found</div>` or `<div>No sprints in planning</div>` instead of Carbon `Tile` empty states as specified in PRD 4.3.

### 2. Incorrect Carbon Component Usage
- **Tag `type` prop uses `as any` cast**: `IssueCard.tsx` line 107, `IssueTable.tsx` lines 118 and 123 cast `type` to `any`. The Carbon `Tag` component expects specific string literals; the cast suppresses TypeScript but indicates the mapping may not align perfectly with Carbon's API.
- **Dropdown `label` prop is empty string in filters**: `BoardView.tsx` and `IssueTable.tsx` use `titleText=""` and `label="All"` on Dropdowns. Carbon recommends using `titleText` for accessibility; leaving it empty reduces screen reader context.
- **Modal vs ComposedModal inconsistency**: `SettingsPage.tsx` uses `Modal` for delete confirmation (line 252), while everywhere else uses `ComposedModal`. Both are valid Carbon components, but the project should standardize on one pattern for consistency.

### 3. Missing Carbon Components for PRD Requirements
- **Empty States**: Should use `Tile` with icon illustration per PRD 4.3. Currently plain `<div>` elements are used.
- **Pagination in Issues List**: Present and correct (`IssueTable.tsx` line 356-365).
- **Breadcrumb in Board View**: Present and correct (`BoardView.tsx` lines 201-206).
- **ProgressBar in Dashboard**: Present in `StatCards.tsx` line 32.

---

## Code Quality Issues

### 1. Hook Rule Violation
- **AppShell.tsx**: `useEffect` inside `HeaderContainer` render prop. Move the resize logic into a dedicated inner component or use `useLayoutEffect` at the top level of `AppShell` before returning `HeaderContainer`.

### 2. Magic Numbers & Inline Styles
- **Multiple files** use extensive inline styles instead of Carbon spacing tokens or SCSS classes. Examples:
  - `DashboardPage.tsx`: `marginBottom: "1.5rem"`, `marginTop: "2rem"`, `gap: "1.5rem"`
  - `SprintsPage.tsx`: `marginBottom: "1.5rem"`, `gap: "1rem"`
  - PRD 4.4 specifies using `$spacing-03`, `$spacing-05`, `$spacing-07`, `$spacing-09`. The inline pixel values approximate these but are not token-based and will not adapt to Carbon theme changes.

### 3. Hardcoded Project Key
- **IssueDetail.tsx line 95**: `FB-{issue.number}` should use the actual project key from `useProjects()`.

### 4. Unused Component
- **SprintForm.tsx**: This component is well-written but **never imported or used**. It should either be removed or integrated into `SprintsPage.tsx`.

### 5. Type Safety
- **Multiple `as any` casts** in chart options (`ReportsPage.tsx`, `StatusChart.tsx`, `PriorityChart.tsx`, `SprintBoard.tsx`). These indicate incomplete typing for `@carbon/charts-react` options. Better to define proper option interfaces or use the chart package's exported types.
- **SprintBoard.tsx line 19**: Imports `ScaleTypes` from `@carbon/charts/interfaces` which is a deep import and may break with package updates. Prefer using the package's public API.

### 6. Error Handling
- **Client-side fetch errors are silent**: `ReportsPage.tsx` lines 26-39 fetches report data but has no `.catch()` or error state. If any endpoint fails, the page stays in `loading` forever because `setLoading(false)` is only called in the `.then()` block.
- **SettingsPage.tsx**: `saveProject`, `saveColumns`, `deleteProject` have no error handling or user feedback on failure.

### 7. Accessibility
- **IssueTable.tsx row click + checkbox conflict**: Rows have `onClick={() => router.push(...)}` and checkboxes have `onSelect`. Clicking the checkbox may trigger both the row navigation and the selection toggle depending on event bubbling. The checkbox `onSelect` does not call `e.stopPropagation()`.
- **Login page h1 styling**: Uses raw `fontSize: "1.75rem"` instead of Carbon type token `productive-heading-04`.

---

## Component Architecture

### Component Sizes
All audited components are under 500 lines:

| Component | Lines | Verdict |
|-----------|-------|---------|
| `AppShell.tsx` | 46 | Good |
| `AppHeader.tsx` | 42 | Good |
| `AppSideNav.tsx` | 48 | Good |
| `BoardView.tsx` | 330 | Acceptable |
| `BoardColumn.tsx` | 52 | Good |
| `IssueCard.tsx` | 131 | Good |
| `InlineCreateIssue.tsx` | 53 | Good |
| `IssueTable.tsx` | 403 | Acceptable |
| `IssueDetail.tsx` | 254 | Good |
| `CommentList.tsx` | 30 | Good |
| `ActivityFeed.tsx` | 37 | Good |
| `SprintBoard.tsx` | 167 | Good |
| `SprintPlanning.tsx` | 119 | Good |
| `SprintForm.tsx` | 55 | Good (but unused) |
| `StatCards.tsx` | 53 | Good |
| `RecentActivity.tsx` | 57 | Good |
| `StatusChart.tsx` | 56 | Good |
| `PriorityChart.tsx` | 52 | Good |

### Architecture Strengths
- Clean separation between pages (server components where possible) and interactive components (client components).
- Hooks are well-organized by domain (`use-board.ts`, `use-issues.ts`, `use-sprints.ts`).
- `React Query` is used consistently for caching and mutations.

### Architecture Weaknesses
- **No shared component library**: Missing `components/shared/` entirely. Common patterns (empty states, avatars, confirm modals) are duplicated or absent.
- **Charts inlined in page**: `ReportsPage.tsx` is 202 lines and contains all 5 charts. While under 500 lines, it violates single-responsibility. PRD 8 expected `components/reports/*` chart components.
- **Inline styles everywhere**: No SCSS modules or styled-components. Makes theming and maintenance harder.

---

## Required Refactors

### High Priority
1. **Fix `useEffect` inside render prop** in `AppShell.tsx`. Extract into a named inner component or move logic to `AppShell` body.
2. **Add error handling to `ReportsPage.tsx` fetch calls**. Move `setLoading(false)` into a `finally` block.
3. **Implement actual column sorting** in `IssueTable.tsx` or remove the misleading `isSortable` prop.
4. **Add missing label filter** to `BoardView.tsx`.
5. **Show actual project key** in `IssueDetail.tsx` instead of hardcoded "FB".
6. **Pre-populate Due Date** in `IssueDetail.tsx` by passing the current value to `DatePicker`.

### Medium Priority
7. **Replace plain `<div>` empty states** with Carbon `Tile` + icon empty states across the app.
8. **Create `components/shared/` components**: `EmptyState.tsx`, `UserAvatar.tsx`, `ConfirmModal.tsx`.
9. **Extract report chart components** into `components/reports/` as specified in PRD 8.
10. **Remove or integrate `SprintForm.tsx`** — currently dead code.
11. **Add column reordering** in Settings Board tab (drag-and-drop or up/down buttons).
12. **Add label color swatches** in Settings Labels tab instead of plain text dropdown.

### Low Priority
13. **Replace inline styles** with Carbon spacing classes or SCSS using Carbon tokens.
14. **Standardize on `ComposedModal`** instead of mixing `Modal` and `ComposedModal`.
15. **Add debouncing** to `IssueDetail.tsx` auto-save fields to reduce API noise.
16. **Fix checkbox row click propagation** in `IssueTable.tsx`.

---

## Detailed File References

| File | Issues |
|------|--------|
| `app/(app)/dashboard/page.tsx` | Missing trend calculation for Open Issues tag |
| `app/(app)/boards/[id]/page.tsx` | Fragile height calc with magic number |
| `app/(app)/sprints/page.tsx` | SprintForm unused; basic empty states |
| `app/(auth)/login/page.tsx` | No logo, raw styled h1 |
| `components/shell/AppShell.tsx` | Hook inside render prop |
| `components/shell/AppSideNav.tsx` | Clean, compliant |
| `components/board/BoardView.tsx` | Missing label filter; dropdown labels empty |
| `components/board/IssueCard.tsx` | Missing blank avatar; Move to action empty |
| `components/issues/IssueTable.tsx` | Sorting not wired; custom batch action bar; checkbox propagation |
| `components/issues/IssueDetail.tsx` | Hardcoded "FB"; due date not pre-filled; excessive auto-save |
| `components/sprints/SprintBoard.tsx` | Missing time elapsed ProgressBar; deep import ScaleTypes |
| `components/sprints/SprintPlanning.tsx` | Clean, compliant |
| `components/sprints/SprintForm.tsx` | Unused dead code |
| `components/dashboard/StatCards.tsx` | Trend tag hardcoded |
| `components/dashboard/RecentActivity.tsx` | Missing activity icon |
| `app/(app)/reports/page.tsx` | Silent fetch errors; charts inlined |
| `app/(app)/settings/page.tsx` | No column reorder; no color swatches |
| `hooks/*.ts` | Well-structured |
| `types/index.ts` | Clean |
| `app/globals.scss` | Acceptable; chart class workaround documented |

---

*End of Audit*

# FlowBoard Design System

## 1. Authority

FlowBoard uses IBM Carbon as the single UI authority. Every page, component, token, and interaction follows Carbon themes, spacing, typography, grid, and composition rules. Product code may extend Carbon through layout wrappers and domain components. Product code may not replace Carbon primitives with custom button, input, modal, table, navigation, or notification implementations.

## 2. Theme Rules

| Rule | Value |
|---|---|
| Default theme | Gray 10 (`g10`) |
| Dark theme | Gray 90 (`g90`) |
| Theme switch location | Settings > Theme |
| Theme application | Root app theme context + Carbon layer tokens |
| Accent strategy | Carbon semantic tokens first, status colors only through `Tag` kinds and chart palette mapping |

## 3. Deterministic UI Order

Every authenticated page follows the same hierarchy.

| Level | Purpose | Carbon basis |
|---|---|---|
| 0 | Root shell | `Header`, `SideNav`, `Content` |
| 1 | Page frame | page container aligned to Carbon grid |
| 2 | Page header | title, breadcrumb, primary action, contextual actions |
| 3 | Summary strip | stat tiles, filters, progress, tab switchers |
| 4 | Primary work area | board, table, form, chart grid, sprint planner |
| 5 | Secondary panels | detail sidebar, activity, comments, support metadata |
| 6 | Feedback layer | notifications, inline validation, loading, empty, modal, overflow |

Composition order inside a page is fixed: breadcrumb, title block, primary action row, summary/filter row, primary content, secondary content, feedback surfaces.

## 4. Layout System

| Concern | Rule |
|---|---|
| Grid | Carbon 16-column grid |
| Desktop content width | Full-width shell content with grid-aligned inner container |
| Form pages | 8-column max content span |
| Board page | Flexible horizontal board lanes inside grid-aligned scroll container |
| Report page | 2-column chart grid on desktop, 1-column on narrow viewports |
| Breakpoints | Carbon defaults, mobile-first |
| Nav behavior | SideNav collapses below Carbon `lg` breakpoint |

## 5. Spacing Scale

| Usage | Token | Pixel |
|---|---|---|
| Tight element gap | `$spacing-03` | 8 |
| Standard control gap | `$spacing-05` | 16 |
| Section gap | `$spacing-07` | 32 |
| Major page separation | `$spacing-09` | 48 |

Rules:

1. Repeated controls inside a toolbar use `$spacing-03`.
2. Form groups, stacked tiles, and column headers use `$spacing-05`.
3. Major sections use `$spacing-07`.
4. Distinct page bands use `$spacing-09`.

## 6. Typography Scale

| Purpose | Carbon token |
|---|---|
| App title | `productive-heading-03` |
| Page title | `productive-heading-05` |
| Section title | `productive-heading-03` |
| Tile metric | `productive-heading-04` |
| Body content | `body-long-01` |
| Dense metadata | `body-compact-01` |
| Labels | `label-01` |
| Helper and validation text | `helper-text-01` |

## 7. Color and Status Rules

| Domain concept | Carbon element |
|---|---|
| To Do | `Tag kind="gray"` |
| In Progress | `Tag kind="blue"` |
| In Review | `Tag kind="purple"` |
| Done | `Tag kind="green"` |
| Blocked | `Tag kind="red"` |
| Critical priority | `Tag kind="red"` |
| High priority | `Tag kind="warm-gray"` |
| Medium priority | `Tag kind="blue"` |
| Low priority | `Tag kind="gray"` |
| Errors | `InlineNotification` or `ToastNotification` with Carbon error styling |
| Success | Carbon success notification styling |

Charts use Carbon Charts defaults with status-aligned semantic mapping. Freeform custom colors are not permitted.

## 8. Component Mapping

| Product element | Required Carbon component |
|---|---|
| App shell | `Header`, `HeaderName`, `HeaderGlobalBar`, `HeaderGlobalAction`, `SideNav`, `SideNavItems`, `SideNavLink`, `Content` |
| Primary buttons | `Button` |
| Inputs | `TextInput`, `PasswordInput`, `TextArea`, `Dropdown`, `MultiSelect`, `NumberInput`, `DatePicker`, `Search`, `Toggle` |
| Tables | `DataTable`, `Table`, `TableHead`, `TableRow`, `TableCell`, `TableToolbar`, `Pagination` |
| Cards and empty states | `Tile`, `ClickableTile` |
| Modal flows | `ComposedModal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Notifications | `InlineNotification`, `ToastNotification`, `InlineLoading`, `Loading` |
| Navigation support | `Breadcrumb`, `BreadcrumbItem`, `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel`, `OverflowMenu`, `OverflowMenuItem` |
| Progress | `ProgressBar` |

## 9. Page Contracts

| Page | Required structure |
|---|---|
| Login | centered form, brand block, inline auth error |
| Dashboard | title row, 4 stat tiles, activity feed, chart band |
| Board | breadcrumb, title/actions row, filter/search row, horizontal board lanes |
| Issue list | title row, toolbar, data table, pagination |
| Issue detail | editable title/description, tabs on left, metadata panel on right |
| Sprints | tabs first, then active/planning/completed content |
| Reports | title row, filter context if needed, 2x3 tile chart grid |
| Settings | tabs first, focused forms/tables beneath |

## 10. Interaction Rules

| State | Rule |
|---|---|
| Loading | Use `Loading`, `InlineLoading`, or Carbon skeleton patterns at the same layout position as loaded content |
| Empty | Use `Tile`-based empty state with clear primary action |
| Error | Inline for local form issues, toast for global failures |
| Auto-save | Trigger on blur or definitive change, show inline saving feedback |
| Drag and drop | Visual movement by dnd-kit transforms, keyboard accessible announcements enabled |
| Destructive actions | Confirm in modal |

## 11. Accessibility Rules

| Concern | Rule |
|---|---|
| Keyboard | All interactions reachable and operable by keyboard |
| Drag and drop | dnd-kit keyboard sensor and live announcements required |
| Contrast | Carbon token defaults only |
| Labels | Every form control has visible label or Carbon-equivalent accessible label |
| Notifications | Use Carbon live region behavior |
| Responsive order | Information order remains stable from desktop to mobile |

## 12. Project Structure Alignment

| Area | Directory |
|---|---|
| Route shells and pages | `src/app/` |
| Shared layout primitives | `src/shared/ui/carbon/` |
| Domain UI | `src/modules/*/ui/` |
| Shared state and data access | `src/state/`, `src/shared/api/`, `src/shared/auth/` |
| Styling | `src/app/globals.scss` plus feature-local module styles only when Carbon tokens are reused |

## 13. Composition Constraints

1. Each component renders one coherent concern.
2. Container components own data fetching and orchestration.
3. Presentational components receive validated props and render Carbon primitives.
4. Raw HTML interactive controls are forbidden in product UI.
5. Layout wrappers may use semantic HTML and Carbon class utilities where Carbon has no direct primitive.

## 14. Layer Rules

| Layer | Rule |
|---|---|
| Theme root | One global Carbon theme provider controls `g10` and `g90` |
| Page background | Base shell uses background layer tokens |
| Primary work surface | Page tiles, tables, forms use `layer-01` |
| Nested supporting surface | Secondary tiles and grouped panels use `layer-02` |
| Overlay surface | Overflows, modals, toast stacks use overlay tokens |

## 15. Responsive Column Allocation

| Surface | `sm` | `md` | `lg+` |
|---|---|---|---|
| Dashboard stat card | 4/4 | 4/8 | 4/16 |
| Board column | full-width scroll lane | 4 lanes in horizontal scroll | 4/16 each lane in horizontal flow |
| Issue detail main pane | 4/4 | 8/8 | 10/16 |
| Issue detail side pane | 4/4 | 8/8 | 6/16 |
| Reports tile | 4/4 | 4/8 | 8/16 |
| Settings form body | 4/4 | 8/8 | 8/16 centered |

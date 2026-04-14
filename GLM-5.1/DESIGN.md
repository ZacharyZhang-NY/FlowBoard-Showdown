# FlowBoard Design System

Source: PRD + IBM Carbon Design System v11

## Theme

| Token | Light (default) | Dark |
|-------|----------------|------|
| Theme | Gray 10 (g10) | Gray 90 (g90) |
| CSS class | `cds--g10` | `cds--g90` |
| SCSS | `themes.$g10` | `themes.$g90` |

Switching: `ThemeProvider` context + `localStorage("flowboard-theme")` + Carbon `Theme` component wrapper.

## Layout Shell

```
+--------------------------------------------------+
| Header (HeaderName: "FlowBoard")        [Avatar] |
+--------+-----------------------------------------+
| SideNav |  Content                                |
+--------+-----------------------------------------+
```

- `Header` + `HeaderName` + `HeaderGlobalBar` + `HeaderGlobalAction`
- `SideNav` + `SideNavItems` + `SideNavLink`
- `Content` for main area (Carbon spacing-aware padding)
- SideNav collapses to hamburger below 1056px (Carbon `lg` breakpoint)

## Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `$spacing-03` | 8px | Tight inner gaps |
| `$spacing-04` | 12px | Compact padding |
| `$spacing-05` | 16px | Standard spacing |
| `$spacing-06` | 24px | Group spacing |
| `$spacing-07` | 32px | Section spacing |
| `$spacing-09` | 48px | Major section separation |

## Typography Scale

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `productive-heading-05` | 28px | Regular | Page titles |
| `productive-heading-03` | 20px | Regular | Section titles |
| `productive-heading-01` | 14px | Regular | Card titles |
| `body-long-01` | 14px | Regular | Body text |
| `label-01` | 12px | Regular | Labels |
| `helper-text-01` | 12px | Regular | Helper text |

## Color Usage

### Status Tags

| Status | Carbon Tag Type |
|--------|----------------|
| To Do | `kind="gray"` |
| In Progress | `kind="blue"` |
| In Review | `kind="purple"` |
| Done | `kind="green"` |
| Blocked | `kind="red"` |

### Priority Tags

| Priority | Carbon Tag Type |
|----------|----------------|
| Critical | `kind="red"` |
| High | `kind="warm-gray"` |
| Medium | `kind="blue"` |
| Low | `kind="gray"` |

## Component Mapping

| UI Element | Carbon Component |
|-----------|-----------------|
| Navigation | `SideNav`, `SideNavLink` |
| Buttons | `Button` (primary/secondary/ghost/danger) |
| Forms | `Form`, `TextInput`, `TextArea`, `Select`, `DatePicker`, `NumberInput` |
| Tables | `DataTable`, `Table`, `TableHead`, `TableRow`, `TableCell`, `TableToolbar` |
| Modals | `Modal`, `ComposedModal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Notifications | `InlineNotification`, `ToastNotification` |
| Tags/Labels | `Tag` (various colors) |
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
| Grid | `Grid`, `Row`, `Column` (16-column CSS Grid) |

## Grid System

- Carbon 16-column CSS Grid
- Dashboard: 4-column card layout (each card spans 4 columns)
- Board view: flexible widths within the grid
- Settings/Forms: centered, 8-column max-width
- Issue detail: 10/6 two-column split

## UI Order and Hierarchy

1. Shell (Header + SideNav) wraps all authenticated pages
2. Page title at top of Content area
3. Primary actions as buttons in page header
4. Data displayed in tables or cards
5. Forms in modals or side panels
6. Feedback via notifications (inline for forms, toast for actions)
7. Loading states via `InlineLoading` or skeleton `Tile`
8. Empty states via `Tile` with descriptive text and action button

## Responsive Breakpoints (mobile-first)

| Breakpoint | Width | Behavior |
|-----------|-------|----------|
| `sm` | 320px | Single column, SideNav hidden |
| `md` | 672px | Two-column where applicable |
| `lg` | 1056px | SideNav persistent, full layout |
| `xlg` | 1312px | Expanded board columns |
| `max` | 1584px | Max content width |

## Accessibility

- WCAG 2.1 AA via Carbon built-in compliance
- Keyboard navigation for all interactive elements
- dnd-kit keyboard drag support (Space pick up, Arrows move, Space drop)
- Screen reader announcements for drag operations

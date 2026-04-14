# FlowBoard Design System — IBM Carbon Design System

## Theme

- **Default**: Gray 10 (`g10`) - light theme
- **Dark**: Gray 90 (`g90`) - toggled via Settings

## Layout Hierarchy

1. **Root**: `<Theme>` wrapper providing Carbon tokens
2. **Shell**: `<Header>` + `<SideNav>` + `<Content>`
3. **Page**: Content area within `<Content>`, using Carbon 16-column grid
4. **Section**: Grouped content with `$spacing-07` separation
5. **Component**: Individual Carbon components with `$spacing-05` internal padding
6. **Element**: Atomic elements (tags, icons, text) with `$spacing-03` gaps

## Spacing Scale (Carbon)

| Token | Value | Usage |
|-------|-------|-------|
| `$spacing-01` | 2px | Micro adjustments |
| `$spacing-02` | 4px | Icon padding |
| `$spacing-03` | 8px | Tight: tag gaps, inline elements |
| `$spacing-04` | 12px | Compact lists |
| `$spacing-05` | 16px | Standard: form fields, card padding |
| `$spacing-06` | 24px | Medium sections |
| `$spacing-07` | 32px | Section spacing |
| `$spacing-08` | 40px | Large sections |
| `$spacing-09` | 48px | Major section separation |

## Typography Scale (IBM Plex Sans)

| Role | Carbon Token | Usage |
|------|-------------|-------|
| Page Title | `productive-heading-05` | Top-level page headings |
| Section Title | `productive-heading-03` | Section headings within pages |
| Card Title | `productive-heading-02` | Card/tile headings |
| Body | `body-long-01` | Paragraph text, descriptions |
| Label | `label-01` | Form labels, field labels |
| Helper | `helper-text-01` | Hint text below inputs |
| Code | `code-01` | Issue keys (FB-1) |

## Color Usage

### Status Colors
| Status | Carbon Tag `kind` |
|--------|------------------|
| To Do | `gray` |
| In Progress | `blue` |
| In Review | `purple` |
| Done | `green` |
| Blocked | `red` |

### Priority Colors
| Priority | Carbon Tag `kind` |
|----------|------------------|
| Critical | `red` |
| High | `warm-gray` |
| Medium | `blue` |
| Low | `gray` |

### Type Icons (`@carbon/icons-react`)
| Type | Icon |
|------|------|
| Task | `Checkbox` |
| Bug | `Debug` |
| Feature | `Star` |
| Improvement | `Upgrade` |

## Grid System

Carbon 16-column CSS Grid (`@carbon/grid`):

- **Dashboard**: 4x `ClickableTile` cards, each spanning 4 columns
- **Board View**: Flexible column widths within grid
- **Forms/Settings**: Centered, 8-column max-width
- **Issue Detail**: 10-col left + 6-col right
- **Reports**: 2x3 chart grid (each chart 8 columns)

## Carbon Component Mapping

| UI Pattern | Carbon Component(s) |
|------------|---------------------|
| App Shell | `Header`, `HeaderName`, `HeaderGlobalBar`, `HeaderGlobalAction`, `SideNav`, `SideNavItems`, `SideNavLink`, `Content` |
| Navigation | `SideNav`, `SideNavLink`, `Breadcrumb`, `BreadcrumbItem` |
| Buttons | `Button` (primary/secondary/ghost/danger) |
| Forms | `Form`, `TextInput`, `TextArea`, `Select`, `DatePicker`, `DatePickerInput`, `NumberInput`, `PasswordInput` |
| Tables | `DataTable`, `Table`, `TableHead`, `TableRow`, `TableHeader`, `TableBody`, `TableCell`, `TableToolbar`, `TableToolbarContent`, `TableToolbarSearch` |
| Modals | `ComposedModal`, `ModalHeader`, `ModalBody`, `ModalFooter` |
| Notifications | `InlineNotification`, `ToastNotification` |
| Tags | `Tag` (gray/blue/purple/green/red/warm-gray) |
| Tabs | `Tabs`, `TabList`, `Tab`, `TabPanels`, `TabPanel` |
| Loading | `Loading`, `InlineLoading` |
| Dropdowns | `Dropdown`, `MultiSelect` |
| Search | `Search` |
| Toggles | `Toggle` |
| Progress | `ProgressBar` |
| Overflow | `OverflowMenu`, `OverflowMenuItem` |
| Tooltips | `Tooltip`, `DefinitionTooltip` |
| Empty State | `Tile` with centered icon + message |
| Pagination | `Pagination` |
| Lists | `StructuredListWrapper`, `StructuredListBody`, `StructuredListRow`, `StructuredListCell` |
| Tiles | `Tile`, `ClickableTile` |

## Component Composition Rules

1. Every visible UI element maps to a Carbon component. No raw HTML `<button>`, `<input>`, `<select>`, or `<table>`.
2. No Tailwind, shadcn, Radix, or custom CSS frameworks. Styling via `@carbon/styles` SCSS tokens only.
3. Components must stay under 300 lines. Decompose into container + presentational.
4. Reusable logic extracted into custom hooks (`hooks/` directory).
5. File naming: PascalCase for components, camelCase for utilities/hooks.

## Responsive Breakpoints

| Breakpoint | Width | Behavior |
|------------|-------|----------|
| `sm` | 320px | Single column, collapsed nav |
| `md` | 672px | Two columns, collapsed nav |
| `lg` | 1056px | Full layout, side nav visible |
| `xlg` | 1312px | Wide layout |
| `max` | 1584px | Maximum width |

SideNav collapses to hamburger below `lg` (1056px).
Board view horizontally scrollable below `lg`.
Issue detail switches to single-column below `md`.

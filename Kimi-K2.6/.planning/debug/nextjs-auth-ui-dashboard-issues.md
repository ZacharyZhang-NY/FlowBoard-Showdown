---
status: resolved
trigger: "fix the issue: Database already seeded. Next.js 16.2.3 (Turbopack) warnings: BETTER_AUTH_SECRET too short, turbopack root inferred incorrectly. GET / 404. localhost:3000 does not redirect to login page. UI issues: cannot scroll left/right, sidebar blocking content. Dashboard has broken/nonsense chart rendering in Issues by Priority section."
created: 2026-04-14
updated: 2026-04-14
---

## Symptoms

1. **Expected behavior**: Root path `/` should redirect to login page when not authenticated. Dashboard UI should scroll properly without sidebar blocking content. Charts should render correctly. No console warnings about auth secret or turbopack root.
2. **Actual behavior**: `GET / 404` error, need to manually type `/login`. Sidebar blocks content, horizontal scrolling broken. "Issues by Priority" chart shows broken/nonsense rendering. Warnings about BETTER_AUTH_SECRET length and turbopack root inference.
3. **Error messages**: `WARN [Better Auth]: your BETTER_AUTH_SECRET should be at least 32 characters long`, `⚠ Warning: Next.js inferred your workspace root, but it may not be correct`, `GET / 404 in 1083ms`
4. **Timeline**: Unknown, currently present in local dev.
5. **Reproduction**: Start dev server, visit localhost:3000, navigate to dashboard and scroll down.

## Current Focus

- hypothesis: Multiple independent issues: (1) missing root page or redirect logic, (2) CSS/layout issues in dashboard with sidebar positioning and overflow, (3) broken chart component in dashboard, (4) config warnings for auth secret and turbopack root.
- next_action: All issues fixed. See Resolution.

## Evidence

- timestamp: 2026-04-14
  observation: User provided screenshots showing sidebar blocking dashboard content and broken chart area labeled "Issues by Priority" with garbled labels.
- timestamp: 2026-04-14
  observation: No root `page.tsx` existed in `app/`, causing `GET / 404`.
- timestamp: 2026-04-14
  observation: `AppLayout` in `app/(app)/layout.tsx` set `marginLeft: 0` on `<Content>`, overriding Carbon's default `margin-inline-start: 3rem` and causing the sidebar to overlap main content.
- timestamp: 2026-04-14
  observation: `@carbon/charts-react/dist/styles.css` was never imported. Additionally, the React wrapper renders `className="chart-holder"` while the distributed CSS only defines `.cds--chart-holder`, so chart styles (sizing, fonts, colors) were not applied.
- timestamp: 2026-04-14
  observation: `BETTER_AUTH_SECRET` was 31 characters; Better Auth requires at least 32.
- timestamp: 2026-04-14
  observation: A stray `/Users/zacharyzhang/package-lock.json` caused Next.js Turbopack to infer the workspace root incorrectly and emit a warning.

## Eliminated

- Not a data issue: chart data format (`{group, value}`) is correct for Carbon charts.
- Not a routing misconfiguration: the `(app)` and `(auth)` route groups are valid; the only problem was the missing root page.

## Resolution

1. **Root 404 / redirect**: Created `app/page.tsx` that checks the Better Auth session and redirects to `/dashboard` when authenticated or `/login` when not.
2. **Sidebar overlap / horizontal scroll**: Updated `app/(app)/layout.tsx` to set `marginLeft: "3rem"` on `<Content>`, matching Carbon's `cds--side-nav ~ .cds--content` rule and preventing the sidebar from blocking content. `overflow-x: auto` on `.cds--content` in `globals.scss` handles horizontal scrolling.
3. **Broken charts**: Added `@import '@carbon/charts-react/dist/styles.css'` to `globals.scss` and added a `.chart-holder` rule to bridge the className mismatch between the React wrapper (`chart-holder`) and the distributed CSS (`.cds--chart-holder`).
4. **BETTER_AUTH_SECRET warning**: Updated `.env` `BETTER_AUTH_SECRET` to a 32-character value.
5. **Turbopack root warning**: Removed the stray `~/package-lock.json` and explicitly set `turbopack.root` in `next.config.ts` to the project directory.

## Files changed

- `/Users/zacharyzhang/Documents/Github/KimiTest/Kimi-K2.6/app/page.tsx` (created)
- `/Users/zacharyzhang/Documents/Github/KimiTest/Kimi-K2.6/app/(app)/layout.tsx`
- `/Users/zacharyzhang/Documents/Github/KimiTest/Kimi-K2.6/app/globals.scss`
- `/Users/zacharyzhang/Documents/Github/KimiTest/Kimi-K2.6/.env`
- `/Users/zacharyzhang/Documents/Github/KimiTest/Kimi-K2.6/next.config.ts`
- `/Users/zacharyzhang/package-lock.json` (removed)

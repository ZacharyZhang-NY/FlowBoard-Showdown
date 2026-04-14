# FlowBoard Roadmap

## Milestone

| Field | Value |
|---|---|
| Product | FlowBoard |
| Scope | Local-first monolithic Next.js application |
| Source of truth | [PRD.md](C:\Users\zacharyzhang\Documents\Github\KimiTest\GPT5.4-XHigh\PRD.md) |
| Status | In progress |

## Execution Order

| Phase | Owner | Goal | Required outputs | Verification |
|---|---|---|---|---|
| 0 | FrontendDesigner | Extract Carbon-based design system from PRD and define deterministic UI order | `DESIGN.md` | Carbon theme, spacing, typography, grid, component mapping, page composition rules documented |
| 1 | ProjectManager | Convert PRD into execution plan and acceptance matrix | `.planning/ROADMAP.md`, `.planning/task_plan.md`, `.planning/findings.md` | All PRD features mapped to delivery phases |
| 2 | ResearchAnalyst | Validate framework, browser, accessibility, and integration constraints | `.planning/findings.md` updates | Official sources checked, risks recorded |
| 3 | TechnicalImplementationResearcher | Finalize full-stack architecture and contracts strategy | Architecture decisions in `.planning/findings.md` | OpenAPI-first, shared-types, auth, observability approach fixed |
| 4 | EnterpriseArchitect | Enforce module boundaries and engineering constraints | Boundary rules in `DESIGN.md` and `.planning/findings.md` | Layering, naming, sizing, DTO, repository, transaction rules fixed |
| 5 | BackendDeveloper | Implement OpenAPI spec, schema, migrations, auth, services, route handlers, observability | Backend app code | API routes, migrations, seed, `/health`, `/metrics`, structured logging work locally |
| 6 | FrontendDesigner | Translate design system into reusable component architecture | Frontend structure and shared UI primitives | Component architecture follows `DESIGN.md` |
| 7 | FrontendDeveloper | Implement authenticated client and integrate live APIs | Frontend app code | All pages functional with real backend integration |
| 8 | CodeReviewer | Verify correctness, build health, and performance | Fixes and optimization notes | TypeScript strict, lint, tests, production build pass |
| 9 | SecurityAuditor | Run security review and fix critical findings | Security notes in `.planning/findings.md` | Auth, cookies, input validation, CSP, rate limits, upload rules verified |
| 10 | ProjectManager | Final integration validation and release readiness | Final status update in `.planning/STATE.md` | Acceptance criteria satisfied end-to-end |

## Delivery Targets

| Area | Target |
|---|---|
| Framework | Next.js 16 App Router with TypeScript strict mode |
| UI | IBM Carbon only, default `g10`, dark `g90` |
| Data | SQLite + Drizzle migrations + deterministic seed |
| Auth | Better Auth email/password, login only |
| API | OpenAPI 3.1 + REST under `/api/v1` |
| Observability | Structured logging, `/health`, `/metrics`, traced request IDs, centralized API error logging |
| Quality gates | lint clean, `tsc --noEmit` clean, tests pass, production build clean |
| Runtime | Local dev only, no remote dependencies for core flows |

## Frozen Decisions

| Topic | Decision |
|---|---|
| Public routes | `/login`, `/api/docs`, `/api/auth/*`, `/api/health`, `/api/metrics` |
| Startup automation | `scripts/bootstrap.ts` runs directory checks, migrations, and idempotent seed |
| Authorization model | project-scoped membership with `admin` and `member` roles |
| Current project resolution | UI defaults to first accessible project and keeps one active project context |
| Board model | issue stores `boardId`, `columnId`, `status`; `status` is authoritative |
| Report surface | five report endpoints to match five charts |
| API envelope | `{ data, meta? }` success, structured `error` failure |

# Findings

| Topic | Finding | Impact |
|---|---|---|
| Workspace baseline | Repository currently contains only `PRD.md` and no app code | Full implementation required |
| Runtime | Local environment has Node `v24.14.1` and npm `11.12.1` | Modern Next.js toolchain supported |
| Next.js | `next@16.2.3` supports React `^18.2.0` and `^19.0.0` | React 18 remains compatible with PRD |
| Better Auth | Latest npm release is `1.6.2` | Stable auth package available |
| Carbon React | Latest npm release is `1.105.0` with React 18/19 support | Carbon stack is compatible |
| Core packages | Latest npm releases exist for Drizzle, Better SQLite3, Swagger UI, React Query, dnd-kit | Required stack is installable |
| Public route policy | Public paths will include `/login`, `/api/docs`, `/api/auth/*`, `/api/health`, `/api/metrics` | Login and observability remain reachable without session loops |
| Startup ownership | `scripts/bootstrap.ts` becomes the only startup automation entry | Migration and seed side effects stay outside auth initialization |
| Project scope policy | UI resolves a current project from the first accessible project, with project-scoped membership and role checks | PRD page IA stays simple while backend remains multi-project capable |
| Reports scope | Report APIs will cover five charts: burndown, velocity, distribution, priority breakdown, cumulative flow | API contract matches page requirements |
| Error envelope | Product APIs will return `{ data, meta? }` or `{ error: { code, message, details?, requestId } }` | Frontend can branch on stable error codes |
| Membership model | `project_members` with project-scoped role is required | Assignee lists and project authorization close correctly |
| Board semantics | Issues will store `boardId` and `columnId`, with `status` as authoritative workflow state | Multi-board support stays internally consistent |

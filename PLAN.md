# Modular Refactor Plan for MRFApp

## Current State Map

### Stack Overview
- **Language & Framework**: TypeScript-based [Create React App](https://create-react-app.dev/) front-end using React 18 and React Router 6.
- **Build Tooling**: `react-scripts` (Webpack under the hood), Tailwind CSS, SASS pipeline (manual `sass:watch` script).
- **Hosting Assumption**: Static front-end bundle; no backend/API code in repo.

### Repository Structure
- `/src/index.tsx` – CRA entry point mounting `<App />` and global styles.
- `/src/App.tsx` – top-level router defining navigation to material, request, fulfillment, and admin views.
- `/src/components` – shared layout (`MainLayout`) and UI primitives (`SmartTable`, `SummaryCard`, `RequestTray`, `DynamicRequestForm`, etc.).
- `/src/features` – feature folders for WO materials, material requests, Qube fulfillment (pick list & picking views), and admin dashboards.
- `/src/services/api.ts` – monolithic mock data service combining master & transactional datasets, UI config, locking, and workflow helpers.
- `/src/data` – static CSV (`mdtest.csv`) and JSON (`transactional-data.json`) acting as data sources.
- `/src/config/wo-materials-config.json` – basic UI configuration for summary cards and table layout.
- `/src/styles` – SASS partials layered into `main.scss`; Tailwind utilities also imported.
- `/src/types/index.ts` – central type definitions for materials, requests, configs, etc.
- `/public` – CRA static assets including `index.html`.
- `/prototype-mrf.html` – standalone prototype HTML page not connected to CRA build.

### Data Models & Workflows
- **Two-layer data model** implemented manually inside `WOMaterialsService` by combining master CSV rows with transactional request JSON.
- **Material Request workflow** is mocked: selecting rows, locking materials, retrieving request details (`getRequestItems`), and updating statuses rely on synchronous in-memory stubs.
- **Admin dashboards** (`ExceptionDashboardView`, `AreaCoordinatorDashboardView`) consume additional mock data served from the same `WOMaterialsService` singleton.

### Configuration & Environment
- Configuration is mostly hard-coded within `WOMaterialsService` or static JSON; no dynamic environment handling or feature flags.
- No `.env` usage detected; no runtime configuration layering.
- No backend endpoints; all services are mocks.

### External Integrations & Services
- None implemented; SharePoint, message bus, webhook integrations are absent.

### Testing & Tooling
- No automated tests or testing frameworks beyond CRA defaults; `react-scripts test` is unused.
- Linting via CRA default extends only.

## Risks & Constraints
- **Tightly coupled service layer**: `WOMaterialsService` mixes data access, business rules, and UI behaviors, complicating modularization.
- **Lack of tests**: No regression safety net; must introduce tests incrementally to protect refactor.
- **Single package CRA**: Moving to multi-package workspace will require retooling scripts/build pipeline without breaking dev workflow.
- **Mock data assumptions**: Current UI depends on static files; migrating to configurable services must preserve demo functionality until real integrations exist.
- **UI feature parity**: Views rely on implicit state; introducing feature flags and state machines must avoid regressions visible to users.
- **Config explosion risk**: Centralizing business rules into JSON without schema/validation may introduce runtime errors unless carefully designed.

## Target Architecture & Migration Path

### Proposed Modular Layout
```
/apps
  /web              # React front-end (migrated from CRA, potentially via Vite or CRA eject replacement)
  /api              # Placeholder/actual API server exposing config+workflow endpoints
/packages
  /config           # Typed config SDK + JSON Schemas + loaders (defaults/site/env layering)
  /domain           # Domain types, state machines, business rule logic
  /ui               # Shared UI primitives (SmartTable, SummaryCard, modals, etc.)
  /integrations     # Ports/adapters for SharePoint, MessageBus, Webhooks (with mocks)
  /testing          # Shared test utilities, fixtures, contract helpers
/docs               # Living documentation (PLAN, ADRs, CONFIG, OPERATIONS, SECURITY, diagrams)
```
- Aligns with npm workspaces to maintain a single repo while isolating responsibilities.
- Feature modules in `/apps/web` consume packages via public APIs; no deep relative imports.
- Config-first system: `/packages/config` exposes typed loader, validator, and schema metadata. UI admin settings generate forms from schemas.
- Domain state machine in `/packages/domain` drives status transitions, fulfilling business rules (R-series) with toggles from config.
- Integrations package abstracts external dependencies with swappable providers (real vs. mock).

### Migration Strategy
1. **Documentation & Alignment** – Capture plan and architectural decisions (current step).
2. **Introduce workspace scaffolding** – Add tooling (npm workspaces) while keeping CRA operational.
3. **Extract configuration package** – Centralize existing JSON and rule definitions; expose read-only API.
4. **Admin Settings UI (read-only)** – Surface configuration without enabling edits.
5. **Domain state machine** – Introduce statuses & transitions behind feature flags.
6. **Config-driven behavior** – Gradually replace hard-coded logic (pack selection, request caps, etc.) with config-derived rules.
7. **Integration Ports** – Scaffold message bus, SharePoint, webhook adapters with mock implementations.
8. **Async workflows & retries** – Implement message bus retry, DLQ, alerting.
9. **Settings management** – Enable config writes with RBAC & audit trail.
10. **Finalize restructure** – Move features into new hierarchy, deprecate legacy files, complete docs and tests.
- At each step, maintain application operability via feature flags and mock providers until real services exist.

## Planned PR Sequence & Acceptance Criteria
1. **PR 1 – Planning Foundations**
   - Deliver `PLAN.md` (this document) and `docs/adr/ADR-000.md` capturing workspace/modular architecture decision.
   - No application code changes.

2. **PR 2 – Workspace & Config Scaffolding**
   - Establish npm workspaces layout, seed `/packages/config` with loader stubs and JSON schema infrastructure.
   - Provide read-only config access for existing app via adapters; add unit tests for config loader.
   - Acceptance: CRA build/test still pass; config loader returns current WO config values.

3. **PR 3 – Admin Settings (Read-Only)**
   - Create `/apps/web` admin settings UI backed by config schemas; expose current config values without edit capability.
   - Add feature flag defaulting to off; ensure existing admin views unaffected when disabled.
   - Acceptance: Settings page renders schema-driven form preview behind flag, tests cover rendering.

4. **PR 4 – Domain State Machine**
   - Introduce `/packages/domain` with typed entities, status state machine, and business rule catalog keyed by config flags.
   - Wire existing views to read state machine outputs without altering behavior (read-only).
   - Acceptance: Unit tests for transitions; UI still behaves identically.

5. **PR 5 – Config-Driven Business Rules**
   - Map R1.x–R4.x rules to config keys; implement logic toggles while keeping defaults matching current behavior.
   - Add automated tests for each rule toggle; update CONFIG.md draft.
   - Acceptance: Feature flags toggled via config adjust logic; tests prove double request prevention, pack logic, etc.

6. **PR 6 – Integrations Ports & Mocks**
   - Scaffold `/packages/integrations` with SharePoint sync adapter, message bus port, webhook client (mock implementations).
   - Provide contract tests verifying adapter interfaces; feature flags keep real integrations disabled.
   - Acceptance: Mock adapters satisfy interface; tests green.

7. **PR 7 – Message Bus Retry & DLQ**
   - Implement retry window, DLQ, and MC alert hook inside integration layer using mocks.
   - Add integration tests simulating failures.
   - Acceptance: Configurable retry parameters honored; DLQ raises alert event.

8. **PR 8 – Webhook Endpoint & API Skeleton**
   - Create `/apps/api` exposing config read APIs, webhook endpoint with API key validation, and audit logging scaffolding.
   - Include contract tests (positive/negative) and documentation updates (OPERATIONS.md draft).
   - Acceptance: API serves config read; webhook rejects invalid key; tests pass.

9. **PR 9 – Front-end Feature Migration**
   - Move CRA features into modular `/apps/web` structure, update imports to use packages, introduce feature flags for new WOMaterial grid behaviors.
   - Remove legacy `src/` structure only after parity verified.
   - Acceptance: App runs from new entry point; regression tests/smoke pass.

10. **PR 10 – Config Write, RBAC & Audit**
    - Enable settings edits with role-based permissions, audit logging, and config history storage.
    - Update CONFIG.md, OPERATIONS.md, SECURITY.md; ensure RBAC enforcement for Requestor/AC/Qube/MC roles.
    - Acceptance: Config edits logged with actor, RBAC tests pass.

11. **PR 11 – Finalization & Docs**
    - Complete documentation suite (README, CONFIG, OPERATIONS, SECURITY, ADR updates, diagrams) and E2E smoke tests covering create → fulfillment workflow.
    - Acceptance: CI green, docs ready for hand-off, feature flags documented.

Each PR will include migration notes, updated ADRs when decisions arise, and ensure application remains operational with feature flags guarding incomplete functionality.

<!--
File: TASKLIST.md
Purpose: Task breakdown for implementing the Project above Site migration with minimal codebase disruption.
Dependencies: PRD.md, existing Site feature, persistence layer, frontend Site management.
Last Modified: 2026-03-13
-->

# Task List: Project Hierarchy Above Site (V1)

> **PRD Reference:** [PRD.md](PRD.md)
> **Date:** 2026-03-13
> **Estimated Tasks:** 32

---

## Legend

| Symbol | Meaning |
|---|---|
| ⬜ | Not started |
| 🔄 | In Progress |
| ✅ | Complete |
| 🔗 | Depends on another task |

### Priority Labels

| Label | Meaning |
|---|---|
| `P0` | Must be completed for safe V1 rollout |
| `P1` | Important for V1 completeness but can follow core backend rollout |
| `P2` | Useful enhancement or deferred adoption task |

### Team Labels

| Label | Team |
|---|---|
| `BE` | Backend API and application team |
| `FE` | Web frontend team |
| `DB` | Persistence and database team |
| `RP` | Reporting team |
| `RT` | Real-time, events, and SignalR team |
| `MB` | Mobile team |
| `QA` | QA and regression testing team |
| `PL` | Product and architecture leads |

---

## P0 Delivery Sequence

> This section turns the critical-path work into a delivery order that can be executed by sprint.

### Sprint 0: Definition and Architecture

| Sprint Goal | Tasks | Owner |
|---|---|---|
| Freeze terminology and define the safe rollout model | `1.1`, `1.2` | `PL`, `BE` |
| Define Project aggregate, Site linkage, and persistence plan | `2.1`, `2.2`, `2.3` | `PL`, `BE`, `DB` |
| Define migration and backfill strategy | `3.1` | `BE`, `DB` |

### Sprint 1: Schema and Backend Contracts

| Sprint Goal | Tasks | Owner |
|---|---|---|
| Prepare schema and migration sequence | `3.2` | `DB`, `BE` |
| Create Project feature structure and DTOs | `4.1`, `4.2` | `BE` |
| Build Project commands, queries, and Site contract updates | `4.3`, `4.4` | `BE` |

### Sprint 2: API and Backward Compatibility

| Sprint Goal | Tasks | Owner |
|---|---|---|
| Expose Project APIs and extend Site APIs safely | `5.1`, `5.2` | `BE` |
| Preserve Site-first user workflows during transition | `6.3` | `FE`, `BE` |

### Sprint 3: Validation and Release Readiness

| Sprint Goal | Tasks | Owner |
|---|---|---|
| Validate schema, data, and API compatibility | `8.1` | `DB`, `BE`, `QA` |
| Run regression across dependent workflows | `8.2` | `QA`, `FE`, `BE`, `MB` |
| Tighten enforcement after validation | `8.3` | `BE`, `DB`, `QA` |

---

## P0 Ownership and Implementation Map

> This section maps each critical task to the team most likely to own it and the primary modules or files it will touch.

| Task | Owner | Primary Modules | Likely Files / Areas |
|---|---|---|---|
| `1.1` Freeze terminology model | `PL` | Architecture, domain language | PRD, task list, architecture notes |
| `1.2` Inventory Site dependencies | `PL`, `BE` | SiteManagement, Reporting, Dashboard, Events, Mobile | `FMS.Application/Features/Site/`, `FMS.WebClient/Controllers/`, `fms.frontend/src/pages/site/`, `fms.mobile/` |
| `2.1` Define Project aggregate contract | `PL`, `BE` | Domain and application model | Project entity design, DTO contract notes |
| `2.2` Define Site to Project linkage | `BE`, `DB` | Domain, persistence | `Site` relationship design, EF mapping plan |
| `2.3` Prepare persistence changes | `DB` | Persistence | `FMS.Persistence/DataAccess/GpsdataContext.cs`, `FMS.Persistence/EntityConfigurations/` |
| `3.1` Define backfill approach | `DB`, `BE` | Migration and data rollout | migration scripts, verification queries |
| `3.2` Prepare migration scripts | `DB` | Persistence, deployment | EF migration files, SQL backfill scripts |
| `4.1` Create Project feature structure | `BE` | Application layer | `FMS.Application/Features/Project/Commands/`, `Queries/`, `DTOs/`, `Services/` |
| `4.2` Add Project DTOs | `BE` | Application layer | `FMS.Application/Features/Project/DTOs/`, Site DTO updates |
| `4.3` Add Project commands and queries | `BE` | CQRS | `FMS.Application/Features/Project/Commands/`, `Queries/` |
| `4.4` Update Site application contracts | `BE` | CQRS, SiteManagement | `FMS.Application/Features/Site/DTOs/`, `Queries/`, `Commands/` |
| `5.1` Add Project controller | `BE` | Web API | `FMS.WebClient/Controllers/ProjectController.cs` |
| `5.2` Extend Site controller behavior | `BE` | Web API | `FMS.WebClient/Controllers/SiteController.cs` |
| `6.3` Preserve Site workflows | `FE`, `BE` | Web frontend and API compatibility | `fms.frontend/src/pages/site/`, related API client and reducer files |
| `8.1` Verify schema and data migration | `DB`, `QA` | Persistence, API | migration verification queries, API smoke tests |
| `8.2` Regression test workflows | `QA` | Web, mobile, reporting, events | `fms.frontend/`, `fms.mobile/`, reporting and SignalR flows |
| `8.3` Tighten enforcement after rollout | `BE`, `DB` | Persistence, validation | required FK enforcement, null-handling cleanup |

---

## Delivery Tracks

> This section reorganizes the same task list by delivery stream so each team can plan its own backlog without losing the phase-based rollout above.

### Backend Track

**Primary owners:** `BE`, `DB`

**Outcome:** Project aggregate, persistence, CQRS, API contracts, and Site compatibility are implemented safely.

| Track Step | Tasks | Priority |
|---|---|---|
| Architecture and dependency analysis | `1.1`, `1.2`, `2.1`, `2.2` | `P0` |
| Persistence and migration design | `2.3`, `3.1`, `3.2` | `P0` |
| Project feature implementation | `4.1`, `4.2`, `4.3` | `P0` |
| Site contract integration | `4.4`, `5.2` | `P0` |
| Project API exposure | `5.1`, `5.3` | `P0`, `P1` |
| Rollout hardening | `8.1`, `8.3` | `P0` |

### Frontend Track

**Primary owners:** `FE`

**Outcome:** Web users can manage Projects and continue Site-first workflows during the transition.

| Track Step | Tasks | Priority |
|---|---|---|
| Site compatibility planning | `1.2` | `P0` |
| Project management UI | `6.1` | `P1` |
| Site UI Project integration | `6.2` | `P1` |
| Site workflow preservation | `6.3` | `P0` |
| Dashboard web adoption | `7.4` | `P1` |
| Web regression coverage | `8.2` | `P0` |

### Reporting Track

**Primary owners:** `RP`, `BE`

**Outcome:** Reports, templates, and schedules support optional Project context while keeping Site filters valid.

| Track Step | Tasks | Priority |
|---|---|---|
| Reporting impact analysis | `1.2`, `7.2` | `P0`, `P2` |
| Report filter adoption | `7.1` | `P1` |
| Contract and template updates | `7.3` | `P1` |
| Reporting regression coverage | `8.2` | `P0` |

### Events Track

**Primary owners:** `RT`, `BE`

**Outcome:** Notifications, events, and SignalR payloads can carry Project context additively without breaking existing consumers.

| Track Step | Tasks | Priority |
|---|---|---|
| Event and SignalR dependency analysis | `1.2` | `P0` |
| Event contract review | `7.5` | `P1` |
| SignalR and notification payload strategy | `7.6` | `P1` |
| Real-time regression coverage | `8.2` | `P0` |

### Mobile Track

**Primary owners:** `MB`, `BE`

**Outcome:** Mobile workflows adopt Project context in a controlled sequence after backend contracts stabilize.

| Track Step | Tasks | Priority |
|---|---|---|
| Mobile dependency analysis | `1.2` | `P0` |
| Mobile adoption planning | `7.7` | `P1` |
| Mobile compatibility validation | `8.2` | `P0` |

### Cross-Track Coordination Notes

1. Backend must complete `3.2`, `4.3`, `4.4`, and `5.1` before Frontend, Reporting, Events, and Mobile can safely adopt Project-aware contracts.
2. Frontend should deliver `6.3` before broad Project-first UX changes so Site workflows remain stable.
3. Reporting, Events, and Mobile should treat Project fields as optional until `8.3` is complete.
4. Regression testing in `8.2` is shared across all tracks and should be planned as an integrated release gate.

---

## Phase 1: Architecture and Terminology

> Confirm the business meaning before any implementation work begins.

### Task 1.1 ⬜ [P0] — Freeze the terminology model

- [ ] Document and confirm the hierarchy: `Organization -> Project -> Site`
- [ ] Confirm that `Site` remains the operational location
- [ ] Confirm that `Project` is an administrative grouping for many Sites
- [ ] Confirm that trip-planning `ProjectPlan` is not the same concept as Project hierarchy

**Deliverables:**
- Approved hierarchy definition
- Final naming rules for backend, frontend, and database work

---

### Task 1.2 ⬜ [P0] — Inventory Site dependencies before coding

- [ ] List Site entity relationships that must remain stable in V1
- [ ] List Site API contracts that must remain backward compatible
- [ ] List frontend screens and flows that currently assume Site is top-level
- [ ] List reports and permissions impacted by Project introduction
- [ ] List dashboard modules impacted by Project introduction
- [ ] List event handlers, notifications, and SignalR flows impacted by Project introduction
- [ ] List mobile workflows impacted by Project introduction

**Deliverables:**
- Site dependency inventory
- Backward-compatibility checklist

---

## Phase 2: Backend Domain and Persistence Design

> Define the additive backend design. This phase requires explicit approval before Domain-layer implementation.

### Task 2.1 ⬜ [P0] — Define Project aggregate contract

- [ ] Define minimum Project fields: `Id`, `Name`, `Code`, `Description`, `IsActive`
- [ ] Define audit fields and lifecycle rules
- [ ] Define uniqueness rules for project code and name
- [ ] Define delete vs deactivate behavior

**Deliverables:**
- Project entity contract
- Validation rules

---

### Task 2.2 ⬜ [P0] — Define Site to Project linkage

🔗 Depends on: Task 2.1

- [ ] Define `Site.ProjectId` relationship
- [ ] Decide nullable-first rollout strategy
- [ ] Define navigation behavior for `Project.Sites`
- [ ] Define required-state enforcement after backfill

**Deliverables:**
- FK strategy
- Relationship rules

---

### Task 2.3 ⬜ [P0] — Prepare persistence changes

🔗 Depends on: Task 2.2

- [ ] Add Project table design to persistence plan
- [ ] Add Site.ProjectId column plan
- [ ] Define indexes for common Project and Site queries
- [ ] Define migration order to avoid deployment failures

**Files to be created later:**
- `FMS.Persistence/EntityConfigurations/ProjectConfiguration.cs`
- `FMS.Persistence/DataAccess/GpsdataContext.cs`
- EF migration files

---

## Phase 3: Data Migration Strategy

> Introduce data safely without breaking existing Site references.

### Task 3.1 ⬜ [P0] — Define backfill approach

🔗 Depends on: Task 2.3

- [ ] Decide whether to create one default Project or multiple seeded Projects
- [ ] Define rules for assigning existing Sites to Projects
- [ ] Define rollback approach if assignment fails
- [ ] Define validation query set for post-backfill verification

**Deliverables:**
- Backfill plan
- Verification checklist

---

### Task 3.2 ⬜ [P0] — Prepare migration scripts

🔗 Depends on: Task 3.1

- [ ] Create schema migration for Project table
- [ ] Create schema migration for nullable `Site.ProjectId`
- [ ] Create data migration to populate Project and link Sites
- [ ] Create follow-up migration to make `Site.ProjectId` required when ready

**Deliverables:**
- Ordered migration set
- Rollback guidance

---

## Phase 4: Backend Application Layer

> Add Project support without disrupting existing Site features.

### Task 4.1 ⬜ [P0] — Create Project feature structure

- [ ] Create `FMS.Application/Features/Project/Commands/`
- [ ] Create `FMS.Application/Features/Project/Queries/`
- [ ] Create `FMS.Application/Features/Project/DTOs/`
- [ ] Create `FMS.Application/Features/Project/Services/` if required

**Deliverables:**
- Project feature folder structure

---

### Task 4.2 ⬜ [P0] — Add Project DTOs

🔗 Depends on: Task 4.1

- [ ] Create `ProjectDto`
- [ ] Create `CreateProjectDto`
- [ ] Create `UpdateProjectDto`
- [ ] Create Site-facing DTO additions for Project fields where needed

---

### Task 4.3 ⬜ [P0] — Add Project commands and queries

🔗 Depends on: Task 4.2

- [ ] Create Project create command and handler
- [ ] Create Project update command and handler
- [ ] Create Project list query and handler
- [ ] Create Project detail query and handler
- [ ] Create Project deactivate/delete command and handler

---

### Task 4.4 ⬜ [P0] — Update Site application contracts

🔗 Depends on: Task 4.2

- [ ] Update Site DTOs to expose Project information
- [ ] Update Site create and update handlers to accept `ProjectId`
- [ ] Add optional `projectId` filtering to Site list queries
- [ ] Preserve Site API backward compatibility where Project is absent during rollout

---

## Phase 5: Web API and Permissions

> Expose Project management cleanly and keep Site endpoints stable.

### Task 5.1 ⬜ [P0] — Add Project controller

🔗 Depends on: Task 4.3

- [ ] Create `FMS.WebClient/Controllers/ProjectController.cs`
- [ ] Add CRUD endpoints under `/api/v1/project`
- [ ] Add endpoint to list Sites by Project if needed
- [ ] Ensure all responses use `FMSResponse<T>`

---

### Task 5.2 ⬜ [P0] — Extend Site controller behavior

🔗 Depends on: Task 4.4

- [ ] Allow Site create and update flows to accept `ProjectId`
- [ ] Add optional Project filter parameters to Site list endpoints
- [ ] Add Project metadata to Site responses where appropriate
- [ ] Avoid breaking existing consumers that do not yet send Project data

---

### Task 5.3 ⬜ [P1] [`BE`, `FE`] — Add Project permissions and navigation mapping

🔗 Depends on: Task 5.1

- [ ] Add `_Read_Project`
- [ ] Add `_Create_Project`
- [ ] Add `_Update_Project`
- [ ] Add `_Delete_Project`
- [ ] Add navigation item for Project management if approved
- [ ] Preserve Site permissions unchanged in V1

---

## Phase 6: Frontend

> Add Project UX without destabilizing existing Site screens.

### Task 6.1 ⬜ [P1] [`FE`] — Add Project management frontend module

🔗 Depends on: Task 5.1

- [ ] Add Project list page
- [ ] Add Project create/edit form
- [ ] Add Project API client methods
- [ ] Add Redux or local state integration consistent with current frontend patterns

---

### Task 6.2 ⬜ [P1] [`FE`] — Update Site management UI

🔗 Depends on: Task 5.2

- [ ] Add Project selector to Site create form
- [ ] Add Project selector to Site edit form
- [ ] Add Project column to Site list if useful
- [ ] Add Project filter to Site page
- [ ] Show Project context in Site detail views

---

### Task 6.3 ⬜ [P0] — Preserve backward-compatible Site workflows

🔗 Depends on: Task 6.2

- [ ] Ensure existing Site navigation still works
- [ ] Ensure current Site-only users can continue their workflows
- [ ] Avoid forcing Project selection in UI until data migration is complete
- [ ] Add empty/default handling for legacy records during rollout

---

## Phase 7: Cross-Cutting Module Adoption

> Adopt Project filtering gradually after the core hierarchy is stable.

### Module Group: Reporting

### Task 7.1 ⬜ [P1] [`RP`, `BE`] — Add Project-aware filtering to reports

- [ ] Identify reports that currently filter only by Site
- [ ] Add Project filter where it improves user workflows
- [ ] Ensure Project plus Site filters work together coherently
- [ ] Preserve existing Site-scoped reports during rollout

---

### Task 7.2 ⬜ [P2] [`PL`, `BE`] — Review cross-feature dependencies

- [ ] Review fuel management flows for Project relevance
- [ ] Review stock and reconciliation flows for Project relevance
- [ ] Review user-site assignment behavior versus future user-project needs
- [ ] Identify V2 candidates for deeper Project adoption

---

### Task 7.3 ⬜ [P1] [`RP`, `BE`, `FE`] — Update reporting contracts and templates

🔗 Depends on: Task 7.1

- [ ] Review reporting source definitions and parameter contracts for Site-only assumptions
- [ ] Add optional `projectId` support to report generation flows where appropriate
- [ ] Review scheduled reports for Site-only payload assumptions
- [ ] Ensure JsReport templates and report builders can display Project context when needed

---

### Module Group: Dashboard

### Task 7.4 ⬜ [P1] [`FE`, `BE`] — Update dashboard filters and rollups

- [ ] Identify dashboards that aggregate strictly by Site
- [ ] Add Project filter support to relevant dashboard endpoints and pages
- [ ] Add Project rollup logic for cards, charts, and drill-downs where needed
- [ ] Preserve existing Site defaults during rollout

---

### Module Group: Events and SignalR

### Task 7.5 ⬜ [P1] [`RT`, `BE`] — Review event handling and real-time flows

- [ ] Identify domain events, notifications, and SignalR payloads that assume Site-only context
- [ ] Decide which event contracts need optional Project fields in V1
- [ ] Update event consumers to tolerate additive Project context
- [ ] Preserve backward compatibility for existing event subscribers

---

### Task 7.6 ⬜ [P1] [`RT`, `BE`] — Update SignalR and notification payload strategy

- [ ] Review SignalR hub payloads for Site-only assumptions
- [ ] Add optional Project fields to live-update DTOs only where required
- [ ] Review notification templates and handlers for Project context needs
- [ ] Verify that older consumers ignore additive Project payload fields

---

### Module Group: Mobile

### Task 7.7 ⬜ [P1] [`MB`, `BE`] — Add mobile adoption plan

- [ ] Review `fms.mobile` workflows that filter, display, or cache Site-scoped data
- [ ] Identify mobile API calls that need optional `projectId`
- [ ] Plan Project-aware mobile filters and selectors
- [ ] Sequence mobile rollout after backend and web API stabilization

---

## Phase 8: Validation and Rollout

> Prove the migration is safe before tightening constraints.

### Task 8.1 ⬜ [P0] — Verify schema and data migration

- [ ] Validate every Site has a Project after backfill
- [ ] Validate Site CRUD still works end to end
- [ ] Validate Project CRUD works end to end
- [ ] Validate Site queries and filters remain performant

---

### Task 8.2 ⬜ [P0] — Regression test existing workflows

- [ ] Test Site management
- [ ] Test vehicle and tank flows that depend on Site
- [ ] Test permissions for Site and Project screens
- [ ] Test navigation and API backward compatibility
- [ ] Test report generation and scheduled reports with Site and Project filters
- [ ] Test dashboards with Site and Project scope
- [ ] Test event handling and SignalR consumers with additive Project context
- [ ] Test mobile workflows against updated API contracts

---

### Task 8.3 ⬜ [P0] — Tighten enforcement after rollout

🔗 Depends on: Task 8.1, Task 8.2

- [ ] Make `Site.ProjectId` required after data validation
- [ ] Remove temporary null-handling branches if added
- [ ] Finalize validation rules in backend and UI
- [ ] Capture deferred V2 follow-up tasks

---

## Recommended Milestone Order

1. Terminology and architecture approval
2. Persistence design and migration scripts
3. Backend Project feature and API
4. Site integration changes
5. Frontend Project screens and Site filters
6. Reporting and dashboard adoption
7. Event handling adoption
8. Mobile adoption
9. Regression testing and constraint tightening
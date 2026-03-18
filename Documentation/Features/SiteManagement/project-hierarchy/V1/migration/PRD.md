<!--
File: PRD.md
Purpose: Product requirements for introducing Project above Site with minimal disruption to the existing FMS codebase.
Dependencies: Existing Site domain, SiteController, Site frontend pages, permission model, EF Core persistence.
Last Modified: 2026-03-13
-->

# PRD: Project Hierarchy Above Site (V1)

> **Version:** 1.0
> **Date:** 2026-03-13
> **Status:** Draft
> **Domain:** SiteManagement
> **Type:** Migration

---

## 1. Executive Summary

Introduce a new `Project` aggregate above the existing `Site` aggregate instead of renaming `Site` to `Project`.

This is the lowest-risk path because `Site` is already a deeply integrated operational concept across the backend, persistence layer, permissions, and frontend. Replacing or renaming `Site` would create widespread code churn and naming conflicts, while adding `Project` as a parent container preserves current behavior and allows gradual adoption.

**Target hierarchy:**

`Organization -> Project -> Site -> Vehicles / Tanks / Employees / Devices / Rules`

---

## 2. Problem Statement

The business needs a higher-level grouping concept above `Site`.

Today, `Site` acts as both:

1. The operational location where vehicles, tanks, employees, and devices are assigned.
2. The main scoping unit for permissions, filtering, and many business workflows.

This makes it difficult to represent broader programs or initiatives that contain multiple operating locations.

The core decision is whether to:

1. Rename `Site` to `Project`.
2. Add `Project` above `Site`.

This PRD adopts option 2 because it minimizes disruption while preserving current semantics.

---

## 3. Goals

1. Add a first-class `Project` concept without breaking existing Site-based workflows.
2. Allow one Project to contain many Sites.
3. Preserve current Site CRUD, Site permissions, and Site-linked business logic during the initial rollout.
4. Enable gradual backend, frontend, and reporting adoption.
5. Avoid a broad rename across the codebase.
6. Include reporting, event handling, dashboards, and mobile app adoption in the migration plan.

---

## 4. Non-Goals

1. Renaming `Site` entities, tables, controllers, DTOs, routes, or permissions in V1.
2. Reworking every feature that currently filters by `SiteId`.
3. Converting historical data structures to a Project-only model.
4. Reusing any trip-planning `ProjectPlan` concept as the same business object.
5. Removing Site as the operational unit.
6. Rewriting every existing dashboard, report, SignalR flow, or mobile screen in V1.

---

## 5. Decision Summary

### Recommended Approach

Create `Project` as a parent aggregate and link `Site` to `Project` through `ProjectId`.

### Rejected Approach

Do not rename `Site` to `Project`.

### Rationale

1. `Site` is a core aggregate with many relationships and existing operational meaning.
2. Site-based APIs, UI screens, and permissions are already established and stable.
3. A rename would cause broad breaking changes across backend, frontend, and database layers.
4. There is already Project-like terminology in other parts of the system, which would create ambiguity if `Site` were renamed.

---

## 6. Current State Analysis

### 6.1 Site as a Core Aggregate

The existing system treats `Site` as a primary operational unit, not a lightweight lookup.

Current responsibilities tied to Site include:

1. Vehicle assignment.
2. Tank assignment.
3. Employee assignment.
4. PTS device assignment.
5. User access scoping.
6. Fueling rules and stock-related workflows.
7. Geofence and GPS-related configuration.

Additional system surfaces that rely on Site-based scoping include:

1. Reporting filters and scheduled report payloads.
2. Dashboard widgets and operational summary cards.
3. Event handling and real-time notifications.
4. Mobile app filtering, assignment, and operational views.

### 6.2 Risk of Renaming Site

Renaming `Site` to `Project` would affect:

1. Domain entities and relationships.
2. EF Core mappings and migrations.
3. DbSet and repository/query usage.
4. API controllers and route contracts.
5. DTOs, handlers, and mapping profiles.
6. Frontend routes, Redux state, and page structure.
7. Permissions and navigation configuration.
8. Historical data and reporting assumptions.
9. Dashboard filters, cards, and drill-down workflows.
10. Event payloads, handlers, and live-update subscriptions.
11. Mobile app contracts, filters, and offline data assumptions.

### 6.3 Module Impact Matrix

| Module | Current Site Dependency | V1 Change Required | Impact | Notes |
|---|---|---|---|---|
| Web Frontend | Site is used as a top-level operational filter and management concept | Add Project management UI and Project-aware Site filters | High | Must preserve current Site-first workflows during rollout |
| Web API | Site contracts and queries are used broadly across modules | Add Project endpoints and extend Site contracts additively | High | Existing Site endpoints should remain backward compatible |
| Reporting | Report parameters, scheduled payloads, and templates often assume Site scope | Add optional `projectId` filters and Project context in outputs | Medium | Site filters remain valid during V1 |
| Events | Notifications, domain events, and SignalR payloads may embed Site-only assumptions | Add optional Project context where needed | Medium | Additive event contracts only; do not break subscribers |
| Dashboard | Dashboard widgets and rollups often aggregate by Site | Add Project filters and Project rollups selectively | Medium | Project adoption should focus on high-value dashboards first |
| Mobile | Mobile flows likely cache and filter by Site | Add Project-aware filters after API stabilization | Medium | Defer broad mobile navigation changes to reduce churn |

---

## 7. Proposed Solution

### 7.1 Domain Model

Introduce a new `Project` aggregate with the following minimum shape:

| Field | Description |
|---|---|
| `Id` | Primary key |
| `Name` | Project display name |
| `Code` | Unique project code |
| `Description` | Optional description |
| `IsActive` | Active/inactive flag |
| `CreatedOn` | Audit timestamp |
| `UpdatedOn` | Audit timestamp |

Then add:

| Change | Description |
|---|---|
| `Site.ProjectId` | Foreign key to Project |
| `Project.Sites` | Navigation collection |

### 7.2 Functional Behavior

1. A Site belongs to exactly one Project after migration completion.
2. A Project can contain multiple Sites.
3. Existing Site-level operations continue to work unchanged wherever possible.
4. Project becomes an additional scoping layer for navigation, filtering, reporting, and administration.
5. Project becomes an additional scoping layer for dashboards, event handling, and mobile experiences where Site is currently assumed to be the top-level context.

### 7.3 Rollout Principle

Use an additive migration:

1. Add Project.
2. Link Site to Project.
3. Backfill data.
4. Update APIs and UI incrementally.
5. Keep Site contracts stable during V1.

---

## 8. User Stories

### 8.1 Administrator

As a system administrator, I want to create Projects and assign Sites to them so that multiple operational locations can be managed under one business umbrella.

### 8.2 Operations Manager

As an operations manager, I want to filter Sites, Vehicles, and reports by Project so that I can monitor operations across related Sites more easily.

### 8.3 Dashboard User

As a dashboard user, I want operational widgets and drill-down views to support Project-level filtering so that I can see rollups across multiple Sites.

### 8.4 Mobile User

As a mobile user, I want the app to understand Project context without breaking my current Site-based workflows so that I can keep using the system during the migration.

### 8.5 Existing Site User

As a current Site-based user, I want my existing workflows to continue working after the Project hierarchy is introduced so that the migration does not break day-to-day operations.

---

## 9. Functional Requirements

### 9.1 Project Management

1. The system shall allow authorized users to create, edit, view, activate, and deactivate Projects.
2. The system shall expose Project list and detail endpoints.
3. The system shall support assigning a Site to a Project.
4. The system shall prevent deleting a Project that still has dependent Sites unless reassignment rules are satisfied.

### 9.2 Site Integration

1. The system shall retain existing Site CRUD functionality.
2. The system shall allow Site create and edit flows to include `ProjectId`.
3. The system shall support filtering Site lists by Project.
4. The system shall preserve existing Site-based queries during V1.

### 9.3 Permissions and Navigation

1. The system shall introduce Project permissions separate from Site permissions.
2. The system shall allow Project screens to appear in navigation without removing Site screens.
3. The system shall preserve current Site permission behavior in V1.

### 9.4 Reporting and Dashboards

1. The system shall support Project-aware filtering for reports that currently use Site filters.
2. The system shall preserve existing Site-scoped report behavior during rollout.
3. The system shall support Project-aware dashboard filtering and rollups where dashboards currently aggregate by Site.
4. The system shall preserve existing dashboard behavior for users who still operate at Site scope.

### 9.5 Event Handling and Real-Time Flows

1. The system shall review event contracts that currently carry Site identifiers or assume Site-only scoping.
2. The system shall support adding Project context to events, notifications, or SignalR payloads where needed without breaking existing consumers.
3. The system shall preserve existing event handling behavior during rollout.

### 9.6 Mobile Application

1. The system shall support Project-aware filtering and display in mobile workflows that currently depend on Site.
2. The system shall preserve backward-compatible mobile behavior during the transition period.
3. The system shall avoid forcing a mobile-only migration before backend and web APIs are stable.

### 9.7 Migration and Backfill

1. The system shall support creating at least one default Project for existing data migration.
2. The system shall support backfilling all existing Sites to a Project.
3. The migration shall avoid breaking existing foreign-key relationships that already depend on Site.

---

## 10. Non-Functional Requirements

1. The migration must be backward compatible during the rollout period.
2. Existing Site APIs should remain operational unless explicitly versioned.
3. Database migration should be safe for incremental deployment.
4. Performance impact on Site lists and Site queries should remain minimal.
5. The design should allow future Project-based reporting and authorization.
6. Real-time event and dashboard performance should not regress materially during the rollout.
7. Mobile clients should remain functional against evolving APIs during the transition period.

---

## 11. API Scope

### 11.1 New API Surface

Add Project-focused endpoints analogous to Site management:

1. `GET /api/v1/project`
2. `GET /api/v1/project/{id}`
3. `POST /api/v1/project`
4. `PUT /api/v1/project/{id}`
5. `DELETE /api/v1/project/{id}` or deactivate behavior
6. `GET /api/v1/project/{id}/sites`

### 11.2 Existing API Enhancements

Enhance Site-related APIs to include Project information where appropriate:

1. Site list responses may include `ProjectId`, `ProjectName`, `ProjectCode`.
2. Site create and update requests may accept `ProjectId`.
3. Site query endpoints may accept optional `projectId` filters.

### 11.3 Reporting, Dashboard, and Event API Considerations

1. Report parameter endpoints may need optional `projectId` support alongside `siteId`.
2. Dashboard endpoints may need Project-level aggregation and filtering.
3. SignalR payloads, notification payloads, or event DTOs may need optional Project context.
4. Mobile-facing endpoints should accept Project filters only after web and backend contracts are stable.

---

## 12. Frontend Scope

### 12.1 New Screens

1. Project list page.
2. Project create/edit form.
3. Project detail panel or equivalent view.

### 12.2 Site UI Changes

1. Add Project selector to Site create/edit forms.
2. Add Project column and filter to Site list.
3. Add Project context in Site detail views where useful.

### 12.3 Deferred Frontend Changes

The following are out of V1 scope unless specifically needed:

1. Moving all existing pages to Project-first navigation.
2. Rewriting all screens that currently assume Site is the top-level grouping.
3. Replacing Site-based breadcrumbs across the product.

### 12.4 Dashboard Scope

1. Add Project-aware filters to dashboard pages that currently operate at Site scope.
2. Add Project rollup behavior for summary cards, charts, and drill-downs where needed.
3. Preserve existing Site-based dashboard defaults during the migration.

### 12.5 Mobile Scope

1. Add Project-aware selection and filtering to mobile workflows that currently rely on Site context.
2. Preserve current mobile Site-based UX during phased rollout.
3. Defer broad mobile navigation redesign unless specifically required.

---

## 13. Data Migration Strategy

### Phase A: Schema Introduction

1. Add Project table.
2. Add nullable `Site.ProjectId`.

### Phase B: Seed and Backfill

1. Create one or more initial Projects.
2. Assign all existing Sites to a Project.

### Phase C: Contract Tightening

1. Make `Site.ProjectId` required after backfill is verified.
2. Add constraints and validation rules.

### Phase D: Cross-Surface Adoption

1. Update reports to support Project filters where appropriate.
2. Update dashboards to support Project rollups and filters.
3. Update event contracts and handlers to carry Project context where necessary.
4. Update mobile consumers after backend and web contracts are stable.

---

## 14. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Renaming Site semantics leaks into V1 | High | Keep Site naming intact and additive |
| Existing data has no natural Project grouping | Medium | Start with default Project assignment and refine later |
| Frontend assumes Site is top-level everywhere | Medium | Add Project filters incrementally without removing Site screens |
| Permission complexity increases | Medium | Add Project permissions separately and preserve Site permission behavior |
| Domain changes are sensitive | High | Implement only after explicit approval; phase carefully |
| Reports and dashboards rely on Site-only filters | Medium | Add optional Project filters while preserving Site defaults |
| Event payload consumers break when Project context is added | High | Make Project fields additive and optional first |
| Mobile app lags behind backend changes | Medium | Phase mobile adoption after API contracts stabilize |

---

## 15. Success Metrics

1. Existing Site CRUD continues to work after Project schema introduction.
2. All Sites are assigned to a Project after migration.
3. Administrators can manage Projects independently.
4. Site screens can filter or display Project context.
5. No critical regressions in Site-based operations during rollout.
6. Key reports can filter by Project without breaking Site-based usage.
7. Key dashboards support Project rollups or filters where needed.
8. Event handling remains backward compatible while Project context is introduced.
9. Mobile workflows remain functional during the transition.

---

## 16. Recommended Delivery Sequence

1. Finalize terminology and business meaning.
2. Add backend Project model and persistence.
3. Add `ProjectId` to Site and backfill data.
4. Add Project APIs and permissions.
5. Add frontend Project screens and Site form updates.
6. Roll out Project-aware reporting, dashboard, and event adoption.
7. Roll out mobile Project-aware support.

---

## 17. Open Decisions

1. Should Project be tenant-wide, organization-wide, or business-unit scoped?
2. Should Site deletion be blocked when linked to an active Project, or should reassignment be mandatory?
3. Should Project support its own administrators in V1, or only global admins?
4. Should reporting default to Project scope when both Project and Site filters exist?
5. Which dashboard modules need Project rollups in V1 versus V2?
6. Which events and SignalR flows need Project context immediately, and which can stay Site-only in V1?
7. Which mobile modules should adopt Project first?

---

## 18. Final Recommendation

Proceed with `Project above Site`.

Do not rename `Site` in V1. Add Project as a parent hierarchy layer, preserve Site as the operational location, and migrate through additive schema and API changes.
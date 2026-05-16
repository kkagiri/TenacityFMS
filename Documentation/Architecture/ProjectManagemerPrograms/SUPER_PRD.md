# Super PRD — Tenacity FMS

> **Document type:** Top-level program-of-work PRD (index, not duplicate)
> **Status:** Living document
> **Cutoff date for "pre-software":** `2026-04-29`
>   Any PRD/TASKS file dated **after** this date is classified as *pre-software* (specification only, not yet implemented) and is rendered separately in the tracker.

---

## How this document works

This Super PRD is the **single program-level entry point** for everyone working on Tenacity FMS — humans, AI agents, and the project tracker UI.

It is deliberately thin. The source of truth for each feature lives in its own folder under `Documentation/Features/{domain}/{feature}/{version}/{type}/`. This file only:

1. Captures the program-level **vision**, **architecture pillars**, and **cross-cutting concerns**.
2. **Indexes** every feature PRD by linking to it.
3. Defines the **status taxonomy** and **phase model** that the tracker JSON uses.

Companion files:

| File | Role | Audience |
|---|---|---|
| `Documentation/Architecture/ProjectManagemerPrograms/SUPER_PRD.md` | This file — narrative + index | Humans + agents |
| `Documentation/Architecture/ProjectManagemerPrograms/super-tasklist.json` | Machine source of truth for status, milestones, % complete | Agents + tracker UI |
| `Documentation/Architecture/ProjectManagemerPrograms/project-tracker.html` | Visual dashboard rendering the JSON | Humans (browser) |
| `Documentation/Architecture/architecture-monitor.html` | Architecture monitor rendering the DFD, tenancy model, and program sources | Humans + agents |

> ⚠️ **Maintenance rule:** Never duplicate feature content here. Update the per-feature PRD/TASKS file, then reflect the headline status in `super-tasklist.json`. The HTML tracker re-renders automatically.

---

## 1. Vision

Tenacity FMS is a multi-tenant Fleet Management System covering vehicle tracking, fueling (PTS / ATG), tank stock, trip management, fiscal compliance, notifications, reporting, and sales onboarding — built on .NET Core (CQRS / Clean Architecture) with a React 18 frontend.

The program goal is to evolve FMS from a single-tenant monolith into a **multi-tenant, multi-device, plugin-driven platform** with clear separation between business workflows, device transport, and infrastructure.

### 1.1 Project Definition

| Aspect | Value |
|---|---|
| Product name | Tenacity FMS (Fleet Management System) |
| Stack | .NET Core (CQRS / Clean Architecture) · React 18 · MySQL 5.5/5.6 · SignalR · RabbitMQ · Redis |
| Tenancy model | Multi-tenant (`ITenantContext`) with three audiences: **Platform Operator**, **Client**, **Customer (sub-tenant)** |
| Frontends | `apps/FMS.Admin` (operator), `apps/fms.frontend` (client/customer), `apps/FMS.Landing` (marketing) |
| Hosts/services | `apps/FMS.WebClient` (API), `services/FMS.Devices.Tracking.Host`, `services/FMS.Devices.Fueling.Host` (target), `services/FMS.PTS.WindowsService` (legacy), `services/FMS.BackgroundServices` |
| Geographic scope | Kenya first (KRA eTIMS); architected for additional fiscal regions via the provider plugin model |

### 1.2 Domain Coverage

FMS covers nine top-level business domains. Each maps to a feature folder under `Documentation/Features/{domain}/` and to one or more sub-systems in the codebase.

| # | Domain | Scope |
|---|---|---|
| 1 | **Vehicle Tracking** | GPS providers (GPSGate, GPSWox), live positions, trips, geofences |
| 2 | **Fueling** | PTS pumps (Technotrade), ATG tank gauges, dispensing transactions, pump commands |
| 3 | **Tank Stock** | Opening/closing stock, refills, adjustments, transfers, reconciliation |
| 4 | **Task & Trip Management** | Driver assignments, trip lifecycle, operational KPIs |
| 5 | **Fiscal Compliance** | KRA eTIMS integration (OSCU + VSCU), receipt signing, audit trail |
| 6 | **Notifications & Alarms** | Alert Configuration, Event Expression Engine, Active Events |
| 7 | **Reporting & Dashboards** | SignalR real-time dashboards, operational reports |
| 8 | **Sales & Onboarding** | `FMS.Sales` pipeline, subscriptions, invoices, customer provisioning |
| 9 | **Administration** | Multi-tenancy, users, roles, permissions, audit log |

> The authoritative breakdown of subdomains and their **sequence dependencies** lives in `super-tasklist.json → domains[]` and is rendered as the "Domain Map" section of `project-tracker.html`.

---

## 2. Architecture Pillars

| Pillar | Description | Reference |
|---|---|---|
| Clean Architecture / CQRS | Commands & queries grouped per-domain under `FMS.Application/Features/{Domain}/`. | `.github/copilot-instructions.md` §3 |
| Multi-Tenancy | Tenant-scoped data via `ITenantContext`; cross-tenant access requires `IBypassTenancy`. | `Documentation/Features/MultiTenancy/` |
| Device Provider Plugins | All device transport in `FMS.Devices.*`; business logic in `FMS.Application/Features/Devices/`. | `Documentation/Features/devices/multi-device-platform/V1/implementation/PRD.md` |
| Event Expression Engine | Replaces legacy `AlarmHandler` pipeline. | `Documentation/Features/NotificationAndAlarm/EventExpressionEngine/PRD.md` |
| Fluent (M365) UI | Microsoft 365 Admin Center design language across all frontends. | `.github/copilot-instructions.md` §10 |
| Application Decomposition | Break up the `FMS.Application` god-package. | `Documentation/Features/Architecture/fms-application-decomposition/V1/implementation/PRD.md` |

---

## 2.1 Domain Map & Sequence Dependencies

Each of the nine domains in §1.2 decomposes into **subdomains**. Subdomains are the lowest unit a feature PRD attaches to. The build/install order across domains is constrained by the dependency graph below — features in a dependent domain cannot reach `released` until their upstream subdomains are at least `inProgress` with a working seam.

| Domain | Subdomains | Depends on |
|---|---|---|
| **Administration** | Tenancy · Users · Roles · Permissions · Audit · Branding | — (foundation) |
| **Sales & Onboarding** | Plans & Pricing · Subscriptions · Invoices · Customer Provisioning | Administration |
| **Vehicle Tracking** | Providers · Live Positions · Trips · Geofences | Administration |
| **Fueling** | PTS Pumps · ATG Gauges · Dispensing · Pump Commands | Administration |
| **Tank Stock** | Opening/Closing Stock · Refills · Adjustments · Transfers · Reconciliation | Fueling |
| **Task & Trip Management** | Assignments · Trip Lifecycle · KPIs | Vehicle Tracking |
| **Fiscal Compliance** | OSCU · VSCU · Receipt Signing · Outbox | Sales & Onboarding |
| **Notifications & Alarms** | Alert Configuration · Event Expression Engine · Active Events | Vehicle Tracking · Fueling · Tank Stock (event sources) |
| **Reporting & Dashboards** | Real-time (SignalR) · Operational Reports · Cross-tenant Reports | Vehicle Tracking · Fueling · Tank Stock · Task & Trip · Fiscal |

> The machine-readable version lives in `super-tasklist.json → domains[]` with `subdomains[]` and `dependsOn[]` fields. The tracker renders this as the **Domain Map** panel.

---

## 2.2 Business Goals

The technical program-of-work is measured against business outcomes that live in a separate dashboard:

- File: [Documentation/Architecture/ProjectManagemerPrograms/business-goals.html](business-goals.html)
- Data: [Documentation/Architecture/ProjectManagemerPrograms/business-goals.json](business-goals.json)
- Owner: Product Manager Agent (see `.github/agents/ProductManager.agent.md`)

Headline metrics: **Adoption**, **Monthly Active Users (MAU)**, **Customer Retention**, **Revenue (ARR/MRR)**, **NPS / CSAT**. The Super PRD does not duplicate those numbers; it only links them.

---

## 3. Feature Catalog

> **The authoritative catalog lives in `super-tasklist.json`.** This table is a quick human-readable index only. Open `project-tracker.html` for the live view.

| Feature | Domain | Phase | Pre-software | PRD link |
|---|---|---|---|---|
| Multi-Device Platform | devices | `preSoftware` with tracked implementation slices | Yes | [PRD](../../Features/devices/multi-device-platform/V1/implementation/PRD.md) |
| KRA eTIMS Integration | Fiscal | `preSoftware` — all phases not started | Yes | [PRD](../../Features/Fiscal/kra-etims-integration/V1/implementation/PRD.md) |
| 3-Audience Frontend (MultiTenancy) | MultiTenancy | `preSoftware` with Phase 1–3.1 partially done | Yes | [PRD](../../Features/MultiTenancy/3-AUDIENCE-PRD.md) |
| Event Expression Engine | NotificationAndAlarm | `notStarted` — 87 tasks across 4 phases, none begun | No | [PRD](../../Features/NotificationAndAlarm/EventExpressionEngine/PRD.md) |
| Alert Configuration | NotificationAndAlarm | `released` — all 31 tasks complete | No | [PRD](../../Features/NotificationAndAlarm/AlertConfiguration/V1/implementation/PRD.md) |
| Permission Standardization | Security | `inProgress` — Phases 0–3 done, Phases 4–7 pending ⚠️ | No | [PRD](../../Features/Security/PermissionStandardization/V1/implementation/PRD.md) |
| User Management V2 | UserManagement | `notStarted` — 25 tasks across 5 phases ⚠️ Domain change needed | No | [PRD](../../Features/UserManagement/V2/implementation/PRD.md) |
| Frontend Layout & Design Language | frontend-layout | `prd` — 6 phases (Tokens, Shell Unification, Error Handling, Lint, 3-Audience, Validation) | Yes | [PRD](../../Features/frontend-layout/shell-and-design-language/V1/implementation/PRD.md) |

To add a feature:
1. Ensure its per-feature PRD and TASKS exist under `Documentation/Features/...`.
2. Add an entry in `super-tasklist.json` → `features[]`.
3. Add `affectedProjects[]` entries when a feature touches multiple packages, apps, services, or tests.
4. (Optional) Add a row to this table if you want a markdown shortcut.

---

## 4. Cross-Cutting Concerns

These are program-wide initiatives that span multiple features. They are tracked separately under `crossCuttingInitiatives[]` in the JSON.

| Concern | Why it's cross-cutting |
|---|---|
| Multi-Tenancy enforcement | Every feature must respect `ITenantContext`. |
| Permission standardization | All controllers must use `User.HasClaim("permissions", "...")`. |
| Logging architecture | All projects use code-based Serilog config with `({SourceContext})`. |
| MySQL 5.5/5.6 compatibility | No `JSON` type, no `CURRENT_TIMESTAMP` defaults, no generated columns. |
| M365 Fluent UI | Replaces ad-hoc styling across pages. |

---

## 5. Phase Definitions

Phases map directly to the `phase` field in `super-tasklist.json`.

| Phase | Meaning |
|---|---|
| `discovery` | Problem framed, no PRD yet. |
| `prd` | PRD drafted, awaiting approval. |
| `planning` | PRD approved, TASKS.md being written. |
| `inProgress` | Code is being written; at least one milestone done. |
| `validation` | Feature complete in dev; under QA/UAT. |
| `released` | Deployed to production. |
| `maintenance` | Live; only bug-fix or enhancement work. |
| `preSoftware` | Created **after** the cutoff date (`2026-04-29`). Spec only. |
| `blocked` | Active phase is blocked by an external dependency. |

### Status legend (for individual tasks/milestones)

| Symbol | Status | Meaning |
|---|---|---|
| 🟢 | `done` | Complete and verified |
| 🟡 | `inProgress` | Actively being worked on |
| 🔴 | `blocked` | Cannot progress until a dependency clears |
| ⚪ | `preSoftware` | Spec only — not buildable yet |
| ⏸ | `notStarted` | Queued; no work begun |

---

## 6. Glossary

| Term | Definition |
|---|---|
| FMS | Tenacity Fleet Management System (this project). |
| PTS | Pump Tank System — fueling device family. |
| ATG | Automatic Tank Gauge — tank measurement device. |
| Provider | A `FMS.Devices.*` plugin implementing `IVehicleTrackingProvider` or `IFuelingDeviceProvider`. |
| Tenant | An isolated customer scope in the multi-tenant system. |
| Pre-software | A spec/PRD authored after the cutoff date, not yet backed by code. |
| Super PRD | This document — the program-level index. |
| Tracker | `Documentation/Architecture/ProjectManagemerPrograms/project-tracker.html` — the visual dashboard. |

---

*Tenacity FMS — Super PRD · Internal · Confidential*

<!--
File: README.md
Purpose: Index of all architecture diagrams for the Vehicle Trip Management module.
         Each diagram is a standalone Mermaid-based markdown file.
Dependencies: PRD.md, SERVICES_README.md, FRONTEND_PRD.md
Last Modified: 2026-03-12
-->

# Vehicle Trip Management — Architecture Diagrams

All diagrams use [Mermaid.js](https://mermaid.js.org/) syntax and render natively in GitHub, VS Code (with Markdown Preview), and Azure DevOps.

---

## Level 1 — System Context

| # | Diagram | Description |
|---|---------|-------------|
| 01 | [System Context (C4 Level 1)](01-system-context.md) | Vehicle Trip Management as a single box with external actors and systems |

## Level 2 — Container

| # | Diagram | Description |
|---|---------|-------------|
| 02 | [Container Diagram (C4 Level 2)](02-container-diagram.md) | Major containers: FMS API, React Frontend, GPSGate, MySQL, SignalR, Background Services |

## Level 3 — Component

| # | Diagram | Description |
|---|---------|-------------|
| 03 | [Backend Component Diagram (C4 Level 3)](03-backend-component-diagram.md) | Five pipeline layers inside the FMS API container |
| 04 | [Frontend Component Diagram (C4 Level 3)](04-frontend-component-diagram.md) | Three access points, shared services, hooks, SignalR connection |

## Level 4 — Code-Level

| # | Diagram | Description |
|---|---------|-------------|
| 05 | [Service Dependency Diagram](05-service-dependency-diagram.md) | Exact interface-level dependency map from Orchestration through to Audit |
| 06 | [Entity Relationship Diagram](06-entity-relationship-diagram.md) | Database tables, relationships, and nullable planning link fields |

## Sequence Diagrams

| # | Diagram | Description |
|---|---------|-------------|
| 07 | [Real-Time Trip Detection](07-seq-realtime-trip-detection.md) | GPS point → PreProcessor → State Machine → SignalR → Frontend |
| 08 | [End-of-Day Reconciliation](08-seq-end-of-day-reconciliation.md) | Nightly batch replay, compare, classify, persist |
| 09 | [Manual Override](09-seq-manual-override.md) | Operator action → Validation → Mutation → Audit Trail |
| 10 | [Recompute](10-seq-recompute.md) | User-triggered recompute through the full pipeline |
| 11 | [Geofence State Machine](11-seq-geofence-state-machine.md) | Point-by-point AT_SITE → DEPARTING → ARRIVING walkthrough |
| 12 | [Cluster Discovery](12-seq-cluster-discovery.md) | Progressive cluster creation and classification refinement |
| 13 | [Fuel Enrichment](13-seq-fuel-enrichment.md) | Trip legs → fuel attachment → confidence scoring → anomaly flags |

## State Machine Diagrams

| # | Diagram | Description |
|---|---------|-------------|
| 14 | [Geofence Detector States](14-state-geofence-detector.md) | AT_SITE / DEPARTING / ARRIVING with all transition conditions |
| 15 | [Cluster Detector States](15-state-cluster-detector.md) | AT_CLUSTER / IN_TRANSIT with stop detection and cluster matching |
| 16 | [Trip Lifecycle States](16-state-trip-lifecycle.md) | InProgress → Completed → Reconciled → Overridden → Superseded |

## Flow Diagrams

| # | Diagram | Description |
|---|---------|-------------|
| 17 | [Five-Layer Pipeline Flow](17-flow-five-layer-pipeline.md) | Master end-to-end flow from raw GPS to final trip records |
| 18 | [Movement Profile Decision Flow](18-flow-movement-profile-decision.md) | Vehicle → profile check → Geofence or Cluster engine |
| 19 | [Override Decision Flow](19-flow-override-decision.md) | Action → validation → approval gate → execute → audit |
| 20 | [Reconciliation Comparison Flow](20-flow-reconciliation-comparison.md) | Batch replay → align → compare → classify → persist |

## Data Flow Diagrams

| # | Diagram | Description |
|---|---------|-------------|
| 21 | [GPS Point Data Flow](21-dataflow-gps-point.md) | Raw GPSGate point through full processing pipeline to persistence |
| 22 | [Frontend Data Flow](22-dataflow-frontend.md) | API response → service → normalizer → React state → UI components |
| 23 | [SignalR Event Flow](23-dataflow-signalr-events.md) | Backend events → SignalR hub → frontend listener + polling fallback |

## Deployment / Infrastructure

| # | Diagram | Description |
|---|---------|-------------|
| 24 | [Deployment Diagram](24-deployment-diagram.md) | IIS, API, GPSGate, MySQL, Redis topology |
| 25 | [Background Job Topology](25-background-job-topology.md) | In-process vs scheduled vs on-demand service execution |

---

## Related Documentation

- [PRD.md](../implementation/PRD.md) — Product Requirements Document (five-layer pipeline specification)
- [SERVICES_README.md](../implementation/SERVICES_README.md) — Backend service descriptions and dependency map
- [FRONTEND_PRD.md](../implementation/FRONTEND_PRD.md) — Frontend architecture, pages, components, and gaps
- [IMPLEMENTATION_STATUS.md](../implementation/IMPLEMENTATION_STATUS.md) — Current implementation state
- [TASKLIST.md](../implementation/TASKLIST.md) — Task list aligned with five-layer architecture

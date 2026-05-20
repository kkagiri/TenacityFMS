# Tenancy, Operators, Users, Customers, and Roles

This document defines the people and security boundaries used by Tenacity FMS so architecture, product, and implementation work use the same words.

## Core Definitions

| Term | Meaning | Owns / Sees | Primary App |
|---|---|---|---|
| Platform Operator | Internal Tenacity user who manages the FMS platform across tenants. | All client tenants, platform configuration, onboarding, support, cross-tenant administration. | `apps/FMS.Admin` |
| Client Tenant | Paying company or reseller using FMS as its operating workspace. | Its own users, vehicles, sites, tanks, devices, roles, reports, and customer tenants. | `apps/fms.frontend` |
| Customer Tenant | Sub-tenant under a client tenant, usually a customer served by that client. | Only its assigned fleet, sites, reports, and permitted workflows. | `apps/fms.frontend` |
| User | Authenticated person scoped to one tenant and assigned one or more roles. | Data and actions allowed by tenant scope plus role permissions. | `apps/fms.frontend` or `apps/FMS.Admin` |
| Role | Named bundle of permission claims assigned to users. | No data by itself; grants actions through permission keys. | Admin / user management surfaces |
| Permission | Atomic action claim checked by API and UI. | Enables one command, query, page, or control. | Backend and frontend |

## System User Definitions

System users are the people who sign in to Tenacity FMS. Each user has one tenant context, one or more role assignments, and a business purpose. The user type below describes the person's operating context; it is not a permission by itself.

| User Type | Definition | Primary Outcomes | Default Tenant Scope | Primary Surfaces |
|---|---|---|---|---|
| Platform Admin | Tenacity internal administrator responsible for configuring and governing the SaaS platform. | Create platform settings, manage client tenants, configure global features, review platform health. | System scope; cross-tenant only through explicit platform permission. | `apps/FMS.Admin` |
| Support Operator | Tenacity internal support user who helps tenants resolve operational or configuration issues. | Inspect tenant setup, troubleshoot user access, verify device/provider status, assist onboarding. | System scope with time-bound or permission-gated tenant access. | `apps/FMS.Admin` |
| Compliance Auditor | Internal or approved audit user who reviews permissions, tenant isolation, fiscal activity, and privileged actions. | Confirm that permissions, audit logs, fiscal records, and cross-tenant actions are traceable. | Read-focused access to approved audit views; no normal operational changes. | `apps/FMS.Admin`, reports |
| Client Tenant Admin | Administrator for a paying client tenant or reseller. | Manage users, roles, sites, vehicles, tanks, devices, branding, and customer tenants. | Client tenant; may include child customer tenants through explicit workflows. | `apps/fms.frontend` admin pages |
| Fleet Manager | Client-side operations leader responsible for vehicles, tracking, trips, and fleet availability. | Monitor fleet status, assign or review trips, manage vehicle records, act on tracking exceptions. | Client tenant vehicles and permitted customer fleets. | `apps/fms.frontend`, dashboards, reports |
| Fuel Manager | Client-side user responsible for fueling workflows, pumps, dispensing, and fuel controls. | Monitor dispensing activity, review fuel transactions, manage fuel-related exceptions and controls. | Client tenant fueling sites, pumps, tanks, and permitted customer fuel data. | `apps/fms.frontend`, fueling modules |
| Tank Stock Manager | Client-side user responsible for stock movements, reconciliation, refills, and tank measurements. | Maintain accurate tank balances, review ATG readings, reconcile opening/closing stock, approve adjustments. | Client tenant tanks, sites, stock records, and permitted customer stock data. | `apps/fms.frontend`, tank stock modules |
| Maintenance User | Operations user who reviews asset condition, service needs, and maintenance-related vehicle activity. | Track vehicles needing attention, support uptime decisions, review maintenance-related reports. | Client tenant assets assigned by role permissions. | `apps/fms.frontend` |
| Dispatch or Trip Coordinator | Operations user who plans and monitors trips, tasks, and driver assignments. | Assign drivers, follow trip lifecycle, monitor task completion, escalate operational delays. | Client tenant trips, drivers, tasks, and permitted customer trips. | `apps/fms.frontend`, mobile-linked workflows |
| Driver Supervisor | User who manages drivers or field staff but is not necessarily a vehicle driver. | Review driver assignments, trip compliance, exceptions, and performance signals. | Client tenant drivers and assigned operational records. | `apps/fms.frontend` |
| Fuel Station Operator | Front-line user at a fueling site or depot who executes or monitors fueling activity. | Operate allowed fueling workflows, verify transactions, respond to pump or ATG alerts. | Assigned sites, pumps, tanks, and shift-level operational data. | `apps/fms.frontend` |
| Reports Manager | User responsible for operational, financial, compliance, or cross-tenant reports. | Build and review reports, compare tenants or customer groups when permitted, export approved data. | Tenant reports; cross-customer aggregation only through explicit reporting permission. | `apps/fms.frontend`, reporting |
| Viewer | Read-only user who needs visibility without command authority. | Monitor dashboards, lists, and reports without changing operational data. | Tenant-scoped read access only. | `apps/fms.frontend` |
| Customer Admin | Administrator for a customer tenant under a parent client. | Manage customer-scoped users and reports when enabled by the parent client. | Customer tenant only. | `apps/fms.frontend` |
| Customer Operator | Customer-side operational user who works with the fleet, reports, tasks, or sites assigned to that customer tenant. | Perform permitted day-to-day customer workflows without seeing parent or sibling data. | Customer tenant only. | `apps/fms.frontend`, `apps/fms.mobile` when applicable |
| Customer Viewer | Customer-side read-only user. | View branded dashboards, vehicles, notifications, and reports for their own customer tenant. | Customer tenant read access only. | `apps/fms.frontend` |
| Mobile Field User | Driver or field staff member using mobile workflows for trips, tasks, confirmations, or field updates. | Complete assigned work, submit status updates, and view only assigned operational context. | Assigned records inside the user's tenant. | `apps/fms.mobile` |
| Sales and Onboarding Operator | Tenacity internal user responsible for leads, subscriptions, plans, invoices, and customer provisioning. | Move prospects through onboarding, provision tenants, and manage subscription lifecycle. | Sales bounded context plus approved tenant-provisioning workflows. | `apps/FMS.Admin`, `FMS.Sales.Api` surfaces |

## User Type, Role, And Permission Relationship

| Concept | Answers | Example |
|---|---|---|
| User type | Who is this person in the business workflow? | Fuel Manager, Customer Viewer, Platform Admin |
| Tenant scope | Which organization's data can this person act on? | Client tenant, customer tenant, system scope |
| Role | What named access bundle did an admin assign? | Tenant Admin, Reports Manager, Viewer |
| Permission | Which exact action is allowed by code? | `_readVehicle`, `_createUser`, `_exportReport` |

User type should guide navigation, onboarding, documentation, and default role templates. Permissions remain the source of truth for enforcement.

## Tenant Hierarchy

```text
Platform / System Tenant
  |
  +-- Client Tenant A
  |     |
  |     +-- Customer Tenant A1
  |     +-- Customer Tenant A2
  |
  +-- Client Tenant B
        |
        +-- Customer Tenant B1
```

## Audience Rules

| Audience | Tenant Kind | Data Boundary | Typical Roles | Notes |
|---|---|---|---|---|
| Platform Operator | System | Cross-tenant by explicit platform permission only. | Platform Admin, Support Operator, Compliance Auditor. | Uses operator APIs and should be audited for cross-tenant access. |
| Client Admin | Client | Client tenant plus child customer tenants where explicitly allowed. | Tenant Admin, Fleet Manager, Fuel Manager, Reports Manager. | Creates users, roles, vehicles, sites, devices, and customer tenants. |
| Client User | Client | Client tenant only. | Driver Supervisor, Fuel Operator, Maintenance User, Viewer. | Operational user with role-limited access. |
| Customer Admin | Customer | Customer tenant only. | Customer Admin, Customer Reports Manager. | Can manage customer-scoped users and reports when enabled by the parent client. |
| Customer User | Customer | Customer tenant only. | Customer Viewer, Customer Operator. | Must never see sibling customer or parent client-only data unless specifically designed and approved. |

## Role And Permission Model

Roles are not tenants. A role only answers "what actions can this user perform?" Tenant context answers "which data can this user perform them against?"

| Layer | Responsibility |
|---|---|
| Tenant context | Applies `TenantId`, tenant kind, parent tenant, and cross-tenant rules. |
| Role assignment | Groups permissions for users inside a tenant. |
| Permission claim | Controls specific API endpoints, UI pages, buttons, and commands. |
| Audit log | Records privileged and cross-tenant actions. |

## Non-Negotiable Architecture Rules

1. A user must belong to a tenant.
2. A customer tenant must have one parent client tenant.
3. A platform operator can cross tenant boundaries only through explicit platform permissions.
4. Backend permission checks are authoritative; frontend checks are only for user experience.
5. Data queries must use tenant scope by default through `ITenantContext`.
6. Cross-tenant reporting must be explicit, permission-gated, and audited.
7. Role names can vary by tenant, but permission keys must remain consistent across backend, frontend, and database.

## Open Design Decisions

| Decision | Current Direction |
|---|---|
| Whether client admins can customize role names | Allowed, as long as permission keys remain canonical. |
| Whether customer admins can create users | Allowed only when parent client enables customer self-service. |
| Whether platform operators can impersonate users | Requires a separate audited design before implementation. |
| Whether parent client users can enter customer context | Allowed only through explicit customer-selection workflows and permission checks. |

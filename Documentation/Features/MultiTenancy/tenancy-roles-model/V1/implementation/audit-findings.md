# Phase 2 Audit Findings — Tenancy & Roles Model (Two-Tier Refactor)

> **Task:** 2.2 — Run [`scripts/postgres/audit-tenant-kinds.sql`](../../../../../../scripts/postgres/audit-tenant-kinds.sql) against the active database (read-only). Document findings.
> **Run date:** 2026-05-20
> **Environment:** developer PC — local Postgres container `fms-postgres-dev` (db `gpsdata`, user `postgres`). This is the authoritative environment for the current codebase; there is no separate production database to audit at this time.
> **Operator:** ProjectManager agent (via Copilot Chat) with user authorisation.

---

## Result

| Q | Section | Result |
|---|---|---|
| Q1 | Tenant counts by `tenant_kind` | 1 row — `System: 1 (1 active, 0 inactive)`. **No Client, no Customer rows.** |
| Q2 | Rows with `TenantKind = Customer (2)` | 0 rows |
| Q3 | Orphan Customer tenants | 0 rows |
| Q4 | Usage footprint per Customer tenant | 0 rows |
| Q5 | System tenant sanity | 1 row — `_platform` / `FMS Platform` / id `11111111-1111-1111-1111-111111111111`, active, created 2026-05-10 07:02:02+00. ✅ matches the seed in migration `20260510070202_AddTenantHierarchyAndBranding`. |
| Q6 | Self-referencing tenants | 0 rows |
| Q7 | **Phase 3 gate verdict** | **GREEN** — `customer_total = 0`. Phase 3 may proceed without a data migration. |

---

## Verdict

**GREEN.** Phase 2.3 (`migration-plan.md`) is not required because there are no `TenantKind = Customer` rows to collapse into `UserResourceScope`. The Phase 3 gate is therefore clear from a data-migration perspective.

Outstanding Phase 2 work:

- **2.4** — Run the `PermissionAudit` subagent and capture the canonical-vs-legacy permission baseline in `permission-baseline.md`. Independent of this audit; can run any time before Phase 4.

---

## Re-running

The audit is read-only (`BEGIN READ ONLY ... ROLLBACK`) and idempotent. Re-run before Phase 3.1 lands to confirm no `Customer` rows were introduced in the interim:

```powershell
Get-Content scripts\postgres\audit-tenant-kinds.sql -Raw `
    | docker exec -i fms-postgres-dev psql -U postgres -d gpsdata
```

If Q7 returns `RED` on a future run, Phase 3 is blocked until a fresh `migration-plan.md` is written and approved.

# Multi-Tenancy — Rollout Playbook

> **Status:** Phase 3 scaffold complete. Per-entity rollout pending.
> **Owner:** Platform team

This document is the operating manual for converting **TenacityFMS** from a single-tenant deployment (the original `Tenacity.FMS`) into a multi-tenant SaaS. The infrastructure is already wired; rolling each business entity onto the tenancy fabric is now an additive, low-risk task that can be staged across releases.

---

## 1. What is already in place

| Layer       | Component                                                      | Path                                                                                                                                                                                                                                                                    |
| ----------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Domain      | `ITenantOwned` marker interface                                | [FMS.Domain/Entities/Common/ITenantOwned.cs](../../../FMS.Domain/Entities/Common/ITenantOwned.cs)                                                                                                                                                                       |
| Domain      | `Tenant` root entity                                           | [FMS.Domain/Entities/Features/MultiTenancy/Tenant.cs](../../../FMS.Domain/Entities/Features/MultiTenancy/Tenant.cs)                                                                                                                                                     |
| Persistence | `TenantConfiguration` (EF mapping)                             | [FMS.Persistence/EntityConfigurations/Features/MultiTenancy/TenantConfiguration.cs](../../../FMS.Persistence/EntityConfigurations/Features/MultiTenancy/TenantConfiguration.cs)                                                                                         |
| Persistence | `DbSet<Tenant> Tenants`                                        | [FMS.Persistence/DataAccess/GpsdataContext.Tenancy.cs](../../../FMS.Persistence/DataAccess/GpsdataContext.Tenancy.cs)                                                                                                                                                   |
| Application | `ITenantContext` / `TenantContext`                             | [FMS.Application/Features/MultiTenancy/Services/ITenantContext.cs](../../../FMS.Application/Features/MultiTenancy/Services/ITenantContext.cs)                                                                                                                           |
| Application | `TenantSaveChangesInterceptor`                                 | [FMS.Application/Features/MultiTenancy/Services/TenantSaveChangesInterceptor.cs](../../../FMS.Application/Features/MultiTenancy/Services/TenantSaveChangesInterceptor.cs)                                                                                               |
| WebClient   | `TenantResolutionMiddleware`                                   | [FMS.WebClient/Middleware/TenantResolutionMiddleware.cs](../../../FMS.WebClient/Middleware/TenantResolutionMiddleware.cs)                                                                                                                                               |
| WebClient   | DI registration & `UseTenantResolution()` wired in pipeline    | [FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs](../../../FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs) · [FMS.WebClient/Extensions/FmsApplicationBuilderExtensions.cs](../../../FMS.WebClient/Extensions/FmsApplicationBuilderExtensions.cs) |
| Database    | Foundation migration (creates `tenant` table + default tenant) | [Documentation/Database/Migrations/2026-04-26-multitenancy-foundation.sql](../../Database/Migrations/2026-04-26-multitenancy-foundation.sql)                                                                                                                            |

### Pipeline order (request flow)

```
UseAuthentication()      ← validates JWT
UseAuthorization()       ← evaluates [Authorize] attributes
UseTenantResolution()    ← reads "tenant_id" claim → ITenantContext
UseRateLimiter()
UseUserActivity()
```

### How tenant id is propagated

1. Login issues a JWT containing claim `tenant_id` (Guid).
2. `TenantResolutionMiddleware` reads the claim and calls `ITenantContext.SetTenant(...)`.
3. `ITenantContext` is **scoped** — every service in the request graph sees the same value.
4. `TenantSaveChangesInterceptor` automatically stamps `TenantId` on any `Added` entity that implements `ITenantOwned` and has an empty TenantId.
5. EF global query filters (added per entity, see §3) ensure SELECTs are tenant-scoped.

---

## 2. Per-entity rollout — the 4-step recipe

For each business entity that must become tenant-owned:

### Step 1 — Domain

```csharp
public class Vehicle : ITenantOwned
{
    public Guid TenantId { get; set; }
    // … existing properties
}
```

### Step 2 — EF Configuration

```csharp
builder.Property(e => e.TenantId)
       .HasColumnName("TenantId")
       .HasColumnType("char(36)")
       .IsRequired();

builder.HasIndex(e => e.TenantId).HasDatabaseName("IX_vehicle_TenantId");

builder.HasOne<Tenant>()
       .WithMany()
       .HasForeignKey(e => e.TenantId)
       .OnDelete(DeleteBehavior.Restrict);
```

### Step 3 — Global query filter

In the entity's partial `OnModelCreating` (or in `GpsdataContext.Tenancy.cs`):

```csharp
modelBuilder.Entity<Vehicle>().HasQueryFilter(v =>
    v.TenantId == _tenantContext.TenantId);
```

> The DbContext must accept `ITenantContext` via constructor injection. EF Core's DI integration will resolve it per scope. The cached model becomes scoped — acceptable for our request volumes; switch to `IModelCacheKeyFactory` if profiling shows hot-path pressure.

### Step 4 — Database

Use the **rollout template** at the bottom of [2026-04-26-multitenancy-foundation.sql](../../Database/Migrations/2026-04-26-multitenancy-foundation.sql):

```sql
ALTER TABLE `vehicle` ADD COLUMN `TenantId` CHAR(36) NULL AFTER `Id`;
UPDATE `vehicle` SET `TenantId` = '00000000-0000-0000-0000-000000000001';
ALTER TABLE `vehicle` MODIFY COLUMN `TenantId` CHAR(36) NOT NULL;
ALTER TABLE `vehicle` ADD CONSTRAINT `FK_vehicle_tenant`
    FOREIGN KEY (`TenantId`) REFERENCES `tenant`(`Id`);
CREATE INDEX `IX_vehicle_TenantId` ON `vehicle`(`TenantId`);
```

Save each rollout under `Documentation/Database/Migrations/{date}-multitenancy-{entity}.sql`.

---

## 3. Rollout tiers

Migrate in tiers to keep risk bounded. Each tier should ship as its own release with regression testing.

| Tier              | Tables                                                                             | Notes                                                         |
| ----------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1 — Anchors       | `vehicle`, `site`, `user`, `asset`                                                 | High-impact reads; do these first to scope all child queries. |
| 2 — Transactions  | `fueltransaction`, `tankreconciliation`, `issue`, `vehicletransfer`, `tankstock_*` | Largest row counts; backfill in maintenance window.           |
| 3 — Configuration | `tankconfiguration`, `pumptransaction`, `notificationrule`, `eventexpression`      | Tenant-scoped settings.                                       |
| 4 — Audit / log   | `useractivity`, `audit_*`                                                          | Optional; can stay global for cross-tenant ops visibility.    |

---

## 4. Identity, claims, and onboarding

- The login endpoint must include `tenant_id` in the issued JWT. Suggested location: `JwtTokenGenerator.GenerateToken` (currently sets `nameid`, `role`, `permissions`).
- Tenant assignment for users is **not yet modelled**. Recommended: add `TenantId` to `AspNetUsers` (Tier 1 above) and resolve it during sign-in.
- Provisioning a new tenant is currently a manual `INSERT INTO tenant` followed by user assignment. A `TenantOnboardingService` should be added when the first second tenant is provisioned.

---

## 5. Operational guard-rails

- **Cross-tenant reads** — needed by support tooling — require either:
  - bypassing the filter via `dbSet.IgnoreQueryFilters()`, or
  - resolving an "admin" tenant context that returns `Guid.Empty`.
- **Background services** that have no HTTP request must explicitly call `tenantContext.SetTenant(...)` for the tenant they are processing on behalf of.
- **Migrations** that touch tenant-owned tables must always include the FK and composite index, otherwise query plans degrade quickly.

---

## 6. What is intentionally not done in Phase 3

To keep the foundation patch-sized and low-risk, the following were deliberately **left for Tier-1 release**:

- No Domain entity has been mutated to implement `ITenantOwned` yet.
- No global query filter has been registered on existing entities.
- No `TenantId` claim is yet emitted by `JwtTokenGenerator`.
- No background service has been retrofitted to call `SetTenant`.

The **scaffold is complete and the build is intact** — Tier 1 work can begin in any branch without further infrastructure changes.

-- =====================================================================
-- Migration:   2026-05-10 — Tenant hierarchy + branding
-- Purpose:     Adds tenant hierarchy + branding columns to `tenant`:
--                - tenant_kind          (int, default 1 = Client)
--                - parent_tenant_id     (uuid, nullable, self-FK)
--                - logo_url             (varchar 512, nullable)
--                - primary_color        (varchar 16, nullable)
--                - secondary_color      (varchar 16, nullable)
--              Backfills existing rows as TenantKind = Client (1).
--              Seeds the reserved "_platform" system tenant.
--
-- Pairs with EF migration:
--   FMS.Persistence/Migrations/20260510070202_AddTenantHierarchyAndBranding.cs
--
-- Database:    PostgreSQL (Npgsql provider, snake_case naming)
-- Tier:        Multi-tenancy hierarchy (Phase 1 of 3-Audience Architecture)
-- =====================================================================

BEGIN;

-- 1. Schema: add the five new columns.
ALTER TABLE tenant
    ADD COLUMN IF NOT EXISTS tenant_kind      integer                NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS parent_tenant_id uuid                   NULL,
    ADD COLUMN IF NOT EXISTS logo_url         character varying(512) NULL,
    ADD COLUMN IF NOT EXISTS primary_color    character varying(16)  NULL,
    ADD COLUMN IF NOT EXISTS secondary_color  character varying(16)  NULL;

-- 2. Index for hierarchy lookups.
CREATE INDEX IF NOT EXISTS ix_tenant_parent_tenant_id
    ON tenant (parent_tenant_id);

-- 3. Self-FK with Restrict on delete (sub-tenants cannot orphan their parent).
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_tenant_tenant_parent_tenant_id'
    ) THEN
        ALTER TABLE tenant
            ADD CONSTRAINT fk_tenant_tenant_parent_tenant_id
            FOREIGN KEY (parent_tenant_id) REFERENCES tenant (id)
            ON DELETE RESTRICT;
    END IF;
END $$;

-- 4. Backfill existing tenants as Client (kind=1). Skip the platform tenant.
UPDATE tenant
SET tenant_kind = 1
WHERE tenant_kind = 0
  AND code <> '_platform';

-- 5. Seed the reserved system tenant. Idempotent.
INSERT INTO tenant (id, code, name, is_active, tenant_kind, created_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    '_platform',
    'FMS Platform',
    TRUE,
    0,                  -- TenantKind.System
    NOW()
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- =====================================================================
-- Rollback
-- =====================================================================
-- BEGIN;
-- DELETE FROM tenant WHERE id = '11111111-1111-1111-1111-111111111111' AND code = '_platform';
-- ALTER TABLE tenant DROP CONSTRAINT IF EXISTS fk_tenant_tenant_parent_tenant_id;
-- DROP INDEX IF EXISTS ix_tenant_parent_tenant_id;
-- ALTER TABLE tenant
--     DROP COLUMN IF EXISTS secondary_color,
--     DROP COLUMN IF EXISTS primary_color,
--     DROP COLUMN IF EXISTS logo_url,
--     DROP COLUMN IF EXISTS parent_tenant_id,
--     DROP COLUMN IF EXISTS tenant_kind;
-- COMMIT;

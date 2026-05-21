-- =============================================================================
-- File:          2026-05-20-user-resource-scope-and-branding-extensions.sql
-- Purpose:       SQL mirror for EF migration AddUserResourceScopeAndBrandingExtensions.
-- Dependencies:  PostgreSQL, existing tenant and user tables.
-- Last Modified: 2026-05-20
-- =============================================================================

BEGIN;

ALTER TABLE tenant
    ADD COLUMN IF NOT EXISTS display_name character varying(255) NULL,
    ADD COLUMN IF NOT EXISTS email_sender character varying(255) NULL,
    ADD COLUMN IF NOT EXISTS footer_text character varying(1000) NULL,
    ADD COLUMN IF NOT EXISTS site_terminology integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS support_contact character varying(255) NULL;

CREATE TABLE IF NOT EXISTS user_resource_scope (
    id uuid NOT NULL,
    user_id character varying(100) NOT NULL,
    resource_kind integer NOT NULL,
    resource_id character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    created_by character varying(100) NOT NULL,
    CONSTRAINT pk_user_resource_scope PRIMARY KEY (id),
    CONSTRAINT fk_user_resource_scope_user_user_id
        FOREIGN KEY (user_id) REFERENCES "user" (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_user_resource_scope_user_id_resource_kind
    ON user_resource_scope (user_id, resource_kind);

COMMIT;
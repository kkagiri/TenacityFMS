# PostgreSQL Migration Variants

This folder contains PostgreSQL migrations for the multi-tenancy rollout.

## Identity Table Naming

Not every PostgreSQL environment uses the same Identity table names.

Legacy schema:

- `roles`
- `rolepermissions`

Identity-vnext schema:

- `"AspNetRoles"`
- `role_permissions`

## Current Split Migration

For the 3-audience permission seed, use exactly one forward script and its matching rollback:

Legacy schema:

- `2026-05-10-three-audience-permissions.sql`
- `2026-05-10-three-audience-permissions.rollback.sql`

Identity-vnext schema:

- `2026-05-10-three-audience-permissions.identity-vnext.sql`
- `2026-05-10-three-audience-permissions.identity-vnext.rollback.sql`

## Selection Query

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('roles', 'rolepermissions', 'AspNetRoles', 'role_permissions')
order by table_name;
```

## Rule For New Identity-Related Seed Scripts

If a PostgreSQL seed or migration script touches Identity role/user tables, do one of these:

1. Ship both variants: the default legacy script plus an `identity-vnext` companion.
2. State clearly in the header that the script only supports one schema shape and why.

Use the same naming pattern:

- `feature-name.sql`
- `feature-name.rollback.sql`
- `feature-name.identity-vnext.sql`
- `feature-name.identity-vnext.rollback.sql`

Today, the active migration folder only needed this split for the 3-audience permission seed. Reuse the same pattern for later PostgreSQL identity-table migrations.

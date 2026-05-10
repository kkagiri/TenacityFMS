---
description: "Use when writing, updating, or reviewing FMS backend API tests, controller tests, CQRS handler tests, integration tests, authorization tests, tenant isolation tests, JWT/session tests, pagination/filtering tests, rate-limit tests, and FMSResponse assertions."
name: "FMS API Testing Rules"
applyTo:
  - "tests/FMS.Testing/**/*.cs"
  - "apps/FMS.WebClient/Controllers/**/*.cs"
  - "apps/FMS.WebClient/Attributes/**/*.cs"
  - "apps/FMS.WebClient/Middleware/**/*.cs"
  - "packages/FMS.Application/Features/**/*.cs"
---

# FMS API Testing Rules

Use these rules when adding or reviewing tests for HTTP APIs, API-facing CQRS handlers, auth/session behavior, tenancy, and API response contracts.

## Test Project Conventions

- Put backend tests under `tests/FMS.Testing/`, grouped by feature or concern, such as `MultiTenancy/`, `Devices/`, `IntegrationTests/`, or `{FeatureName}/`.
- Use xUnit `[Fact]` tests by default. Use `[Theory]` only when a compact set of inputs exercises the same behavior.
- New test files must include the standard file header with purpose, dependencies, and last modified date.
- Before treating a test as complete, verify it is actually compiled by `tests/FMS.Testing/FMS.Testing.csproj`. Some legacy folders are excluded with `<Compile Remove=...>`; do not place new tests inside excluded paths unless the project file is updated intentionally.
- Keep tests deterministic: no production database, live Redis, real external services, real email, or wall-clock-sensitive assertions unless the task explicitly calls for an integration environment.

## API Contract Coverage

- New or changed API endpoints should have tests for the successful path and the main failure paths: validation, unauthorized, forbidden, not found, conflict, and system error where practical.
- Assert both HTTP status code and response envelope. New API bodies should use `FMSResponse` / `FMSResponse<T>`; tests should verify `IsSuccess`, `Data`, messages/errors, and validation error lists where relevant.
- For list endpoints, test the standard pagination envelope fields: `items`, `page`, `pageSize`, `totalCount`, `totalPages`.
- For filters, test at least: no filter, one matching filter, no-match filter, and combined filters when the endpoint supports them.
- For sorting, test default ordering and one explicit sort when sorting is exposed.

## Authorization and Permission Tests

- Any endpoint with `[Authorize]` or `[RequirePermission]` should have negative coverage for missing/invalid auth and missing permissions when the test level can exercise HTTP behavior.
- Permission-sensitive tests must use real permission names from `Permissions.cs`; do not invent ad hoc strings.
- Operator APIs must test that client/customer JWTs cannot access operator surfaces and that `_platform` system-tenant users with platform permissions can.
- Security-sensitive cross-tenant lookups should assert `404` when existence must be hidden, not `403`.

## JWT, Refresh Session, and Claims

- JWT tests should decode the emitted token and assert exact claim names and values, following the style in `MultiTenancy/JwtTenantClaimsTests.cs`.
- Tenant claims to cover when affected: `tenant_id`, `tenant_kind`, `parent_tenant_id`, `is_platform_operator`.
- Assert `is_platform_operator` is absent or false for non-`_platform` tenants. Do not accept role-only evidence as platform authorization.
- Login and refresh-token tests should assert the standard payload shape: `Token`, `RefreshToken`, `User` inside `FMSResponse`.

## Tenant Isolation Tests

- Tenant-owned reads must include at least two tenant IDs in the fixture data and assert that a request scoped to Tenant A never sees Tenant B rows.
- Mutation tests should verify tenant stamping on create and cross-tenant mutation rejection, following the pattern in `Devices/ProviderConfigRepositoryTenantFilterTests.cs`.
- Cross-tenant bypass tests must prove the bypass only works for platform operators and only where `[AllowCrossTenant]` is intended.
- Do not use `IgnoreQueryFilters()` in tests except when explicitly testing admin/operator bypass behavior.

## Pagination, Filtering, and Boundary Cases

- Test one-based paging: `page=1` returns the first page and invalid/low page values are clamped or rejected according to the endpoint contract.
- Test `pageSize` bounds, including too-small and too-large values.
- For date filters, use fixed UTC timestamps and assert local-time conversion is not performed in backend logic.
- For comma-separated ID filters, test valid lists, mixed invalid values, empty values, and whitespace trimming.

## Rate Limit Tests

- Login, token refresh, invite, export, bulk import, and expensive report endpoints require explicit named rate-limit policies. Tests or configuration assertions should verify the policy is attached before the task is marked complete.
- Prefer testing policy registration/metadata rather than relying on slow repeated-request loops.
- Rate-limit tests should assert the endpoint does not leak tenant/user existence details through rejection messages.

## Test Infrastructure

- Prefer EF Core InMemory with a unique database name per test class or test method for application/query handler tests.
- Use Moq for collaborator boundaries such as `ILogger<T>`, external services, email senders, cache, and provider clients.
- Dispose DbContexts and other disposable resources. Avoid shared mutable static state.
- Seed only the rows needed for the behavior under test; keep fixtures readable and close to the test.
- When testing handlers, call the handler directly. When testing routing, auth, middleware, or filters, use an HTTP/integration-style test harness.

## Assertions and Naming

- Test names should describe behavior: `Method_condition_expectedResult`, matching existing patterns like `Token_includes_tenant_id_and_kind_for_client_user`.
- Prefer explicit assertions over snapshots or broad object equality when response contracts matter.
- Assert no data leakage with `Assert.All(...)` or exact ID sets, not only counts.
- Avoid tests that merely assert mocks were called unless the call is the behavior being protected.

## When Not to Add Tests

- Do not add broad regression tests for unrelated legacy behavior while making a narrow API change.
- Do not revive tests in excluded legacy folders as part of unrelated work.
- If an endpoint depends on missing infrastructure, add a focused lower-level handler/service test and note the remaining integration gap in the final response.

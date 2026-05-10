---
description: "Use when designing, creating, or reviewing FMS HTTP APIs, controllers, API clients, endpoint routes, REST resource naming, API versioning, pagination, filtering, JWT authentication, refresh-session handling, rate limiting, permission checks, and FMSResponse error consistency."
name: "FMS API Design Rules"
applyTo:
  - "apps/FMS.WebClient/Controllers/**/*.cs"
  - "apps/FMS.WebClient/Attributes/**/*.cs"
  - "apps/FMS.WebClient/Middleware/**/*.cs"
  - "packages/FMS.Application/Features/**/*.cs"
  - "packages/FMS.Application/Common/**/*.cs"
  - "apps/FMS.Admin/src/api/**/*.ts"
  - "apps/fms.frontend/src/api/**/*.js"
  - "apps/fms.frontend/src/services/**/*.js"
---

# FMS API Design Rules

Follow these rules for every new or edited API surface. Prefer existing local patterns over inventing new conventions.

## Resource Naming

- Model endpoints as resources, not UI actions. New endpoints must use lowercase plural resource nouns for collections and sub-resources: `/api/v1/operator/tenants`, `/api/v1/issuetracker/templates`.
- Use HTTP verbs for CRUD: `GET` list/detail, `POST` create, `PUT` or `PATCH` update, `DELETE` delete/deactivate when deletion is real.
- Use action segments only for domain commands that are not normal CRUD, such as `/refresh-token`, `/change-password`, `/invite-admin`, `/validate-delete`.
- Keep route casing stable and lowercase where new endpoints are created. Do not create duplicate aliases with different casing.
- Legacy singular/cased routes may remain for compatibility, but do not copy that style into new APIs.
- For operator-only cross-tenant APIs, place endpoints under `/api/v1/operator/...` and require platform permissions.

## Versioning

- Backend routes must include the URL version prefix `api/v1`. Use `ApiVersions.Routes.V1_BASE` or existing controller route patterns where practical.
- Do not introduce a new version (`v2`, etc.) unless the contract is intentionally breaking and the old version remains supported.
- Frontend API clients must respect their app's axios base URL convention:
  - `fms.frontend`: call controller paths without `/api`; the interceptor adds `v1` when needed.
  - `FMS.Admin`: call versioned paths relative to the configured API base, such as `/v1/operator/tenants`.

## Pagination, Filtering, and Sorting

- List endpoints that can grow must support pagination with query parameters: `page`, `pageSize`.
- Use one-based `page` values. Clamp invalid values server-side: `page >= 1`, `pageSize` within a safe maximum.
- Return the standard paged envelope: `{ items, page, pageSize, totalCount, totalPages }`. Existing DTOs may wrap this shape, but new list endpoints must expose these fields consistently.
- Filtering belongs in query parameters, not ad hoc path segments: `?search=`, `?tenantKind=`, `?isActive=`, `?from=`, `?to=`.
- Parse comma-separated ID lists with `StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries` and ignore invalid values instead of throwing when partial input is recoverable.
- Keep filtering and paging in Application queries/handlers when possible. Controllers should map HTTP parameters into CQRS requests and return the result.

## Authentication and Session Handling

- Secure APIs with JWT bearer auth unless the endpoint is explicitly public: `[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]`.
- Login and token refresh endpoints may use `[AllowAnonymous]`, but must return the standard token payload shape: `Token`, `RefreshToken`, `User` inside `FMSResponse`.
- User-facing APIs must validate permissions with `[RequirePermission(...)]` or an existing permission guard. Frontend permission checks are UX only.
- Operator APIs require `_platform` system-tenant identity, platform permissions, and `[AllowCrossTenant]` only when the endpoint must bypass tenant filters.
- Emit `is_platform_operator = true` only for users in the `_platform` system tenant. Never infer platform access from role name alone.
- Extract user IDs from `ClaimTypes.NameIdentifier` or `sub`, validate GUIDs when a GUID is required, and avoid trusting request-body user IDs for the actor.

## Rate Limiting

- Do not bypass the global rate limiter pipeline.
- Login, token refresh, invite, export, bulk import, and expensive report endpoints must use explicit named ASP.NET Core rate-limit policies before the task is considered complete.
- Prefer named ASP.NET Core rate-limit policies over custom sleep/throttle logic inside controllers.
- When rate limiting rejects a request, keep the response contract consistent and avoid leaking tenant/user existence details.

## Error Response Consistency

- Return `FMSResponse` / `FMSResponse<T>` for API success, validation, and error bodies. Do not return anonymous `{ message }` shapes from new endpoints unless an existing framework contract requires it.
- Map response/error types to HTTP status codes consistently:
  - Validation or model-state errors: `400 BadRequest(FMSResponse.ValidationFailed(...))`
  - Auth failure: `401 Unauthorized(FMSResponse.Failed(...))`
  - Permission failure: `403 Forbid()` unless the endpoint intentionally hides existence
  - Missing resource: `404 NotFound(FMSResponse.Failed(...))`
  - Conflict/duplicate: `409 Conflict(FMSResponse.Failed(...))`
  - Unexpected failure: `500 StatusCode(..., FMSResponse.SystemError(...))`
- For cross-tenant or security-sensitive lookups, return `404` instead of `403` when revealing endpoint/resource existence is unsafe.
- Model-state errors should be flattened into a string list and returned via `FMSResponse<T>.ValidationFailed(errors)`.
- Do not expose raw exception details to clients except in clearly local development-only diagnostics. Log details with `ILogger<T>` and return a safe message.

## Controller Shape

- Prefer thin controllers: validate HTTP concerns, map route/query/body values, call MediatR, return `FMSResponse` with the right status code.
- Put commands in `Features/{Domain}/Commands/` and queries in `Features/{Domain}/Queries/`; keep command/query and handler in the same file when tightly coupled.
- Put API DTOs in `Features/{Domain}/DTOs/`, one DTO per file unless the DTO is a tiny private controller request record.
- Add file documentation headers to new files and keep files under the 600-line limit.

## Client API Calls

- Keep API URL construction centralized in service/client modules. Components should call service functions, not inline axios requests for shared endpoints.
- Normalize backend response envelopes at the API-client boundary, so pages consume predictable data shapes.
- Preserve JWT/refresh-token storage conventions already used by the app being edited; do not introduce a second session model in the same frontend.

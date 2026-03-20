# Security Documentation — Current Status

**Last Updated**: 2026-03-20
**Scope**: Repository security controls, permission hardening, and operational follow-up status

---

## Current Status Summary

| Area                                    | Status                        | Notes                                                                                                                    |
| --------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Repository secret-protection guardrails | ✅ Implemented                | Example config files, `.gitignore` updates, and git hooks are documented and present in the repo.                        |
| Backend permission hardening            | ✅ Implemented for Phases 1-3 | Centralized permission constants, runtime DB permission checks, and controller protection are in place.                  |
| Database permission fix scripts         | 🟡 Prepared                   | SQL scripts exist under Permission Standardization, but execution against the live database is not recorded in the repo. |
| Frontend/mobile permission retrieval    | ✅ Implemented                | Clients fetch current-user permissions from `GET /api/v1/Permission/me`.                                                 |
| Frontend permission constants mirror    | 🟡 Partial                    | Backend constants exist; dedicated frontend constants standardization is still tracked as pending.                       |
| Operational credential rotation         | ⚠️ Unverified in repo         | Audit and checklist documents identify the required actions, but execution must be confirmed outside source control.     |
| Git history cleanup for old secrets     | ⚠️ Unverified in repo         | Current tracking protections exist; full history rewrite is still a manual operational step unless separately confirmed. |
| Full security regression testing        | 🟡 Pending                    | Role-matrix and end-to-end validation are still tracked as remaining work.                                               |

---

## What Is Already Done

### 1. Runtime permission enforcement is active

The backend now uses database-driven permission checks instead of relying only on JWT-embedded permission claims.

- Backend attribute: [FMS.WebClient/Attributes/RequirePermissionAttribute.cs](../../../FMS.WebClient/Attributes/RequirePermissionAttribute.cs)
- Authorization filter: [FMS.WebClient/Attributes/PermissionAuthorizationFilter.cs](../../../FMS.WebClient/Attributes/PermissionAuthorizationFilter.cs)
- Permission service: [FMS.Infrastructure/Services/PermissionAuthorizationService.cs](../../../FMS.Infrastructure/Services/PermissionAuthorizationService.cs)

Current behavior:

- Protected endpoints use `[RequirePermission(...)]`
- Permission evaluation is done against the database at runtime
- User permissions are cached in memory for 15 minutes per user
- API responses return `403` with required permission names when access is denied

### 2. Backend permission constants were centralized

- Constants file: [FMS.Application/Common/Constants/PermissionConstants.cs](../../../FMS.Application/Common/Constants/PermissionConstants.cs)

This is the current source of truth for backend permission names used by controllers.

### 3. Controller-level security hardening was completed

The permission hardening work documented under Permission Standardization shows:

- Magic-string permission usage largely replaced with constants
- Previously unprotected active controllers now have permission protection
- Inline permission checks were reduced in favor of `[RequirePermission]`

Primary implementation tracking documents:

- [Documentation/Features/Security/PermissionStandardization/V1/implementation/TASKLIST.md](PermissionStandardization/V1/implementation/TASKLIST.md)
- [Documentation/Features/Security/PermissionStandardization/V1/implementation/PRD.md](PermissionStandardization/V1/implementation/PRD.md)

### 4. Frontend and mobile permission loading is implemented

Permissions are fetched after login from `GET /api/v1/Permission/me`.

- Frontend action: [fms.frontend/src/redux/actions/permissionActions.js](../../../fms.frontend/src/redux/actions/permissionActions.js)
- Frontend hook: [fms.frontend/src/hooks/usePermissions.js](../../../fms.frontend/src/hooks/usePermissions.js)
- Mobile slice: [fms.mobile/src/redux/slices/authSlice.js](../../../fms.mobile/src/redux/slices/authSlice.js)

### 5. JWT handling was tightened

The JWT generator documents that permissions are no longer relied on as the primary authorization source.

- JWT generator: [FMS.Application/Infrastructure/Services/Authentication/JwtTokenGenerator.cs](../../../FMS.Application/Infrastructure/Services/Authentication/JwtTokenGenerator.cs)

Current design:

- Authentication uses JWT bearer tokens
- Authorization uses the database-backed permission service
- Clients fetch permissions explicitly from `/api/v1/Permission/me`

### 6. Repository guardrails for secret handling are present

From the original remediation work, the repository contains:

- Security pre-commit hook: [.githooks/pre-commit](../../../.githooks/pre-commit)
- Hook installers: [scripts/setup-git-hooks.ps1](../../../scripts/setup-git-hooks.ps1), [scripts/setup-git-hooks.sh](../../../scripts/setup-git-hooks.sh)
- Example config templates such as [FMS.WebClient/appsettings.example.json](../../../FMS.WebClient/appsettings.example.json)

These protect future commits, but they do not by themselves prove that old credentials were rotated or that historical git exposure was removed.

---

## Still Pending or Needs Verification

### Operational tasks not verifiable from source control

These items were identified in the audit/remediation documents and should be treated as requiring separate confirmation:

- Rotation of previously exposed passwords and API keys
- Production/server environment variable rollout
- Git history cleanup for previously committed secrets
- Post-remediation verification audit

### Permission standardization tasks still open

Per the current task tracking:

- Phase 4 — database permission renaming is not started
- Phase 5 — SQL scripts are created, but live execution is not confirmed
- Phase 6 — frontend permission constants mirror is not started
- Phase 7 — full test matrix and role validation are not completed

---

## Document Guide

| File                                                                                                                                               | Purpose                                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [Documentation/Features/Security/SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)                                                               | Historical audit of exposed secrets and repository risks recorded on 2025-11-05.                    |
| [Documentation/Features/Security/IMMEDIATE_ACTION_CHECKLIST.md](IMMEDIATE_ACTION_CHECKLIST.md)                                                     | Historical urgent operational response checklist for credential rotation and environment hardening. |
| [Documentation/Features/Security/REMEDIATION_SUMMARY.md](REMEDIATION_SUMMARY.md)                                                                   | Summary of repository remediation actions plus a current-state addendum.                            |
| [Documentation/Features/Security/PermissionStandardization/V1/implementation/PRD.md](PermissionStandardization/V1/implementation/PRD.md)           | Design and scope for permission-system standardization.                                             |
| [Documentation/Features/Security/PermissionStandardization/V1/implementation/TASKLIST.md](PermissionStandardization/V1/implementation/TASKLIST.md) | Detailed execution status for controller protection and permission migration work.                  |

---

## Recommended Reading Order

1. Start with [Documentation/Features/Security/README.md](README.md)
2. Review [Documentation/Features/Security/REMEDIATION_SUMMARY.md](REMEDIATION_SUMMARY.md)
3. Review [Documentation/Features/Security/PermissionStandardization/V1/implementation/TASKLIST.md](PermissionStandardization/V1/implementation/TASKLIST.md)
4. Use [Documentation/Features/Security/SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) only as the historical finding record

---

## Bottom Line

**Done in code/repo**:

- Permission hardening foundation is implemented
- Runtime authorization is database-driven
- Most controller protection work is complete
- Client permission retrieval is implemented
- Secret-protection guardrails for future commits are in place

**Not yet proven in repo**:

- Live credential rotation
- Live database permission migration execution
- Historical git secret removal
- Full validation across all roles and environments

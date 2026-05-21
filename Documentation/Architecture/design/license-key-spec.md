# License Key Specification

Self-hosted instances of Tenacity FMS are activated and constrained by a signed license key. This spec defines the format, payload, validation flow, expiry behavior, and runtime enforcement.

SaaS deployments do not use license keys — they read entitlements from Tenacity's subscription billing. Both modes are unified behind an `ILicenseProvider` abstraction so business code asks the same questions in either deployment.

---

## Goals

1. Tamper-proof. Customers cannot edit limits, expiry, or features.
2. Offline-verifiable. No network call required to validate a license.
3. Revocable. Optional check-in lets Tenacity flag compromised or unpaid licenses.
4. Graceful expiry. Read-only mode, never a lockout of admins.
5. Same business logic as SaaS. Feature gates and limits are queried through the same interface in both modes.

---

## Format

License keys are issued as **JWS (JSON Web Signature)** strings signed with **RS256** (Tenacity holds the private key; instances embed the public key).

```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkxJQyJ9.<payload>.<signature>
```

Rationale: JWS is a stable, well-supported standard in .NET (`System.IdentityModel.Tokens.Jwt`). RS256 is universally available and the keys can be rotated by shipping a new public key with the next product release. Ed25519 / EdDSA is a valid alternative if smaller keys and signatures matter; the rest of the spec is unchanged either way.

---

## Payload Schema

```json
{
  "license_id": "LIC-2026-0001",
  "customer": "Hyoung & Co (EA) Ltd",
  "instance_id": "hyoung-prod-01",
  "issued_at": "2026-05-01T00:00:00Z",
  "expires_at": "2027-05-01T00:00:00Z",
  "edition": "Enterprise",
  "limits": {
    "max_client_tenants": 1,
    "max_users": 50,
    "max_sites": 25,
    "max_vehicles": 1000,
    "max_machine_identities": 10
  },
  "features": [
    "gps_tracking",
    "fuel_audit",
    "cross_site_reporting",
    "advanced_calibration",
    "trip_detection",
    "monthly_report"
  ],
  "branding": {
    "white_label_allowed": true
  },
  "check_in": {
    "url": "https://license.tenacity.com/checkin",
    "interval_days": 7,
    "required": false
  },
  "support_contact": "support@tenacity.com"
}
```

| Field | Purpose | Notes |
|---|---|---|
| `license_id` | Tenacity reference | Format `LIC-YYYY-NNNN` |
| `customer` | Display name | Shown in `Admin → License` |
| `instance_id` | Binds the license to one deployment | Set at first activation; subsequent runs must match |
| `issued_at`, `expires_at` | Validity window | UTC ISO 8601 |
| `edition` | Marketing label | Not used for gating; gating is by `features` |
| `limits` | Hard caps enforced at creation time | See enforcement below |
| `features` | Explicit feature gate keys | Source of truth for `IFeatureGate` |
| `branding.white_label_allowed` | Whether `BrandingConfig` can be edited | See branding-provider-spec.md |
| `check_in` | Optional revocation endpoint | If `required = true`, missed check-in moves license to Grace |
| `support_contact` | Shown to admins | Branded per BrandingConfig in white-label deployments |

---

## Storage

| Location | Purpose |
|---|---|
| `license.key` on disk | Original JWS string. Survives database resets; bootstraps the system if DB is empty. |
| `License` table in DB | Parsed payload + status. Source of truth at runtime. Updated by daily revalidation. |
| Public key | Embedded in `FMS.Licensing` assembly as a resource. Rotated by shipping a new release. |

### License table

```sql
CREATE TABLE License (
  Id GUID PRIMARY KEY,
  LicenseKey TEXT NOT NULL,          -- original JWS
  Payload JSON NOT NULL,             -- parsed for queries
  Status VARCHAR(20) NOT NULL,       -- Active | Grace | Expired | Revoked
  ExpiresAt DATETIME NOT NULL,
  GraceUntil DATETIME,
  LastValidatedAt DATETIME NOT NULL,
  LastCheckInAt DATETIME,
  AppliedAt DATETIME NOT NULL,
  AppliedByUserId GUID NOT NULL
);
```

Only one license row is active at a time; previous licenses are kept for audit.

---

## Activation Flow

1. **First boot.** No license in DB. App boots into "Activation Pending" mode — only `/admin/license` and authentication endpoints respond.
2. **Admin applies the license.** Pastes the JWS string into the activation page or uploads `license.key`.
3. **Validation.**
   - Verify JWS signature against the embedded public key.
   - Check `issued_at <= now <= expires_at`.
   - Check `instance_id` matches the local instance ID (or is unset → bind on first apply).
4. **Persist.** Write to disk and DB. Emit audit event `license.applied`.
5. **Unlock.** App leaves Activation Pending; normal routes respond.

License renewal follows the same flow; the previous row is marked superseded.

---

## Revalidation and Check-in

A hosted background service revalidates daily:

1. Re-verify the JWS signature (catches tampering after activation).
2. Recompute `Status` from `expires_at` and `GraceUntil`.
3. If `check_in.url` is set and `check_in.interval_days` has elapsed: POST a heartbeat.

Heartbeat payload:

```json
{
  "license_id": "LIC-2026-0001",
  "instance_id": "hyoung-prod-01",
  "version": "1.4.2",
  "active_users": 47,
  "active_sites": 8,
  "timestamp": "2026-05-20T12:00:00Z"
}
```

Tenacity response can carry a **revocation signal**:

```json
{ "revoked": true, "reason": "non_payment" }
```

Revoked → `Status = Revoked`. Behaviour matches Expired (read-only mode).

If `check_in.required = true` and check-in fails for 14 consecutive days → `Status = Grace`. App stays functional but admin sees a banner.

---

## Expiry Behaviour

| Status | Behaviour |
|---|---|
| **Active** | Full functionality. |
| **Grace** | Full functionality. Admin sees a warning banner. Default grace = 14 days post-`expires_at`, or 14 days of failed required check-ins. |
| **Expired** | Read-only mode. Existing data viewable. No new transactions, no new entities. Authentication and `/admin/license` always work so a new license can be applied. |
| **Revoked** | Same as Expired. Admin sees an explicit revocation message. |

The app **never** locks out admins. A lockout would prevent applying a renewal.

---

## Limits Enforcement

Limits are checked at creation time, in command handlers, before persistence:

```csharp
public class CreateUserHandler : IRequestHandler<CreateUserCommand, Result<Guid>>
{
    private readonly ILicenseService _license;
    private readonly IUserRepository _users;

    public async Task<Result<Guid>> Handle(CreateUserCommand cmd, CancellationToken ct)
    {
        var limit = _license.Current.Limits.MaxUsers;
        var count = await _users.CountActiveAsync(cmd.TenantId, ct);
        if (count >= limit)
            return Result.Fail($"User limit ({limit}) reached. Renew to add more users.");

        // ... continue with creation
    }
}
```

Soft warnings are shown to admins at 80% capacity. Hard rejection at 100%.

In SaaS mode, the same handlers call `ILicenseService` but get values from the `SaasSubscriptionProvider`. No code change between modes.

---

## Feature Gates

```csharp
public interface IFeatureGate
{
    bool IsEnabled(string feature);
    void RequireEnabled(string feature);  // throws if disabled
}
```

Used at module entry points:

```csharp
[Authorize(Permissions = "report.crosscustomer.read")]
public async Task<IActionResult> CrossSiteReport(CrossSiteReportQuery query)
{
    _features.RequireEnabled("cross_site_reporting");
    return Ok(await _mediator.Send(query));
}
```

Feature keys are stable strings. The license payload's `features` array is the source of truth in self-hosted; SaaS subscription records carry the equivalent list.

---

## Provider Abstraction

```csharp
public interface ILicenseProvider
{
    LicenseInfo Current { get; }
    Task<Result> ApplyAsync(string licenseString, CancellationToken ct);
    Task RevalidateAsync(CancellationToken ct);
    event EventHandler<LicenseStatusChangedEventArgs> StatusChanged;
}

public sealed class LicenseInfo
{
    public string LicenseId { get; init; }
    public string Customer { get; init; }
    public LicenseStatus Status { get; init; }
    public DateTime ExpiresAt { get; init; }
    public LicenseLimits Limits { get; init; }
    public IReadOnlySet<string> Features { get; init; }
}
```

Two implementations:

| Implementation | Used in | Source |
|---|---|---|
| `SelfHostedLicenseProvider` | Self-hosted | `License` table + `license.key` file |
| `SaasSubscriptionProvider` | SaaS | Tenacity subscription service, cached per tenant |

DI binds the correct one at startup based on `appsettings.json → Deployment.Mode`.

---

## Audit Events

All license events write to the audit log:

- `license.applied` — license activated, with `license_id` and `applied_by`
- `license.renewed` — superseding license applied
- `license.status_changed` — Active → Grace → Expired → Revoked transitions
- `license.checkin_failed` — heartbeat failure
- `license.tamper_detected` — JWS signature failure on revalidation (rare; usually means a manually edited license file)

---

## Open Decisions

| Decision | Direction |
|---|---|
| Public key rotation | New key shipped with each major release. Old keys retained for one major version for backward compatibility. |
| What happens if license file and DB disagree | DB wins. License file is bootstrap only. Disagreement after first activation logs `license.tamper_detected` and falls back to DB. |
| Whether feature flags are versioned | Yes. Feature keys are append-only. Removed features are kept as no-ops to maintain backward compatibility with old licenses. |
| Per-feature seat caps | Deferred. Current model: per-instance limits only. |
| Offline-only deployments | `check_in.required = false` and `check_in.url` empty supports fully air-gapped use. |

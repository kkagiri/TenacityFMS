# IBrandingProvider Specification

`IBrandingProvider` resolves the active `BrandingConfig` at request time so that no part of the product UI, email template, or API response hardcodes "Tenacity" or any specific term like "Site" vs "Branch".

The provider has two implementations — one for each deployment mode — but the rest of the codebase asks the same question regardless: *"what's the current branding?"*

---

## Goals

1. No hardcoded brand strings anywhere in UI or templates.
2. SaaS resolves per-tenant; self-hosted resolves per-instance.
3. Site terminology (Site / Branch / Station / Depot / Yard) is display-only — never affects code, database, API, or permission keys.
4. Cheap to resolve. Branding is read on almost every request; cache aggressively.
5. Localization-ready. Terminology fields support multiple languages.

---

## BrandingConfig Schema

```csharp
public sealed class BrandingConfig
{
    public string DisplayName { get; init; } = "Tenacity FMS";
    public string LogoLightUrl { get; init; }
    public string LogoDarkUrl { get; init; }
    public string PrimaryColor { get; init; } = "#0078D4";
    public string Domain { get; init; }
    public BrandingEmail Email { get; init; }
    public BrandingSupport Support { get; init; }
    public BrandingTerminology Terminology { get; init; }
    public string FooterHtml { get; init; }
    public string LegalText { get; init; }
}

public sealed class BrandingEmail
{
    public string SenderName { get; init; }
    public string SenderAddress { get; init; }
    public string ReplyTo { get; init; }
}

public sealed class BrandingSupport
{
    public string Email { get; init; }
    public string Phone { get; init; }
    public string PortalUrl { get; init; }
}

public sealed class BrandingTerminology
{
    public string Site { get; init; } = "Site";    // "Branch", "Station", "Depot", "Yard"
    public string Sites { get; init; } = "Sites";
    public IReadOnlyDictionary<string, BrandingTerminology> Localized { get; init; }
}
```

The default terminology is English. `Localized` is keyed by IETF language tag (`en`, `sw`, `fr`, `am`).

Database table:

```sql
CREATE TABLE BrandingConfig (
  Id GUID PRIMARY KEY,
  Scope VARCHAR(20) NOT NULL,        -- 'Instance' | 'Tenant'
  TenantId GUID,                     -- null for Scope='Instance'
  Payload JSON NOT NULL,
  UpdatedAt DATETIME NOT NULL,
  UpdatedByUserId GUID NOT NULL
);

CREATE UNIQUE INDEX UX_BrandingConfig_Tenant
  ON BrandingConfig(Scope, TenantId);
```

Only one row per scope at any time. Historical edits go to `BrandingConfigHistory` for audit.

---

## Interface

```csharp
public interface IBrandingProvider
{
    Task<BrandingConfig> ResolveAsync(CancellationToken ct = default);
}
```

`ResolveAsync` returns the effective `BrandingConfig` for the **current request context**. It implicitly depends on `ITenantContext` for SaaS and on instance settings for self-hosted, so callers do not pass tenant IDs explicitly.

### Two implementations

| Implementation | Used in | Resolution |
|---|---|---|
| `InstanceBrandingProvider` | Self-hosted | Reads the single `Scope='Instance'` row. Cached in memory for the process lifetime; invalidated when the row is updated. |
| `TenantBrandingProvider` | SaaS | Reads `Scope='Tenant'` for the current `ITenantContext.TenantId`. Falls back to `Scope='Instance'` defaults if no tenant override exists. Cached per tenant. |

DI registration:

```csharp
if (deploymentMode == DeploymentMode.SelfHosted)
    services.AddSingleton<IBrandingProvider, InstanceBrandingProvider>();
else
    services.AddScoped<IBrandingProvider, TenantBrandingProvider>();
```

`InstanceBrandingProvider` is a singleton (one branding, whole instance). `TenantBrandingProvider` is scoped because it depends on `ITenantContext`, which is request-scoped.

---

## Resolution Rules

| Scenario | Returned |
|---|---|
| SaaS, tenant has a `BrandingConfig` row | That tenant's config. |
| SaaS, tenant has no override | Instance default (Tenacity branding or reseller default). |
| Self-hosted, branding row exists | That row. |
| Self-hosted, no row yet | Built-in Tenacity defaults. |
| `BrandingConfig.WhiteLabelAllowed` is false in license | Edits to branding are rejected; the read still returns the (default) config. |

White-label is gated by the license payload's `branding.white_label_allowed`. If false, the admin UI hides the branding edit page and the API rejects mutations with `403 license.white_label_disabled`. Reads always succeed.

---

## Caching

Branding is read on almost every request — UI shell, page titles, email templates. Cache aggressively.

| Provider | Cache key | Invalidation |
|---|---|---|
| `InstanceBrandingProvider` | None — single value held in memory | On `BrandingConfig.Update` command, the in-memory value is replaced. |
| `TenantBrandingProvider` | `TenantId` | On update for that tenant, the entry is evicted. Defaults to a 5-minute TTL as a safety net. |

Invalidation is broadcast via SignalR or RabbitMQ in multi-node SaaS deployments. Self-hosted single-node has no broadcast needed.

---

## UI Hydration

The React app loads branding once on session start and stores it in a `BrandingContext`.

`GET /api/branding/current` returns:

```json
{
  "displayName": "Hyoung Fleet",
  "logoLightUrl": "/branding/logo-light.svg",
  "logoDarkUrl": "/branding/logo-dark.svg",
  "primaryColor": "#1F4E79",
  "terminology": {
    "site": "Site",
    "sites": "Sites"
  },
  "support": {
    "email": "support@hyoung.co.ke",
    "phone": "+254 700 000 000"
  }
}
```

Usage in components:

```jsx
const { terminology, displayName } = useBranding();

return (
  <div>
    <h1>{displayName}</h1>
    <th>{terminology.site}</th>     {/* renders "Site", "Branch", "Station"... */}
  </div>
);
```

**Forbidden in components:** any literal string `"Tenacity"`, `"Site"`, `"Branch"`, `"Station"`, `"Depot"` used as a display label. A lint rule enforces this — see Linting below.

---

## Email Templates

Existing Handlebars templates already render through `jsreport`. Branding is injected as a `Brand` partial:

```handlebars
<head>
  <title>{{Brand.DisplayName}} - {{ReportTitle}}</title>
</head>
<body>
  <header style="background:{{Brand.PrimaryColor}}">
    <img src="{{Brand.LogoLightUrl}}" alt="{{Brand.DisplayName}}" />
  </header>
  ...
  <footer>
    Need help? {{Brand.Support.Email}} - {{Brand.Support.Phone}}
    {{{Brand.FooterHtml}}}
  </footer>
</body>
```

The template renderer injects `Brand` from `IBrandingProvider.ResolveAsync()` at render time, so each rendered template uses the active branding for that tenant or instance.

Email subject lines and sender addresses come from the same provider:

```csharp
var brand = await _branding.ResolveAsync(ct);

await _mailer.SendAsync(new EmailMessage
{
    From = new MailAddress(brand.Email.SenderAddress, brand.Email.SenderName),
    Subject = $"[{brand.DisplayName}] Monthly Fleet Report - {period}",
    ...
});
```

---

## Site Terminology Rules

Restating the rule from the tenancy doc, explicitly for engineering:

| Surface | Term used |
|---|---|
| Database table names, columns | `Site`, `SiteId` |
| API URLs | `/api/sites`, `/api/sites/{id}` |
| JSON keys | `siteId`, `sites` |
| Permission keys | `site.read`, `site.create` |
| Audit log entries | `Site` |
| Error messages (technical) | `Site` |
| UI display labels | `BrandingConfig.Terminology.Site` (resolved) |
| User-facing error messages | `BrandingConfig.Terminology.Site` (resolved) |
| Email body text | `BrandingConfig.Terminology.Site` (resolved) |

A developer writing `<span>Branch</span>` directly in JSX is a bug. So is a backend message like `"Branch not found"`. The backend says `"Site not found"`; the frontend presents that error with the configured terminology if appropriate.

---

## Linting

To enforce no-hardcoded-brand and no-hardcoded-terminology:

**Frontend (ESLint custom rule):** forbid string literals matching `/\b(Tenacity|Branch|Station|Depot|Yard)\b/` in JSX text and string props. Whitelist: test files, branding admin pages, comments.

**Backend (Roslyn analyzer):** forbid the same set of strings in any `string` literal in `*.cs` files outside `Tenacity.Branding.*` namespaces. CI fails the build on violation.

These are nuisance rules but they catch terminology drift before it ships.

---

## Admin UI

Two pages, both gated by `branding.update` permission and the license check:

- **`/admin/branding`** — edit display name, colors, logos, support contact, terminology overrides. Live preview.
- **`/admin/branding/localized`** — edit translations for terminology keys per language.

Update writes one row to `BrandingConfig` (one per scope), copies the previous row to `BrandingConfigHistory`, and emits `branding.updated` audit event with the diff.

---

## Open Decisions

| Decision | Direction |
|---|---|
| Custom domain SSL provisioning in SaaS | Out of scope for v1. Customers can use `tenant.tenacity.com` style subdomains; full custom domains deferred. |
| Per-page branding (e.g., a different login screen for customer-facing portals) | Deferred. Single branding per scope for now. |
| Bulk terminology export / import | Yes, support JSON import/export for translations. |
| Whether `Tenacity` defaults are removable in self-hosted | If `white_label_allowed = true`, yes — admin can fully replace. Otherwise the Tenacity-branded defaults stay. |
| Theme tokens (full design system overrides) | Deferred. Primary color is the only token in v1; full token overrides come later. |

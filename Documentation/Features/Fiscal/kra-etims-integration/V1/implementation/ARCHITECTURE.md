# Architecture — KRA eTIMS Integration

| Item    | Value                                           |
| ------- | ----------------------------------------------- |
| Domain  | fiscal                                          |
| Feature | kra-etims-integration                           |
| Version | V1                                              |
| Pattern | Multi-provider plugin (mirrors `FMS.Devices.*`) |
| Related | [PRD.md](./PRD.md) · [TASKS.md](./TASKS.md)     |

> **Source-of-truth specs:** all KRA payload shapes, field lengths, code lists, and endpoint names MUST come from the PDFs in `Documentation/KRA_intergration/`. This document defines **how FMS structures the integration**, not what KRA's API looks like.

---

## 1. Why a separate project family (and not a separate repo, and not inside `FMS.Devices.*`)

| Option                            | Verdict | Reason                                                                                                       |
| --------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| Separate Git repo                 | ❌      | Cross-process orchestration with sales; tenancy/auth/logging would have to be re-implemented; release drift. |
| Inside `FMS.Devices.Fueling`      | ❌      | eTIMS is a tax/fiscal compliance integration tied to **sales**, not telemetry. Conflates two domains.        |
| New `FMS.Fiscal.*` project family | ✅      | Same multi-provider **pattern** as devices, but its own domain seam.                                         |

The shape (Abstractions / Core / Vendor plugin / Optional Host) is identical to `FMS.Devices.*` so anyone who has worked on devices can navigate it instantly.

---

## 2. Project layout

```
FMS.Fiscal.Abstractions/                   ← interfaces, canonical envelopes, attributes
   Common/
      FiscalProviderAttribute.cs
      FiscalCapabilities.cs                (flags: SignInvoice, RegisterItem, RegisterCustomer,
                                            CreditNote, StockMovement, ZReport, OfflineQueue, ...)
      FiscalProviderMetadata.cs
      FiscalCountry.cs / FiscalMode.cs
   Sales/
      IFiscalProvider.cs
      FiscalInvoice.cs / FiscalLine.cs / FiscalCustomer.cs / FiscalTax.cs
      FiscalSigningResult.cs / FiscalSigningError.cs
   Notifications/
      InvoiceSignedNotification.cs         (MediatR INotification)
      InvoiceSigningFailedNotification.cs

FMS.Fiscal.Core/                           ← registry, factory, repos, outbox processor
   Registry/
      FiscalProviderRegistry.cs
      FiscalProviderFactory.cs             (per-tenant resolver)
   Persistence/
      IFiscalProviderConfigRepository.cs
      IFiscalSigningRecordRepository.cs
      IFiscalSigningQueueRepository.cs
      (implementations apply WHERE TenantId = ITenantContext.TenantId automatically)
   Outbox/
      FiscalSigningOutboxProcessor.cs      (BackgroundService)
   Orchestration/
      IFiscalOrchestrator.cs
      FiscalOrchestrator.cs                (resolves OSCU vs VSCU, calls provider, persists result)
   DependencyInjection/
      AddFiscalCore.cs

FMS.Fiscal.Kra/                            ← THE plugin for V1
   Providers/Kra/
      KraFiscalProvider.cs                 ([FiscalProvider("KRA", Country=KE, Mode=...)])
      Oscu/
         OscuHttpClient.cs                 (Polly retry, redacted logging)
         OscuEndpoints.cs                  (selectInitOsdcInfo, saveItem, saveTrnsSalesOsdc, ...)
         OscuPayloadSerializer.cs
      Vscu/
         VscuLocalClient.cs                (talks to local VSCU agent)
      Mapping/
         InvoiceToKraPayloadMapper.cs      (FiscalInvoice -> KRA payload)
         KraResponseToCanonicalMapper.cs   (KRA response -> FiscalSigningResult)
      Codes/
         KraClassificationCache.cs         (HS codes, tax categories, payment types)
         KraCodeListSyncer.cs              (selectCodeList / selectItemClsList sync)
      Auth/
         KraDeviceInitializer.cs           (initial device registration; cmcKey caching)
         KraSecretsProtector.cs            (encrypts/decrypts Settings TEXT)
      DependencyInjection/
         KraServiceCollectionExtensions.cs (AddFiscalKra() — wired from AddFiscalProviders())

FMS.Fiscal.Vscu.Host/                      ← OPTIONAL — only deployed at branches that use VSCU
   Program.cs                              (Windows Service worker)
   VscuLocalAgentBridge.cs                 (HTTP listener that the WebClient or branch box calls)
   Logging/
      VscuLoggingConfiguration.cs          (C:\Logs\FMS.Fiscal.Vscu\)

FMS.Application/Features/Fiscal/           ← BUSINESS LOGIC (no transport, no payloads)
   Commands/
      SignSaleInvoiceCommand.cs            (command + handler in same file)
      VoidSignedInvoiceCommand.cs
      RegisterFiscalItemCommand.cs
      RegisterFiscalCustomerCommand.cs
      RetryFiscalSigningCommand.cs
      ConfigureFiscalProviderCommand.cs    (admin)
   Queries/
      GetFiscalSigningStatusQuery.cs
      GetFiscalProvidersQuery.cs
      GetFiscalSigningRecordQuery.cs
      GetFiscalSigningQueueQuery.cs
   DTOs/
      FiscalProviderConfigDto.cs
      FiscalSigningRecordDto.cs
      FiscalSigningQueueItemDto.cs
   Services/
      IFiscalReceiptService.cs / FiscalReceiptService.cs   (assembles printable receipt model)
   Validators/
      ConfigureFiscalProviderValidator.cs
      SignSaleInvoiceValidator.cs
   Notifications/
      SaleCompletedFiscalHandler.cs        (subscribes to existing SaleCompletedNotification)
      InvoiceSignedFiscalHandler.cs        (drives audit log, SignalR push, receipt render)

FMS.WebClient/Controllers/Fiscal/
   FiscalProvidersController.cs            ([Authorize] _Read_/ _Manage_FiscalProvider)
   FiscalSigningController.cs              (status, retry, reprint)

fms.frontend/src/pages/fiscal/             ← Frontend (M365 Fluent design)
   FiscalProvidersMain.js
   components/
      FiscalProviderList.js
      FiscalProviderForm.js
      FiscalSigningStatus.js
      SignedReceiptPreview.js
   dataservice/
      fiscalProviderApi.js                 (/api/v1/fiscal/providers)
      fiscalSigningApi.js                  (/api/v1/fiscal/signing)
   redux/slices/
      fiscalSlice.js
```

### Hard rules (mirror `FMS.Devices.*` §13.2)

| ✅ DO                                                                      | ❌ DON'T                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Add new country provider under `FMS.Fiscal.<Country>/Providers/...`.       | Add fiscal/KRA code in `FMS.Application/Communication` or `FMS.Infrastructure`. |
| Decorate provider with `[FiscalProvider("Name", Country=..., Mode=...)]`.  | Manually wire providers in `Program.cs`.                                        |
| Branch on `provider.Capabilities.HasFlag(...)`.                            | Compare `provider.Name == "KRA"`.                                               |
| Inject `IFiscalProvider` resolved per-tenant via `IFiscalProviderFactory`. | Inject `IKraFiscalProvider` directly outside the plugin.                        |
| Read provider config via `IFiscalProviderConfigRepository`.                | Query `fiscal_provider_configurations` directly with EF.                        |
| Store tenant data using `ITenantContext.TenantId`.                         | Cross-tenant access without `IBypassTenancy`.                                   |
| Read KRA spec PDFs before writing payload code.                            | Invent KRA field names or guess code lists.                                     |

---

## 3. Runtime sequence (sale → signed receipt)

### 3.1 OSCU (online) happy path

```
Cashier closes sale
        │
        ▼
SaleCompletedNotification (existing MediatR notification raised by sales pipeline)
        │
        ▼
SaleCompletedFiscalHandler  ─── enqueues ──▶ SignSaleInvoiceCommand (MediatR)
        │
        ▼
SignSaleInvoiceCommandHandler
   │ resolves provider via IFiscalOrchestrator
   │   └─ IFiscalProviderFactory.Resolve(tenantId, branchId)  → KraFiscalProvider (Mode=OSCU)
   │ maps Invoice -> FiscalInvoice -> KRA payload
   │ provider.SignAsync(invoice)
   │   └─ OscuHttpClient.PostAsync(saveTrnsSalesOsdc, payload)   [Polly: 3 retries]
   │ on success:
   │   ├─ persist fiscal_signing_records (Status=Signed)
   │   ├─ patch invoice with CU Invoice No / signature / QR / signedAt
   │   └─ raise InvoiceSignedNotification
   │ on transient failure:
   │   ├─ persist fiscal_signing_records (Status=Pending)
   │   └─ enqueue fiscal_signing_queue
        │
        ▼
InvoiceSignedFiscalHandler
   ├─ writes audit log
   ├─ pushes SignalR event to branch dashboard
   └─ frontend renders receipt with QR
```

### 3.2 VSCU (local agent) happy path

Same flow but the provider Mode is `VSCU`. `KraFiscalProvider` routes to `VscuLocalClient` which posts to `http://localhost:<port>` (the `FMS.Fiscal.Vscu.Host` agent on the branch box). The agent signs locally; FMS persists the result identically.

### 3.3 Outbox / retry

```
FiscalSigningOutboxProcessor (BackgroundService, runs in WebClient or its own host)
   loop:
      take rows where NextAttemptAtUtc <= now AND Attempt < Max
      for each: provider.SignAsync(...) again
         on success: update record + dequeue
         on fail:    backoff 30s → 2m → 10m → 30m → 1h → 6h → alert via Event Expression Engine
```

---

## 4. Tenancy model

- All fiscal tables carry `TenantId CHAR(36) NOT NULL`.
- Repositories implement automatic `WHERE TenantId = ITenantContext.TenantId` (same pattern as `FMS.Devices.Core/Persistence`).
- A tenant in Kenya can have **multiple branches**, each with its own `fiscal_provider_configurations` row (own KRA PIN/branch ID/device ID and its own OSCU vs VSCU mode).
- Branch == Site in FMS naming (locked decision).

---

## 5. Configuration & secrets

- KRA `cmcKey`, certs, and base URLs live encrypted in `fiscal_provider_configurations.Settings` (TEXT).
- Encryption uses the existing FMS secrets provider (same one used for other provider credentials).
- System-wide toggles + thresholds live in `systemconfigurations` (see PRD §8).
- No KRA URL or PIN is ever hardcoded in code or `appsettings.json`.

---

## 6. Logging

Add categories in `FmsLoggingConfiguration.cs` (WebClient) — text format with `({SourceContext})`:

| Folder        | SourceContext match                                 | Retention |
| ------------- | --------------------------------------------------- | --------- |
| `fiscal/`     | `FMS.Fiscal.*`, `FMS.Application.Features.Fiscal.*` | 14 days   |
| `fiscal-kra/` | `FMS.Fiscal.Kra.*`                                  | 14 days   |

`FMS.Fiscal.Vscu.Host` mirrors PTS host pattern under `C:\Logs\FMS.Fiscal.Vscu\` with `app/`, `errors/`, `signing/`, `sync/`, `startup/`.

Sensitive fields (PIN, cmcKey, full cert blobs, customer PII beyond PIN) are redacted via a `KraSensitiveFieldsRedactor` enricher before sinks see them.

---

## 7. Permissions

Added in `Permissions.cs` and seeded into the `permissions` MySQL table:

`_Read_FiscalProvider`, `_Manage_FiscalProvider`, `_Read_FiscalSigningStatus`, `_Retry_FiscalSigning`, `_Read_FiscalReceipt`, `_Reprint_FiscalReceipt`, `_Sync_FiscalItem`, `_Sync_FiscalCustomer`.

Frontend uses `usePermissions()` (JWT-based), backend uses `User.HasClaim("permissions", "_X")`. Frontend checks are UX only — backend enforces.

---

## 8. Frontend integration points

- New navigation entries under **Admin** group (via Navigation Management UI, NOT direct SQL):
  - `/admin/fiscal-providers` — `_Read_FiscalProvider`
  - `/admin/fiscal-signing-status` — `_Read_FiscalSigningStatus`
- `Content.js` adds two routes per page (base + wildcard) per AGENTS.md §7.
- `app-routes.js` adds component cases.
- Receipt component on the existing sale receipt page renders signing block + QR (using `qrcode.react` or existing QR helper).
- All UI uses M365 Fluent classes (`m365-page-header`, `m365-section-group`, `m365-input`, `m365-btn--primary`, ...) and `tw-` Tailwind prefix.

---

## 9. Boundaries — what touches what

| Layer                              | May reference                                               | May NOT reference                            |
| ---------------------------------- | ----------------------------------------------------------- | -------------------------------------------- |
| `FMS.Fiscal.Abstractions`          | (only stdlib + MediatR for `INotification`)                 | Persistence, Application, WebClient, KRA SDK |
| `FMS.Fiscal.Core`                  | Abstractions, Persistence, Domain                           | KRA-specific code, vendor SDKs               |
| `FMS.Fiscal.Kra`                   | Abstractions, Core, Persistence (read provider config only) | Application/Features, WebClient              |
| `FMS.Application/Features/Fiscal/` | Abstractions, Core (services/orchestrator only)             | KRA HTTP client, OSCU payloads, VSCU bridge  |
| `FMS.Application/Features/Sales`   | Raises `SaleCompletedNotification` only                     | Direct fiscal calls                          |
| `FMS.WebClient/Controllers/Fiscal` | Application/Features, MediatR                               | Direct EF queries against fiscal tables      |
| `FMS.Fiscal.Vscu.Host`             | Abstractions, Core, KRA Vscu pieces                         | Application, WebClient                       |

The Domain layer (`FMS.Domain/`) is **not** modified by this feature in V1 — the new entities live in `FMS.Persistence/Entities/Fiscal/` (or wherever the team standardises) with EF entity configs in `FMS.Persistence/EntityConfigurations/Fiscal/`. If a Domain change becomes necessary (e.g. adding fiscal fields onto an existing `Invoice` entity), follow AGENTS.md §1.6 and request explicit approval first.

---

## 10. Multi-country future (UG / TZ / RW)

When a new country is added:

1. Create `FMS.Fiscal.<Country>` project.
2. Add `Providers/<CountryAuthority>/` with `<X>FiscalProvider.cs` decorated `[FiscalProvider("EFRIS", Country="UG", Mode=...)]`.
3. Implement only the capabilities that authority supports.
4. Register via `<X>ServiceCollectionExtensions.cs` called from `AddFiscalProviders()`.
5. Add per-tenant `fiscal_provider_configurations` rows.
6. Zero changes in `FMS.Application/Features/Fiscal/` (capability-flag branching only).

---

## 11. Testing strategy

- **Mapper unit tests** — captured KRA request samples per call (per spec PDF appendix). One test per OSCU endpoint we use.
- **Outbox tests** — simulate KRA 5xx; assert retry schedule, no double-signing, idempotency key respected.
- **Tenant filter tests** — repository reads return only the active tenant's rows (mirrors `ProviderConfigRepositoryTenantFilterTests`).
- **End-to-end smoke** — sandbox KRA OSCU: register item → create customer → sign sale → fetch z-report.
- **VSCU smoke** — local agent on dev box, simulated branch payload, signing latency p95.
- **Conformance** — every `[FiscalProvider]` class must (a) register, (b) expose metadata, (c) declare ≥1 capability, (d) honour `ITenantContext`.

---

## 12. Deployment

- WebClient picks up `FMS.Fiscal.Core` + `FMS.Fiscal.Kra` automatically (DI scan via `[FiscalProvider]`).
- `FMS.Fiscal.Vscu.Host` deployed only to branches running VSCU mode; install/uninstall scripts mirror `FMS.PTS.WindowsService` Scripts.
- Outbox processor runs in WebClient by default; can be split into a `FMS.Fiscal.Outbox.Host` worker if load demands.

---

## 13. References

- KRA spec PDFs: `Documentation/KRA_intergration/`.
- Devices PRD/Tasks (architectural blueprint): `Documentation/Features/devices/multi-device-platform/V1/implementation/`.
- AGENTS.md: §1.4, §1.6, §1.9 (CQRS), §3 (backend), §4 (frontend), §6 (logging), §9 (system config), §10 (Fluent design), §13 (devices pattern reference).

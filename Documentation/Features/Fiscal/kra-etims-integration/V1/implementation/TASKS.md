# Tasks — KRA eTIMS Integration V1

> Tracks implementation of the [PRD](./PRD.md) and [ARCHITECTURE](./ARCHITECTURE.md).
> Anchors `🧪 X.Y` reference PRD §11.X acceptance criteria.
> Read the relevant PDF in `Documentation/KRA_intergration/` before any task that touches KRA payloads.

Legend: `[ ]` open · `[x]` done · ⛓ depends-on · 🧪 verification anchor · 📄 KRA PDF section to consult

---

## Phase 0 — Spec ingestion & approval (1 sprint)

- [ ] **T0.1** Read all four PDFs in `Documentation/KRA_intergration/`. Produce a one-pager listing every endpoint we will call in V1, with field-level mapping notes from FMS Invoice → KRA payload. 📄 OSCU spec, TIS.
- [ ] **T0.2** Confirm OSCU sandbox + production base URLs and onboarding steps with KRA. 📄 Sign-up guide. 🧪 -
- [ ] **T0.3** Validate void / credit-note flow against current FMS sales void command. Update PRD §FR-8 + §13.1. ⛓ T0.1
- [ ] **T0.4** Confirm fuel SKU classification codes (PMS / AGO / IK / lubricants) with finance + KRA reference list. 📄 OSCU `selectItemClsList`.
- [ ] **T0.5** Architecture sign-off on this folder structure. ⛓ T0.1
- [ ] **T0.6** Decide outbox host: WebClient BackgroundService for V1, or dedicated `FMS.Fiscal.Outbox.Host` later. ⛓ T0.5

---

## Phase 1 — Foundations (1 sprint)

- [ ] **T1.1** Create `FMS.Fiscal.Abstractions` project (TFM `net8.0`); add to `Tenacity.Fms.sln` and `Tenacity.Fms.sln`. ⛓ T0.5
- [ ] **T1.2** Define in `FMS.Fiscal.Abstractions/Common/`: `FiscalProviderAttribute`, `FiscalCapabilities` flags, `FiscalProviderMetadata`, `FiscalCountry`, `FiscalMode`. ⛓ T1.1
- [ ] **T1.3** Define in `FMS.Fiscal.Abstractions/Sales/`: `IFiscalProvider`, `FiscalInvoice`, `FiscalLine`, `FiscalCustomer`, `FiscalTax`, `FiscalSigningResult`, `FiscalSigningError`. ⛓ T1.1
- [ ] **T1.4** Define `InvoiceSignedNotification` and `InvoiceSigningFailedNotification` MediatR `INotification` types. ⛓ T1.1
- [ ] **T1.5** Create `FMS.Fiscal.Core` project; reference Abstractions + Persistence + Domain. ⛓ T1.1
- [ ] **T1.6** Implement `FiscalProviderRegistry` + `FiscalProviderFactory` (per-tenant resolver). ⛓ T1.5
- [ ] **T1.7** Implement repositories (`IFiscalProviderConfigRepository`, `IFiscalSigningRecordRepository`, `IFiscalSigningQueueRepository`) with automatic `WHERE TenantId = ITenantContext.TenantId` filter. ⛓ T1.5
- [ ] **T1.8** Implement `IFiscalOrchestrator` + `FiscalOrchestrator` in Core. ⛓ T1.6, T1.7
- [ ] **T1.9** Implement `FiscalSigningOutboxProcessor : BackgroundService`. ⛓ T1.7
- [ ] **T1.10** `AddFiscalCore()` DI extension in `FMS.Fiscal.Core/DependencyInjection`. ⛓ T1.6
- [ ] **T1.11** EF entity configs in `FMS.Persistence/EntityConfigurations/Fiscal/` for: `FiscalProviderConfigurationEntity`, `FiscalSigningRecordEntity`, `FiscalSigningQueueEntity`, `FiscalItemRegistrationEntity`, `FiscalCustomerRegistrationEntity`. MySQL 5.6 safe (no `JSON`, no `CURRENT_TIMESTAMP`). ⛓ T1.5 🧪 11.10
- [ ] **T1.12** Register entities on `GpsdataContext`. ⛓ T1.11
- [ ] **T1.13** **HANDOFF — User action**: `dotnet ef migrations add AddFiscalSchema --project FMS.Persistence --startup-project FMS.WebClient`, review, then `dotnet ef database update`. ⛓ T1.12
- [ ] **T1.14** Tenant-filter unit tests for the three new repositories under `FMS.Testing/Fiscal/`. 🧪 11.4 ⛓ T1.7

---

## Phase 2 — KRA provider plugin (2 sprints, depends on Phase 1)

- [ ] **T2.1** Create `FMS.Fiscal.Kra` project; add to both `.sln`s; reference Abstractions + Core + Persistence. ⛓ T1.5
- [ ] **T2.2** Implement `KraFiscalProvider` shell decorated `[FiscalProvider("KRA", Country="KE", Mode=Oscu|Vscu, Version="1.0")]` with capability flags. ⛓ T1.3
- [ ] **T2.3** Implement `KraSecretsProtector` (encrypt/decrypt `Settings` TEXT using existing FMS secret provider). ⛓ T2.1
- [ ] **T2.4** Implement `KraDeviceInitializer` — calls `selectInitOsdcInfo`, persists `cmcKey` encrypted into provider config. 📄 OSCU spec § device init. ⛓ T2.3
- [ ] **T2.5** Implement `OscuHttpClient` with Polly retry (3 attempts, exponential), redacted logging, request/response capture into `fiscal_signing_records.RawRequestText/RawResponseText`. ⛓ T2.1
- [ ] **T2.6** Implement `OscuPayloadSerializer` and `InvoiceToKraPayloadMapper` for sale signing. 📄 OSCU spec § `saveTrnsSalesOsdc`. ⛓ T2.5
- [ ] **T2.7** Implement `KraResponseToCanonicalMapper` (KRA response → `FiscalSigningResult` incl. CU Invoice No, signature, internal data, QR payload). 📄 OSCU spec § response. ⛓ T2.6
- [ ] **T2.8** Implement `OscuEndpoints.SaveItem` + `RegisterItemAsync` on the provider. 📄 OSCU spec § `saveItem`. 🧪 11.5
- [ ] **T2.9** Implement `OscuEndpoints.SaveCustomer` + `RegisterCustomerAsync`. 📄 OSCU spec § `saveCustomer`.
- [ ] **T2.10** Implement code-list sync (`selectItemClsList`, `selectCodeList`) + `KraClassificationCache`. 📄 OSCU spec § codes.
- [ ] **T2.11** Implement `VscuLocalClient` — HTTP bridge to `Fiscal.Kra.VscuBaseUrl`. ⛓ T2.5
- [ ] **T2.12** Implement `VoidAsync` (credit-note path) — gated until T0.3 completes. 📄 OSCU spec § void/credit-note.
- [ ] **T2.13** `KraServiceCollectionExtensions.AddFiscalKra()` — registers HTTP client, mappers, provider; called from a top-level `AddFiscalProviders()` in `FMS.Fiscal.Core`. ⛓ T2.2
- [ ] **T2.14** Mapper unit tests against captured KRA sample payloads (one test per OSCU endpoint we use). 🧪 11.1 ⛓ T2.6
- [ ] **T2.15** Sandbox smoke: device init → register item → register customer → sign sale → verify CU Invoice No + QR. 🧪 11.1 ⛓ T2.4..T2.13

---

## Phase 3 — Application layer + sales hook (1 sprint, depends on Phase 2)

- [ ] **T3.1** Create `FMS.Application/Features/Fiscal/{Commands,Queries,DTOs,Services,Validators,Notifications}/` skeleton.
- [ ] **T3.2** `SignSaleInvoiceCommand` + handler (one file). Calls `IFiscalOrchestrator.SignAsync`. ⛓ T1.8 🧪 11.1
- [ ] **T3.3** `SaleCompletedFiscalHandler : INotificationHandler<SaleCompletedNotification>` — only acts if tenant is in scope (Kenya, fiscal enabled, external-customer sale). ⛓ T3.2
- [ ] **T3.4** Confirm/raise `SaleCompletedNotification` from existing sales completion command (do not duplicate; reuse if it exists). 🧪 11.1
- [ ] **T3.5** `VoidSignedInvoiceCommand` + handler. ⛓ T2.12
- [ ] **T3.6** `RegisterFiscalItemCommand` + handler (manual + on product save hook). 🧪 11.5
- [ ] **T3.7** `RegisterFiscalCustomerCommand` + handler.
- [ ] **T3.8** `RetryFiscalSigningCommand` + handler.
- [ ] **T3.9** `ConfigureFiscalProviderCommand` + handler (admin) + `ConfigureFiscalProviderValidator`. 🧪 11.6
- [ ] **T3.10** `Get*Query` set: provider list, signing record by id, signing status (paged), queue depth + items.
- [ ] **T3.11** `IFiscalReceiptService` — assembles printable receipt model with KRA fields + QR payload.
- [ ] **T3.12** `InvoiceSignedFiscalHandler` — audit log + SignalR push to branch dashboard.
- [ ] **T3.13** Wire `FiscalSigningOutboxProcessor` into WebClient hosted services. ⛓ T1.9 🧪 11.3

---

## Phase 4 — WebClient API + permissions + system config (1 sprint, depends on Phase 3)

- [ ] **T4.1** Add to `Permissions.cs`: `_Read_FiscalProvider`, `_Manage_FiscalProvider`, `_Read_FiscalSigningStatus`, `_Retry_FiscalSigning`, `_Read_FiscalReceipt`, `_Reprint_FiscalReceipt`, `_Sync_FiscalItem`, `_Sync_FiscalCustomer`. 🧪 11.6
- [ ] **T4.2** Seed permission rows into `permissions` table.
- [ ] **T4.3** Seed `systemconfigurations` rows for every key in PRD §8. 🧪 11.10
- [ ] **T4.4** `FiscalProvidersController` — CRUD + test-connection action. `[Authorize]` + claim checks. 🧪 11.6
- [ ] **T4.5** `FiscalSigningController` — list/status/get/retry/reprint endpoints.
- [ ] **T4.6** All endpoints return `FMSResponse<T>` / `FMSResponse`.
- [ ] **T4.7** Logging: extend `FmsLoggingConfiguration.cs` with `fiscal/` (14d) and `fiscal-kra/` (14d) categories matching `FMS.Fiscal.*` SourceContext namespaces. 🧪 11.9
- [ ] **T4.8** Add `KraSensitiveFieldsRedactor` Serilog enricher; ensure no PIN/cmcKey/PII reaches sinks.

---

## Phase 5 — Frontend (1 sprint, depends on Phase 4)

- [ ] **T5.1** Create `fms.frontend/src/dataservice/fiscalProviderApi.js` and `fiscalSigningApi.js` (paths `/fiscal/providers`, `/fiscal/signing` — no `/api` prefix).
- [ ] **T5.2** Redux slice `fiscalSlice.js`.
- [ ] **T5.3** Page `pages/fiscal/FiscalProvidersMain.js` + components: `FiscalProviderList`, `FiscalProviderForm`. M365 Fluent (`m365-page-header`, `m365-section-group`, `m365-input`, `m365-btn--primary`). 🧪 11.6
- [ ] **T5.4** Page `pages/fiscal/FiscalSigningStatusMain.js` + components: `FiscalSigningStatus`, `SignedReceiptPreview`.
- [ ] **T5.5** Add navigation entries via Navigation Management UI: `/admin/fiscal-providers`, `/admin/fiscal-signing-status`. NO direct SQL.
- [ ] **T5.6** `Content.js` route pairs (base + wildcard) for both pages; `app-routes.js` component cases. Per AGENTS.md §7.
- [ ] **T5.7** Receipt component update — render KRA block + QR (existing QR helper or `qrcode.react`). 🧪 11.7
- [ ] **T5.8** Use `usePermissions()` hook to gate UI buttons.
- [ ] **T5.9** Mobile responsiveness pass (height-based collapse, M365 mobile rules).

---

## Phase 6 — VSCU host (optional, depends on Phase 2 & 4)

- [ ] **T6.1** Create `FMS.Fiscal.Vscu.Host` worker project. Mirror `FMS.PTS.WindowsService` Program.cs scaffold.
- [ ] **T6.2** Implement `VscuLocalAgentBridge` — local HTTP listener; signs on behalf of FMS WebClient when branch is in VSCU mode.
- [ ] **T6.3** Logging at `C:\Logs\FMS.Fiscal.Vscu\` with subfolders `app/`, `errors/`, `signing/`, `sync/`, `startup/`. Text format with `({SourceContext})`.
- [ ] **T6.4** Install/Uninstall PowerShell scripts.
- [ ] **T6.5** End-to-end smoke: WebClient → VSCU local agent → KRA → signed result back. 🧪 11.2

---

## Phase 7 — Outbox & alerting (1 sprint, depends on Phase 3)

- [ ] **T7.1** Confirm outbox backoff schedule (30s, 2m, 10m, 30m, 1h, 6h) is configurable via `Fiscal.RetryBackoffSeconds`.
- [ ] **T7.2** Outbox metrics — depth + max age — exposed to admin dashboard.
- [ ] **T7.3** Event Expression Engine entry: `FiscalOutboxAgeExceeded` triggers alert when `MaxAgeMinutes > Fiscal.OutboxAlertAgeMinutes`. 🧪 11.3
- [ ] **T7.4** Chaos test: simulate KRA 5xx for 10 minutes; assert no sales blocked, all eventually signed. 🧪 11.3

---

## Phase 8 — Hardening, tests, docs (1 sprint)

- [ ] **T8.1** Conformance test suite under `FMS.Testing/Fiscal/`: every `[FiscalProvider]` class must (a) register, (b) expose metadata, (c) declare ≥1 capability, (d) honour tenant filter via repos. 🧪 11.4 11.8
- [ ] **T8.2** Per-tenant config UI verification: switch tenants → only that tenant's rows visible. 🧪 11.4
- [ ] **T8.3** Capability-flag negative test: stub `[FiscalProvider("EFRIS", Country="UG")]` registers and resolves but skipped for KE tenants without code change in Application. 🧪 11.8
- [ ] **T8.4** Spec-mismatch monitoring — alert if KRA returns response code outside our known list (so spec drift is caught fast).
- [ ] **T8.5** Update PRD §13 Open Questions with resolutions; add follow-up tickets for V2 (UG/TZ/RW).
- [ ] **T8.6** Author provider cookbook in `FMS.Fiscal.Abstractions/README.md` (10-step "add a new country" guide).
- [ ] **T8.7** Cross-link cookbook from a future `.agents/skills/fiscal/SKILL.md` (out of scope for V1 unless requested).

---

## Cross-cutting tasks

- [ ] **TX.1** Add §14 "Fiscal Architecture (Multi-Provider Compliance)" to `AGENTS.md` and `.github/copilot-instructions.md` once V1 ships.
- [ ] **TX.2** Verify all new `.cs` and `.js` files carry the standard documentation header (AGENTS.md §1.8).
- [ ] **TX.3** Verify no file exceeds 600 lines (AGENTS.md §1.7); refactor if so.
- [ ] **TX.4** Build via the `build` task; do not auto-run. Recommend "Please build and test the application" after each phase.

---

## Quality gates per phase

Before marking a phase done:

- [ ] AGENTS.md §12 Quality Checklist passes.
- [ ] All MySQL DDL verified on 5.6 (no `JSON`, no `CURRENT_TIMESTAMP`, no generated cols).
- [ ] All new permissions seeded into `permissions` table.
- [ ] All new system config keys seeded into `systemconfigurations` table.
- [ ] No `provider.Name == "KRA"` checks in Application/WebClient — capability flags only.
- [ ] No direct EF queries against fiscal tables outside `FMS.Fiscal.Core/Persistence`.
- [ ] All new UI uses M365 Fluent classes, `tw-` prefix, `fa-light` icons, SCSS, mobile responsive.
- [ ] Domain layer (`FMS.Domain/`) untouched (or change explicitly approved per AGENTS.md §1.6).

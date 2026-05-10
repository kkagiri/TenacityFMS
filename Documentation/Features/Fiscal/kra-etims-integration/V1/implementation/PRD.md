# PRD — KRA eTIMS Integration (OSCU + VSCU)

| Item          | Value                                          |
| ------------- | ---------------------------------------------- |
| Document type | Product Requirements Document                  |
| Domain        | fiscal                                         |
| Feature       | kra-etims-integration                          |
| Version       | V1                                             |
| Status        | Draft — pending architecture approval          |
| Last reviewed | 2026-05-04                                     |
| Country scope | Kenya (KRA) — V1                               |
| Future scope  | UG EFRIS, TZ VFD, RW EBM (same plugin pattern) |

> **Source documents (authoritative — must be consulted before implementation):**
>
> - `Documentation/KRA_intergration/OSCU_Specification_Document_v2.0.pdf` — OSCU API surface, payloads, response codes.
> - `Documentation/KRA_intergration/VSCU_Specification_Document_v2.0.pdf` — VSCU local agent spec, signing flow, sync cadence.
> - `Documentation/KRA_intergration/TIS-for-OSCU--VSCU-Technical-Specifications-v2.0.pdf` — Combined technical spec (TIS).
> - `Documentation/KRA_intergration/OSCU_VSCU_Step-by-Step_Guide-on-how-to-sign-up.pdf` — Onboarding (PIN/branch/device init).
>
> AI agents: read the relevant PDF section before writing payload mapping code. KRA payload field names, lengths, and code lists are normative — do not invent them.

---

## 1. Problem

Tenacity FMS sells fuel to external customers in Kenya from sites running PTS-controlled pumps. Every taxable sale (fuel, lubricants, shop items) must be fiscalised by KRA eTIMS before a valid receipt can be issued, and item/customer/stock movement data must be reported to KRA. Today FMS has no fiscal layer:

- No signing of sale invoices (illegal to issue receipts to external customers in KE).
- No KRA item registration for fuel SKUs.
- No CU Invoice Number, signature, or QR on printed receipts.
- No offline buffer / retry for KRA outages or station connectivity loss.
- Multi-country expansion (UG/TZ/RW) would force a parallel implementation per country.

## 2. Goals (V1)

1. Sign every external sale invoice with KRA eTIMS before the receipt is finalised.
2. Support **both** OSCU (online cloud signing) and VSCU (local virtual signing module) per tenant/branch.
3. Register fuel SKUs and customers with KRA on demand and on change.
4. Emit canonical **CU Invoice Number, Receipt Signature, Internal Data, QR payload, Signed-At UTC** onto the invoice record and printed receipt.
5. Durable outbox + retry pipeline so KRA outages never block sales at the pump.
6. Multi-tenant: each tenant has its own KRA PIN, branch ID, device ID, certificates/keys, and OSCU/VSCU mode.
7. Pluggable fiscal-provider seam so UG/TZ/RW can be added later as plugins without touching sales code.

## 3. Non-Goals (V1)

- UG EFRIS, TZ VFD, RW EBM providers (V2+).
- Internal fleet refuels (no external customer → not fiscalised).
- Replacing the existing sales pipeline; we only attach to its completion event.
- Reprinting historical pre-eTIMS receipts.
- KRA stock-take automation beyond the documented `stockMaster` / `stockMoveSave` calls.
- Custom KRA reporting dashboards beyond a signing-status view (V2).

## 4. Personas

| Persona              | Role                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| Tenant admin         | Configures KRA PIN, branch, device ID, OSCU/VSCU mode per branch.     |
| Station cashier      | Closes a sale; expects valid eTIMS receipt with QR within seconds.    |
| Finance / compliance | Reviews signing status, KRA reconciliation, retry queue.              |
| Platform engineer    | Adds future country providers behind the same `IFiscalProvider` seam. |
| KRA auditor          | Receives KRA-side reports; verifies QR codes on printed receipts.     |

## 5. Functional Requirements

### FR-1 Fiscal provider abstraction

- `IFiscalProvider` plugin contract (Sign, Void/CreditNote, RegisterItem, RegisterCustomer, GetCodes, GetClassification, StockMove, ZReport).
- Decorated with `[FiscalProvider("KRA", Country = "KE", Mode = Oscu | Vscu)]`.
- Capability flags (`FiscalCapabilities`) so consumers branch on capabilities, not provider name (mirrors `FMS.Devices.*` rule).
- Resolved per tenant via `IFiscalProviderFactory` using `ITenantContext.TenantId`.

### FR-2 OSCU mode (online)

Reference: **OSCU spec PDF §** signing endpoints, §codes, §error responses.

- HTTP client targets KRA OSCU base URL (per environment: sandbox/prod).
- Calls covered V1: `selectInitOsdcInfo`, `saveItem`, `selectItemClsList`, `selectCustomer`, `saveCustomer`, `saveTrnsSalesOsdc`, `saveStockMaster`, `saveStockItems`, `saveStockMoveCust` — exact endpoint names per the spec PDF, do not paraphrase.
- Auth: device init → tin/branchId/deviceSerialNo → KRA returns `cmcKey` cached encrypted in `fiscal_provider_configurations.Settings`.
- Idempotency key per invoice (e.g. `invcNo` = monotonic per device).
- Timeouts + Polly retry (3 attempts, exponential backoff) before falling to outbox.

### FR-3 VSCU mode (local virtual agent)

Reference: **VSCU spec PDF §** local API, §sync cadence.

- Local VSCU agent runs as Windows Service `FMS.Fiscal.Vscu.Host` per branch.
- HTTP/IPC bridge from FMS WebClient → local VSCU on `http://localhost:<port>`; signing happens locally; agent batches and syncs to KRA on its own cadence.
- One device per branch — branch and site are the same naming concept (per stakeholder confirmation 2026-05-04).
- Agent persists its own queue; FMS treats VSCU as a local provider and still records the signing result on the invoice.

### FR-4 Sales pipeline integration

- New MediatR notification `SaleCompletedNotification` raised at the end of the existing fuel-sale completion command.
- Handler `SignSaleInvoiceCommandHandler`:
  1. Resolves provider via `IFiscalOrchestrator` (per-tenant, per-branch, OSCU vs VSCU).
  2. Maps `Invoice` → canonical `FiscalInvoice` → KRA payload.
  3. On success → persists `fiscal_signing_records` row + updates invoice with signing fields + raises `InvoiceSignedNotification`.
  4. On failure / offline → enqueues `fiscal_signing_queue`; receipt is marked **Pending KRA** and reprintable once signed.
- Receipt printing is **blocked** until either signed or explicit cashier override (configurable; see §FR-7).

### FR-5 Item registration (fuel SKUs + shop items)

Reference: **OSCU spec PDF § Item registration**.

- Sync command `RegisterItemCommand` for any product flagged taxable.
- Pre-classified KRA HS codes for fuel products (PMS, AGO, IK) loaded from a seed table; cashier never picks classification.
- Re-sync on product create/update (only fields KRA cares about).

### FR-6 Customer registration

Reference: **OSCU spec PDF § Customer / Branch customer**.

- B2B customers (with PIN) registered before first signed invoice.
- Walk-in customers signed under the branch's "non-PIN" customer code.

### FR-7 Outbox + retry

- Table `fiscal_signing_queue` (DB-backed outbox).
- Background service `FiscalSigningOutboxProcessor` (drains queue with backoff: 30s, 2m, 10m, 30m, 1h, 6h, then alert).
- Retry preserves original invoice timestamp; KRA receives the original sale time.
- Configurable cashier override: `Fiscal.AllowOfflineReceipt` (`false` default — receipt cannot print until signed; if `true`, prints "Pending KRA" copy now and final copy once signed).
- Outbox depth + age surfaced on admin dashboard; alert via Event Expression Engine when age > threshold.

### FR-8 Void / Credit note (placeholder, to be verified)

Reference: **OSCU spec PDF § saveTrnsSalesOsdc with refund / credit-note semantics**.

- `VoidInvoiceCommand` requires the original CU Invoice Number (per stakeholder note: "yes, to be verified later"). Spec compliance to be re-validated against the current sales void flow before V1 cutover.

### FR-9 Tenant isolation

- `fiscal_provider_configurations.TenantId NOT NULL`.
- `fiscal_signing_records.TenantId NOT NULL`.
- `fiscal_signing_queue.TenantId NOT NULL`.
- Repositories apply `WHERE TenantId = ITenantContext.TenantId` automatically.
- Cross-tenant reads only via `IBypassTenancy` (admin-only, audited).

### FR-10 Receipt rendering

- Frontend receipt component (and PDF/print template) shows: KRA PIN, branch ID, CU Invoice No, receipt signature, internal data, QR code (rendered from KRA-supplied payload), signed-at timestamp.
- `_Read_FiscalReceipt` and `_Reprint_FiscalReceipt` permissions.

### FR-11 Admin UI

- Page `/admin/fiscal-providers` — list/add/edit per-tenant fiscal provider configs (M365 Fluent design, `m365-*` classes).
- Page `/admin/fiscal-signing-status` — outbox queue depth, retry status, manual retry, search by invoice.
- Permissions: `_Read_FiscalProvider`, `_Manage_FiscalProvider`, `_Read_FiscalSigningStatus`, `_Retry_FiscalSigning`.

### FR-12 Logging

- New WebClient categories in `FmsLoggingConfiguration.cs`:
  - `fiscal/` — all fiscal events (14d).
  - `fiscal-kra/` — KRA-specific raw req/res with sensitive fields redacted (14d).
- `FMS.Fiscal.Vscu.Host` mirrors WebClient categories under `C:\Logs\FMS.Fiscal.Vscu\`.
- All log entries include `({SourceContext})` per AGENTS.md §6.

## 6. Non-Functional Requirements

| ID    | Requirement                                                                                          |
| ----- | ---------------------------------------------------------------------------------------------------- |
| NFR-1 | Sale-to-signed receipt p95 ≤ 4s (OSCU online); ≤ 1s (VSCU).                                          |
| NFR-2 | Outbox retry never blocks the sales pipeline; signing failure must not roll back the sale.           |
| NFR-3 | KRA credentials (`cmcKey`, certs) encrypted at rest in `Settings` (TEXT) using existing FMS secrets. |
| NFR-4 | MySQL 5.5/5.6 compatible — no `JSON`, no `CURRENT_TIMESTAMP` defaults, no generated cols.            |
| NFR-5 | All new permissions added to `Permissions.cs` + `permissions` table; role assignments via Admin UI.  |
| NFR-6 | All new system config keys added to `systemconfigurations` table.                                    |
| NFR-7 | Frontend uses M365 Fluent design tokens, `tw-` prefix, `fa-light` icons, SCSS, mobile responsive.    |
| NFR-8 | Provider plugin loaded by DI scan via `[FiscalProvider]` attribute — no manual wiring per vendor.    |

## 7. Data Model (MySQL 5.6 safe)

> Field types and lengths align with KRA spec PDFs. Update once implementer confirms exact spec field lengths.

### 7.1 `fiscal_provider_configurations`

```
Id                  CHAR(36)     PK
TenantId            CHAR(36)     NOT NULL
ProviderName        VARCHAR(64)  NOT NULL   -- "KRA"
Country             VARCHAR(8)   NOT NULL   -- "KE"
Mode                VARCHAR(16)  NOT NULL   -- "OSCU" | "VSCU"
BranchId            VARCHAR(64)  NOT NULL   -- KRA branch id
DeviceSerialNo      VARCHAR(64)  NOT NULL
TaxpayerPin         VARCHAR(32)  NOT NULL   -- KRA PIN
Settings            TEXT         NULL       -- encrypted JSON-as-text (cmcKey, cert refs, base URL)
IsActive            TINYINT(1)   NOT NULL   DEFAULT 1
CreatedAt           DATETIME     NULL
UpdatedAt           DATETIME     NULL
UNIQUE (TenantId, BranchId, ProviderName)
INDEX  (TenantId, IsActive)
```

### 7.2 `fiscal_signing_records`

```
Id                  CHAR(36)     PK
TenantId            CHAR(36)     NOT NULL
InvoiceId           CHAR(36)     NOT NULL   -- FK to existing invoice/sale
ProviderConfigId    CHAR(36)     NOT NULL   -- FK to fiscal_provider_configurations
Mode                VARCHAR(16)  NOT NULL
CuInvoiceNo         VARCHAR(64)  NULL       -- KRA-issued
ReceiptSignature    VARCHAR(255) NULL
InternalData        VARCHAR(255) NULL
QrPayload           TEXT         NULL
ScuId               VARCHAR(64)  NULL
SignedAtUtc         DATETIME     NULL
RawRequestText      MEDIUMTEXT   NULL       -- redacted
RawResponseText     MEDIUMTEXT   NULL       -- redacted
Status              VARCHAR(24)  NOT NULL   -- "Pending"|"Signed"|"Failed"|"Voided"
ErrorCode           VARCHAR(64)  NULL
ErrorMessage        VARCHAR(500) NULL
CreatedAt           DATETIME     NULL
UpdatedAt           DATETIME     NULL
INDEX (TenantId, InvoiceId)
INDEX (TenantId, Status, CreatedAt)
```

### 7.3 `fiscal_signing_queue` (outbox)

```
Id                  CHAR(36)     PK
TenantId            CHAR(36)     NOT NULL
SigningRecordId     CHAR(36)     NOT NULL   -- FK
Attempt             INT          NOT NULL   DEFAULT 0
NextAttemptAtUtc    DATETIME     NULL
LastError           VARCHAR(500) NULL
CreatedAt           DATETIME     NULL
UpdatedAt           DATETIME     NULL
INDEX (TenantId, NextAttemptAtUtc)
```

### 7.4 `fiscal_item_registrations`

```
Id                  CHAR(36)     PK
TenantId            CHAR(36)     NOT NULL
ProductId           CHAR(36)     NOT NULL
ProviderConfigId    CHAR(36)     NOT NULL
KraItemCode         VARCHAR(64)  NOT NULL
KraClassificationCode VARCHAR(32) NOT NULL
LastSyncedAtUtc     DATETIME     NULL
SyncStatus          VARCHAR(24)  NOT NULL
CreatedAt           DATETIME     NULL
UpdatedAt           DATETIME     NULL
UNIQUE (TenantId, ProviderConfigId, ProductId)
```

### 7.5 `fiscal_customer_registrations`

```
Id                  CHAR(36)     PK
TenantId            CHAR(36)     NOT NULL
CustomerId          CHAR(36)     NOT NULL
ProviderConfigId    CHAR(36)     NOT NULL
KraCustomerCode     VARCHAR(64)  NULL
TaxpayerPin         VARCHAR(32)  NULL
LastSyncedAtUtc     DATETIME     NULL
SyncStatus          VARCHAR(24)  NOT NULL
CreatedAt           DATETIME     NULL
UpdatedAt           DATETIME     NULL
UNIQUE (TenantId, ProviderConfigId, CustomerId)
```

## 8. System Configuration Keys (`systemconfigurations`)

| Key                            | Default                 | Description                                           |
| ------------------------------ | ----------------------- | ----------------------------------------------------- |
| `Fiscal.Enabled`               | `false`                 | Master switch.                                        |
| `Fiscal.DefaultCountry`        | `KE`                    |                                                       |
| `Fiscal.AllowOfflineReceipt`   | `false`                 | If true, prints "Pending KRA" receipt before signing. |
| `Fiscal.SigningTimeoutSeconds` | `8`                     | OSCU HTTP timeout per attempt.                        |
| `Fiscal.MaxSyncAttempts`       | `6`                     | Outbox retry cap before alerting.                     |
| `Fiscal.OutboxAlertAgeMinutes` | `30`                    | Event expression alert threshold.                     |
| `Fiscal.Kra.OscuBaseUrl`       | `<sandbox URL>`         | Per-environment.                                      |
| `Fiscal.Kra.VscuBaseUrl`       | `http://localhost:8088` | Local VSCU agent.                                     |

## 9. Permissions

| Permission                  | Description                                |
| --------------------------- | ------------------------------------------ |
| `_Read_FiscalProvider`      | View fiscal provider configurations.       |
| `_Manage_FiscalProvider`    | Create/update/disable provider configs.    |
| `_Read_FiscalSigningStatus` | View signing queue + record list.          |
| `_Retry_FiscalSigning`      | Force-retry queued items.                  |
| `_Read_FiscalReceipt`       | View signed receipt details.               |
| `_Reprint_FiscalReceipt`    | Reprint a signed receipt.                  |
| `_Sync_FiscalItem`          | Trigger item registration sync to KRA.     |
| `_Sync_FiscalCustomer`      | Trigger customer registration sync to KRA. |

## 10. Stakeholder Decisions (locked 2026-05-04)

| #   | Question                                  | Decision                                   |
| --- | ----------------------------------------- | ------------------------------------------ |
| 1   | Tenant scope                              | Stations selling to external customers.    |
| 2   | OSCU or VSCU                              | Both — selectable per branch.              |
| 3   | KRA item classification sync              | Yes — required.                            |
| 4   | Credit notes / void semantics             | Yes (to be verified against current flow). |
| 5   | Device-per-branch vs per-site vs per-pump | One device per branch (branch == site).    |

## 11. Acceptance Criteria

11.1 **Sign happy path (OSCU)** — closing a fuel sale on a Kenyan tenant produces a signed receipt with CU Invoice No + QR within p95 ≤ 4s.
11.2 **Sign happy path (VSCU)** — same as 11.1 against local VSCU agent within p95 ≤ 1s.
11.3 **Outbox** — KRA returning 5xx for 5 minutes does not block sales; queued items sign automatically once KRA recovers.
11.4 **Tenant isolation** — switching tenants in the admin UI shows only that tenant's provider configs and signing records.
11.5 **Item registration** — creating a new fuel SKU triggers `saveItem`; KRA item code is stored.
11.6 **Permission gate** — user without `_Manage_FiscalProvider` cannot save a provider config (HTTP 403 + UI hide).
11.7 **Receipt render** — signed receipt component shows all KRA-mandated fields and a scannable QR.
11.8 **Capability check** — adding a stub UG provider does not require any change in `Features/Fiscal/Commands/SignSaleInvoiceCommand.cs`.
11.9 **Logging** — every signing attempt produces a redacted entry under `fiscal-kra/` with `({SourceContext})`.
11.10 **MySQL** — all DDL runs unchanged on MySQL 5.6 (no `JSON`, no `CURRENT_TIMESTAMP`, no generated columns).

## 12. Risks

| Risk                                       | Mitigation                                                       |
| ------------------------------------------ | ---------------------------------------------------------------- |
| KRA spec field-length / code-list drift    | Spec PDF is the single source of truth; mappers validate inputs. |
| OSCU outage during peak                    | Outbox + cashier override flag; alerting via Event Engine.       |
| VSCU agent crash on a branch               | Windows Service auto-restart; health endpoint checked by FMS.    |
| `cmcKey` / cert leakage                    | Encrypted at rest; redaction in logs; admin-only retrieval.      |
| Cashier prints unsigned receipt by mistake | `Fiscal.AllowOfflineReceipt` defaults `false`; permission-gated. |
| KRA voids require flow we don't have       | Verify against current sales void flow before V1 cutover.        |

## 13. Open Questions

1. Exact OSCU void / credit-note flow against the existing FMS sales void — to be verified before Phase 4.
2. Lubricants and shop items KRA classification — confirm pre-loaded HS code list with finance.
3. Walk-in customer code per branch — KRA convention vs. per-tenant pseudo-customer record.
4. Z-report cadence — daily auto vs. cashier-triggered.
5. Whether the VSCU agent should be co-located with `FMS.PTS.WindowsService`/`FMS.Devices.Fueling.Host` on the same branch box, or run as its own service.

## 14. References

- Spec PDFs (this folder root): see header.
- AGENTS.md §1.4 Architecture Planning, §1.6 Domain layer is sacred, §3 Backend, §4 Frontend, §6 Logging, §9 SystemConfig, §10 Fluent Design.
- Devices PRD/Tasks (pattern blueprint): `Documentation/Features/devices/multi-device-platform/V1/implementation/PRD.md`.

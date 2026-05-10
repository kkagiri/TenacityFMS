# FMS.Sales — Subscription & Billing PRD (V1)

**Status:** Draft · **Owner:** Platform Team · **Date:** 2026-04-29
**Bounded Context:** `FMS.Sales` (separate solution, shared database)
**Pricing Model:** Hybrid Base + Metered (Option 3)

---

## 1. Goals

1. Provide a **subscription + billing layer** for TenacityFMS multi-tenant SaaS.
2. Decouple sales/billing logic from the operational fleet system so revisions to pricing, plans, promotions, currencies, or payment integrations **do not require redeploying the main FMS app**.
3. Support **two go-to-market motions**:
   - **Self-serve onboarding** with Stripe (primary)
   - **Manual sales** processed by an internal sales team (offline POs, bank transfers, hardware bundles, channel partners)
4. **Multi-currency** pricing — single Plan can have prices in USD, IDR, MYR, SGD, EUR, etc.
5. Match the **Hybrid Base + Metered** pricing model:
   - Monthly base fee per tenant
   - Included quotas (sites, users, devices, vehicles, RFID tags)
   - Metered overage charges per unit beyond quota

---

## 2. Non-Goals (V1)

- Tax calculation engine (use Stripe Tax or a flat tax-rate field per invoice)
- Dunning automation (manual retry only in V1)
- Revenue recognition / GAAP reporting
- Multi-currency conversion (each subscription is locked to one billing currency)
- Per-feature gating logic inside FMS (handled by feature flags read from Sales)

---

## 3. Architecture

### 3.1 Bounded Context Separation

```
┌────────────────────────────────────────┐    ┌────────────────────────────────┐
│  FMS (operational system)              │    │  FMS.Sales (billing system)    │
│  - Tenants, Sites, Vehicles, PTS       │    │  - Plans, Subscriptions        │
│  - GpsdataContext (140+ tables)        │    │  - SalesDbContext (sales_*)    │
│  - WebClient API                       │    │  - Sales API (separate host    │
│                                        │    │    or mounted under /sales)    │
└─────────────────┬──────────────────────┘    └─────────────────┬──────────────┘
                  │                                              │
                  └──────────────► PostgreSQL ◄──────────────────┘
                                  tenacy_fms
                  Main schema: public                   Sales tables: sales_*
                  Migration history: __EFMigrationsHistory
                  Sales migration history: __sales_migrations_history
```

**Rules:**

- `FMS.Sales.*` projects MUST NOT reference `FMS.Application`, `FMS.Domain`, `FMS.Persistence`, or `FMS.WebClient`.
- `FMS` projects MUST NOT reference `FMS.Sales.*`.
- Shared link is the **TenantId (Guid) only** — Sales stores `TenantId` as a Guid value with no FK; existence is validated at write time via a thin read port if needed.
- Both contexts share the same Postgres database to simplify ops; tables in different namespaces.

### 3.2 Project Structure

```
FMS.Sales/
├── FMS.Sales.Domain/          Entities, value objects, enums
├── FMS.Sales.Application/     CQRS Commands/Queries/Handlers, services, validators
├── FMS.Sales.Persistence/     SalesDbContext, EF configurations, migrations
├── FMS.Sales.Api/             ASP.NET Core minimal-host API (separately deployable)
└── FMS.Sales.sln              Independent solution file
```

### 3.3 DbContext Isolation

- `SalesDbContext` uses its own migration history table: `__sales_migrations_history`
- All tables prefixed `sales_` (e.g., `sales_plan`, `sales_subscription`)
- Connection string reused: `ConnectionStrings__FMSConnection` (same DB, same user)
- No cross-context navigation properties. References by **Guid TenantId** only.

---

## 4. Domain Model

### 4.1 Core Entities

| Entity              | Purpose                                                                                            |
| ------------------- | -------------------------------------------------------------------------------------------------- |
| `Currency`          | ISO-4217 currencies supported (USD, IDR, MYR, SGD, EUR, GBP, …)                                    |
| `Plan`              | Subscription plan template (Starter, Growth, Pro, Enterprise)                                      |
| `PlanFeature`       | Feature flags per plan (HasApi, HasRealtime, HasAdvancedReports)                                   |
| `PlanQuota`         | Included usage caps per plan (sites, users, devices, vehicles, rfid_tags, pts_pumps, tank_sensors) |
| `PlanPrice`         | One row per (plan, currency, billing_cycle) — multi-currency pricing                               |
| `MeteredPrice`      | Overage unit price per (plan, metric, currency) for above-quota usage                              |
| `Subscription`      | A tenant's active plan: status, currency, cycle, trial dates, payment provider                     |
| `SubscriptionItem`  | Line items on the subscription (base + add-ons)                                                    |
| `UsageRecord`       | Daily snapshot per (tenant, metric, period) — written by FMS via background job                    |
| `Invoice`           | Generated per billing cycle; `Draft` → `Open` → `Paid` / `Void` / `Uncollectible`                  |
| `InvoiceLine`       | Individual charge line on an invoice                                                               |
| `Payment`           | Recorded payment attempt (Stripe charge id OR manual reference)                                    |
| `Coupon`            | Discount codes (percentage or fixed amount, optional expiry)                                       |
| `ManualSale`        | Sales-team entry: PO number, sales rep, payment terms, status                                      |
| `OnboardingRequest` | Self-serve signup intent before Stripe checkout completes                                          |

### 4.2 Enums

- `BillingCycle`: `Monthly`, `Annual`
- `SubscriptionStatus`: `Trialing`, `Active`, `PastDue`, `Cancelled`, `Suspended`, `Expired`
- `InvoiceStatus`: `Draft`, `Open`, `Paid`, `Void`, `Uncollectible`
- `PaymentProvider`: `Stripe`, `Manual`, `BankTransfer`, `Paddle`, `RazorPay`
- `PaymentStatus`: `Pending`, `Succeeded`, `Failed`, `Refunded`
- `MeterKey`: `Sites`, `Users`, `Devices`, `Vehicles`, `RfidTags`, `PtsPumps`, `TankSensors`, `Transactions`

---

## 5. Pricing Model (Hybrid Option 3)

### 5.1 Default Plan Catalogue

| Plan       | Base/mo (USD) | Sites | Users | Devices | Vehicles | RFID  |
| ---------- | ------------- | ----- | ----- | ------- | -------- | ----- |
| Free       | $0            | 1     | 2     | 1       | 5        | 10    |
| Starter    | $99           | 1     | 5     | 5       | 50       | 100   |
| Growth     | $299          | 3     | 15    | 20      | 200      | 500   |
| Pro        | $799          | 10    | 50    | 80      | 1,000    | 2,500 |
| Enterprise | Quote         | ∞     | ∞     | ∞       | ∞        | ∞     |

### 5.2 Default Overage Pricing (USD)

| Metric            | Per-unit/mo |
| ----------------- | ----------- |
| Extra Site        | $25         |
| Extra User        | $4          |
| Extra PTS Pump    | $12         |
| Extra Tank Sensor | $8          |
| Extra Vehicle     | $1          |
| Extra RFID Tag    | $0.30       |

Each price has a parallel row in IDR/MYR/SGD/etc. set by Sales/Finance.

### 5.3 Annual Discount

- 15% off applied automatically when `BillingCycle = Annual`.

---

## 6. Self-Serve Onboarding Flow (Stripe)

```
[Public signup page]
     ↓
POST /sales/api/onboarding (email, company, country, plan, currency)
     ↓
Create OnboardingRequest (Pending)
     ↓
Create Stripe Checkout Session
     ↓
Redirect → Stripe Checkout
     ↓
Webhook: checkout.session.completed
     ↓
Create Tenant in main FMS (via API call to FMS.WebClient bootstrap endpoint)
Create Subscription in Sales
Create initial Invoice + Payment
Send welcome email
     ↓
Tenant signs in to FMS
```

---

## 7. Manual Sales Flow

```
[Internal sales rep dashboard]
     ↓
POST /sales/api/manual-sales
  - Customer name, contact, country, plan, currency, custom price overrides,
    payment terms (Net30/Net60), PO number, sales rep id
     ↓
Create ManualSale (Pending Approval)
     ↓
Sales manager approves
     ↓
Create Tenant (if new) + Subscription (status=Active, payment_provider=Manual)
Generate Invoice (Open)
     ↓
Finance records Payment when received
     ↓
Mark Invoice Paid
```

---

## 8. Usage Metering

- A background job inside FMS (e.g., `UsageMetricCollectorService` in `FMS.BackgroundServices`) runs daily at 02:00 UTC.
- For each tenant, it computes `COUNT(*)` for each `MeterKey` from the operational tables.
- It POSTs to `POST /sales/api/internal/usage` (internal service-to-service auth).
- Sales stores daily `UsageRecord`s and rolls up to monthly buckets at invoice generation time.

**Rationale:** Sales never reads main FMS tables directly — keeping the contexts loosely coupled.

---

## 9. Billing Cycle Job

- Daily background worker in `FMS.Sales.Api`:
  - Find subscriptions whose `current_period_end <= today`.
  - Generate Invoice (base + overage lines).
  - For Stripe subs → send to Stripe via API.
  - For Manual subs → email sales rep with the draft.
  - Roll subscription forward.

---

## 10. Multi-Currency Rules

- Each `Plan` has 1..N `PlanPrice` rows, one per supported currency.
- A `Subscription` is locked to ONE currency at creation; cannot be changed (must cancel + resubscribe).
- All amounts stored as `decimal(19,4)` to handle IDR (no decimals, large numbers) and USD/EUR (2 decimals).
- ISO-4217 currency code is the FK (string, 3 chars).

---

## 11. Security & Compliance

- Sales API requires admin role + IP allowlist for staff endpoints (manual sales).
- Stripe webhooks verified via signing secret.
- Internal usage endpoint protected by mTLS or shared secret.
- PII (email, billing address) encrypted at rest using PG `pgcrypto` for V2.
- Audit log table `sales_audit_log` tracks every state transition.

---

## 12. Roll-Out Phases

| Phase    | Scope                                                                                                          |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| **V1.0** | Domain entities, SalesDbContext, plan/subscription CRUD, manual-sales flow, basic invoice generation, USD only |
| **V1.1** | Multi-currency support, Stripe checkout + webhooks                                                             |
| **V1.2** | Usage metering ingestion + overage billing                                                                     |
| **V1.3** | Self-serve signup UI, coupon codes, annual discount                                                            |
| **V1.4** | Dunning, retries, reporting dashboards                                                                         |
| **V2.0** | Tax engine, multi-currency conversion, channel partner portal                                                  |

---

## 13. Open Questions

1. Does FMS.Sales.Api run as **a separate host** (own URL/domain) or **mounted under FMS.WebClient `/sales/*`**?
   → V1 default: **separate host** for true isolation.
2. Tenant provisioning — does Sales create tenants directly in `tenants` table, or call an FMS bootstrap endpoint?
   → **Call FMS bootstrap endpoint** to keep main system as the source of truth for tenant identity.
3. How should we handle currency rounding?
   → Bankers' rounding (`MidpointRounding.ToEven`); IDR rounds to 0 decimals, USD/EUR to 2.

---

## 14. Acceptance Criteria for V1.0

- [ ] FMS.Sales solution builds independently
- [ ] SalesDbContext produces a migration that creates only `sales_*` tables
- [ ] Plan, Subscription, ManualSale CRUD via REST endpoints
- [ ] Invoice generated for a manual sale
- [ ] Payment recorded against an invoice → status becomes Paid
- [ ] No project-level reference between FMS._ and FMS.Sales._
- [ ] Both contexts coexist in the same Postgres DB without conflict

---

_End of PRD_

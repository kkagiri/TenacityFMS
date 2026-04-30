# PRD — Tenacy FMS Public Landing Page Suite

**Feature:** MarketingSite / Landing Pages
**Version:** V1
**Type:** Implementation
**Status:** Approved (planning complete)
**Owner:** Frontend + Sales platform
**Last updated:** 2026-04-29

---

## 1. Background & Problem

Tenacy FMS currently has **no public-facing surface**. Visiting `/` redirects an unauthenticated user straight to `/login`, with no opportunity to learn about the product, compare pricing, or submit interest. Sales operates entirely off-platform (manual email / direct outreach), there is no live pricing source, and the `sales_onboarding_request` table defined in the FMS.Sales PRD has no UI to populate it.

The result: prospects cannot self-discover, sales has no inbound funnel, and the existing `FMS.Sales.Api` (`GET /api/plans`, `GET /api/currencies`) is unused.

## 2. Goals

| # | Goal | Success indicator |
|---|---|---|
| G1 | Give every public visitor a marketing surface that explains the product | Visitors can reach Home, Solutions, Industries, Pricing, About, Contact, Demo, Onboarding without authenticating |
| G2 | Display **live** pricing sourced from FMS.Sales | `/pricing` calls `GET /api/plans` + `GET /api/currencies` and renders without hard-coded values |
| G3 | Capture qualified leads into the sales database | Three new endpoints (`/onboarding`, `/contact`, `/demo`) write rows; sales can read them |
| G4 | Preserve the existing authenticated experience exactly | No regression to `/login`, `/home`, `/admin/*`, `/vehicles/*`, etc. |
| G5 | Stay brand-cohesive with the authenticated app | Inspinia hero/section composition + M365 Fluent tokens, Segoe UI, primary `#0078D4` |

## 3. Non-Goals (V1)

- Self-serve signup that auto-provisions a user account or tenant.
- Stripe Checkout / direct payment from the marketing site.
- Blog, Docs, or Resources content hubs.
- Internationalization (i18n) — English only in V1.
- Dark mode for marketing pages.
- A/B testing, content management system, or marketing automation integrations.
- Server-side rendering / Next.js migration.

## 4. Personas

| Persona | Primary need | Entry page |
|---|---|---|
| **Operations Manager (Mining/Logistics)** | Verify the product solves fleet + fuel pain | `/`, `/solutions`, `/industries` |
| **Procurement / Finance** | Compare plans, request quote | `/pricing`, `/contact` |
| **CTO / IT Lead** | Validate technology, integrations, security | `/solutions`, `/demo` |
| **Existing Customer** | Sign in to the app | Header "Sign in" → `/login` |
| **Sales Rep (internal)** | Read submitted leads | (Backend / sales console — out of scope here) |

## 5. User Stories

- US-01 As a visitor, I want to land on `/` and immediately understand what Tenacy FMS does so I can decide whether to dig deeper.
- US-02 As a procurement user, I want to view plan prices in my own currency and toggle monthly/annual so I can budget.
- US-03 As an operations manager in mining, I want a page that speaks to my industry so I trust the product fits.
- US-04 As a prospect, I want to request a demo without creating an account so I face minimal friction.
- US-05 As a prospect ready to start, I want a multi-step onboarding form that captures my company, plan choice, and contact details.
- US-06 As an existing customer, I want a clearly visible "Sign in" link in the header that takes me to the existing login.
- US-07 As a mobile visitor, I want every page to work on a 360px-wide phone with no horizontal scroll.
- US-08 As a search engine, I want each public page to expose canonical URLs, descriptions, OG tags, and a sitemap.

## 6. Scope — Pages & Routes

| # | Route | Page | Purpose |
|---|---|---|---|
| P1 | `/` | Home | Hero, value prop, feature highlights, how-it-works, industry teaser, pricing teaser, lead CTA |
| P2 | `/solutions` | Solutions | Section per capability backed by real `FMS.Application/Features/` modules |
| P3 | `/industries` | Industries | Logistics, Mining, Construction, Retail Fuel, Public Sector, Agriculture |
| P4 | `/pricing` | Pricing | Live plan/currency data; monthly/annual toggle; comparison table; FAQ |
| P5 | `/about` | About Us | Mission, team, values, locations |
| P6 | `/contact` | Contact | Form + offices + map |
| P7 | `/demo` | Request a Demo | Short form for booking a demo |
| P8 | `/onboarding` | Onboarding (lead capture) | 3-step: Company → Plan → Contact (no account creation) |
| P9 | `/login` | (existing) | Untouched; reachable from header "Sign in" |

## 7. Detailed Page Requirements

### 7.1 Home (`/`)
- **Hero:** H1 ≤ 60 chars (e.g., "Real-time Fleet Intelligence — From Tank to Truck"), supporting paragraph ≤ 200 chars, two CTAs (`Request a demo` → `/demo`, `View pricing` → `/pricing`), placeholder dashboard image with floating KPI cards.
- **Trust strip:** placeholder logo wall + caption.
- **Feature grid (6 cards):** GPS Tracking · Fuel Audit · Tank Inventory · PTS Pump Control · Event Engine Alarms · Advanced Reporting. Each card: `fa-light` icon, title, 2-line description, "Learn more" link to anchor on `/solutions`.
- **How it works:** 3 numbered steps (Connect → Monitor → Act) with placeholder illustrations.
- **Industry teaser:** 6-tile strip linking to `/industries`.
- **Pricing teaser:** 3 plan summary cards (Starter, Growth, Pro) + "See full pricing" link.
- **Testimonial placeholder.**
- **Final CTA banner:** headline + `Request demo` button.

### 7.2 Solutions (`/solutions`)
- Sticky left rail with anchor nav. Sections, each with placeholder screenshot + 4–6 bullet benefits + secondary CTA:
  1. Fleet & Vehicle Management (Vehicle, VehicleTracking, Geofence, VehicleTransfer)
  2. Fuel & Tank Operations (TankManagement, TankStock, FuelAudit, AutomatedReconciliation, ExpectedFuelAverage)
  3. Device & PTS Control (PTS, PTSDevice, ATG, IoT Gateway)
  4. Real-time Dashboards & Reports (Dashboard, Reporting)
  5. Alerts & Workflow Automation (EventEngine, Notification, IssueTracker, WarningLetter)
  6. Multi-tenant Administration (MultiTenancy, UserManagement, Site, Supplier)

### 7.3 Industries (`/industries`)
- Header + 6 cards (Logistics, Mining, Construction, Retail Fuel, Public Sector, Agriculture). Each card: icon, title, 2-line summary, "Read more" → in-page anchor or `/industries#slug`.
- Below cards: 6 detailed sections with use-case copy and feature callouts.

### 7.4 Pricing (`/pricing`)
- **Top bar:** currency switcher (sourced from `GET /api/currencies` filtered to `IsActive`), billing-cycle toggle (Monthly / Annual; Annual shows "Save X%" badge computed client-side from API data).
- **Plan cards:** 4 cards (Starter, Growth, Pro, Enterprise) populated from `GET /api/plans`. Each card shows: name, short description, price (filtered by selected currency + cycle), included quotas (vehicles, users, sites, RFID, pumps, sensors), feature checklist, CTA. Enterprise card shows "Talk to sales" → `/contact`.
- **Loading + empty states:** skeleton on initial load; friendly fallback if Sales API is unavailable.
- **Comparison table:** full feature matrix below cards.
- **FAQ accordion:** ≥ 6 entries (trial, billing, switching plans, currency lock, refunds, taxes).
- **Enterprise CTA banner.**

### 7.5 About (`/about`)
- Mission + vision + story.
- Team grid (avatar placeholders, name, role).
- Values (3-up grid).
- Locations / map placeholder.
- Press / awards strip.

### 7.6 Contact (`/contact`)
- Form fields: Name (required), Company (required), Work Email (required + email format), Phone (optional, E.164 hint), Country (dropdown), Message (required, 1000-char max).
- POST `POST /api/contact` → `sales_onboarding_request` with `RequestType = Contact`.
- Sidebar: support@, sales@ email, office addresses, embedded map placeholder.
- Success state: confirmation message + link back to `/`.

### 7.7 Demo (`/demo`)
- Form fields: Name, Work Email, Company, Fleet size (range select), Country, Preferred date, Preferred time slot (Morning/Afternoon/Evening), Notes (optional, 500-char max).
- POST `POST /api/demo` → `sales_onboarding_request` with `RequestType = Demo`.
- Success state: confirmation + placeholder calendar booking link.

### 7.8 Onboarding (`/onboarding`)
- **Step 1 — Company:** Company name, Industry (select), Country, Fleet size, Number of sites.
- **Step 2 — Plan:** Plan select (pre-fills from `?plan=` query param), Billing currency, Billing cycle, optional notes.
- **Step 3 — Contact:** Full name, Job title, Work email, Phone, Consent checkbox.
- Progress indicator at top; "Back" / "Continue" / final "Submit". Validation per step before advancing.
- POST `POST /api/onboarding` → `sales_onboarding_request` with `RequestType = Onboarding`. **No tenant or user account is created in V1.**
- Success page: "Thanks — sales will be in touch within 1 business day. Already have an account? Sign in."

## 8. Functional Requirements — Public Layout & Navigation

- **FR-1** New `PublicMarketingLayout` renders for all marketing routes (regardless of auth state). It includes `MarketingHeader`, `<Outlet/>`, `MarketingFooter`.
- **FR-2** `MarketingHeader` shows: Tenacy FMS wordmark, primary nav (Home / Solutions / Industries / Pricing / About / Contact), secondary actions (`Sign in`, `Request demo`). Sticky; transparent over hero, solid on scroll. Mobile collapses to hamburger.
- **FR-3** `MarketingFooter` shows: nav columns (Product / Company / Legal), contact email, social placeholder icons, copyright "© 2026 Tenacy FMS".
- **FR-4** Visiting `/` while authenticated still shows the marketing landing (does **not** auto-redirect to `/home`); the header replaces "Sign in" with "Open app" → `/home`.
- **FR-5** Clicking "Sign in" navigates to existing `/login`; login still redirects post-success to `/home`.
- **FR-6** All marketing pages set per-page `<title>` and meta description via `react-helmet-async`.

## 9. Functional Requirements — Sales API

- **FR-7** Add `POST /api/onboarding`, `POST /api/contact`, `POST /api/demo` endpoints in `FMS.Sales.Api`.
- **FR-8** Persistence approach (locked decision per planning): **single `sales_onboarding_request` table with a `RequestType` enum column** (`Onboarding | Contact | Demo`). Add nullable columns to cover the union of fields across all three forms.
- **FR-9** Each new endpoint follows CQRS: command + handler in one file under `FMS.Sales.Application/Features/Onboarding/Commands/`. Validators in `Validators/`.
- **FR-10** Endpoints return `FMSResponse` with a generated request id; reject malformed payloads with 400 + validation messages.
- **FR-11** CORS on `FMS.Sales.Api` allows the marketing origin (configurable via env / appsettings).
- **FR-12** Existing `GET /api/plans` and `GET /api/currencies` remain unchanged. If the public payload omits `IsPublic = false` plans / `IsActive = false` currencies, ensure filtering happens server-side.

## 10. Functional Requirements — Frontend Data

- **FR-13** New `marketingApi.js` (in `fms.frontend/src/dataservice/`) uses a separate axios instance pointing to `REACT_APP_SALES_API_URL`. Functions: `getPublicPlans`, `getCurrencies`, `submitOnboarding`, `submitContact`, `submitDemo`.
- **FR-14** Pricing page caches plan/currency response in component state (no Redux). Currency/cycle changes re-filter in memory; only one network round-trip per visit.
- **FR-15** All form submissions show inline field errors, a top-level error banner on API failure, and disable the submit button while pending.

## 11. Non-Functional Requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-1 | Performance — Lighthouse Performance | ≥ 80 on `/` and `/pricing` |
| NFR-2 | Accessibility — Lighthouse a11y | ≥ 95 on every marketing page |
| NFR-3 | SEO — Lighthouse SEO | ≥ 95 on every marketing page |
| NFR-4 | Mobile responsiveness | No horizontal scroll at 360 / 768 / 1280 px |
| NFR-5 | Time-to-Interactive | < 4 s on simulated Fast 3G for `/` |
| NFR-6 | Security | All forms send over HTTPS; CSRF-safe (no cookie auth on Sales API); honeypot field on each form |
| NFR-7 | Privacy | Onboarding consent checkbox required; privacy policy linked in footer |
| NFR-8 | Observability | Page-view analytics hook stub (env-gated) |
| NFR-9 | Compliance | `robots.txt` allows marketing routes, disallows `/admin`, `/home`, `/vehicles`, `/admin/*`, etc. |

## 12. Visual & Style Requirements

- **VR-1** Visual style is **Hybrid** — Inspinia hero/section composition, M365 Fluent tokens (`#0078D4` primary, `#201f1e` text, `#605e5c` secondary text, `#faf9f8` surface, `#c8c6c4` border), Segoe UI typography.
- **VR-2** Marketing tokens live in a new `marketing-tokens.scss`. **Do not** modify `fms.frontend/src/themes/generated/variables.base.scss` (that file's `#03a9f4` is the authenticated app's accent and must remain untouched).
- **VR-3** All Tailwind utility classes in marketing pages use the existing `tw-` prefix.
- **VR-4** All icons use `fa-light fa-icon-name` (FontAwesome).
- **VR-5** Light mode only.
- **VR-6** Buttons: primary (`#0078D4` filled), secondary (border + Fluent dark text), text/ghost. 34 px control height, 4 px radius (per copilot-instructions).

## 13. Data Model — `sales_onboarding_request` (extended)

| Column | Type | Required | Notes |
|---|---|---|---|
| id | UUID | yes | PK |
| request_type | varchar(20) | yes | `Onboarding` / `Contact` / `Demo` |
| status | varchar(20) | yes | `New` (default) / `Contacted` / `Closed` |
| company_name | varchar(200) | conditional | required for Onboarding/Contact |
| industry | varchar(100) | no | Onboarding |
| country | varchar(100) | yes | all |
| fleet_size | varchar(50) | no | Onboarding/Demo |
| number_of_sites | int | no | Onboarding |
| plan_code | varchar(50) | no | Onboarding |
| currency_code | varchar(3) | no | Onboarding |
| billing_cycle | varchar(20) | no | Onboarding |
| full_name | varchar(150) | yes | all |
| job_title | varchar(150) | no | Onboarding |
| email | varchar(200) | yes | all |
| phone | varchar(50) | no | all |
| message | varchar(1000) | conditional | required for Contact |
| preferred_date | date | no | Demo |
| preferred_time_slot | varchar(20) | no | Demo |
| notes | varchar(1000) | no | Onboarding/Demo |
| consent_marketing | tinyint(1) | conditional | required for Onboarding |
| created_at | datetime | yes | server-generated |
| source | varchar(100) | no | e.g. `marketing-site` |

Migration: new EF migration in `FMS.Sales.Persistence/Migrations/` adding the columns above to the existing `sales_onboarding_request` table.

## 14. Open Decisions (resolved)

| # | Question | Decision |
|---|---|---|
| D1 | Where does `/` go? | New public landing at `/`. Auth routes unchanged. |
| D2 | Visual style? | Hybrid — Inspinia composition + Fluent tokens. |
| D3 | Onboarding scope? | Lead capture only; no auto-provisioning. |
| D4 | Persistence shape? | Single table + `request_type` enum. |
| D5 | Marketing API hosting? | Pending stakeholder confirmation. **Recommendation:** dedicated subdomain `api.tenacyfms.com`. |
| D6 | Logo? | Pending. Existing `logoHyoung.png` may be replaced/co-branded — confirmation required before final design. Placeholder used until then. |

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Sales API unreachable from public origin (CORS) | Pricing page fails to load | Verify CORS config in dev + staging before page rollout; add graceful fallback message. |
| Marketing accent (`#0078D4`) bleeds into authenticated app | UI regression in app | Marketing tokens isolated in `marketing-tokens.scss`; never edit `variables.base.scss`. |
| Lead form abuse / spam | Junk in `sales_onboarding_request` | Honeypot field + per-IP rate limit + email-format validation. |
| Auth regression when rewiring `App.js` | Existing users blocked from app | Step 2 must keep `/login`, `/home`, `/admin/*` flows; manual smoke test required. |
| Missing brand assets at launch | Visual placeholders ship to prod | Use named placeholder files in `public/marketing/` so design team can swap without code change. |

## 16. Acceptance Criteria

- AC-1 `npm start` renders `/` as the marketing landing without authentication.
- AC-2 Header nav reaches every page in §6.
- AC-3 "Sign in" navigates to existing `/login` and successful login still lands on `/home`.
- AC-4 `/pricing` shows live plans and currencies from `GET /api/plans` + `GET /api/currencies`. Toggling currency or cycle re-renders prices with no second network call.
- AC-5 Submitting `/onboarding`, `/contact`, `/demo` returns 200 and writes a row to `sales_onboarding_request` with the correct `request_type`.
- AC-6 No regression on `/home`, `/admin/*`, `/vehicles/*`, `/tank-stock/*`.
- AC-7 Lighthouse on `/` and `/pricing`: Perf ≥ 80, A11y ≥ 95, SEO ≥ 95.
- AC-8 Manual responsive check at 360 / 768 / 1280 px on every page passes.
- AC-9 `sitemap.xml` is reachable and valid; `robots.txt` disallows authenticated paths.
- AC-10 EF migration applies cleanly to a fresh database.

## 17. References

- [Documentation/Features/Sales/PRD-FMS-Sales.md](../../../../Sales/PRD-FMS-Sales.md)
- [Documentation/Features/sales/subscription-billing/V1/implementation/PRD.md](../../../../sales/subscription-billing/V1/implementation/PRD.md)
- `FMS.Sales/FMS.Sales.Api/Program.cs`
- `FMS.Sales/FMS.Sales.Domain/Entities/`
- `fms.frontend/src/App.js`, `Content.js`, `UnauthenticatedContent.js`
- `.github/copilot-instructions.md` — styling, CQRS, file-grouping rules
- `.agents/skills/design/SKILL.md` — M365 Fluent design system

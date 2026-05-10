# Task List — Tenacity FMS Public Landing Page Suite

**Feature:** MarketingSite / Landing Pages
**Version:** V1
**Companion doc:** [PRD.md](./PRD.md)
**Last updated:** 2026-04-29

Legend: `[ ]` not started · `[~]` in progress · `[x]` done · **(B)** backend · **(F)** frontend · **(D)** docs/ops

---

## Phase A — Foundation

### A1. Public marketing layout shell **(F)**

- [ ] A1.1 Create folder `fms.frontend/src/layouts/public-marketing/`.
- [ ] A1.2 Add `PublicMarketingLayout.js` (renders `<MarketingHeader/>`, `<Outlet/>`, `<MarketingFooter/>`).
- [ ] A1.3 Add `MarketingHeader.js` (logo, primary nav, "Sign in" / "Open app" toggle, "Request demo" CTA, mobile hamburger).
- [ ] A1.4 Add `MarketingFooter.js` (nav columns, contact, social placeholders, copyright).
- [ ] A1.5 Add `marketing-tokens.scss` (Fluent tokens: `#0078D4`, `#201f1e`, `#605e5c`, `#faf9f8`, `#c8c6c4`, type stack, spacing scale). **Do not** edit `variables.base.scss`.
- [ ] A1.6 Add `public-marketing.scss` (header/footer/section base styles).
- [ ] A1.7 File header comment block on every new file (per copilot-instructions §1.8).
- [ ] A1.8 Sticky transparent-on-hero / solid-on-scroll header behavior.

### A2. Routing rewire **(F)**

- [ ] A2.1 Add `fms.frontend/src/MarketingRoutes.js` listing all marketing routes inside `<PublicMarketingLayout>`.
- [ ] A2.2 Modify `fms.frontend/src/App.js` so marketing routes render regardless of auth state (mount `MarketingRoutes` before the auth fork).
- [ ] A2.3 Verify `/login` continues to render via `UnauthenticatedContent.js`.
- [ ] A2.4 Verify post-login navigation to `/home` is unchanged.
- [ ] A2.5 Header logic: show "Sign in" when unauthenticated, "Open app" when authenticated.
- [ ] A2.6 Smoke test: `/`, `/pricing`, `/login`, `/home`, `/admin`, `/vehicles` all reachable as before.

### A3. Marketing API client **(F)**

- [ ] A3.1 Add env var `REACT_APP_SALES_API_URL` to `.env.example`, document in `LOCAL_DEV_SETUP.md`.
- [ ] A3.2 Create `fms.frontend/src/dataservice/marketingApi.js` with its own axios instance (no auth interceptor).
- [ ] A3.3 Implement `getPublicPlans()` → `GET /api/plans`.
- [ ] A3.4 Implement `getCurrencies()` → `GET /api/currencies`.
- [ ] A3.5 Implement `submitOnboarding(payload)` → `POST /api/onboarding`.
- [ ] A3.6 Implement `submitContact(payload)` → `POST /api/contact`.
- [ ] A3.7 Implement `submitDemo(payload)` → `POST /api/demo`.
- [ ] A3.8 Standard error mapping → `{ ok, data, error: { message, fields } }`.

### A4. Sales API endpoints **(B)**

- [ ] A4.1 Add `RequestType` enum (`Onboarding | Contact | Demo`) in `FMS.Sales.Domain/Enums/`.
- [ ] A4.2 Extend `OnboardingRequest` entity with the columns listed in PRD §13 (nullable where appropriate).
- [ ] A4.3 EF migration `ExtendOnboardingRequest` in `FMS.Sales.Persistence/Migrations/`.
- [ ] A4.4 Apply migration locally; verify schema.
- [ ] A4.5 Create folder `FMS.Sales.Application/Features/Onboarding/Commands/`.
- [ ] A4.6 `SubmitOnboardingRequestCommand` (command + handler in one file per copilot-instructions §1.9).
- [ ] A4.7 `SubmitContactRequestCommand` (command + handler in one file).
- [ ] A4.8 `SubmitDemoRequestCommand` (command + handler in one file).
- [ ] A4.9 DTOs in `Features/Onboarding/DTOs/` (one per file).
- [ ] A4.10 FluentValidation validators in `Features/Onboarding/Validators/` (validator + interface in same file when small).
- [ ] A4.11 Wire endpoints in `FMS.Sales.Api/Program.cs` (or controller equivalent): `/api/onboarding`, `/api/contact`, `/api/demo`. Return `FMSResponse`.
- [ ] A4.12 Configure CORS to allow marketing origin (env-driven).
- [ ] A4.13 Add honeypot field check + simple per-IP rate limit (e.g. fixed-window in-memory) on the three submission endpoints.
- [ ] A4.14 Verify `GET /api/plans` filters out `IsPublic = false` plans server-side.
- [ ] A4.15 Verify `GET /api/currencies` filters out `IsActive = false` currencies server-side.
- [ ] A4.16 Unit tests for each command handler (success + validation failure).
- [ ] A4.17 Integration test: POST each endpoint, verify row inserted with correct `request_type`.

### A5. Shared marketing components **(F)**

- [ ] A5.1 `Hero.js` — hero band with title/sub/CTA/image slot.
- [ ] A5.2 `SectionHeading.js` — eyebrow + H2 + sub.
- [ ] A5.3 `FeatureCard.js` — icon, title, description, link.
- [ ] A5.4 `IndustryCard.js`.
- [ ] A5.5 `PricingCard.js` — name, price (currency-aware), quotas, features, CTA.
- [ ] A5.6 `CurrencyBillingToggle.js` — currency dropdown + monthly/annual switch.
- [ ] A5.7 `LeadCaptureForm.js` — generic form runner with config-driven fields, validation, submit.
- [ ] A5.8 `FAQItem.js` — accordion item (a11y: button + aria-expanded).
- [ ] A5.9 `CTAStripe.js` — full-width gradient/solid CTA band.
- [ ] A5.10 `ImagePlaceholder.js` — labelled grey block with target dimensions.
- [ ] A5.11 `MarketingNavLink.js` — header link with active state.
- [ ] A5.12 SCSS partials per component; tokens consumed from `marketing-tokens.scss`.
- [ ] A5.13 Storybook (if available) or visual smoke page to render each component once.

---

## Phase B — Pages

### B1. Home `/` **(F)**

- [ ] B1.1 Create `fms.frontend/src/pages/marketing/Home.js` + `Home.scss`.
- [ ] B1.2 Hero section.
- [ ] B1.3 Trust strip.
- [ ] B1.4 Feature grid (6 `FeatureCard`s).
- [ ] B1.5 How-it-works (3 steps).
- [ ] B1.6 Industry teaser strip.
- [ ] B1.7 Pricing teaser (3 plan cards summary; can hard-code names but link to live `/pricing`).
- [ ] B1.8 Testimonial placeholder.
- [ ] B1.9 Final CTA banner.
- [ ] B1.10 Helmet meta (title, description, OG).
- [ ] B1.11 Mobile pass.

### B2. Solutions `/solutions` **(F)**

- [ ] B2.1 Create page + sticky left rail nav.
- [ ] B2.2 Section: Fleet & Vehicle Management.
- [ ] B2.3 Section: Fuel & Tank Operations.
- [ ] B2.4 Section: Device & PTS Control.
- [ ] B2.5 Section: Real-time Dashboards & Reports.
- [ ] B2.6 Section: Alerts & Workflow Automation.
- [ ] B2.7 Section: Multi-tenant Administration.
- [ ] B2.8 Anchor links + scroll-spy active state.
- [ ] B2.9 Helmet meta + mobile pass.

### B3. Industries `/industries` **(F)**

- [ ] B3.1 Header + 6 industry cards.
- [ ] B3.2 Detail sections per industry.
- [ ] B3.3 Helmet meta + mobile pass.

### B4. Pricing `/pricing` **(F)**

- [ ] B4.1 Page scaffold + helmet meta.
- [ ] B4.2 Fetch plans + currencies on mount via `marketingApi`; show skeleton.
- [ ] B4.3 Currency dropdown (filtered to `IsActive`).
- [ ] B4.4 Monthly/Annual toggle with auto-computed annual savings badge.
- [ ] B4.5 Render 4 `PricingCard`s with live data.
- [ ] B4.6 Comparison table (full feature matrix).
- [ ] B4.7 FAQ accordion (≥ 6 items).
- [ ] B4.8 Enterprise CTA banner.
- [ ] B4.9 Empty/error state when API fails.
- [ ] B4.10 Mobile pass — cards stack, table becomes scrollable horizontally.

### B5. About `/about` **(F)**

- [ ] B5.1 Mission/vision/story section.
- [ ] B5.2 Team grid.
- [ ] B5.3 Values 3-up.
- [ ] B5.4 Locations / map placeholder.
- [ ] B5.5 Press/awards strip.
- [ ] B5.6 Helmet meta + mobile pass.

### B6. Contact `/contact` **(F)**

- [ ] B6.1 Layout: form + sidebar.
- [ ] B6.2 Form fields per PRD §7.6 with inline validation.
- [ ] B6.3 Honeypot field.
- [ ] B6.4 Submit → `marketingApi.submitContact`.
- [ ] B6.5 Success state.
- [ ] B6.6 Sidebar: emails, addresses, map placeholder.
- [ ] B6.7 Helmet meta + mobile pass.

### B7. Demo `/demo` **(F)**

- [ ] B7.1 Form fields per PRD §7.7.
- [ ] B7.2 Date / time-slot inputs.
- [ ] B7.3 Honeypot field.
- [ ] B7.4 Submit → `marketingApi.submitDemo`.
- [ ] B7.5 Success state with placeholder calendar booking link.
- [ ] B7.6 Helmet meta + mobile pass.

### B8. Onboarding `/onboarding` **(F)**

- [ ] B8.1 Folder `pages/marketing/Onboarding/` with 3-step wizard component.
- [ ] B8.2 Step 1 — Company.
- [ ] B8.3 Step 2 — Plan (pre-fill from `?plan=`); fetch plans/currencies via `marketingApi`.
- [ ] B8.4 Step 3 — Contact + consent checkbox.
- [ ] B8.5 Per-step validation; "Back" / "Continue" / "Submit" buttons.
- [ ] B8.6 Progress indicator.
- [ ] B8.7 Honeypot field on final step.
- [ ] B8.8 Submit → `marketingApi.submitOnboarding`.
- [ ] B8.9 Success page with link back to `/login`.
- [ ] B8.10 Helmet meta + mobile pass.

---

## Phase C — Polish, SEO & Ops

### C1. SEO **(F)**

- [ ] C1.1 Install `react-helmet-async`; wrap root in `HelmetProvider`.
- [ ] C1.2 Per-page `<title>` + meta description + canonical + OG tags.
- [ ] C1.3 Default OG image at `public/marketing/og-default.png` (placeholder).
- [ ] C1.4 Update `public/index.html` defaults.

### C2. Sitemap & robots **(F/D)**

- [ ] C2.1 Generate `public/sitemap.xml` listing the 8 marketing routes.
- [ ] C2.2 Update `public/robots.txt`: `Allow: /`, `Disallow: /home`, `/admin`, `/admin/*`, `/vehicles`, `/tank-stock`, `/reports`, `/event-expressions`, `/issues`, `/notifications`, `/dispatch`, `/employees`, `/maintenance`, `/manualrefill`, `/notification-center`, `/providermanagement`, `/PTSDevice`, `/reconciliation`, `/role`, `/site`, `/tag`, `/tank`, `/tank-management`, `/automated-reconciliation`, `/dashboard`.

### C3. Placeholder assets **(F)**

- [ ] C3.1 Create `fms.frontend/public/marketing/` folder.
- [ ] C3.2 Add named placeholders: `hero-dashboard.png`, `feature-gps.png`, `feature-fuel.png`, `feature-tank.png`, `feature-pts.png`, `feature-events.png`, `feature-reports.png`, `industry-logistics.png`, `industry-mining.png`, `industry-construction.png`, `industry-retail-fuel.png`, `industry-public.png`, `industry-agriculture.png`, `team-1..6.png`, `og-default.png`.
- [ ] C3.3 Confirm logo strategy (Tenacity vs co-branded) — replace `logoTenacity.png` reference if needed.

### C4. Responsive & a11y pass **(F)**

- [ ] C4.1 Manual pass at 360 / 768 / 1280 px on every marketing page.
- [ ] C4.2 Keyboard navigation pass (focus rings, tab order, skip-to-content link).
- [ ] C4.3 Color-contrast audit on all text/CTA combinations.
- [ ] C4.4 Lighthouse run on `/` and `/pricing`: Perf ≥ 80, A11y ≥ 95, SEO ≥ 95.

### C5. Analytics & observability **(F)**

- [ ] C5.1 Add page-view hook stub on route change (env-gated).
- [ ] C5.2 Add form-submission event hook stub.

### C6. Security & abuse **(B/F)**

- [ ] C6.1 HTTPS-only deployment.
- [ ] C6.2 Honeypot validation on backend (reject if filled).
- [ ] C6.3 Rate limit on each submission endpoint.
- [ ] C6.4 Server-side input length / format validation.
- [ ] C6.5 Privacy policy + terms placeholder pages or external links in footer.

### C7. QA / Acceptance **(F/B/D)**

- [ ] C7.1 Run through PRD §16 acceptance criteria; tick each one.
- [ ] C7.2 Auth regression smoke: log in → `/home` works; admin pages load; vehicle pages load.
- [ ] C7.3 Submit each form against staging Sales API; verify rows in DB with correct `request_type`.
- [ ] C7.4 Sitemap + robots fetched in production-like environment.

### C8. Release **(D)**

- [ ] C8.1 Hand-off note in PR description with screenshots of all 8 pages.
- [ ] C8.2 Deploy Sales API changes (migration applied) **before** frontend.
- [ ] C8.3 Deploy frontend.
- [ ] C8.4 Post-deploy smoke test on production URL.
- [ ] C8.5 Notify sales team that leads now flow into `sales_onboarding_request` (filter by `request_type`).

---

## Dependency Order

```
A1 ─┬─► A5 ─┐
A2 ─┘       ├─► B1..B8 ─► C1, C2, C3, C4, C5, C7 ─► C8
A3 ─────────┤
A4 ─────────┘
            └─► C6 (security touches both A4 + forms)
```

A1, A2, A3, A4 may proceed in parallel. B-phase pages are independent of each other once A is complete. C-phase polish runs after B.

## Open Items Blocking Implementation

1. **Marketing API hosting domain** — confirm `api.tenacityfms.com` (recommended) vs same-origin path routing. Affects A4.12 CORS config and A3.1 env var.
2. **Logo asset decision** — Tenacity vs co-branded. Affects A1.3, C3.3.
3. **Privacy policy / terms copy** — required for footer links and onboarding consent (C6.5). Legal sign-off needed.

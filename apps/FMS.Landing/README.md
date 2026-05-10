# FMS.Landing — Tenacy FMS Public Marketing Site

Standalone Vite + React 18 SPA hosting the public-facing landing, pricing, solutions, industries, about, contact, demo, and lead-capture onboarding pages for Tenacy FMS.

This project is **separate from `fms.frontend`** (the authenticated app). It deploys to its own origin (e.g. `https://www.tenacyfms.com`) and links to the authenticated app for sign-in.

## Stack

| Layer        | Choice                                                         |
| ------------ | -------------------------------------------------------------- |
| Build        | Vite 5                                                         |
| UI           | React 18                                                       |
| Styling      | Hand-authored CSS (Fluent-grounded tokens in `src/styles.css`) |
| Routing      | Hash router (template-native — see "Routing" below)            |
| Forms / data | Plain `fetch` against `FMS.Sales.Api` (no Redux, no axios)     |

## Quick start

```pwsh
cd FMS.Landing
npm install
copy .env.example .env.local   # adjust as needed
npm run dev
```

Open <http://localhost:5180>. The dev server hot-reloads on save.

## Production build

```pwsh
npm run build
npm run preview   # smoke-test the dist/ output locally
```

The `dist/` folder is a static asset bundle — deploy to any static host (Azure Static Web Apps, S3 + CloudFront, Netlify, Nginx).

## Environment variables

See `.env.example`. All variables are prefixed `VITE_` (Vite only exposes those to client code).

| Var                  | Purpose                                                                                                                  |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `VITE_SALES_API_URL` | Base URL for `FMS.Sales.Api`. Used for `GET /api/plans`, `GET /api/currencies`, and the three lead-submission endpoints. |
| `VITE_APP_LOGIN_URL` | Where the header "Sign in" button redirects.                                                                             |
| `VITE_APP_HOME_URL`  | Where the header shows "Open app" for already-authenticated users (detection is out of scope V1).                        |
| `VITE_ANALYTICS_KEY` | Optional analytics key; leave blank to disable.                                                                          |

## Routing

V1 uses the template's hash router (`#/home`, `#/pricing`, etc.). This keeps the SPA single-file and matches the original prototype.

> Follow-up: switch to React Router `BrowserRouter` to expose canonical paths (`/pricing`) and satisfy SEO acceptance criteria AC-9 in the parent PRD. Tracked separately.

## Folder structure

```
FMS.Landing/
├── index.html               # Vite entry HTML
├── package.json
├── vite.config.js
├── .env.example
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx             # ReactDOM mount
    ├── App.jsx              # Route switch + global tweaks (dev only)
    ├── styles.css           # Fluent tokens + global styles
    ├── components/
    │   ├── Icon.jsx
    │   ├── Layout.jsx       # Header, Footer, Wordmark, BrandMark, useHashRoute, navigate
    │   ├── DashboardMock.jsx
    │   └── TweaksPanel.jsx  # Dev-only design tweaks panel
    └── pages/
        ├── Home.jsx
        ├── Pricing.jsx
        ├── Onboarding.jsx
        └── Placeholders.jsx # Solutions / Industries / About / Contact
```

## Tweaks panel (dev only)

The floating "Tweaks" panel appears only when `import.meta.env.DEV === true`. It lets you live-adjust the primary color, font family, density, and corner radius. Production builds exclude it entirely.

## Linting

```pwsh
npm run lint
```

## Status

V1 scaffold — pages are template-faithful and use mock data. Follow-up tasks (live Sales API integration, BrowserRouter migration, SEO/sitemap, real form submission) are tracked in the parent PRD at:

`Documentation/Features/MarketingSite/landing-pages/V1/implementation/`

## Related projects

- `fms.frontend/` — authenticated React app (DevExtreme, Redux, Inspinia shell)
- `FMS.Sales/FMS.Sales.Api/` — public Sales API consumed for live pricing
- `FMS.WebClient/` — main .NET API

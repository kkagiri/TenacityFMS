# FMS.Admin

Standalone operator portal for the `_platform` system tenant.

## Local Development

- Dev server: `npm run start:admin` from the repo root, or `npm run dev` inside `apps/FMS.Admin`.
- Local URL: `http://localhost:5181`
- Preview URL: `http://localhost:4174`
- API base URL: set `VITE_FMS_API_URL`, or it falls back to `/api` on the current origin.

This app is intentionally separate from `apps/fms.frontend` so platform-operator screens do not ship in the client/customer portal bundle.
# Leapsofts Sales Automation (tenant web app)

React 19 + TypeScript + Vite SPA for **tenant organizations**: dashboard, leads, projects/Kanban, meetings, chat, AI assistant, invoicing, team, attendance, org settings, and more. It talks to the backend at **`/api/v1`** (JWT session).

## Prerequisites

- Node.js 20+
- Running API: [leapsoft-sales-automation-backend](../leapsoft-sales-automation-backend/Readme.md) (MongoDB + Redis as documented there)

## Environment

Create `.env` in this folder (see Vite [env loading](https://vite.dev/guide/env-and-mode.html)):

| Variable | Purpose |
| --- | --- |
| `VITE_API_URL` | **Required for API calls.** Tenant API root passed to Axios as `baseURL` (`src/lib/axios.ts`). Use the backend mount point, e.g. `http://127.0.0.1:5000/api/v1`. Paths in hooks are relative to that (`/users`, `/leads`, …). |

`vite.config.ts` also sets a dev `server.proxy` from `/api` → `VITE_API_URL` (useful if anything calls relative `/api/...`; the main client uses the absolute `baseURL` above).

## Scripts

```bash
npm install
npm run dev      # Vite dev server (--host)
npm run build    # TypeScript project references + production bundle
npm run lint
npm run preview  # Preview production build
```

Optional Node tests: `npm run test:teams`, `test:sales-kpi-refresh`, `test:lead-updates`.

## Auth

- Access token is stored in `localStorage` (`accessToken`); refresh uses the backend `/auth/refresh` flow with credentials (see `src/lib/axios.ts`).
- After a failed refresh, the client clears auth and redirects to `/login`.

## Routing

Main router: `src/router/index.tsx` (dashboard, tasks, sales, projects, Kanban, meetings, chat, AI, invoices, team, attendance, admin, profile, OAuth return paths for integrations, etc.). Lazy route loaders live in `src/router/lazy-pages.ts`.

For full API coverage and roles, see the backend README route table.

## Lumi (AI assistant)

Lumi chats at `/ai` and from the global drawer. Organization Gemini and Claude keys are saved in System Settings; users can add a personal key that takes priority. Lumi can read org ICPs and profiles, break leads down by those buckets, and propose KPI, invoice, and Kanban changes that apply only after the user approves the preview card.

## Related packages

- [Backend API](../leapsoft-sales-automation-backend/Readme.md)
- [Platform console](../leapsofts-erp-admin/README.md) (operator UI, not this app)
- [Tauri desktop](../leapsofts-erp-app/README.md)

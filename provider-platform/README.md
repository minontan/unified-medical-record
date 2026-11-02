# Provider platform

The provider-facing half of the [Unified Medical Record](../README.md): a clinical prescribing and medication-management workflow for a long-term-care setting — resident registry, screenshot/structured medication intake with PII redaction, a pharmacist-gated prescription approval state machine, DOCX prescription document generation, and a full audit trail.

- **Stack:** React 18 · Vite 8 · Tailwind · Radix/shadcn · TanStack Query · `@base44/sdk`
- **Backend:** `backend/entities/` (7 schemas + access rules) · `backend/functions/` (4 TypeScript functions) · `backend/shared/` (prescription date formatting + DOCX builder)
- **Roles:** server-derived acting role — `admin` = pharmacist (approver), other users = nurse
- **Full catalog:** [`docs/FUNCTION_MANIFEST.md`](../docs/FUNCTION_MANIFEST.md)

Any change pushed to the repo will also be reflected in the platform Builder.

## Prerequisites

1. Clone the repository using the project's Git URL.
2. Navigate to the project directory.
3. Install dependencies: `npm install`.
4. Install the platform CLI: `npm install -g base44@latest`.
5. Install [Deno](https://docs.deno.com/runtime/getting_started/installation/) — the local backend runs on it.

Run `base44 --help` for the full command surface.

## Run Locally

Three commands, from the project root:

```bash
base44 login   # one-time per machine
base44 link    # one-time per clone
base44 dev     # local backend + frontend together
```

Open the frontend URL that the dev command prints (typically `http://localhost:5173`).

Notes:

- **Every fresh clone needs the link command.** It writes `backend/.app.jsonc` (the backend-instance pointer), which is deliberately gitignored. Your instance id is in your platform dashboard; `base44 link --help` shows the non-interactive flags.
- **The dev command runs the frontend for you** (via `site.serveCommand` in this repo's `backend/config.jsonc`) — never run `npm run dev` yourself: alone it serves a UI with no backend behind it (every `/api` call fails), and alongside the dev command the second Vite silently takes the next port and you end up looking at the wrong one.
- **The app must be published at least once for the UI to load under the dev server.** The frontend boots by fetching app settings from the hosted app; before the first publish that fails and every page redirects to login. The local API works regardless.
- Entities, functions, and auth run locally — entity data is **in-memory only**, wiped when the dev server restarts. Everything else (integrations, OAuth login) is forwarded to your deployed app.

## Frontend Only, Hosted Backend

To work on just the frontend against the live hosted backend:

```bash
base44 dev --remote
```

⚠️ In this mode writes go to your **production data** — plain local dev keeps everything local.

## Publish Your Changes

After pushing your changes to git, open the platform dashboard and publish the app:

```bash
base44 dashboard open
```

This repo syncs through git, so publish from the dashboard rather than the CLI deploy command — a CLI deploy ships your local tree directly, bypassing the sync, and the deployed state silently diverges from the repo.

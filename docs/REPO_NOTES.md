# Repository Notes

## Structure & conventions

- Two self-contained platforms: `patient-platform/` (React 18 · Vite 6) and `provider-platform/` (React 18 · Vite 8). Each has its own `package.json`, its own `backend/` backend tree (entities with access rules, TypeScript functions, workflows/automations), and its own frontend under `src/`.
- The platforms do not share code or data today; see the fusion map in the root README for the intended integration seams.
- Package names: `unified-medical-record-patient-platform` / `unified-medical-record-provider-platform`.
- Backend trees live in `backend/` - renamed from the platform-conventional `base44/` folder. The platform CLI and Vite plugin expect the conventional name; if you use them against this repo, rename the folder back (or symlink) for the duration.

## Machine-local files (gitignored by design)

- `.env.local` — local environment values; contains only the public app id (`VITE_BASE44_APP_ID`), never secrets.
- `backend/.app.jsonc` — per-machine backend linkage pointer; regenerate with the platform `link` command.
- `node_modules/`, `dist/`, logs.

## Branding assets

Image references (favicon, OG/Twitter images, header logos) point at `/logo.png`. No brand assets ship with this repository — place your own logo at each platform's `public/logo.png`, or adjust the URLs. OG/Twitter image URLs are relative; make them absolute when a real domain replaces the `example.org` placeholders.

## Known gaps (deliberate, pre-public)

- The disclaimer modal (`patient-platform/src/components/DisclaimerModal.jsx`) renders hardcoded English; translated `disclaimer.*` keys exist in all 11 locale files but are not yet consumed — wire `useTranslation` before relying on localized consent text.
- Intentional platform-SDK surface, **do not rename**: `base44_` localStorage prefixes, `data-base44-image` attributes + `base44:image-replace` events, workflow `"namespace": "base44"`, and `npm:@base44/sdk` specifiers. Renaming any of these breaks the SDK integration.

## Data & PHI

Entity files under `backend/entities/` are **schemas + access rules only — no data rows**. No PHI is stored in this repository. Secrets live in the platform's secret store and are deliberately absent from the repo.

## Dependency deltas between the two platforms

| Package | Patient platform | Provider platform |
|---|---|---|
| Vite | 6 | 8 (beta) + `nitro` beta devDep |
| `@vitejs/plugin-react` | ^4.3.4 | ^6.0.5 |
| Rich text | `react-quill` | `react-quill-new` |
| jspdf | 4.0 | 4.2.1 |
| i18n | i18next + react-i18next (11 locales) | — |

Note: the provider DOCX builder (`backend/shared/prescriptionDocx.ts`) imports `docx` via a Deno `npm:docx@9.5.1` runtime specifier — it appears in **no** `package.json`. Unifying any of these is a deliberate future decision, not a default. The provider platform also carries `.npmrc` with a 7-day supply-chain cooldown policy (min-release-age=7; `@base44/*` exempt).

## Local npm install caveat (macOS)

Some npm configurations reject project-scoped installs that use `--allow-scripts` (`EALLOWSCRIPTS`). This is a local npm configuration interaction, not a defect in the code. If you hit it: add the flagged entries to `allowScripts` in `package.json` or `.npmrc`, or run `npm install --allow-scripts` where your npm version supports it.

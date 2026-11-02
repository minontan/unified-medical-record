# AGENTS.md

Guide for AI coding agents working in this repository. Read this before making changes.

## What this is

The **Unified Medical Record**: two companion platforms in one repository.

- `patient-platform/` — patient-facing personal health record (React 18 · Vite 6) with clinical intelligence: measurements, LLM-extracted lab results, medications, documents, women's & child health, caregiver access, predictive risk models, screening engine, 11 locales.
- `provider-platform/` — provider-facing clinical prescribing workflow (React 18 · Vite 8): resident registry, pharmacist-gated prescription state machine, DOCX generation, full audit trail.

Each platform is self-contained: its own `package.json`, a `backend/` tree (entity schemas + access rules, TypeScript functions, automations), and its frontend under `src/`.

## Hard rules

1. **No PHI, ever** — not in code, comments, fixtures, issues, or commit messages. Synthetic data only. This history is public.
2. **Do not rename the platform-SDK surface** — `base44_` localStorage prefixes, `data-base44-image` attributes, `base44:image-replace` events, workflow `"namespace": "base44"`, `npm:@base44/sdk` specifiers, and the `backend/.app.jsonc` linkage file. These are functional contracts, deliberately kept through the de-brand (see `docs/REPO_NOTES.md` → Known gaps).
3. **Keep the disclaimers.** This is clinical decision-support software, **not a medical device**. The README Disclaimer, the NOTICE device statement, and the in-app disclaimers must survive every change.
4. **Clinical guideline content is pluggable configuration** — see `docs/GUIDELINES.md` and the `[GUIDELINE-DEPENDENT]` markers in `docs/FUNCTION_MANIFEST.md`. If your change touches thresholds, classification tables, or screening rules, say so explicitly and prominently.
5. **Backend folder name:** `backend/` was renamed from the platform-conventional folder. The platform CLI and Vite plugin expect the conventional name — read `docs/REPO_NOTES.md` before wiring platform tooling against this repo.

## Build & run

**Patient platform** — Vite dev server against the linked backend:

```bash
cd patient-platform
npm install
npx base44 login && npx base44 link   # one-time; link writes gitignored backend/.app.jsonc
npm run dev
```

**Provider platform** — the platform CLI starts the local backend and frontend together:

```bash
cd provider-platform
npm install
npx base44 login && npx base44 link
npx base44 dev      # open the URL it prints; do NOT run `npm run dev` alone here
```

## Before you finish

- **Parse-gate every file you touched:** `npx esbuild <file> --loader:.ts=ts --outfile=/dev/null` (or `--loader:.jsx=jsx`).
- JSON/JSONC files must parse; locale files must stay **key-identical to `en.json`**.
- No new secrets, analytics IDs, real identifiers, or brand names. Scanning your own diff for these before committing is expected practice.
- Update `docs/FUNCTION_MANIFEST.md` when adding or changing functions/entities, and `docs/GUIDELINES.md` if guideline-bearing surfaces moved.
- Run the relevant scripts from the platform's `package.json`.

## Where the deep documentation lives

| Doc | Contents |
|---|---|
| [`docs/FUNCTION_MANIFEST.md`](docs/FUNCTION_MANIFEST.md) | Complete function/algorithm catalog with source paths |
| [`docs/GUIDELINES.md`](docs/GUIDELINES.md) | Pluggable clinical-guideline surfaces and how to swap them |
| [`docs/REPO_NOTES.md`](docs/REPO_NOTES.md) | Conventions, dependency deltas, branding assets, known gaps |
| [`CONTRIBUTING.md`](CONTRIBUTING.md) | Contribution rules (Apache-2.0, no PHI, clinical-content tagging) |
| [`SECURITY.md`](SECURITY.md) | Private vulnerability reporting |

# Patient platform

The patient-facing half of the [Unified Medical Record](../README.md): a personal health record with clinical intelligence — measurements, LLM-extracted lab results, medications, documents, appointments, women's and child health, caregiver access, predictive "digital twin" risk models, screening recommendations, and a multilingual community layer (11 locales).

- **Stack:** React 18 · Vite 6 · Tailwind · Radix/shadcn · TanStack Query · `@base44/sdk`
- **Backend:** `backend/entities/` (29 schemas + access rules) · `backend/functions/` (17 TypeScript functions) · `backend/workflows/` (4 automations)
- **Full catalog:** [`docs/FUNCTION_MANIFEST.md`](../docs/FUNCTION_MANIFEST.md)

## Run locally

```bash
npm install
npx base44 login    # one-time device flow
npx base44 link     # link to your backend instance (writes gitignored backend/.app.jsonc)
npm run dev
```

## Publishing

Pushes to the linked repo are reflected in the platform Builder; releases publish from the platform dashboard (git-based publish — do not use the CLI deploy command for this app).

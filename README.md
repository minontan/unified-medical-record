# Unified Medical Record

**A MedNex Pte Ltd project** — an all-in-one medical health record system with clinical care functions, for **both patients and providers**. Two companion platforms live in this repository:

| Platform | Role | Surface |
|---|---|---|
| [`patient-platform/`](patient-platform/) | Patient-facing personal health record | 28 pages · 29 entities · 17 backend functions · 4 automations · 11 languages |
| [`provider-platform/`](provider-platform/) | Provider-facing clinical care (long-term-care prescribing workflow) | 12 pages · 7 entities · 4 backend functions + 2 shared modules |

This is decision-support software — **not a medical device** (see [Disclaimer](#disclaimer)).

## Repository layout

```
├── patient-platform/         # Patient platform (React 18 · Vite 6 · Tailwind · Radix/shadcn)
│   ├── backend/
│   │   ├── entities/         #   29 entity schemas + access rules
│   │   ├── functions/        #   17 backend functions (TypeScript)
│   │   └── workflows/        #   4 automations (cron + entity triggers)
│   └── src/                  #   28 pages · 100 components · 14 lib modules · 11 locales
├── provider-platform/        # Provider platform (React 18 · Vite 8 · Tailwind · Radix/shadcn)
│   ├── backend/
│   │   ├── entities/         #   7 entity schemas + access rules
│   │   ├── functions/        #   4 backend functions (TypeScript)
│   │   └── shared/           #   2 shared modules (prescription dates + DOCX builder)
│   └── src/                  #   12 pages · 74 components · 14 lib modules
└── docs/
    ├── FUNCTION_MANIFEST.md  # every function/algorithm: purpose, I/O, source path
    ├── GUIDELINES.md         # pluggable clinical-guideline surfaces (modular by design)
    └── REPO_NOTES.md         # repository conventions, dependency deltas, data & PHI statement
```

## Patient platform

- **Personal health record:** measurements with trends, lab results (LLM-extracted from uploaded reports against a standardized test dictionary), medications, medical documents, appointments, women's health (cycle, pregnancy markers & vitals, immunisations), child profiles + child health records with care-transfer, wearable data points.
- **Clinical intelligence:** screening recommendation engine (rule-based over age/sex/smoking/APCS profile), cardiometabolic insights (blood-pressure and lipid/Lp(a) classification tables, cardio-kidney-metabolic framework messaging and KDIGO eGFR staging — pluggable, see [Guidelines](#clinical-guidelines-are-pluggable-not-permanent)), per-user predictive risk models with trajectory charts ("digital twin"), LLM-generated dismissible insights, musculoskeletal assessment (WHO BMD classification + SARC-F).
- **Care network:** caregiver access with scoped permissions, dual-purpose connections (family/caregiver), doctor and diagnostic-centre directories (geo-coded) plus a pharmacy directory (address-based), community posts, groups and support groups.
- **Localization:** 11 locales (EN, zh-Hans, zh-Hant, JA, KO, VI, TH, MS, ID, KM, MY) incl. Chinese lab-test glossary and script-detection translation.

## Provider platform

- **Resident registry** with facility locations and identity matching rules (never matches on empty identifiers alone).
- **Prescription workflow** as an explicit eight-state machine — `draft → in_review → approved → printed → signed → transmitted`, with `changes_requested` and `void` branches — version-tracked, with per-item approval and flags, print counting, and a full audit log (trace IDs, actor identity written server-side).
- **Intake:** structured entry or LLM OCR from screenshots — multi-patient split, verbatim drug-name transcription (no inference), defense-in-depth redaction (identity-field deletion + national ID regex scrub) before storage.
- **Documents:** DOCX prescription generation (A4, fixed Asia/Singapore dates, blank patient-ID/signature fields, trace-ID footer) with version-keyed file reuse and 300-second signed URLs.
- **Roles:** server-derived acting role — `admin` = pharmacist, other users = nurse; the approve action is gated by a server-side role check inside `approvePrescription` (an application-layer gate, not a data-layer field restriction — see the `Prescription` entity's access rules).

## Clinical functions & algorithms (highlights)

Full catalog with inputs/outputs and coupling notes: [`docs/FUNCTION_MANIFEST.md`](docs/FUNCTION_MANIFEST.md).

| Algorithm | Source | What it does |
|---|---|---|
| Predictive model computation | `patient-platform/backend/functions/computePredictiveModels/entry.ts` | Per-user risk scoring over 12- and 24-month analysis windows, with medication-event correlation across a 6-month pre-event window and a ≥5% relative-change threshold; recomputed on every new lab result or measurement via workflow triggers |
| Cardiometabolic classification | `patient-platform/backend/functions/generateCardiometabolicInsights/entry.ts` | Blood-pressure stratification (2024 ESC / 2025 AHA tables) plus lipid / Lp(a) guidance, CKM framework messaging and KDIGO eGFR staging from embedded guideline tables — [pluggable](docs/GUIDELINES.md); sentinel-value exclusion |
| Screening recommendation engine | `patient-platform/backend/functions/generateScreeningRecommendations/entry.ts` | Rule engine over patient profile (age, sex, smoking, APCS, sexual activity) against the ScreeningProtocol catalogue — [pluggable](docs/GUIDELINES.md) |
| Medical insight rules | `patient-platform/backend/functions/generateMedicalInsights/entry.ts` | Deterministic rule engine producing screening content into MedicalInsight — [pluggable](docs/GUIDELINES.md) |
| MSK engine | `patient-platform/src/lib/musculoskeletalEngine.js` | WHO BMD classification + SARC-F sarcopenia screening from assessment inputs — [pluggable](docs/GUIDELINES.md) |
| Lab reference-range parser | `patient-platform/src/lib/labStatus.js` | One-sided flagging of results against lab-reported reference text (no embedded guideline) |
| PII masking | `patient-platform/src/lib/piiMasking.js` | Redaction layer applied before any LLM insight call |
| Prescription date formatting | `provider-platform/backend/shared/prescriptionDates.ts` | Three prescription date formats at fixed Asia/Singapore timezone |
| Prescription DOCX builder | `provider-platform/backend/shared/prescriptionDocx.ts` | A4 DOCX layout (`npm:docx@9.5.1`) with logo, blank patient-ID/signature fields, trace-ID footer |
| Intake OCR extraction | `provider-platform/backend/functions/extractIntakeScreenshot/entry.ts` | LLM extraction under a strict schema: multi-patient split, verbatim transcription, national-ID redaction (pattern in source) |
| Lab report extraction | `patient-platform/backend/functions/extractLabReport/entry.ts` | LLM parsing of uploaded lab reports to a JSON schema, per-user daily quota, server-side signed fetch |
| Drug glossary search/import | `patient-platform/backend/functions/searchDrugGlossary/entry.ts`, `importDrugGlossary/entry.ts` | 18k-row glossary search (3 parallel filters + dedupe); SSRF-validated bulk import |
| Anonymous social identity | `patient-platform/src/lib/hashId.js` | SHA-256 truncated identity hash for social features — no PII in community interactions |

## Clinical guidelines are pluggable, not permanent

Guideline content embedded in this codebase — blood-pressure, cholesterol/lipid and diabetes-related classification tables, screening rules, risk thresholds — is a **modular, replaceable component**, not a fixed part of the system. The classification tables, thresholds and prompt text live in identifiable locations (`generateCardiometabolicInsights`, `generateScreeningRecommendations`, `generateMedicalInsights`, `computePredictiveModels`, `musculoskeletalEngine.js`, and the `ScreeningProtocol` entity's data rows) and are meant to be swapped for whatever guideline set is appropriate for **your** deployment.

**[`docs/GUIDELINES.md`](docs/GUIDELINES.md)** inventories every guideline-bearing surface, what is embedded where, and how to replace it. Nothing in this repository asserts that any embedded guideline set is current, complete, or correct for your jurisdiction.

## Security architecture (patterns shared across both platforms)

- **Server-mediated trust boundaries** — client-forged payloads are re-verified server-side: community-post like/reaction counts are server-initialized, support-group membership writes append the *caller's* identity, caregiver-change notifications re-read recipients from the database.
- **Service-role-only ledgers** — LLM quota (`LlmUsage`) writes are denied even to the record owner; only backend functions write them.
- **Signed-URL authorization** — 300-second signed URLs for lab files and intake sources, with owner-or-caregiver checks and patient-initiated provenance verification.
- **LLM hygiene** — per-user daily quotas, PII redaction on insight prompts and extraction outputs (note: raw documents sent to lab-extraction and the generic LLM endpoint are not input-masked — see FUNCTION_MANIFEST), strict response schemas, safe old-insight cleanup.
- **Input defense** — SSRF validation (HTTPS-only, private/CGNAT ranges blocked) on imports; four-layer contact-form anti-spam (IP rate-limit, honeypot, timing, keywords).
- **Singapore context** — national-ID redaction in intake; fixed Asia/Singapore timezone for prescription documents.

## Platform seams (patient ↔ provider)

The two platforms currently run on separate backends and do not share data. These are the intended integration seams for a future unified deployment:

| Concept | Patient platform | Provider platform |
|---|---|---|
| Medication | `Medication` — patient-maintained list | `Prescription` + `PrescriptionItem` — pharmacist-approved, versioned |
| Diagnostic data | `LabResult` — patient-uploaded, LLM-extracted | `IntakeDocument` — facility intake, OCR-extracted, quarantined until resolved |
| Identity & roles | `User` — privacy flags, discovery opt-in, caregiver links via `Connection` | `User` — `admin` (pharmacist) / `user` (nurse) |
| Audit | Light — `LlmUsage` quota ledger | Explicit — `AuditLog` with trace IDs, actor identity, version tracking |
| Documents | `MedicalDocument` — patient uploads | Generated prescription DOCX + intake source files |

## Running locally

The two platforms have **different** local-dev runtimes — follow the per-platform instructions:

**Patient platform** — standard Vite dev server against the linked backend:

```bash
cd patient-platform
npm install
npx base44 login    # one-time device flow
npx base44 link     # link to your backend instance (writes gitignored backend/.app.jsonc)
npm run dev
```

**Provider platform** — Deno-based local backend; the platform CLI starts backend **and** frontend together:

```bash
cd provider-platform
npm install
npx base44 login && npx base44 link
npx base44 dev      # open the URL it prints (typically localhost:5173)
```

Provider-platform specifics (see its [README](provider-platform/README.md) for the full run-book):
- **Do not** run `npm run dev` in `provider-platform/` — alone it serves a UI with no backend behind it, and every `/api` call fails.
- The UI loads under the dev server only after the app has been published at least once (it fetches app settings from the hosted app).
- Local entity data is in-memory and wiped on restart; the `--remote` dev mode works against your **live production data** — know which mode you're in.

General notes:
- `provider-platform/.npmrc` enforces a 7-day supply-chain cooldown (npm releases younger than a week are skipped; `@base44/*` exempt).
- Backend functions execute on the managed runtime; secrets live in the platform's secret store and are **deliberately absent from this repository**.
- Publishing is done via the platform dashboard's git-based publish flow — never the CLI deploy command (see `provider-platform/README.md` → "Publish Your Changes").

## Docs

- [`AGENTS.md`](AGENTS.md) — build guide for AI coding agents (conventions, do-not-rename surfaces, gates).
- [`docs/FUNCTION_MANIFEST.md`](docs/FUNCTION_MANIFEST.md) — complete catalog: entities, backend functions, workflows, shared and client lib modules.
- [`docs/GUIDELINES.md`](docs/GUIDELINES.md) — pluggable clinical-guideline surfaces and how to swap them.
- [`docs/REPO_NOTES.md`](docs/REPO_NOTES.md) — repository conventions, dependency deltas between the platforms, data & PHI statement.
- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution rules (Apache-2.0, no PHI, clinical-content tagging).
- [`SECURITY.md`](SECURITY.md) — private vulnerability reporting.

## License

Released under the [Apache License 2.0](LICENSE) — Copyright 2026 MedNex Pte Ltd.

- Contributions are welcome and are licensed under Apache-2.0 — see [CONTRIBUTING.md](CONTRIBUTING.md) (no PHI in issues or PRs, ever).
- Third-party dependencies remain under their own permissive licenses (MIT/ISC) — see [NOTICE](NOTICE).
- The MedNex Pte Ltd name and project logos are trademarks of MedNex Pte Ltd and are not covered by the code license.
- The embedded clinical guideline content is pluggable configuration, not a licensed medical product — see [docs/GUIDELINES.md](docs/GUIDELINES.md).

## Disclaimer

Clinical decision-support software. **Not** a medical device; not cleared or approved by FDA, HSA, or any regulator; no clinical validation is claimed for any algorithm or embedded guideline set in this repository. Patient-safety review is required before any clinical use.

# Pluggable Clinical Guidelines — modular surfaces

**Design rule:** the guideline content in this system — guidance on cholesterol, hypertension (HTN), diabetes and related cardiometabolic risk — is a **non-permanent, modular component**. It is not part of the system's permanent logic. Deployers are expected to **input the guideline set appropriate for their own use** of this code, replacing what ships here.

Nothing in this repository claims any embedded guideline set is current, complete, or correct for your jurisdiction. Treat every table below as replaceable configuration.

## Where guideline content lives

| # | Surface | File | What is embedded | How to replace |
|---|---|---|---|---|
| 1 | Cardiometabolic insights | `patient-platform/backend/functions/generateCardiometabolicInsights/entry.ts` | Blood-pressure classification tables (2024 ESC / 2025 AHA), lipid & Lp(a) guidance, ADA/AHA CKM framework messaging + KDIGO eGFR (CKD) staging; sentinel-value exclusion rules | Edit the threshold tables / prompt text in place, or fork the function under a new name and point the caller at it (note the backend's immutable-by-name deploy behavior for *changed* functions) |
| 2 | Screening rules | `patient-platform/backend/functions/generateScreeningRecommendations/entry.ts` + `generateMedicalInsights/entry.ts` | Rule parameters over age / sex / smoking / APCS / sexual-activity profile | Edit rule parameters in the functions, and/or replace the `ScreeningProtocol` entity's data rows (the protocol catalogue is **data**, editable without code changes) |
| 3 | Screening protocol catalogue | `patient-platform/backend/entities/ScreeningProtocol.jsonc` (+ deployed entity rows) | The screening protocol list the recommendation engine matches against | Data-level replacement: update rows via the app or API; schema itself is code |
| 4 | Predictive risk scoring | `patient-platform/backend/functions/computePredictiveModels/entry.ts` | Risk-classification thresholds, ≥5% relative-change trigger, 12/24-month analysis windows, 6-month pre-event medication-event correlation | Edit thresholds/window constants in place (or fork under a new name) |
| 5 | Musculoskeletal engine | `patient-platform/src/lib/musculoskeletalEngine.js` | WHO BMD classification categories + SARC-F cutoffs | Edit constants in place (frontend-only; rebuild required) |
| 6 | Lab flagging | `patient-platform/src/lib/labStatus.js` | **No embedded guideline** — parses whatever reference ranges each lab report prints | Nothing to replace; behavior follows the source lab |
| 7 | Provider-platform intake/prescribing | `provider-platform/backend/**` | **No guideline tables** — verbatim-transcription policy for drug names; date/DOCX formatting only | n/a |

## Replacement rules of thumb

1. **Guideline content is configuration, not core logic.** The surrounding machinery (data capture, LLM extraction, quota/PII guards, audit) does not depend on *which* guideline set is loaded — only the tables/thresholds/rules listed above do.
2. **Swap at the marked surfaces only.** The manifest (`FUNCTION_MANIFEST.md`) tags every guideline-dependent row **[GUIDELINE-DEPENDENT]**; those rows are the complete set.
3. **Re-verify after any swap.** Guideline tables feed patient-facing recommendations; any replacement set should pass your own clinical review before deployment. The disclaimer in the root README applies to whatever set you install.
4. **Line numbers drift.** This doc names files and describes content, not exact line numbers — locate the tables by their clinical terms (e.g. "ESC", "AHA", "LDL", "CKM", "SARC-F") inside the cited files.

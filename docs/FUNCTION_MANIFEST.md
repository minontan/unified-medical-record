# Function & Algorithm Manifest

Complete catalog of the two platforms. Paths are repo-relative. Backend functions are TypeScript (`entry.ts`) executing on the managed backend runtime; entity schemas + row-level security live in `backend/entities/*.jsonc`; automations in `backend/workflows/*.jsonc`.

> **GUIDELINE-DEPENDENT** marks surfaces that embed clinical guideline content (classification tables, thresholds, rule parameters, screening protocols). These are **modular by design** — see [`GUIDELINES.md`](GUIDELINES.md) before relying on any guideline-derived behavior.

---

## A) Patient platform

### Entities (29)

| Group | Entities |
|---|---|
| Personal record | `HealthMeasurement`, `LabResult`, `Medication`, `MedicalDocument`, `Appointment`, `WomensHealthLog` (cycle / pregnancy markers & vitals / immunisations), `WearableDataPoint`, `ChildProfile`, `ChildHealthRecord` (incl. email care-transfer flow) |
| Directory & community | `Doctor` (geo-coded), `Pharmacy` (address-based — no coordinate fields), `DiagnosticCentre` (geo-coded), `SupportGroup`, `CommunityPost`, `PostComment`, `Connection` (dual-purpose: friend **and** caregiver link with `relationship` + `caregiver_permissions`) |
| Clinical intelligence | `ScreeningProtocol` **[GUIDELINE-DEPENDENT]**, `MedicalInsight` (rule-based screening content), `PredictiveModel` (per-user risk scores/trends), `PredictiveInsight` (LLM-generated, dismissible), `MusculoskeletalAssessment` (BMD / sarcopenia / SARC-F inputs) |
| Glossaries | `DrugGlossary` (~18k rows — grounded in `provider-platform/src/data/drug-glossary.json`: 18,272 rows), `ChineseLabGlossary`, `MultilingualLabGlossary` (8 source languages: ms, id, th, vi, km, my, ja, ko — Chinese is the separate `ChineseLabGlossary`; the app itself ships 11 locales), `StandardizedLabTest` |
| Platform | `User` (`is_anonymous`, `allow_discovery`, per-domain privacy flags, `invites_remaining`), `UserHealthProfile` (smoking / APCS / cancer-risk factors), `Notification`, `LlmUsage` (quota ledger — create/update denied even to owner; service-role writes only) |

### Backend functions (17)

| Function | Trigger | Purpose / notable guards |
|---|---|---|
| `computePredictiveModels` **[GUIDELINE-DEPENDENT]** | workflow on LabResult / HealthMeasurement create | 562 lines; clinical scoring over 12- and 24-month analysis windows, medication-event correlation across a 6-month **pre-event** window, ≥5% relative-change threshold |
| `dailyHealthNotifications` | cron `0 0 * * *` | Full-table scan for critical labs; null-user cron must be admin; min-interval guard via globalThis |
| `extractLabReport` | HTTP | `{file_uri, json_schema, prompt}`; per-user daily LLM quota; server-side signed URL — the LLM fetches, the client never sees the URL |
| `generateCardiometabolicInsights` **[GUIDELINE-DEPENDENT]** | HTTP | 441 lines; BP classification (2024 ESC / 2025 AHA tables) + lipid / Lp(a) guidance, CKM framework messaging and KDIGO eGFR (CKD) staging; sentinel-value exclusion |
| `generateMedicalInsights` **[GUIDELINE-DEPENDENT]** | HTTP | Rule engine over profile (age/sex/smoking/APCS/sexual activity) → `MedicalInsight` |
| `generateScreeningRecommendations` **[GUIDELINE-DEPENDENT]** | HTTP | Rule engine over profile against the `ScreeningProtocol` catalogue |
| `generatePredictiveInsights` | HTTP | LLM loop with PII redaction (mirrors `src/lib/piiMasking.js`), daily cap, safe old-insight cleanup |
| `invokeLlm` | HTTP | `{prompt, response_json_schema, purpose}`; quota enforced via `LlmUsage` |
| `getLabFileSignedUrl` | HTTP | `{file_uri}` → 300-s signed URL; owner-or-caregiver authz; patient-initiated provenance check |
| `getCaregiverPatientData` | HTTP | `{patient_email, data_type}`; user-scoped client + provenance check |
| `onCaregiverConnectionChange` | workflow on Connection create/update (`relationship=="caregiver"`) | Webhook-spoof verification: re-reads the DB record; recipients sourced from DB, never the payload |
| `searchUsersForDiscovery` | HTTP | Service-role bypass of self-scoped User RLS; server-side `allow_discovery` filter |
| `createCommunityPost` | HTTP | Trust fields (likes/reactions/counts) server-initialized — never client-forgeable |
| `updateSupportGroupMembership` | HTTP | `{group_id, action}`; server appends/removes the **caller's** email only |
| `searchDrugGlossary` | HTTP | `{query, limit=20}`; 3 parallel DB filters + dedupe |
| `importDrugGlossary` | HTTP | `{file_url, preview_only}`; fuzzy column matching; SSRF validation (HTTPS only; private/CGNAT ranges blocked) |
| `sendContactMessage` | HTTP | 4-layer anti-spam: IP rate-limit (globalThis-pinned), honeypot, <2 s timing check, keyword filter |

### Workflows (4)

| Workflow | Trigger | Effect |
|---|---|---|
| Caregiver Connection Notifications | entity trigger (Connection, caregiver condition) | invokes `onCaregiverConnectionChange` |
| Daily Health Notifications | cron `0 0 * * *` | invokes `dailyHealthNotifications` |
| Recompute Predictive Models on New Lab Result | entity trigger (LabResult create) | invokes `computePredictiveModels` |
| Recompute Predictive Models on New Measurement | entity trigger (HealthMeasurement create) | invokes `computePredictiveModels` |

### Client lib modules (`patient-platform/src/lib/`, 14)

| Module | Purpose |
|---|---|
| `musculoskeletalEngine.js` **[GUIDELINE-DEPENDENT]** | WHO BMD classification + SARC-F sarcopenia screening |
| `labStatus.js` | One-sided reference-range parser (flags results vs lab-reported reference text; parses whatever ranges the lab prints — no embedded guideline) |
| `piiMasking.js` | PII redaction — applied to insight prompts (`generatePredictiveInsights`) and to extraction outputs in the upload UIs; raw inputs to `extractLabReport`/`invokeLlm` are **not** input-masked |
| `sanitizeHtml.js` | XSS stripping for LLM-generated HTML |
| `multilingualLabTranslation.js` | Script-detection-driven lab translation |
| `chineseLabSeedGlossary.js` | Seed data for the Chinese lab glossary |
| `hashId.js` | SHA-256 truncated identity hash (no PII in social features) |
| `i18n.js` | i18next setup, 11 locales |
| `AuthContext.jsx` | Session/auth context |
| `NavigationTracker.jsx` | Navigation state tracking |
| `app-params.js` | App parameter handling |
| `query-client.js` | TanStack Query client |
| `utils.js` | Shared utilities |
| `PageNotFound.jsx` | 404 route component |

---

## B) Provider platform

### Entities (7)

| Entity | Notes |
|---|---|
| `Resident` | Resident registry with identity fields |
| `IntakeDocument` | Status workflow, `source_hash`, `trace_id`, redacted file URI, `resident_id` link |
| `Prescription` | Eight-state machine: `draft` (default) → `in_review` → `approved` → `printed` → `signed` → `transmitted`, plus `changes_requested` and `void`; version-tracked; `print_count`; attached DOCX fields. Update rules permit the record creator **or** an admin with **no field restriction** — state transitions are enforced at the application layer (server-checked in `approvePrescription`), not by data-layer field rules; the client also writes `printed`/`void` transitions directly |
| `PrescriptionItem` | Per-row `approved` / `flags` / `source_raw` |
| `AuditLog` | `trace_id`, actor name/role, version |
| `FacilityLocation` | Name/address schema with role-gated access rules; the site list lives as entity **rows** in the deployed app — no site enumeration exists in this repo (the intake UI lists up to 20 live rows) |
| `User` | `role: admin \| user` only |

### Backend functions (4)

| Function | Purpose / notable guards |
|---|---|
| `approvePrescription` | Server-verified `role==='admin'` (= pharmacist) before moving a prescription to `approved` and writing audit with server-derived identity. This is an application-layer gate: the entity's update rules themselves permit creator-or-admin writes without field restrictions, so the *data layer* alone does not make this "the only path to `approved`" |
| `extractIntakeScreenshot` | OCR via LLM under a strict schema — multi-patient split, verbatim drug-name transcription, no inference; defense-in-depth redaction (identity-field deletion + national-ID redaction scrub). The scrub pattern matches national-ID formats (case-insensitive, whitespace-tolerant); see the source for the exact expression |
| `getIntakeSource` | ID-validated → 300-s signed URL |
| `prescriptionDocument` | Status-gated DOCX generation; first generation restricted to creator-or-pharmacist; 1–200 item bounds; version-keyed reuse of saved file; audit entry; 300-s signed URL |

### Shared modules (`provider-platform/backend/shared/`)

| Module | Purpose |
|---|---|
| `prescriptionDates.ts` | `formatPrescriptionDate` — 3 formats, fixed Asia/Singapore timezone |
| `prescriptionDocx.ts` | `buildPrescriptionDocx` — A4 layout via the Deno `npm:docx@9.5.1` specifier (a runtime import — `docx` is **not** in either platform's `package.json`): logo fetch, blank patient-ID/signature fields, trace-ID footer |

### Client lib modules (`provider-platform/src/lib/`, 14)

| Module | Purpose |
|---|---|
| `useRole.js` | Acting role derived **server-side** (admin = pharmacist, else nurse) |
| `authReturnTo.js` | Security-centralized redirect validation |
| `glossary.js` | Ranked drug search against `src/data/drug-glossary.json` |
| `intake.js` | Resident-matching rules (never match on empty number/name alone) |
| `audit.js` | Audit-trail helpers |
| `masking.js` | PII masking helpers |
| `medicationText.js` | Medication text normalization |
| `residentIdentity.js` | Resident identity helpers |
| `prescriptionDates.js` | Frontend mirror of the shared date module |
| `app-params.js`, `query-client.js`, `utils.js`, `AuthContext.jsx`, `PageNotFound.jsx` | Platform utilities |

---

## Cross-cutting observations

- **Security posture is the headline theme in both platforms:** server-mediated trust boundaries, service-role-only writes for quota/audit, signed-URL authorization, PII redaction before LLM calls with regex safety nets, SSRF guards, layered anti-spam, server-derived roles.
- **Shared DNA:** 300-second signed URLs; per-user daily LLM quotas; trace/version provenance (explicit in the provider platform, audit-light in the patient platform); dashboard-based git publish flow (never the CLI deploy command).
- **Dependency deltas (see REPO_NOTES):** Vite 6 vs Vite 8 (beta) + nitro beta; `@vitejs/plugin-react` 4.3.4 vs 6.0.5; `react-quill` vs `react-quill-new`; jspdf 4.0 vs 4.2.1; the patient platform adds i18next/react-i18next. The provider DOCX builder imports `docx` via a Deno `npm:` specifier at runtime, not via `package.json`.

*Maintained as the complete catalog of both platforms; every row is traceable to the cited file.*

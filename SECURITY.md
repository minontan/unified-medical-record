# Security Policy

## Supported versions

| Platform | Branch | Security fixes |
|---|---|---|
| `patient-platform/` | `main` | ✅ |
| `provider-platform/` | `main` | ✅ |

Only the latest `main` is supported.

## Reporting a vulnerability

**Preferred channel: GitHub Private Vulnerability Reporting** — use the
**"Report a vulnerability"** button under the **Security** tab of this
repository. Reports submitted there are private by default.

Please do **not** open a public issue for security problems.

### What to include

- Platform (patient / provider) and the affected file, endpoint, or function
- Step-by-step reproduction, or a proof of concept
- Impact assessment — what an attacker could realistically gain
- A suggested fix (optional but appreciated)

### Scope

**In scope** — vulnerabilities in either platform's code:

- Authentication or authorization bypasses, including access-rule (RLS)
  escapes and cross-account access
- Injection flaws (SQL, script, prompt-injection reaching LLM calls)
- Signed-URL abuse or authorization gaps on file access
- PII-leakage paths, including failures in the redaction pipeline applied to insight prompts and extraction outputs (raw inputs to lab-extraction and the generic LLM endpoint are not masked — reports on that behavior are in scope too)
- SSRF in import/ingest functions
- Logic flaws in the server-side trust checks (forged-payload protections,
  server-derived roles, audit-integrity)

**Out of scope:**

- Vulnerabilities in the managed backend runtime itself — report those to
  the platform vendor; we will forward confirmed platform issues upstream.
- Social engineering, phishing, or physical attacks.
- Clinical-content disputes (guideline thresholds, screening rules) — those
  are quality questions; open an issue tagged `clinical-content`.
- Automated scanner output without a demonstrated, reproducible impact.

## Our commitments

- We aim to acknowledge valid reports within **5 business days**
  (best-effort).
- Coordinated disclosure with a default window of **90 days** before public
  detail, extendable by mutual agreement.
- **Safe harbor:** researchers acting in good faith and in accordance with
  this policy will not face legal action from us for accidental or
  inconsequential violations of it.

## Testing rules

- Do **not** test against production deployments you do not own or operate.
- Do **not** access, exfiltrate, or modify real patient data (PHI). This
  repository contains none — never put any in a report either.
- No degradation of service, interference with other users, or abuse of the
  contact/notification features while researching.

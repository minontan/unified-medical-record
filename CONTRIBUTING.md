# Contributing to Unified Medical Record

Thank you for considering a contribution. This project is clinical
decision-support software — please read the Disclaimer in the main
[README](README.md) before diving in.

## Licensing

By submitting a pull request or patch, you agree that your contribution is
licensed under the **Apache License 2.0** (the project's license), and that
you have the right to license it as such. No formal CLA is required.

## Ground rules

1. **No PHI, ever.** Do not open issues or PRs containing patient data,
   national-ID numbers, or any real health information. Use synthetic data for
   reproduction steps. Issue threads and diffs are permanent and public.
2. **Clinical guideline content is pluggable configuration** (see
   [docs/GUIDELINES.md](docs/GUIDELINES.md)). If you change embedded
   guideline tables or thresholds, say so explicitly in your PR — these feed
   patient-facing recommendations.
3. **Keep the disclaimer intact.** PRs that weaken or remove the
   not-a-medical-device disclaimer or clinical-safety language will be
   rejected.
4. **Respect the security architecture.** Server-side trust checks (re-reads
   from the database, service-role-only ledgers, signed-URL authorization,
   PII redaction on insight prompts and extraction outputs) exist as
   invariants — do not bypass them for convenience.

## Development

Per-platform setup lives in each platform's README
([patient-platform](patient-platform/README.md) ·
[provider-platform](provider-platform/README.md)). Run the relevant checks
from each platform's `package.json` before submitting.

## Reporting problems

- **Clinical content errors** (thresholds, screening rules): open an issue
  tagged `clinical-content`.
- **Security issues**: please do NOT open a public issue — follow [SECURITY.md](SECURITY.md) (GitHub Private Vulnerability Reporting).
- **Bugs / features**: normal issues and PRs welcome.

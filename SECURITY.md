# Security policy

## Reporting

Do not open a public issue for suspected credential exposure or exploitable vulnerabilities. Contact the repository owner privately through the authenticated project channel.

## Secrets

- Never commit API keys, cookies, authorization headers, account identifiers, or raw provider responses.
- Keep inference variables server-only. Never prefix them with `NEXT_PUBLIC_`.
- Use the PowerShell credential helper only in the active verification shell and clear the environment variable afterward.
- Rotate a credential immediately if it appears in Git history, logs, screenshots, CI output, or chat.

## Provider safety

- Mock inference is deterministic, synthetic, and never identified as AMD.
- Production refuses mock inference by default.
- Live AMD inference remains disabled until authenticated proof and adapter approval.
- Provider failures return sanitized normalized errors; no silent fallback is allowed.

## Public-release gate

Before changing repository visibility, run the full quality suite, scan complete Git history for secrets, review commit identity exposure, select a license, and receive Control Room approval.

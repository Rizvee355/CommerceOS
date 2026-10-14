# AMD ACT III Token Factory verification protocol

1. Team registration is complete per participant confirmation; confirm Token Factory team assignment in the official account dashboard.
2. Obtain the account-issued ACT III Token Factory API key from https://notebooks.amd.com/tokenfactory when available.
3. Read the **account-issued** endpoint, API version, model identifier and request format from the official dashboard/manual. Do not substitute Radeon Cloud endpoints or guess URLs.
4. Set `AMD_TOKEN_FACTORY_API_KEY` privately (never commit it). In Windows PowerShell 5.1, **dot-source** `. .\scripts\Read-TokenFactoryKey.ps1` to keep the environment variable in the active session.
5. Send a minimal authenticated inference request with a unique verification prompt.
6. Preserve **redacted** evidence: timestamp, sanitized endpoint host/path, model identifier, HTTP status, request ID if supplied, generated-content snippet, redacted response metadata.
7. Redact API key, Authorization header, cookies, account IDs and sensitive URLs before storing evidence.
8. Mark authenticated inference G0 PASS only when an authorized request succeeds and yields actual model-generated content.

Current status (2026-10-14): team registration reported complete, API key not yet issued/received, inference proof BLOCKED.

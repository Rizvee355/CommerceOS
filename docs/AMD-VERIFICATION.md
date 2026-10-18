# AMD ACT III Token Factory verification protocol

1. Team registration is complete per participant confirmation; confirm Token Factory team assignment in the official account dashboard.
2. Obtain the account-issued ACT III Token Factory API key from https://notebooks.amd.com/tokenfactory when available.
3. Read the **account-issued** endpoint, API version, model identifier and request format from the official dashboard/manual. Do not substitute Radeon Cloud endpoints or guess URLs.
4. Set `AMD_TOKEN_FACTORY_API_KEY` privately (never commit it). In Windows PowerShell 5.1, **dot-source** `. .\scripts\Read-TokenFactoryKey.ps1` to keep the environment variable in the active session.
5. Send a minimal authenticated inference request with a unique verification prompt.
6. Preserve **redacted** evidence: timestamp, sanitized endpoint host/path, model identifier, HTTP status, request ID if supplied, generated-content snippet, redacted response metadata.
7. Redact API key, Authorization header, cookies, account IDs and sensitive URLs before storing evidence.
8. Mark authenticated inference G0 PASS only when an authorized request succeeds and yields actual model-generated content.

## Verified evidence

Current status (2026-10-18): **G0 PASS for controlled synthetic development use.**

- Authenticated catalog: `GET https://developer.amd.com.cn/radeon/api/v1/models` → HTTP `200`, 16 models.
- Standalone inference: `POST https://developer.amd.com.cn/radeon/api/v1/chat/completions` → HTTP `200`.
- Requested model: `DeepSeek-V4-Flash`; response model: `self-dploy/DeepSeek-V4-Flash`.
- Redacted response ID: `f1ae81867a234b21909370b902fe81d1`.
- Standalone usage: 18 prompt tokens, 41 completion tokens, 59 total tokens.
- CommerceOS integration proof: the PromiseGuard `at_risk` synthetic preset returned the unchanged deterministic `at_risk` assessment, `humanReview.required: true`, live `amd-token-factory` provenance, and four schema-valid constrained advisory actions.
- Integration response duration: 20,536 ms at `2026-10-18T10:06:36.689Z`.
- Actual HTTP route proof: loopback `POST /api/v1/promiseguard/analyze` returned HTTP `200` with live provenance in 21.3 seconds at `2026-10-18T10:18:11.759Z`.

No API key, authorization header, organizer account identifier, or raw provider body is retained in this evidence. Production/public activation remains blocked pending an approved access-control design; the deployed Vercel application continues to run with inference disabled.

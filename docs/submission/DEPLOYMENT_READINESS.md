# Deployment Readiness

## Safe minimum deployment

Deploy the existing production build with:

- Node.js `24.16.0` and pnpm `12.4.2`;
- `INFERENCE_PROVIDER=disabled`;
- no AMD credential or mock-provider environment variables;
- HTTPS, platform logs with secret redaction, and standard request limits;
- the existing `pnpm build` / `pnpm start` lifecycle.

## Expected public behavior

- `/` — CommerceOS overview.
- `/promiseguard` — synthetic PromiseGuard preview.
- `/api/v1/health` — health and server clock.
- `/api/v1/capabilities` — truthful capability registry.
- `/marginleak` — HTTP `404` in production.
- `POST /api/v1/marginleak/analyze` — HTTP `403` with `MARGINLEAK_PREVIEW_UNAVAILABLE` in production.

## Not authorized in Mission 016

- Creating a deployment or public URL.
- Exposing development mode to the internet.
- Weakening MarginLeak production restrictions.
- Activating production AMD inference.

## Pre-deploy approval checklist

1. Approve the hosting provider and public data exposure.
2. Confirm the repository license and public visibility decision.
3. Configure only `INFERENCE_PROVIDER=disabled`.
4. Run the full CI suite from an LF-normalized checkout.
5. Smoke-test the expected public routes and the MarginLeak fail-closed routes.
6. Record the immutable deployment URL and source SHA.

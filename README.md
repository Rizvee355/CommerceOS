# CommerceOS

CommerceOS is a contract-first commerce operations control room for decisions that should not be delegated to an opaque model. It combines deterministic evaluation, explicit evidence, human-review gates, and an optional server-side inference boundary.

Built for the **AMD Developer Hackathon: ACT III — Reinvent Commerce** track.

## What works today

### PromiseGuard — synthetic preview (`stub` capability)

PromiseGuard evaluates whether current fulfillment evidence supports an order's dispatch commitment. It returns one of three deterministic outcomes:

- `supported` — current evidence supports readiness, without promising dispatch or delivery;
- `at_risk` — one or more facts threaten the commitment and require review;
- `indeterminate` — evidence is missing, stale, or otherwise insufficient.

The interactive `/promiseguard` preview is backed by the real contract-validated evaluator and API route. The public capability remains `stub` because live merchant connectors and production activation are not included.

### MarginLeak — synthetic development preview (`planned` capability)

MarginLeak reconciles expected and observed order economics across eight categories. It computes contribution-margin variance with integer minor-unit arithmetic, distinguishes adverse leakage from favorable offsets, withholds totals when evidence is incomplete, and requires human review for provisional or adverse results.

MarginLeak remains `planned`. Its interactive preview is available only in development and test. In production, `/marginleak` returns HTTP `404` and `POST /api/v1/marginleak/analyze` returns HTTP `403` with `MARGINLEAK_PREVIEW_UNAVAILABLE`.

### RescueCart — disabled

RescueCart is intentionally disabled to keep the product scope credible and the safety boundaries explicit.

## AMD integration status

Authenticated AMD Token Factory inference is verified for a controlled, synthetic PromiseGuard workflow. The server-only adapter uses the organizer-documented OpenAI-compatible endpoint and `DeepSeek-V4-Flash`, validates structured output, and can add a labeled advisory explanation without changing the deterministic verdict or human-review policy.

The public Vercel application still runs with inference disabled. Production selection of `amd-token-factory` fails closed until a separate access-control and deployment approval; the local integration is not authentication for a public model endpoint.

No API credential is required to run the deterministic product locally.

## Architecture

```text
apps/commerceos
  Next.js application, product routes, APIs, and UI

packages/contracts
  Canonical Zod contracts plus generated JSON Schema and OpenAPI artifacts

packages/inference
  Server-only provider interface, AMD Token Factory adapter, and deterministic test mock

docs
  Architecture decisions, control-room gates, security records, and demo runbooks
```

The deterministic rules own every verdict, financial calculation, and review decision. Optional inference can only add advisory text through a validated provider contract; it cannot overwrite those outputs.

## Requirements

- Node.js `24.16.0`
- pnpm `12.4.2`

## Local setup

```powershell
git clone https://github.com/Rizvee355/CommerceOS.git
Set-Location CommerceOS
pnpm install --frozen-lockfile
$env:INFERENCE_PROVIDER = "disabled"
pnpm check
pnpm dev
```

For an authorized loopback-only AMD synthetic demonstration, load the key without echoing it, then start the development server on `127.0.0.1`:

```powershell
. .\scripts\Read-TokenFactoryKey.ps1
$env:AMD_TOKEN_FACTORY_MODEL = "DeepSeek-V4-Flash"
$env:INFERENCE_PROVIDER = "amd-token-factory"
pnpm --filter @commerceos/app dev --hostname 127.0.0.1 --port 3000
```

Use synthetic scenarios only. Do not send customer, payment, health, or other sensitive data to the trial service.

Open:

- Overview: `http://localhost:3000/`
- PromiseGuard: `http://localhost:3000/promiseguard`
- Health: `http://localhost:3000/api/v1/health`
- Capability registry: `http://localhost:3000/api/v1/capabilities`

For the development-only MarginLeak demonstration, bind the server to loopback:

```powershell
$env:INFERENCE_PROVIDER = "disabled"
pnpm --filter @commerceos/app dev --hostname 127.0.0.1 --port 3000
```

Then open `http://127.0.0.1:3000/marginleak`. Do not expose a development server to the public internet.

## Verification

```powershell
pnpm format:check
pnpm lint
pnpm typecheck
pnpm contracts:check
pnpm test
pnpm build
pnpm security:secrets
pnpm security:deps
pnpm test:e2e
pnpm exec playwright test --config=playwright.dev.config.ts
```

The production E2E suite verifies that MarginLeak fails closed while PromiseGuard remains available. The development E2E suite verifies MarginLeak's synthetic workflows across desktop and mobile widths.

## Security and operating boundaries

- Never commit credentials, cookies, authorization headers, or raw provider responses.
- Inference variables remain server-only; production mock inference is forbidden.
- CI makes no live provider calls.
- Monetary values use integer minor units; missing evidence is never coerced to zero.
- Production MarginLeak restrictions must not be weakened for a demo.
- Public live AMD activation requires explicit operator approval and an approved access-control design.

See [SECURITY.md](SECURITY.md), [CONTRIBUTING.md](CONTRIBUTING.md), and [docs/control-room/GOVERNANCE.md](docs/control-room/GOVERNANCE.md).

## Current release caveats

- Authenticated AMD inference and local CommerceOS integration are verified; public AMD access remains disabled.
- The public release is available at `https://github.com/Rizvee355/CommerceOS-ACTIII` under the MIT license.
- The public application is available at `https://commerceos-actiii.vercel.app` with `INFERENCE_PROVIDER=disabled`.

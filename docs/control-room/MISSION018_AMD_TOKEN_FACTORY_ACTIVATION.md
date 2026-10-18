# Mission 018 — AMD Token Factory activation evidence

## Outcome

Authenticated AMD Token Factory inference and the CommerceOS PromiseGuard advisory integration both passed on 2026-10-18. The integration is limited to controlled synthetic development use. The deployed public application remains inference-disabled.

## Sanitized provider proof

- Base URL: `https://developer.amd.com.cn/radeon/api/v1`
- Catalog: `GET /models` → HTTP `200`, 16 models
- Inference: `POST /chat/completions` → HTTP `200`
- Requested model: `DeepSeek-V4-Flash`
- Response model: `self-dploy/DeepSeek-V4-Flash`
- Standalone response ID: `f1ae81867a234b21909370b902fe81d1`
- Standalone usage: 18 prompt, 41 completion, 59 total tokens
- Quota immediately after proof: approximately `$0.999986` remaining from the documented daily `$1` team limit

Generated-content excerpt: CommerceOS helps merchants make better fulfillment decisions by combining operational evidence to explain routing, timing, and cost trade-offs.

No credential, authorization header, organizer account identifier, cookie, or raw provider response is stored here.

## CommerceOS integration proof

The real `at_risk` PromiseGuard synthetic preset ran through the deterministic evaluator and the new AMD adapter:

- Deterministic assessment: `at_risk`
- Human review: required
- Analysis status with live advisory: `needs_review`
- Provider ID: `amd-token-factory`
- Response model: `self-dploy/DeepSeek-V4-Flash`
- Provenance: `live`
- Duration: 20,536 ms
- Constrained actions returned: resolve blocker, verify inventory, obtain a current readiness estimate, and reassess the customer-facing commitment

The actual loopback Next.js route was then tested end to end. `POST /api/v1/promiseguard/analyze` returned HTTP `200` in 21.3 seconds with `needs_review`, the unchanged deterministic `at_risk` assessment, required human review, live Token Factory provenance, and five reconciled actions. The loopback server was stopped immediately afterward.

The model did not calculate or modify the verdict. CommerceOS supplied only validated synthetic findings and deterministic action/evidence candidates, then validated and reconciled the returned JSON before accepting it.

## Security boundary

- The endpoint is hard-coded to the organizer-documented AMD host; callers cannot redirect credentials.
- Credentials are server-only and must never use a `NEXT_PUBLIC_` variable.
- Non-synthetic requests are rejected before the network call.
- Caller request IDs and trace IDs are not sent to the provider.
- Provider errors and bodies are normalized without credential or payload disclosure.
- Cancellation and a 60-second timeout bound quota use.
- There is no live-to-mock fallback.
- `NODE_ENV=production` rejects `INFERENCE_PROVIDER=amd-token-factory` pending a separately approved public access-control design.
- MarginLeak remains `planned`, its production routes remain denied, and it never invokes AI for financial calculations.

## Controlled local demonstration

```powershell
. .\scripts\Read-TokenFactoryKey.ps1
$env:AMD_TOKEN_FACTORY_MODEL = "DeepSeek-V4-Flash"
$env:INFERENCE_PROVIDER = "amd-token-factory"
pnpm --filter @commerceos/app dev --hostname 127.0.0.1 --port 3000
```

Use only the built-in synthetic PromiseGuard scenarios. The Token Factory trial documentation prohibits sensitive workloads and indicates short-term prompt/output retention.

## Deployment decision

No live AMD behavior is merged or enabled in the public Vercel deployment by this mission. Before any such change, the operator must approve an access-control design that prevents unrestricted public quota consumption and must authorize the merge and deployment explicitly.

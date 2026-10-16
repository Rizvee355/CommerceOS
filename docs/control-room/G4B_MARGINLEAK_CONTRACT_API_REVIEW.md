# G4B MarginLeak Contract and Synthetic API Review

## Review status

MarginLeak G4B is a versioned contract and synthetic-analysis API candidate. It is not production authorization. MarginLeak remains `planned`; the endpoint is not advertised by the capability registry and must not be deployed for production users.

## API purpose

`POST /api/v1/marginleak/analyze` accepts source-backed synthetic financial evidence for one order in one currency and returns a deterministic contribution-margin variance assessment. It does not perform accounting close, reconciliation, persistence, authentication, commerce integration, or AI inference.

```text
synthetic evidence
  -> 16 KiB bounded JSON reader
  -> strict MarginLeak v1 request schema
  -> reviewed G4A.2 deterministic evaluator
  -> canonical response adapter
  -> strict MarginLeak v1 response schema
  -> JSON response with request-scoped trace metadata
```

## Canonical v1 contracts

Zod schemas are authoritative under `packages/contracts/src/v1`. Generated JSON Schema and OpenAPI 3.1 artifacts live under `packages/contracts/generated`.

The request uses:

- `schemaVersion: "1.0"`;
- `moduleId: "marginleak"`;
- a synthetic scenario and opaque order reference;
- one ISO 4217 currency;
- `observationState: "final" | "provisional"`;
- only the eight approved category keys, each optional so absent expected or observed evidence remains explicitly incomplete;
- nonnegative integer minor-unit amounts capped at `562949953421311`;
- unique evidence IDs and UTC source timestamps.

The response uses the shared analysis envelope fields plus deterministic MarginLeak data: assessment, evidence completeness, finality, order and currency, aggregate totals, category comparisons, findings, missing evidence paths, evidence references, ruleset version, and human-review metadata. No inference or recommendation field is emitted.

## Financial definitions

```text
contribution margin =
    gross item revenue
  + shipping revenue
  - discounts
  - cost of goods sold
  - shipping cost
  - fulfillment cost
  - payment processing cost
  - platform cost

net contribution variance = expected contribution margin - observed contribution margin

confirmed leak amount = max(net contribution variance, 0)
                        only for complete final evidence
```

A positive signed variance is adverse; a negative variance is favorable. Favorable component movement can offset adverse movement. A negative observed contribution margin is not automatically leakage. Unknown evidence is never converted to zero.

## Human-review policy

Human review is required when the result is `leak_detected` or `indeterminate`. Incomplete evidence returns null aggregate totals. Complete provisional evidence retains both contribution margins and signed variance but returns `leakAmount: null`. Only a complete final `no_leak_detected` result avoids review.

## Complete success response example

This is the complete deterministic response shape for the canonical final no-leak fixture. UUIDs and timestamps are request-scoped examples; they do not identify a stored audit record.

```json
{
  "schemaVersion": "1.0",
  "moduleId": "marginleak",
  "analysisStatus": "complete",
  "metadata": {
    "requestId": "52dd0dc8-dcd2-4131-85ec-c14a9af75e88",
    "traceId": "90c3d1ef-97ee-454d-92ce-5e16609ae170",
    "receivedAt": "2026-10-17T00:02:00.000Z",
    "respondedAt": "2026-10-17T00:02:00.010Z"
  },
  "scenario": {
    "scenarioId": "ml-no-leak",
    "synthetic": true
  },
  "deterministic": {
    "data": {
      "assessment": "no_leak_detected",
      "evidenceCompleteness": "complete",
      "observationState": "final",
      "orderRef": "ORDER-SYN-NO-LEAK",
      "currency": "USD",
      "totals": {
        "expectedContributionMargin": {
          "amountMinor": 4900,
          "currency": "USD"
        },
        "observedContributionMargin": {
          "amountMinor": 5200,
          "currency": "USD"
        },
        "netContributionVariance": { "amountMinor": -300, "currency": "USD" },
        "leakAmount": { "amountMinor": 0, "currency": "USD" }
      },
      "categoryComparisons": [
        {
          "category": "grossItemRevenue",
          "role": "revenue",
          "expected": { "amountMinor": 10000, "currency": "USD" },
          "observed": { "amountMinor": 9900, "currency": "USD" },
          "direction": "adverse",
          "varianceAmount": { "amountMinor": 100, "currency": "USD" },
          "expectedEvidenceId": "nl-gross-expected",
          "observedEvidenceId": "nl-gross-observed"
        },
        {
          "category": "shippingRevenue",
          "role": "revenue",
          "expected": { "amountMinor": 1000, "currency": "USD" },
          "observed": { "amountMinor": 1000, "currency": "USD" },
          "direction": "neutral",
          "varianceAmount": { "amountMinor": 0, "currency": "USD" },
          "expectedEvidenceId": "nl-shipping-revenue-expected",
          "observedEvidenceId": "nl-shipping-revenue-observed"
        },
        {
          "category": "discounts",
          "role": "deduction",
          "expected": { "amountMinor": 500, "currency": "USD" },
          "observed": { "amountMinor": 500, "currency": "USD" },
          "direction": "neutral",
          "varianceAmount": { "amountMinor": 0, "currency": "USD" },
          "expectedEvidenceId": "nl-discounts-expected",
          "observedEvidenceId": "nl-discounts-observed"
        },
        {
          "category": "cogs",
          "role": "deduction",
          "expected": { "amountMinor": 4000, "currency": "USD" },
          "observed": { "amountMinor": 3700, "currency": "USD" },
          "direction": "favorable",
          "varianceAmount": { "amountMinor": 300, "currency": "USD" },
          "expectedEvidenceId": "nl-cogs-expected",
          "observedEvidenceId": "nl-cogs-observed"
        },
        {
          "category": "shippingCost",
          "role": "deduction",
          "expected": { "amountMinor": 800, "currency": "USD" },
          "observed": { "amountMinor": 700, "currency": "USD" },
          "direction": "favorable",
          "varianceAmount": { "amountMinor": 100, "currency": "USD" },
          "expectedEvidenceId": "nl-shipping-cost-expected",
          "observedEvidenceId": "nl-shipping-cost-observed"
        },
        {
          "category": "fulfillmentCost",
          "role": "deduction",
          "expected": { "amountMinor": 300, "currency": "USD" },
          "observed": { "amountMinor": 300, "currency": "USD" },
          "direction": "neutral",
          "varianceAmount": { "amountMinor": 0, "currency": "USD" },
          "expectedEvidenceId": "nl-fulfillment-expected",
          "observedEvidenceId": "nl-fulfillment-observed"
        },
        {
          "category": "paymentCost",
          "role": "deduction",
          "expected": { "amountMinor": 300, "currency": "USD" },
          "observed": { "amountMinor": 300, "currency": "USD" },
          "direction": "neutral",
          "varianceAmount": { "amountMinor": 0, "currency": "USD" },
          "expectedEvidenceId": "nl-payment-expected",
          "observedEvidenceId": "nl-payment-observed"
        },
        {
          "category": "platformCost",
          "role": "deduction",
          "expected": { "amountMinor": 200, "currency": "USD" },
          "observed": { "amountMinor": 200, "currency": "USD" },
          "direction": "neutral",
          "varianceAmount": { "amountMinor": 0, "currency": "USD" },
          "expectedEvidenceId": "nl-platform-expected",
          "observedEvidenceId": "nl-platform-observed"
        }
      ],
      "findings": [
        {
          "code": "ADVERSE_COMPONENT_VARIANCE",
          "impact": "adverse",
          "category": "grossItemRevenue",
          "amount": { "amountMinor": 100, "currency": "USD" },
          "evidenceIds": ["nl-gross-expected", "nl-gross-observed"]
        },
        {
          "code": "FAVORABLE_COMPONENT_VARIANCE",
          "impact": "favorable",
          "category": "cogs",
          "amount": { "amountMinor": 300, "currency": "USD" },
          "evidenceIds": ["nl-cogs-expected", "nl-cogs-observed"]
        },
        {
          "code": "FAVORABLE_COMPONENT_VARIANCE",
          "impact": "favorable",
          "category": "shippingCost",
          "amount": { "amountMinor": 100, "currency": "USD" },
          "evidenceIds": [
            "nl-shipping-cost-expected",
            "nl-shipping-cost-observed"
          ]
        }
      ],
      "missingEvidencePaths": []
    },
    "rulesetVersion": "marginleak-contribution-g4a.1",
    "evidenceRefs": [
      {
        "evidenceId": "nl-gross-expected",
        "factPath": "/financials/grossItemRevenue/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-gross-observed",
        "factPath": "/financials/grossItemRevenue/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-shipping-revenue-expected",
        "factPath": "/financials/shippingRevenue/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-shipping-revenue-observed",
        "factPath": "/financials/shippingRevenue/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-discounts-expected",
        "factPath": "/financials/discounts/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-discounts-observed",
        "factPath": "/financials/discounts/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-cogs-expected",
        "factPath": "/financials/cogs/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-cogs-observed",
        "factPath": "/financials/cogs/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-shipping-cost-expected",
        "factPath": "/financials/shippingCost/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-shipping-cost-observed",
        "factPath": "/financials/shippingCost/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-fulfillment-expected",
        "factPath": "/financials/fulfillmentCost/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-fulfillment-observed",
        "factPath": "/financials/fulfillmentCost/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-payment-expected",
        "factPath": "/financials/paymentCost/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-payment-observed",
        "factPath": "/financials/paymentCost/observed",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-platform-expected",
        "factPath": "/financials/platformCost/expected",
        "sourceKind": "synthetic_fixture"
      },
      {
        "evidenceId": "nl-platform-observed",
        "factPath": "/financials/platformCost/observed",
        "sourceKind": "synthetic_fixture"
      }
    ]
  },
  "humanReview": {
    "required": false,
    "reasonCodes": [],
    "decidedBy": "deterministic_policy",
    "policyVersion": "marginleak-review-g4a.1"
  }
}
```

## Complete validation-error example

```json
{
  "schemaVersion": "1.0",
  "requestId": "52dd0dc8-dcd2-4131-85ec-c14a9af75e88",
  "traceId": "90c3d1ef-97ee-454d-92ce-5e16609ae170",
  "timestamp": "2026-10-17T00:02:00.000Z",
  "error": {
    "code": "INVALID_REQUEST",
    "category": "validation",
    "message": "The request did not match the MarginLeak contract.",
    "retryable": false,
    "fieldErrors": [
      {
        "path": "/financials/paymentCost/observed/amountMinor",
        "code": "INVALID_FIELD",
        "message": "The field is invalid."
      }
    ]
  }
}
```

The error never echoes the invalid value or an internal stack. Transport status mapping is 400 malformed JSON, 413 oversized body, 415 unsupported media type, 422 contract validation, and 500 sanitized unexpected failure. Unsupported methods are handled by Next.js with 405.

## Synthetic scenarios

- **Healthy final:** observed margin meets or exceeds expected margin; `leakAmount` is zero and review is not required.
- **Adverse final:** complete final evidence has positive net variance; confirmed leakage equals that variance and review is required.
- **Incomplete:** one or more expected or observed values are absent; all aggregate totals are null and review is required.
- **Provisional:** all inputs may be calculated, but `leakAmount` is null until observations are final.
- **Negative contribution:** classification still depends on expected-versus-observed variance, not the sign of observed margin.
- **Offsetting movement:** favorable cost movement can offset adverse revenue or expense movement in the net order result.

## Compatibility results

- Contract additions are new exports; existing PromiseGuard schema meanings are unchanged.
- The existing generic analysis envelope accepts the MarginLeak response.
- The OpenAPI generator retains health, capabilities, and PromiseGuard paths and adds the MarginLeak path.
- The local G4A fixtures keep `prototypeVersion: "g4a.1"`; the external canonical API uses `schemaVersion: "1.0"`.
- The capability registry remains unchanged with MarginLeak `planned` and no advertised routes.

The preview route may exist while the capability remains planned because the route is a review artifact for synthetic contract validation. Registry state represents production readiness and user availability, neither of which G4B grants.

## Security assessment and production blockers

Implemented controls:

- strict schemas reject unknown fields and non-synthetic scenarios;
- request currency must match every observation;
- evidence identifiers must be unique;
- response totals, category roles, directions, findings, evidence paths, and review reasons are reconciled before emission;
- timestamps must be UTC;
- amounts must be nonnegative exact integers within the reviewed bound;
- body size is enforced from both declared length and actual streamed bytes;
- invalid UTF-8 and malformed JSON fail closed;
- field errors expose paths but not submitted values;
- internal exceptions use the sanitized shared error envelope;
- the route performs no logging, persistence, outbound calls, or secret access.

Deployment blockers:

- no authentication or authorization;
- no tenant isolation;
- no rate limiting or abuse protection;
- no production source authority or evidence-ingestion policy;
- no persistence, idempotency, or audit-record retention;
- unresolved taxes, refunds, returns, fee reconciliation, materiality, finality, multi-currency, and allocation policies.

## Future AMD inference boundary — design only

A later G0-authorized adapter may consume an immutable view of the deterministic response:

```ts
type FutureMarginLeakExplanationInput = {
  requestId: string;
  traceId: string;
  assessment: "leak_detected" | "no_leak_detected" | "indeterminate";
  totals: MarginLeakDeterministicData["totals"];
  findings: MarginLeakFinding[];
  evidenceRefs: EvidenceRef[];
};

type FutureMarginLeakExplanationOutput = {
  summary: string;
  uncertainty: string;
  actions: Array<{
    actionCode: string;
    priority: number;
    explanation: string;
    evidenceIds: string[];
  }>;
  evidenceRefs: string[];
};
```

The adapter may explain findings, rank merchant-actionable mitigations, state uncertainty, and recommend a human-review step. It may not change deterministic amounts, assessment, finality, evidence completeness, or review requirements; fabricate recoverable cash; or run without validated evidence references. G4B implements no provider, credentials, model calls, fallback, or mock inference.

## Test evidence

- Canonical contract tests cover strict parsing, versions, currency, timestamps, duplicate evidence, amount boundaries, aggregate/category reconciliation, provenance, finding/review contradictions, and generic-envelope compatibility.
- G4A.2 domain tests preserve negative-contribution semantics and independently cross-check safe aggregate extremes with `BigInt`.
- Orchestrator tests cover final leak, final no-leak, incomplete, provisional, metadata, and evidence references.
- Route tests cover valid outcomes, validation classes, declared and streamed size limits, invalid UTF-8, error sanitization, and governance state.
- Playwright sends the canonical fixture through the built Next.js server and verifies unsupported GET behavior. This is HTTP API coverage, not MarginLeak frontend coverage.

Final command counts and GitHub CI status belong in the PR verification record after the complete quality gate.

## Recommended G4C frontend requirements

- Clearly label all data as synthetic preview data.
- Display expected, observed, and signed variance separately from confirmed leakage.
- Never label provisional variance as recovered or recoverable cash.
- Distinguish zero from missing evidence.
- Show finality, completeness, evidence references, ruleset, and review reason codes.
- Render adverse and favorable movements without hiding net offsets.
- Do not expose the route as production-active while capability state is `planned`.
- Add accessible loading, validation, empty, and review-required states without changing backend calculations.

## Windows PowerShell 5.1 operator guide

```powershell
Set-Location -LiteralPath 'D:\AI\Workspaces\CommerceOS-Codex'

pnpm install --frozen-lockfile
pnpm contracts:check
pnpm test
pnpm build
pnpm test:e2e
pnpm security:deps
```

Start the built application in a separate PowerShell window:

```powershell
Set-Location -LiteralPath 'D:\AI\Workspaces\CommerceOS-Codex'
$env:INFERENCE_PROVIDER = 'disabled'
pnpm --filter '@commerceos/app' start --hostname 127.0.0.1
```

Submit the canonical synthetic fixture:

```powershell
Set-Location -LiteralPath 'D:\AI\Workspaces\CommerceOS-Codex'
$body = Get-Content -Raw -LiteralPath '.\packages\contracts\fixtures\v1\marginleak\valid\no-leak-request.json'
$response = Invoke-RestMethod -Method Post -Uri 'http://127.0.0.1:3000/api/v1/marginleak/analyze' -ContentType 'application/json' -Body $body
$response | ConvertTo-Json -Depth 20
```

No secret, API key, customer record, or external service is required.

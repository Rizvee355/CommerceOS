# MarginLeak G4B Contract and Synthetic API Design

**Status:** Control Room-authorized implementation design for a stacked draft PR.

**Parent:** PR #4 at `3e2116b4cc818dff08a116016daa3b8d6fecf71f`.

## Purpose

Promote the reviewed MarginLeak G4A.2 semantics into additive CommerceOS v1 contracts and expose them through a synthetic-only `POST /api/v1/marginleak/analyze` preview route. The route must produce deterministic, source-backed contribution-margin variance without persistence, authentication, commerce integrations, or inference.

## Selected architecture

The canonical Zod schemas live under `packages/contracts/src/v1`, following ADR 0002. The existing G4A.2 evaluator remains the only financial calculator. Its input boundary is narrowed to the financial fields it actually consumes so both the prototype fixtures and canonical API requests can use it without duplicating arithmetic. A MarginLeak server orchestrator converts the evaluator result into the canonical response envelope, adds server-generated request metadata, and enumerates evidence references without inventing evidence.

The Next.js App Router route validates media type, byte size, JSON syntax, and the canonical request schema before calling the orchestrator. It returns the existing sanitized error envelope for failures. The capability registry remains unchanged: a reviewable synthetic preview endpoint does not mean the module is production-active.

## Alternatives considered

1. **Canonical schemas plus a thin domain adapter — selected.** Preserves the reviewed evaluator, makes contract authority explicit, and avoids duplicate calculations.
2. **Rewrite the evaluator around new response types.** Rejected because it needlessly risks reviewed financial semantics.
3. **Keep schemas inside the route.** Rejected because it would create a second contract authority and omit generated artifacts.

## Contract design

Both request and response use `schemaVersion: "1.0"` and `moduleId: "marginleak"`.

The strict request contains a synthetic scenario, opaque order reference, currency, finality, and the fixed eight-category financial map. Each optional expected or observed entry has a nonnegative exact integer minor-unit amount, matching currency, unique evidence ID, and synthetic source details. Omission represents unknown evidence; no value is defaulted to zero. Component amounts retain the reviewed `floor(Number.MAX_SAFE_INTEGER / 16)` bound.

The strict response uses the shared analysis envelope fields and contains:

- request-scoped response metadata;
- the synthetic scenario;
- deterministic data with assessment, completeness, finality, currency, order reference, totals, comparisons, findings, and missing paths;
- ruleset version and submitted evidence references;
- deterministic human-review metadata.

No inference or AI recommendation field is emitted. Deterministic analysis is authoritative for this mission. `analysisStatus` is `complete` only for a complete final no-leak result; every review-required result uses `needs_review`.

Response invariants reject contradictory states: incomplete totals are all null; complete provisional evidence retains both margins and signed variance but has null `leakAmount`; complete final evidence has a nonnegative `leakAmount` consistent with signed variance; assessment, review metadata, and analysis status must agree.

## Financial semantics

For expected and observed inputs independently:

```text
contribution margin = gross item revenue + shipping revenue
                    - discounts - COGS - shipping cost
                    - fulfillment cost - payment cost - platform cost

net contribution variance = expected contribution margin - observed contribution margin
confirmed leak amount = max(net contribution variance, 0)
                        only for complete final evidence
```

Incomplete evidence yields null aggregate totals. Complete provisional evidence yields margins and signed variance but null confirmed leakage. Negative contribution is not itself leakage; only adverse expected-versus-observed variance on complete final evidence can produce confirmed leakage.

## HTTP and security boundary

The route runs in the Node.js runtime, accepts only `application/json`, and enforces the existing 16 KiB request limit both from declared length and streamed bytes. Malformed JSON returns 400, oversized bodies 413, unsupported media 415, schema failures 422, and unexpected failures a sanitized 500. Validation errors expose paths but never submitted values. The route performs no logging, network calls, persistence, inference, credential access, or browser logic.

The preview is publicly reachable if deployed because authentication and rate limiting are not implemented. Deployment remains blocked until those controls and tenant isolation are authorized.

## Compatibility and governance

Contract changes are additive exports and generated artifacts. PromiseGuard schemas, evaluator, route, and inference behavior remain unchanged. MarginLeak remains `planned`, RescueCart remains disabled, and no capability routes are advertised. The stacked PR targets `codex/g4-marginleak-domain-prototype`, not `main`.

## Future AMD boundary

A future separately authorized adapter may receive only the validated deterministic result plus evidence identifiers to explain findings, rank merchant actions, state uncertainty, and recommend a review step. It must not alter amounts, assessment, review policy, or claim recoverable cash. G4B defines this interface in documentation only and makes no provider call.

## Verification strategy

Contract tests cover valid and invalid money, currency, timestamps, evidence identity, unknown fields, versions, response invariants, generic-envelope compatibility, and artifact generation. Domain tests preserve all G4A.2 scenarios and arithmetic extremes. Orchestrator tests prove truthful metadata and evidence mapping. Route tests cover success, all validation classes, size limits, sanitization, and injected failure. A Playwright API test sends at least one complete request through the running Next.js server and confirms unsupported methods. Full repository gates prove PromiseGuard compatibility and build integrity.

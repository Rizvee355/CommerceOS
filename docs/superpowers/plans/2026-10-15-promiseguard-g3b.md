# PromiseGuard G3B Backend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved synthetic-only PromiseGuard dispatch-readiness backend, deterministic evaluator, constrained mock inference, stateless API route, generated contracts, and verification without frontend or live AMD work.

**Architecture:** Add PromiseGuard-specific canonical Zod contracts to the existing v1 package without changing generic envelope semantics. Keep evaluation as a pure feature-domain function with an injected clock, place provider orchestration behind the existing server-only inference interface, and expose exactly one size- and content-type-guarded Next.js route.

**Tech Stack:** TypeScript 6 strict mode, Zod 4, Next.js 16 App Router, Vitest 5, pnpm 12, existing OpenAPI/JSON Schema generator.

**Spec:** `docs/control-room/CommerceOS_G3A_Control_Room_Reconciliation_v1.md` (copied from the user-approved attachment in Task 1)

## Global Constraints

- Base all work on `d58ec726afb96ffa5ea4d90371f32f2fa82d08dd` in branch `codex/g3b-promiseguard-domain`.
- Implement only `POST /api/v1/promiseguard/analyze`; no other PromiseGuard routes.
- Keep PromiseGuard capability `stub`, MarginLeak `planned`, and RescueCart `disabled`.
- Initial requests are synthetic-only; reject non-synthetic scenarios and non-synthetic evidence origins.
- No customer PII, persistence, commerce integrations, frontend implementation, public deployment, or live AMD adapter.
- Production inference remains explicitly disabled; mock is development/test only with no network and honest `synthetic_mock` provenance.
- Business assessment and generic `analysisStatus` remain distinct.
- All product schemas remain compatible with the actual G2 generic v1 envelope.

## Review Focus

- An expired adverse snapshot must not establish present risk; it yields uncertainty unless another current adverse fact exists.
- A missing optional readiness estimate must point to its JSON field path and never fabricate an evidence ID.
- A current `ready` fulfillment state must make a conflicting readiness estimate irrelevant rather than adverse.
- Oversized malformed JSON must return `413` before parsing, while an in-size malformed body returns `400`.
- AI actions must use allowlisted codes, ordered priorities, compatible deterministic findings, and existing validated evidence IDs.

---

### Task 1: Approval record and canonical PromiseGuard contracts

**Files:**

- Create: `docs/control-room/CommerceOS_G3A_Control_Room_Reconciliation_v1.md`
- Create: `docs/control-room/G3B-IMPLEMENTATION-NOTES.md`
- Create: `packages/contracts/src/v1/promiseguard.ts`
- Create: `packages/contracts/src/v1/promiseguard.test.ts`
- Create: `packages/contracts/fixtures/v1/promiseguard/valid/supported.json`
- Create: `packages/contracts/fixtures/v1/promiseguard/valid/at-risk.json`
- Create: `packages/contracts/fixtures/v1/promiseguard/valid/indeterminate.json`
- Modify: `packages/contracts/src/v1/index.ts`
- Modify: `packages/contracts/scripts/generate-artifacts.ts`
- Modify: `packages/contracts/scripts/generate-artifacts.test.ts`
- Modify: `packages/contracts/README.md`
- Generate: `packages/contracts/generated/json-schema/*.json`
- Generate: `packages/contracts/generated/openapi/openapi.json`

**Interfaces:**

- Consumes: G2 generic response, inference, evidence, metadata, review, and scenario schemas.
- Produces: `promiseGuardEvaluationRequestSchema`, `promiseGuardDeterministicDataSchema`, `promiseGuardAiMitigationOutputSchema`, `promiseGuardEvaluationResponseSchema`, and their inferred types.

- [ ] Write contract and artifact tests for strict synthetic-only requests, UTC timestamps, unique evidence IDs, validity intervals, blocker codes, typed findings, response/generic cross-validation, AI references, and the `/analyze` OpenAPI operation.
- [ ] Run the focused tests and confirm they fail because PromiseGuard schemas and artifacts do not exist.
- [ ] Add the approved specification record and separate implementation assumptions.
- [ ] Implement the smallest Zod contract module and exports that satisfy the tests.
- [ ] Extend artifact generation and generate JSON Schema/OpenAPI output.
- [ ] Run contract tests, type checking, and artifact drift checks until green.
- [ ] Commit the contract deliverable.

### Task 2: Pure evaluator and relative synthetic presets

**Files:**

- Create: `apps/commerceos/src/features/promiseguard/domain/evaluate.ts`
- Create: `apps/commerceos/src/features/promiseguard/domain/evaluate.test.ts`
- Create: `apps/commerceos/src/features/promiseguard/domain/presets.ts`
- Create: `apps/commerceos/src/features/promiseguard/domain/presets.test.ts`

**Interfaces:**

- Consumes: `PromiseGuardEvaluationRequest`, deterministic data/finding schemas, `EvidenceRef`, and `HumanReviewMetadata`.
- Produces: `evaluatePromiseGuard(input, asOf)` and `createPromiseGuardPreset(id, asOf)`.

- [ ] Write table-driven evaluator tests covering all approved freshness, deadline, adverse-precedence, missing-path, contradiction, review, and repeatability behavior.
- [ ] Run the focused tests and confirm failure because the evaluator and presets do not exist.
- [ ] Implement evidence-reference construction and the pure deterministic evaluator using only the injected `asOf` clock.
- [ ] Implement three relative synthetic presets that remain valid as calendar time advances.
- [ ] Run evaluator, preset, contract, and type-check tests until green.
- [ ] Commit the deterministic domain deliverable.

### Task 3: Constrained mock fixtures and inference orchestration

**Files:**

- Modify: `packages/inference/src/index.ts`
- Modify: `packages/inference/src/inference.test.ts`
- Create: `apps/commerceos/src/features/promiseguard/server/analyze.ts`
- Create: `apps/commerceos/src/features/promiseguard/server/analyze.test.ts`

**Interfaces:**

- Consumes: G2 `InferenceProvider`, PromiseGuard evaluator, AI mitigation schema, and generic inference metadata.
- Produces: `analyzePromiseGuard(input, dependencies)` returning a fully validated PromiseGuard response.

- [ ] Write failing tests for disabled inference, mock success, mock timeout/unavailable/malformed output, action compatibility, evidence-reference validation, no fallback, and generic response compatibility.
- [ ] Run focused tests and confirm failures against the missing orchestration/domain fixtures.
- [ ] Add only approved synthetic PromiseGuard fixtures to the shared deterministic mock; retain existing foundation fixtures and no-network behavior.
- [ ] Implement orchestration that preserves deterministic output, validates all model output, maps normalized provider errors, and never changes the business assessment.
- [ ] Run inference/orchestration tests and type checking until green.
- [ ] Commit the inference deliverable.

### Task 4: Guarded stateless API route and full verification

**Files:**

- Modify: `apps/commerceos/src/server/api/responses.ts`
- Modify: `apps/commerceos/src/server/api/responses.test.ts`
- Create: `apps/commerceos/src/app/api/v1/promiseguard/analyze/route.ts`
- Create: `apps/commerceos/src/app/api/v1/promiseguard/analyze/route.test.ts`
- Modify: `docs/GATES.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: PromiseGuard request/response schemas, orchestration, G2 server configuration, and standard error envelope.
- Produces: exactly one `POST /api/v1/promiseguard/analyze` route and sanitized typed API errors.

- [ ] Write failing route/response tests for `200`, `400`, `413`, `415`, `422`, error sanitization, fixed server metadata, disabled inference, and capability truthfulness.
- [ ] Run focused tests and confirm failure because the route and typed error helper do not exist.
- [ ] Implement reusable sanitized error-envelope construction and the route with a 16 KiB UTF-8 body limit and exact JSON media-type enforcement.
- [ ] Confirm the registry remains `stub` and no frontend files change.
- [ ] Run focused API tests and type checking until green.
- [ ] Update G3B status documentation without claiming active UX or AMD availability.
- [ ] Run frozen install, formatting, lint, typecheck, contract drift, full unit/coverage tests, production build, browser smoke, secret scan, and production dependency audit.
- [ ] Review the complete diff for scope, generated artifacts, secrets, and unexpected files; commit the final deliverable.

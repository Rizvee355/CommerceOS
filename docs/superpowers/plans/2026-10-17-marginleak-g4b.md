# MarginLeak G4B Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add canonical MarginLeak v1 contracts and a synthetic-only deterministic analysis API while preserving G4A.2 financial behavior.

**Architecture:** Canonical Zod schemas and generated artifacts define the external boundary. The frozen domain evaluator remains the sole calculator; a server orchestrator maps its output into the canonical envelope, and a strict Next.js route handles transport validation and sanitized errors.

**Tech Stack:** TypeScript 6, Zod 4, Next.js 16 App Router, Vitest 5, Playwright 1.63, pnpm 12.

**Spec:** `docs/superpowers/specs/2026-10-17-marginleak-g4b-design.md`

## Global Constraints

- Preserve single-order, single-currency G4A.2 semantics and exact integer minor-unit arithmetic.
- `leakAmount` is non-null only for complete final evidence.
- Do not modify PromiseGuard behavior, inference packages, capability status, frontend, persistence, or infrastructure.
- MarginLeak remains synthetic-only and `planned`; no AMD calls or production claims.
- Keep the PR stacked on `codex/g4-marginleak-domain-prototype`.

## Review Focus

- Unknown versus explicit zero: missing evidence must remain indeterminate and never be zero-filled.
- Provisional adverse variance: margins and variance remain visible but confirmed leakage stays null.
- Cross-currency and duplicate evidence: request parsing must reject both with precise paths.
- Safe-integer extremes: contract bounds and evaluator totals must remain exactly representable.
- Error privacy: schema and internal failures must not echo submitted financial values or exception text.

---

### Task 1: Canonical MarginLeak v1 contracts

**Files:**

- Create: `packages/contracts/src/v1/marginleak.ts`
- Create: `packages/contracts/src/v1/marginleak.test.ts`
- Create: `packages/contracts/fixtures/v1/marginleak/valid/*.json`
- Modify: `packages/contracts/src/v1/index.ts`
- Modify: `packages/contracts/README.md`

**Interfaces:**

- Produces: `marginLeakEvaluationRequestSchema`, `marginLeakEvaluationResponseSchema`, MarginLeak types, categories, roles, and maximum amount constant.

- [ ] Write failing request tests for valid, incomplete, provisional, currency mismatch, duplicates, timestamps, unknown fields, version mismatch, and monetary boundaries.
- [ ] Run the focused contract test and confirm failures are caused by missing schemas.
- [ ] Implement strict request schemas and additive exports.
- [ ] Write failing response tests for valid final, incomplete, provisional, contradictory leak, review, and generic-envelope states.
- [ ] Implement response schemas and cross-field invariants.
- [ ] Run all contract tests and typecheck.

### Task 2: Generated JSON Schema and OpenAPI

**Files:**

- Modify: `packages/contracts/scripts/generate-artifacts.ts`
- Modify: `packages/contracts/scripts/generate-artifacts.test.ts`
- Generate: `packages/contracts/generated/json-schema/marginleak-evaluation-*.schema.json`
- Modify: `packages/contracts/generated/openapi/openapi.json`

**Interfaces:**

- Consumes: canonical schemas from Task 1.
- Produces: drift-checked JSON Schema and `POST /api/v1/marginleak/analyze` OpenAPI operation.

- [ ] Write failing artifact tests for both schemas and the new route.
- [ ] Register schemas and route in the generator.
- [ ] Generate artifacts and run generator tests plus drift check.

### Task 3: Frozen evaluator adapter and orchestration

**Files:**

- Modify: `apps/commerceos/src/features/marginleak/domain/schema.ts`
- Modify: `apps/commerceos/src/features/marginleak/domain/evaluate.ts`
- Create: `apps/commerceos/src/features/marginleak/server/analyze.ts`
- Create: `apps/commerceos/src/features/marginleak/server/analyze.test.ts`

**Interfaces:**

- Consumes: `MarginLeakEvaluationRequest`.
- Produces: `analyzeMarginLeak(request, { now, randomUUID })` returning `MarginLeakEvaluationResponse`.

- [ ] Write failing orchestration tests for final leak, final no-leak, incomplete, provisional, trace metadata, and evidence references.
- [ ] Narrow the evaluator input type without changing calculations.
- [ ] Implement the canonical response adapter and parse its output through the response schema.
- [ ] Run server, domain, and contract suites; compare G4A.2 arithmetic outputs unchanged.

### Task 4: Synthetic analysis route

**Files:**

- Create: `apps/commerceos/src/server/api/json-request.ts`
- Create: `apps/commerceos/src/server/api/json-request.test.ts`
- Create: `apps/commerceos/src/app/api/v1/marginleak/analyze/route.ts`
- Create: `apps/commerceos/src/app/api/v1/marginleak/analyze/route.test.ts`

**Interfaces:**

- Consumes: canonical request schema and `analyzeMarginLeak`.
- Produces: strict POST handler with 200/400/413/415/422/500 responses.

- [ ] Write failing parser and route tests for valid requests, all deterministic outcomes, malformed JSON, invalid schema, streamed/declarative oversize, unsupported media, and sanitized injected failure.
- [ ] Implement the bounded JSON reader and route handler with injectable server dependencies.
- [ ] Run focused route, response-envelope, and PromiseGuard route tests.

### Task 5: Real HTTP verification and Control Room documentation

**Files:**

- Create: `apps/commerceos/tests/e2e/marginleak-api.spec.ts`
- Create: `docs/control-room/G4B_MARGINLEAK_CONTRACT_API_REVIEW.md`

**Interfaces:**

- Consumes: built Next.js route and canonical examples.
- Produces: actual-server request evidence, operator guide, security blockers, and G4C/AMD boundaries.

- [ ] Add a failing Playwright API test for a complete synthetic request and unsupported GET.
- [ ] Build and run the HTTP test against the real Next.js server.
- [ ] Write the review document with full success/error examples and Windows PowerShell 5.1 commands.
- [ ] Run formatting and documentation consistency checks.

### Task 6: Adversarial audit, compatibility, and delivery

**Files:**

- Modify only files justified by genuine audit findings.

**Interfaces:**

- Produces: reviewed stacked draft PR with complete local and CI evidence.

- [ ] Dispatch one read-only adversarial reviewer against the full branch diff and mission criteria.
- [ ] Reproduce and fix all Critical or Important findings with red-green tests.
- [ ] Run focused MarginLeak tests, PromiseGuard tests, `pnpm check`, `pnpm test:e2e`, and `pnpm security:deps`.
- [ ] Verify contract drift, capability state, forbidden-path absence, and clean Git status.
- [ ] Commit, push, and create the stacked draft PR targeting `codex/g4-marginleak-domain-prototype`.
- [ ] Wait for GitHub CI and report exact results without merging or deploying.

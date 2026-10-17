# MarginLeak G4A Domain Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an isolated, synthetic-only MarginLeak domain prototype that calculates single-order contribution-margin variance from source-backed expected and observed minor-unit amounts.

**Architecture:** Add a local MarginLeak domain namespace inside the CommerceOS application. A strict local Zod schema validates synthetic financial evidence, and a pure deterministic evaluator produces traceable component comparisons, aggregate variance when complete, and versioned human-review decisions. No shared contract, route, inference, registry, or PromiseGuard code changes.

**Tech Stack:** TypeScript 6, Zod 4, Vitest 5, JSON fixtures, pnpm workspace.

**Spec:** `docs/control-room/G4A_MARGINLEAK_DOMAIN_PROPOSAL.md`

## Global Constraints

- Work only on `codex/g4-marginleak-domain-prototype` from verified `origin/main` SHA `71dfd4514814cc3dd98354aadd88a9811f2ef3b7`.
- Keep all product code under `apps/commerceos/src/features/marginleak/domain/`.
- Do not modify PromiseGuard, `packages/contracts`, `packages/inference`, production routes, the capability registry, or GitHub governance.
- Keep MarginLeak `planned`; do not add persistence, authentication, external integrations, RescueCart, or live inference.
- Follow test-first RED-GREEN-REFACTOR for every production behavior.
- Use only synthetic, non-PII fixtures.

## Review Focus

- A missing amount must remain unknown; it must never be coerced to zero or included in aggregate totals.
- A mixed-currency or duplicate-evidence request must fail local schema validation before evaluation.
- Revenue and cost variance signs must produce the same net result as expected margin minus observed margin.
- Aggregate arithmetic must remain within safe-integer bounds, including worst-case expected-versus-observed variance.
- A complete provisional request may show calculated totals but must remain indeterminate and require review.

---

### Task 1: Local MarginLeak schema

**Files:**

- Create: `apps/commerceos/src/features/marginleak/domain/schema.ts`
- Create: `apps/commerceos/src/features/marginleak/domain/schema.test.ts`

**Interfaces:**

- Consumes: `currencyCodeSchema` from the read-only shared contracts package.
- Produces: `marginLeakPrototypeRequestSchema`, `MarginLeakPrototypeRequest`, `FINANCIAL_CATEGORIES`, `FinancialCategory`, `CONTRIBUTION_ROLES`, and `MAX_COMPONENT_AMOUNT_MINOR`.

- [ ] **Step 1: Write failing schema tests**

Cover a valid complete request and rejection of floats, negatives, unknown properties, mixed currencies, duplicate evidence IDs, non-UTC timestamps, non-synthetic scenarios, and amounts above the safe aggregation bound.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/schema.test.ts`
Expected: FAIL because `./schema` does not exist.

- [ ] **Step 3: Implement the strict local schema and inferred types**

Keep categories fixed, component sides optional for missing-data evaluation, observation magnitudes nonnegative, and evidence identifiers unique across the request.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/schema.test.ts`
Expected: all schema tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat(marginleak): define local G4A financial schema`

### Task 2: Complete deterministic calculation

**Files:**

- Create: `apps/commerceos/src/features/marginleak/domain/evaluate.ts`
- Create: `apps/commerceos/src/features/marginleak/domain/evaluate.test.ts`

**Interfaces:**

- Consumes: validated `MarginLeakPrototypeRequest`, category order, and contribution roles from Task 1.
- Produces: `evaluateMarginLeak(request)` and inferred result types with component breakdown, exact totals, findings, ruleset metadata, and human-review metadata.

- [ ] **Step 1: Write failing evaluator tests for complete final inputs**

Assert the exact expected and observed margins, adverse/favorable/neutral component directions, signed net variance, nonnegative leak amount, leak/no-leak assessments, evidence linkage, stable category order, and human-review decision.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/evaluate.test.ts`
Expected: FAIL because `./evaluate` does not exist.

- [ ] **Step 3: Implement the smallest pure evaluator for complete inputs**

Derive signs from category definitions. Check every aggregate with `Number.isSafeInteger` before returning it.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/evaluate.test.ts`
Expected: complete-input evaluator tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat(marginleak): calculate contribution-margin variance`

### Task 3: Missing and provisional evidence policy

**Files:**

- Modify: `apps/commerceos/src/features/marginleak/domain/evaluate.test.ts`
- Modify: `apps/commerceos/src/features/marginleak/domain/evaluate.ts`

**Interfaces:**

- Consumes: evaluator from Task 2.
- Produces: indeterminate assessment, missing JSON Pointer paths, partial component comparisons, nullable aggregates for incomplete inputs, and provisional-review behavior.

- [ ] **Step 1: Add failing tests for incomplete and provisional requests**

Assert that incomplete inputs do not produce aggregate totals, complete pairs remain traceable, missing paths do not invent evidence IDs, provisional totals remain available, and both cases require review with distinct reason codes.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/evaluate.test.ts`
Expected: new missing/provisional policy tests fail for unimplemented behavior.

- [ ] **Step 3: Implement missing-data and provisional policy**

Do not let a known adverse component determine the net assessment when any required component side is missing.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/evaluate.test.ts`
Expected: all evaluator tests pass.

- [ ] **Step 5: Commit**

Commit message: `feat(marginleak): handle incomplete financial evidence`

### Task 4: Synthetic fixture scenarios

**Files:**

- Create: `apps/commerceos/src/features/marginleak/domain/fixtures/leak-detected.json`
- Create: `apps/commerceos/src/features/marginleak/domain/fixtures/no-leak.json`
- Create: `apps/commerceos/src/features/marginleak/domain/fixtures/indeterminate.json`
- Create: `apps/commerceos/src/features/marginleak/domain/fixtures/provisional.json`
- Create: `apps/commerceos/src/features/marginleak/domain/fixtures.test.ts`

**Interfaces:**

- Consumes: request schema and evaluator from Tasks 1-3.
- Produces: four strict, source-backed synthetic demonstrations with exact expected assessments.

- [ ] **Step 1: Write the fixture contract test before fixture files exist**

Load all four fixture paths, parse them with the local schema, evaluate them, and assert the expected assessment and key amounts.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/fixtures.test.ts`
Expected: FAIL because the fixture files do not exist.

- [ ] **Step 3: Add the minimal synthetic fixture files**

Use opaque order references, unique evidence IDs, UTC timestamps, one currency per fixture, and explicit zeroes where a cost does not apply.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `pnpm exec vitest run apps/commerceos/src/features/marginleak/domain/fixtures.test.ts`
Expected: all fixture scenarios pass.

- [ ] **Step 5: Commit**

Commit message: `test(marginleak): add synthetic variance scenarios`

### Task 5: Documentation and full verification

**Files:**

- Modify: `docs/control-room/G4A_MARGINLEAK_DOMAIN_PROPOSAL.md` only if implementation findings require clarification.
- Keep: `docs/superpowers/plans/2026-10-16-marginleak-g4a.md`.

**Interfaces:**

- Consumes: completed schema, evaluator, fixtures, tests, and actual verification results.
- Produces: an audit-ready branch and draft PR without integration changes.

- [ ] **Step 1: Verify the implementation matches every proposal section**

Check formulas, categories, bounds, missing-data rules, review rules, fixtures, limitations, and prohibited paths.

- [ ] **Step 2: Run focused and repository-wide quality gates**

Run: `pnpm check`, `pnpm test:e2e`, and `pnpm security:deps`.
Expected: all commands exit successfully with no test failures, build failure, contract drift, or high-severity production dependency finding.

- [ ] **Step 3: Inspect the branch diff and protected paths**

Run: `git diff --check origin/main...HEAD` and inspect `git diff --name-only origin/main...HEAD`.
Expected: no whitespace errors and no prohibited path changes.

- [ ] **Step 4: Commit final documentation or verification corrections if needed**

Commit message: `docs(marginleak): finalize G4A domain proposal`

- [ ] **Step 5: Request whole-branch review, fix Critical/Important findings with RED-GREEN tests, and rerun the full gates**

- [ ] **Step 6: Push the branch and create a separate draft PR against `main`**

The PR must identify the base SHA, prototype-only scope, formulas, tests, contract impact (`none`), capability impact (`none`), and the Control Room audit requirement.

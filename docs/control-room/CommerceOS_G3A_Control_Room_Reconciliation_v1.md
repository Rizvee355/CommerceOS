> **Approval record — 2026-10-15:** The CommerceOS owner explicitly approved this reconciliation and authorized G3B backend/domain implementation. The historical status line below is retained verbatim from the reviewed artifact; this approval note supersedes its earlier “PROPOSED” state.

# CommerceOS — G3A Control Room Reconciliation

**Status:** PROPOSED — awaiting explicit G3B authorization. **No code, configuration, or GitHub changes authorized by this document.**

**Baseline:** CommerceOS G2 merged on `main` at `d58ec726afb96ffa5ea4d90371f32f2fa82d08dd`.

**Inputs:** Codex GPT-5.6 Sol G3A domain specification and Antigravity Claude Sonnet 5.5 G3A UX specification. The shipped G2 Zod contracts, not older G1 examples or unapproved UI fields, remain authoritative.

## A. Control Room verdict

- **Codex:** Adopt dispatch-_readiness_ assessment as the sole MVP problem. Accept the deterministic-first design with targeted corrections below. Its submitted TypeScript/Zod schemas are a proposal, **not drop-in implementation code**.
- **Antigravity:** Accept evidence-first, stateless, accessible UX and three synthetic presets. Replace every delivery-date/ship-by/carrier-handoff assumption that is not in the approved contract. Do not build additional product routes or a history view.
- **Scope:** one fulfillment and its merchant-supplied `dispatchBy` timestamp. No prediction of carrier delivery or proof of actual dispatch, no merchant integrations, no persistence, no customer PII, no multi-tenancy, no automated merchant actions. MarginLeak remains planned; RescueCart disabled.

## B. Domain contract for approval

- **API:** `POST /api/v1/promiseguard/analyze` (stateless operation; chosen over Codex's `/evaluations` resource-style name). Malformed JSON -> 400; syntactically valid but invalid/unsupported payload -> 422 with sanitized field paths; successful domain evaluations -> 200 even when assessment is indeterminate. Other failures -> sanitized 5xx as appropriate.
- **Request:** `schemaVersion: '1.0'`, `moduleId: 'promiseguard'`, G2-compatible `scenario`, opaque `fulfillmentRef`, a single `commitment` (`evidenceId`, `kind:'dispatch_by'`, UTC `dispatchBy`), and operational evidence for inventory allocation, fulfillment state, blocking state, with optional ready-time estimate.
- **Evidence:** For each operational snapshot: unique `evidenceId`, explicitly declared origin, UTC `observedAt` and `validUntil` (nullable), plus the typed fact. All evidence IDs must be unique including the commitment ID. For the authorized **synthetic-only** initial scope, origins must be `synthetic_fixture`. Do not claim that a manually entered `system_export` label proves system authenticity. Real, non-synthetic operations require another gate.
- **Allowed states:** inventory `secured|not_secured|unknown`; fulfillment `not_started|in_progress|ready|blocked|unknown`; blocker `none_known|active|unknown`, with allowlisted blocker codes if and only if active; optional `estimatedReadyAt` timestamp.
- **Response:** reuse the **actual G2** `AnalysisResponseEnvelope` field names: `schemaVersion`, `moduleId`, `analysisStatus`, `metadata`, `scenario`, `deterministic`, optional `aiRecommendation`, `humanReview`, and `inference`. Put typed PromiseGuard result in `deterministic.data`. Do not substitute the illustrative earlier G1 `meta` or `module` shapes.
- **Business `deterministic.data.assessment`:** `supported|at_risk|indeterminate`, independent of generic `analysisStatus`. Response also contains typed findings, evidence completeness, and derived deadline/readiness facts. No numeric risk or model confidence.
- **Review:** `humanReview.required` is deterministic, true for `at_risk` and `indeterminate`, false for `supported`; reason codes and policy version must be non-empty and consistent with the assessment when review is required.

## C. Deterministic decision semantics

Evaluate using an **injected server clock**, never a client-supplied clock.

1. Strictly validate incoming data before evaluation. Dates must be UTC; unknown fields, duplicate evidence IDs, impossible validity intervals and inconsistent synthetic provenance are rejected with 422.
2. A snapshot may support a positive or adverse decision only if `observedAt <= asOf`, `validUntil != null`, and `validUntil > asOf`. Invalid, stale, future-dated or unknown-validity facts cannot prove either safety **or risk**; report them as uncertain. `validUntil <= asOf` is expired.
3. An elapsed `dispatchBy <= asOf` is an independent deadline concern: classify **at_risk**, but never claim actual dispatch _failed_ without a dispatch-completion record.
4. Any **current, valid** adverse fact (inventory not secured; fulfillment blocked; blocker active; usable ready estimate after dispatchBy; usable ready estimate already elapsed while fulfillment still unfinished) yields **at_risk**, even if other facts are unknown. Still report missing or contradictory information.
5. Otherwise, any required unknown, missing, stale, invalid or materially contradictory evidence yields **indeterminate** and human review.
6. Otherwise, classify **supported** only if current evidence confirms inventory secured, no active blockers, and either fulfillment `ready` or `not_started|in_progress` with a usable ready estimate `<= dispatchBy` that has not already elapsed. `estimatedReadyAt == dispatchBy` is admissible only as a readiness estimate, never a dispatch guarantee.
7. A present ready-time estimate that conflicts with a `ready` fulfillment state needs an explicit policy: prefer ignoring it as no longer relevant and documenting that choice, rather than silently overriding actual readiness. Test both cases.
8. Every finding must be traceable. For _missing_ facts, a finding can point to the absent field by an approved JSON Pointer without inventing an `evidenceId`. For present facts, IDs must resolve to G2 `deterministic.evidenceRefs`; AI references must resolve to those same validated IDs.

**Important correction to Codex:** “adverse outranks uncertain” applies only to trustworthy **current** adverse evidence. An expired stock-shortfall snapshot cannot prove present-day risk. Also, `MISSING_READY_ESTIMATE` cannot require a non-existent evidence ID.

## D. AI responsibility and demo truthfulness

- Deterministic rules determine the assessment and review requirement. AI must not rewrite them.
- AI's meaningful role is to **select and prioritize evidence-backed mitigations** from an approved action vocabulary and produce a concise operational explanation. This must go beyond paraphrasing a status badge, but every proposed action and evidence ID must be validated against available rule findings.
- Permitted action categories: verify allocation; obtain ready estimate; resolve blocker; escalate to fulfillment lead; reassess the customer-facing commitment. Never auto-send, change promises, or guarantee dispatch/delivery.
- AI recommendation remains optional, clearly separated and marked with `synthetic_mock` or verified `live` provenance; no uncalibrated percentages or confidence.
- G0 AMD is pending. Production uses `disabled` inference; mock remains restricted to explicit local development/test until a **separate** safe public demo policy is approved. Never silently fall back from a selected live provider.
- When inference is disabled/fails: preserve deterministic result, `analysisStatus:'limited'`, `inference.status:'unavailable'`, omit `aiRecommendation`. UI shows a separately identified _deterministic_ template rather than AI-generated text.

## E. UX approval boundaries

- Unified shell, Overview and one PromiseGuard workspace; keep the current single deployable. Main form fields mirror **only** the approved request contract. Antigravity's proposed promised-delivery, carrier handoff, units-ordered/available and last-update fields are **not** in this dispatch-readiness MVP; use inventory allocation status, fulfillment state, blocking state and optional ready estimate instead.
- Results show: commitment and disclaimer; domain assessment; evidence and findings; required human review; optional AI explanation / deterministic unavailable state; suggested actions; trace and provenance.
- Generic `analysisStatus:'limited'` does **not** mean `indeterminate`: one measures AI/result availability, the other business evidence. Render them independently.
- Suggested action “Add this fact” must focus a relevant editable form control. Missing-fact links use field paths, not fabricated evidence IDs.
- Capabilities should become `promiseguard:active` only after the route, UI, and end-to-end tests pass; this can honestly mean deterministic evaluation available even if AI is disabled, as long as inference unavailability is conspicuous.
- Approve token contrast corrections, 12px minimum status/metadata text, semantic risk color, accessible form errors, keyboard focus and reduced-motion behavior. A mobile disclosure menu is optional; favor simple navigation over adding complexity.
- No saved history, account management, fake metrics, chat UI, notifications, delivery prediction, commerce-platform integration, or RescueCart functionality.

## F. Scenarios and tests

Three **synthetic** cases: (1) secured/no blocker and viable ready time -> `supported`; (2) current not-secured inventory/active blocker/later ready estimate -> `at_risk`; (3) unknown inventory/blockers and missing estimate -> `indeterminate`. Include AI disabled and mock-available variants with clear labeling.

**Time-fixture correction:** Codex's absolute example dates on 2026-10-15 become stale later. Unit tests may freeze an injected clock at 2026-10-15T09:00:00Z; interactive demo presets must generate relative dates from the evaluation clock and preserve consistency across observedAt, validUntil and dispatchBy.

Tests must cover: same-time deadline, past estimate, missing estimate, expired adverse evidence (not authoritative), current adverse plus unknown evidence, synthetically mismatched origins, future observations, duplicate IDs, contradictory states, evidence ID and path linkage, output/generic schema cross-validation, disabled inference response, mocked no-network inference with honest provenance, malicious/PII-shaped unknown fields, 400 vs 422 errors, status badge accessibility, and redaction.

### Security and scope

No unauthenticated public live inference. Limit request body size (proposed 16 KiB), accept JSON only, reject unknown properties, redact raw provider messages and PII, keep keys server-side. Read-only evidence review; no fulfillment-state mutation.

## G. Execution proposal (requires user authorization)

1. **Codex on fresh `codex/g3b-promiseguard-domain` branch from merged main:** implement PromiseGuard domain Zod schemas + fixtures, deterministic evaluator, relevant tests, stateless POST route and server orchestration using `disabled` by default and explicit local synthetic mock only. As contract owner, it may add domain fixtures to inference package under this scope. Do not edit MarginLeak, enable AMD, or merge.
2. **Antigravity after contract PR is stable:** own only approved PromiseGuard UI and shared presentation components on isolated `antigravity/g3b-promiseguard-ui` branch, based on the agreed contracts / reviewed domain branch; never independently rewrite shared contracts. Resolve integration through sequential PRs to protected `main` after gate review.
3. **Control Room:** audit new product semantics, tests, security, and demo truthfulness. Merge only after separate authorization. G0 AMD proof and adapter remain separate.

**Open approval questions:** (i) Approve this minimal dispatch-readiness MVP? (ii) Permit synthetic-only evaluation, including mock in local dev/test and disabled in production? (iii) Approve the stateless `/analyze` route and evidence policy above? These are **one consolidated G3A approval decision**, not three independent launches.

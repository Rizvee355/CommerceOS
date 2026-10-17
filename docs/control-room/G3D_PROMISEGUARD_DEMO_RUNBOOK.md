# CommerceOS — G3D PromiseGuard Hackathon Demo Runbook

**Document ID:** `G3D_PROMISEGUARD_DEMO_RUNBOOK`  
**Module:** PromiseGuard (Dispatch Readiness Intelligence)  
**Track:** AMD ACT III — Unified Commerce Intelligence Foundation  
**Status:** Release Candidate (Synthetic Preview)

---

## 1. 30-Second Elevator Pitch for PromiseGuard

> "Merchants lose customer trust and margin when orders miss dispatch cutoffs silently—or when teams rely on opaque AI guesses to make fulfillment decisions. **PromiseGuard** is the primary dispatch-readiness intelligence module inside **CommerceOS**. Instead of treating AI as a black-box oracle, PromiseGuard evaluates order commitments and operational evidence through **deterministic domain rules first**—classifying dispatch readiness as **Supported**, **At Risk**, or **Indeterminate** with full evidence traceability and mandatory human-review gates—and layers optional AI mitigation synthesis on top with explicit provenance."

---

## 2. Exact Local Startup Commands

Run these commands from the repository root (`CommerceOS`) before the live demonstration:

```bash
# 1. Verify dependencies are installed
pnpm install --frozen-lockfile

# 2. (Optional) Verify contracts and build health before going live
pnpm contracts:check
pnpm build

# 3. Start the local server (production build for fastest response, or dev mode)
pnpm start
# Or for development hot-reload:
pnpm dev
```

Once started, open:

- **Overview Shell:** `http://localhost:3000/`
- **PromiseGuard Synthetic Preview:** `http://localhost:3000/promiseguard`
- **Health & Clock Endpoint:** `http://localhost:3000/api/v1/health`
- **Capability Registry Endpoint:** `http://localhost:3000/api/v1/capabilities`

---

## 3. 3-Minute Live Demo Script

### Minute 0:00 – 0:45 | The Unified CommerceOS Foundation (`/`)

1. Start on `http://localhost:3000/`.
2. Point out the **Editorial Operational Daylight** aesthetic—designed for high-trust operational clarity without decorative vanity charts or fake telemetry.
3. Highlight the **Unified Modules** section:
   - **PromiseGuard** (`stub` in the public capability registry while operating as a functional **Synthetic Preview**).
   - **MarginLeak** (`planned` — next module in the unified architecture).
   - **RescueCart** (`disabled` — intentionally gated to maintain strict scope discipline).
4. Click **"Open synthetic workspace →"** (or **"PromiseGuard"** in the top navigation bar) to enter `/promiseguard`.

### Minute 0:45 – 2:00 | Three Deterministic Readiness Archetypes (`/promiseguard`)

1. Point out the **Scope & Truthfulness Strip** at the top of `/promiseguard`:
   - Evaluates **dispatch readiness** (not carrier delivery guarantee).
   - Uses **synthetic fixtures** synchronized to the **authoritative server clock** (`/api/v1/health`).
2. Walk through **Scenario 1 (`Supported`)**, **Scenario 2 (`At Risk`)**, and **Scenario 3 (`Indeterminate`)** (detailed in Sections 4–6 below).

### Minute 2:00 – 3:00 | Live Fact Editing, Traceability & Provenance

1. From **Scenario 2 (`At Risk`)**, click **"Edit related fact (Allocation status)"** on an adverse finding card.
2. Notice how focus jumps directly to the **Allocation status** field and **immediately invalidates the previous result** so stale verdicts can never misrepresent edited facts.
3. Resolve the adverse facts (set Inventory to `Secured`, Fulfillment State to `Ready`, Blocking Status to `No known blockers`), click **"Run analysis"**, and show the verdict flip to **Supported** with full session provenance (`requestId`, `traceId`, and inspectable raw JSON envelope).

---

## 4. Scenario 1 Walkthrough: Aligned Evidence (`supported`)

1. **Select Preset:** Ensure **Preset 1 — Aligned evidence** (`Supported`) is selected.
2. **Inspect Facts:**
   - **Fulfillment reference:** `FUL-SYN-001` (`pg-supported`)
   - **Inventory allocation:** `Secured`
   - **Fulfillment state:** `Ready`
   - **Blocking state:** `No known blockers`
   - **Readiness estimate:** Included and before the `Dispatch by` deadline.
3. **Click `"Run analysis"`:**
   - **Assessment Banner:** Displays **Supported** — _"Current evidence supports dispatch readiness"_ along with the explicit scope boundary: _"It is not a guarantee of dispatch or delivery."_
   - **Deterministic Findings:** Lists **5 Supporting Findings** (`INVENTORY_SECURED`, `FULFILLMENT_READY`, `NO_KNOWN_BLOCKERS`, `ESTIMATE_WITHIN_DEADLINE`, `DEADLINE_OPEN`) with evidence trace IDs.
   - **Human Review Panel:** Shows **No Review Required** (`Automated Review Status: Clear`, policy `promiseguard-policy.v1`).
   - **AI Assistance Panel:** Truthfully displays **Inference Offline** (`AI assistance is not enabled in this environment`) or `Synthetic Mock` when mock inference is enabled.

---

## 5. Scenario 2 Walkthrough: Adverse Evidence (`at_risk`)

1. **Select Preset:** Click **Preset 2 — Adverse evidence** (`At risk`).
   - Point out that switching scenarios immediately clears the previous evaluation and re-synchronizes relative timestamps against `/api/v1/health`.
2. **Inspect Facts:**
   - **Fulfillment reference:** `FUL-SYN-002` (`pg-at-risk`)
   - **Inventory allocation:** `Not secured`
   - **Fulfillment state:** `Blocked`
   - **Blocking state:** `Active blocker` with `inventory_shortage` and `cutoff_missed` checked.
   - **Readiness estimate:** Estimated ready time exceeds the `Dispatch by` deadline.
3. **Click `"Run analysis"`:**
   - **Assessment Banner:** Displays **At risk** — _"The evidence identifies a risk to this dispatch commitment"_.
   - **Deterministic Findings:** Highlights **4 Adverse Findings** (`INVENTORY_NOT_SECURED`, `FULFILLMENT_BLOCKED`, `ACTIVE_BLOCKER_REPORTED`, `ESTIMATE_AFTER_DEADLINE`).
   - **Human Review Panel:** Escalates to **Review Required** with deterministic reason code `PROMISEGUARD_AT_RISK`.
   - **Interactive Traceability:** Each adverse finding includes an **"Edit related fact"** button mapped to the exact form control that triggered the rule.

---

## 6. Scenario 3 Walkthrough: Incomplete Evidence (`indeterminate`)

1. **Select Preset:** Click **Preset 3 — Incomplete evidence** (`Indeterminate`).
2. **Inspect Facts:**
   - **Fulfillment reference:** `FUL-SYN-003` (`pg-indeterminate`)
   - **Inventory allocation:** `Unknown` (with `Validity is unknown` checked)
   - **Fulfillment state:** `In progress`
   - **Blocking state:** `Unknown`
   - **Readiness estimate:** Omitted (`Include a readiness estimate` unchecked).
3. **Click `"Run analysis"`:**
   - **Assessment Banner:** Displays **Indeterminate** — _"The evidence is not sufficient for a reliable assessment"_, with **Evidence Completeness: Partial / Incomplete**.
   - **Deterministic Findings:** Groups **Uncertain or Missing Evidence** (`INVENTORY_UNKNOWN`, `EVIDENCE_VALIDITY_UNKNOWN`, `FULFILLMENT_IN_PROGRESS`, `BLOCKING_STATE_UNKNOWN`, `MISSING_READY_ESTIMATE`).
   - **Human Review Panel:** Escalates to **Review Required** with reason code `PROMISEGUARD_EVIDENCE_INCOMPLETE`.
   - **Key Takeaway for Judges:** PromiseGuard refuses to guess when operational evidence is missing or expired—it surfaces an honest `indeterminate` verdict and routes to human review.

---

## 7. Live Edit / Re-Evaluation Demonstration

To demonstrate that PromiseGuard is a live, contract-validated evaluator rather than a hardcoded static click-through:

1. Select **Preset 2 (`At risk`)** and run analysis to show the **At risk** verdict.
2. In the **Adverse Findings** list, click **"Edit related fact (Allocation status)"** on the `INVENTORY_NOT_SECURED` card.
3. Point out two immediate behaviors:
   - Focus moves directly to `#pg-inventory-status`.
   - The previous **At risk** result vanishes immediately—preventing stale assessment presentation.
4. Change **Allocation status** to `Secured`, **Fulfillment State** to `Ready`, **Blocking status** to `No known blockers`, and uncheck **Include a readiness estimate** (or set it before the deadline).
5. Also demonstrate client/contract validation: clear **Fulfillment reference** and click **"Run analysis"** to show the accessible **Error Summary** (`role="alert"`) and inline field error, then click **"Reset to scenario"** to restore a clean server-synchronized preset.

---

## 8. How to Explain Deterministic Rules vs. AI Recommendations

- **Deterministic Rules Own the Verdict:** Every readiness assessment (`supported`, `at_risk`, `indeterminate`), finding code, derived deadline state, and human-review escalation is computed by deterministic domain logic (`promiseguard-rules.v1` and `promiseguard-policy.v1`).
- **AI Never Overrides Rules:** AI assistance (`aiRecommendation`) is strictly additive. When enabled, it synthesizes an operational summary and prioritized mitigation actions (`verify_inventory_allocation`, `resolve_operational_blocker`, etc.) that must cite valid `evidenceIds` from the request.
- **Zero Single Point of Failure:** If AI inference is disabled, unconfigured, times out, or fails schema validation, the deterministic assessment and human-review routing still succeed 100% of the time (`analysisStatus: "complete"` or `"degraded"`).

---

## 9. How to Explain AMD Inference Readiness / Fallback Truthfully

- **Adapter Architecture Ready:** `@commerceos/inference` implements a strict provider adapter boundary supporting `disabled`, `deterministic-mock`, and `amd-token-factory` (OpenAI-compatible chat completions with JSON schema validation).
- **Truthful Runtime Provenance:** The response contract reports `inference.status` (`available` or `unavailable`), `providerId`, `modelId`, and `provenance` (`live` vs `synthetic_mock`).
- **Strict Hardware Honesty Policy:** While live AMD Token Factory credential verification (`G0`) is pending in this environment, the UI enforces neutral provider labeling (`Live Inference Provider`, `Synthetic Mock`, or `Inference Offline`) and never claims live AMD Instinct hardware execution without authenticated proof.

---

## 10. How to Explain Why MarginLeak is `planned` and RescueCart is `disabled`

- **One Unified Platform, Disciplined Execution:** CommerceOS is architected as a multi-module commerce intelligence system sharing a single contract registry (`@commerceos/contracts`), envelope standard, and inference layer (`@commerceos/inference`).
- **Why PromiseGuard is First:** Fulfillment commitment reliability has the clearest deterministic evidence model and highest operational urgency.
- **Why MarginLeak is `planned`:** MarginLeak shares the same contract and provenance architecture and is the next module on the roadmap once PromiseGuard's release candidate gate is complete.
- **Why RescueCart is `disabled`:** RescueCart is explicitly held in a `disabled` state with zero exposed routes so the MVP remains deeply credible on fulfillment intelligence rather than spreading thin across unfinished surfaces.

---

## 11. Judge Q&A Cheat Sheet

1. **Q: Is this just a wrapper around an LLM prompt?**  
   **A:** No. The core readiness evaluator (`evaluatePromiseGuard`) is 100% deterministic TypeScript domain logic backed by strict Zod and JSON Schema contracts (`@commerceos/contracts`). Even with AI inference completely turned off, PromiseGuard produces full readiness verdicts, evidence trace links, and human-review routing.

2. **Q: What happens if warehouse or ERP data is stale or missing an expiration timestamp?**  
   **A:** Every evidence item carries `observedAt` and either `validUntil` or `validityUnknown: true`. If `validUntil` has passed relative to the server clock—or if `validityUnknown` is true—deterministic rules flag `EVIDENCE_EXPIRED` or `EVIDENCE_VALIDITY_UNKNOWN`, downgrade completeness, and prevent a false `supported` verdict.

3. **Q: Why does the frontend synchronize with `/api/v1/health` before generating presets?**  
   **A:** The backend evaluates evidence timestamps against the authoritative server clock. If the browser used `new Date()` on a client machine with clock skew, synthetic presets could accidentally appear expired or future-dated on the server. If `/api/v1/health` is unreachable, PromiseGuard fails safely and offers a one-click retry rather than guessing with the browser clock.

4. **Q: Can an AI hallucination mark a risky order as "Supported" or skip human review?**  
   **A:** Never. The AI adapter cannot write to `deterministic.data.assessment` or `humanReview.required`. Furthermore, every AI-suggested mitigation action is validated against a strict enum of `actionCode` values and must reference existing `evidenceIds` from the input payload.

5. **Q: Why does `/api/v1/capabilities` list PromiseGuard as `stub` while `/promiseguard` is interactive?**  
   **A:** In CommerceOS governance, the capability registry reflects production commerce integration status (`stub` until live merchant connectors and G0 AMD verification are activated), while `/promiseguard` is transparently badged as a **Synthetic Preview** over the real deterministic evaluator and API route.

6. **Q: How do you prevent operators from acting on stale results when editing form fields?**  
   **A:** Any edit to any form control—or any preset switch or reset—immediately invalidates the active evaluation state, aborts any in-flight request via `AbortController`, and increments a monotonic request sequence counter so late network responses are discarded.

7. **Q: How is contract drift prevented between the Next.js API and the frontend?**  
   **A:** Both the server route (`/api/v1/promiseguard/analyze`) and the frontend client import schemas directly from `@commerceos/contracts`, and CI enforces `pnpm contracts:check` to ensure generated JSON Schema artifacts in `packages/contracts/artifacts/v1/` are 100% synchronized with the TypeScript definitions.

8. **Q: What accessibility standards does the workspace meet for operational teams?**  
   **A:** The workspace implements WCAG 2.2 AA practices: semantic landmarks, native radio-group keyboard arrow navigation for scenario presets, programmatic focus management to the error summary or results heading, `aria-live="polite"` status announcements, `prefers-reduced-motion` support, and 44px minimum touch targets.

---

## 12. Recovery Steps if Local Network / Clock / Server State Fails During the Demo

- **Symptom 1: "Server Clock Synchronization Failed" banner appears on `/promiseguard`.**
  - **Cause:** The local Next.js server was restarting or unreachable when `/api/v1/health` was called.
  - **Recovery:** Verify `pnpm start` (or `pnpm dev`) is running in the terminal, then click **"Retry Clock Synchronization"** directly in the red alert banner. No page reload is required.
- **Symptom 2: Validation Error Summary appears after manual edits.**
  - **Cause:** A required timestamp was cleared, `Active blocker` was selected without checking any blocker codes, or a timestamp was malformed.
  - **Recovery:** Click **"Reset to scenario"** in the top-right corner of the Step 2 form header to immediately re-synchronize with the server clock and restore a clean, valid preset.
- **Symptom 3: Evaluation hangs or takes too long during network hiccup.**
  - **Recovery:** Click **"Cancel evaluation"** in the progress card, then click **"Run analysis"** again.
- **Symptom 4: Port 3000 is occupied or unresponsive.**
  - **Recovery:** Run `pnpm build && pnpm start` (or pass `-p 3001`) and open `/promiseguard`.

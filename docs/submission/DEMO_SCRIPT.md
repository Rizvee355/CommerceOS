# CommerceOS Demo Script

Target length: 2 minutes. Use only synthetic data.

## 0:00–0:15 — Problem and boundary

"CommerceOS is a rule-first control room for commerce decisions where an attractive AI explanation is not enough. Deterministic rules own the verdict, the money, and the review gate."

Show the Overview page. Point to the capability states: PromiseGuard `stub`, MarginLeak `planned`, RescueCart `disabled`, and AMD inference `Pending`.

## 0:15–0:55 — PromiseGuard

Open `/promiseguard`, select **Adverse evidence**, and run the analysis.

"PromiseGuard checks inventory, fulfillment state, blockers, the dispatch deadline, and the readiness estimate. This order is At Risk because inventory is not secured, fulfillment is blocked, an active blocker exists, and readiness falls after the deadline. Every finding links back to the evidence that caused it."

Point to **Human Operational Review Flagged** and **Inference Offline**.

"The review decision is deterministic. With inference disabled, CommerceOS does not fabricate an explanation or label a mock as AMD."

## 0:55–1:35 — MarginLeak

Run the loopback-only development server and open `/marginleak`. Use **Confirmed margin leakage** and click **Run Margin Analysis**.

"MarginLeak reconciles eight contribution-margin categories in integer minor units. Expected margin is $49.00, observed margin is $43.50, and the confirmed adverse variance is $5.50. The ledger shows exactly which categories caused the gap."

Point to the leak amount, category ledger, and human-review gate.

"Missing values are never replaced with zero. Provisional evidence never becomes confirmed leakage."

## 1:35–1:55 — Architecture and safety

"Both modules share versioned contracts, generated schemas, trace metadata, and fail-closed provider controls. MarginLeak remains planned: its production page is a server-side 404 and its production analysis API is a 403."

## 1:55–2:00 — Honest AMD close

"The AMD provider boundary is ready, but the event account is still awaiting Token Factory API-distribution entitlement. This demo contains no unverified AMD inference claim."

## Recording artifact

The prepared silent recording follows the same product sequence and uses the live local application. It contains no credentials, private account information, or fabricated UI.

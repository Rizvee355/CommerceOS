# MarginLeak G4A Domain Proposal

**Status:** Isolated prototype for Control Room audit. Not a canonical contract, production API, or active capability.

**Mission:** Evaluate contribution-margin variance for one synthetic order in one currency by comparing explicit expected and observed financial inputs.

## Decision summary

The prototype uses a fixed financial-component map rather than a general ledger or an order-line model. This keeps the first decision explainable: each component has an expected amount, an observed amount, and its own evidence. The evaluator calculates expected contribution margin, observed contribution margin, and the resulting variance with integer minor-unit arithmetic.

Missing values are unknown, never zero. A component is zero only when the request explicitly supplies a source-backed zero. The evaluator does not claim a net leak when any required input is missing or when observed figures are provisional.

## Approved prototype boundary

The prototype covers:

- one order and one ISO 4217 currency;
- synthetic fixtures only;
- expected versus observed amounts;
- gross item revenue, discounts, shipping revenue, COGS, shipping cost, fulfillment cost, payment cost, and platform cost;
- deterministic calculations and findings;
- evidence references, missing-field paths, and deterministic human-review decisions.

It does not cover taxes, refunds, returns, advertising attribution, foreign exchange, customer lifetime value, shared overhead allocation, inventory valuation methods, revenue recognition, accounting close, persistence, external commerce systems, production routes, or AI recommendations.

## Alternatives considered

### 1. Fixed component map — selected

Every allowed category has one expected and one observed slot. The shape is strict and easy to audit. It prevents an unknown category from silently changing the formula.

### 2. Arbitrary financial ledger

A ledger would be more extensible but would require account mapping, debit/credit rules, deduplication, and allocation policy. Those are outside G4A and would make synthetic results look more authoritative than they are.

### 3. Order-line profitability model

Line-level modeling would support quantities, returns, bundles, and SKU-level COGS. It would also introduce allocation and inventory-costing decisions that are not needed to prove the single-order domain model.

## Local input model

The local schema is intentionally not exported from `packages/contracts`. It uses these prototype fields:

- `prototypeVersion: "g4a.1"`
- `moduleId: "marginleak"`
- `scope: "single_order_contribution_margin_variance"`
- a synthetic scenario reference and opaque order reference;
- one ISO 4217 `currency`;
- `observationState: "final" | "provisional"`;
- a strict `financials` object containing only the approved categories.

Each category may contain `expected` and `observed` observations. Each observation contains:

- a nonnegative integer `amountMinor`;
- the same currency as the request;
- a unique `evidenceId`;
- `source.kind: "synthetic_fixture"`;
- a concise source label and a UTC `recordedAt` timestamp.

An omitted category or side is accepted as missing domain evidence so the evaluator can return an indeterminate result. Unknown properties, mixed currencies, duplicate evidence IDs, floating-point amounts, negative component magnitudes, non-ISO currencies, non-UTC timestamps, and non-synthetic sources are rejected by schema validation.

## Financial categories and signs

| Category           | Contribution role | Reason for inclusion                                               |
| ------------------ | ----------------: | ------------------------------------------------------------------ |
| Gross item revenue |               `+` | Revenue before order-level discounts                               |
| Shipping revenue   |               `+` | Amount charged to the customer for shipping                        |
| Discounts          |               `-` | Explicit reduction from gross item revenue                         |
| COGS               |               `-` | Recorded product cost attributable to the order                    |
| Shipping cost      |               `-` | Carrier or delivery cost attributable to the order                 |
| Fulfillment cost   |               `-` | Pick, pack, handling, or warehouse cost attributable to the order  |
| Payment cost       |               `-` | Payment-processing cost attributable to the order                  |
| Platform cost      |               `-` | Marketplace or platform transaction cost attributable to the order |

All component inputs are nonnegative magnitudes. Signs come from the category definition, not from callers. This prevents double negatives such as a negative discount being added to revenue.

## Exact arithmetic and bounds

Amounts use integer minor units. Callers must normalize amounts using the currency's standard ISO 4217 minor unit before validation. The prototype performs no decimal or foreign-exchange conversion.

Each component is capped at `floor(Number.MAX_SAFE_INTEGER / 16)` minor units. There are eight expected and eight observed inputs, so this bound keeps every supported subtotal and expected-minus-observed variance inside JavaScript's exact safe-integer range. The evaluator still checks derived values before returning them.

## Deterministic formulas

For each side:

```text
contribution margin =
    gross item revenue
  + shipping revenue
  - discounts
  - COGS
  - shipping cost
  - fulfillment cost
  - payment cost
  - platform cost
```

For each component, its contribution effect is the signed amount defined by the table above.

```text
component adverse variance = expected contribution effect - observed contribution effect
net contribution variance  = expected contribution margin - observed contribution margin
confirmed leak amount      = max(net contribution variance, 0) for complete final evidence
                             null for provisional or incomplete evidence
```

A positive component variance is adverse, a negative variance is favorable, and zero is neutral. Favorable movement can offset adverse movement in the net result. The response retains every component comparison so the net result remains explainable.

## Assessment and missing-data policy

The evaluator returns one of three assessments:

- `leak_detected`: every required input is present, observations are final, and expected contribution margin exceeds observed contribution margin;
- `no_leak_detected`: every required input is present, observations are final, and observed contribution margin meets or exceeds expected contribution margin;
- `indeterminate`: any expected or observed input is missing, or the request declares provisional observations.

When inputs are incomplete, the evaluator reports comparisons for complete pairs but does not return aggregate margins, net variance, or a leak amount. A known adverse component cannot prove a net order-level leak because an unknown favorable component could offset it.

When inputs are complete but provisional, expected contribution margin, observed contribution margin, and signed net contribution variance are returned as provisional facts. `leakAmount` remains `null` because a calculated adverse variance is not confirmed leakage until the observed evidence is final. The business assessment remains `indeterminate` and human review is required.

The prototype has no materiality threshold. For complete final evidence, one minor unit of adverse net variance is classified as a leak. Control Room must approve a threshold policy before production use.

## Human-review policy

Human review is required when:

- a net leak is detected;
- any required input is missing; or
- observed financials are provisional.

Review is not required only for a complete, final `no_leak_detected` result. The policy is deterministic and versioned as `marginleak-review-g4a.1`.

## Output and traceability

The result contains:

- assessment, completeness, currency, and observation state;
- expected and observed contribution margins when all inputs exist;
- signed net contribution variance when all inputs exist;
- a nonnegative confirmed leak amount only when all inputs exist and observations are final; otherwise `leakAmount` is `null`;
- a component breakdown with direction, absolute variance amount, and both evidence IDs;
- missing input paths without invented evidence IDs;
- deterministic findings;
- ruleset and human-review policy versions.

Every present amount in a component comparison resolves to its submitted evidence ID. Derived totals do not claim a separate external source.

## Synthetic scenarios

1. **Leak detected:** complete final evidence, with shipping and payment overruns plus lower observed revenue producing a positive net leak.
2. **No leak detected:** complete final evidence, with favorable COGS and shipping movement offsetting a small revenue shortfall.
3. **Indeterminate:** a required observed COGS amount and expected platform cost are missing.
4. **Provisional:** all amounts are present, but the observed figures are not final; both margins and signed variance are calculated, `leakAmount` remains `null`, and the assessment remains indeterminate.

## Security and governance

- Fixtures use opaque synthetic references and `.invalid` example domains only when a string is needed.
- The schema rejects unknown properties to reduce accidental PII entry.
- No customer data, credentials, provider output, or network call is involved.
- No PromiseGuard code, shared contract, inference code, production API route, capability registry, or GitHub governance file is changed.
- MarginLeak remains `planned` until a later gate authorizes integration.

## Limitations and promotion gates

This prototype is a variance calculator, not an accounting system and not a claim of recoverable profit. Cost attribution and source authority remain merchant responsibilities. A production contract needs Control Room decisions on authoritative cost systems, refunds and returns, taxes, fee reconciliation, materiality thresholds, finality, multi-currency behavior, and allocation methods.

Promotion requires a separate contract review, production API authorization, security review, and capability decision. G4A does not authorize any of them.

# CommerceOS — ACT III Submission Draft

## Project name

CommerceOS

## Track

Reinvent Commerce

## Short description

Deterministic commerce intelligence that turns fulfillment and margin evidence into auditable decisions, explicit review gates, and optional AI assistance.

## Long description

Commerce teams often discover operational failures after they become customer complaints or margin losses. Existing dashboards show totals, while generic AI assistants can explain confidently without owning the underlying arithmetic or evidence quality.

CommerceOS is a contract-first control room for two high-impact decisions. PromiseGuard evaluates whether inventory, fulfillment state, blockers, deadlines, and readiness estimates support an order's dispatch commitment. MarginLeak reconciles expected and observed order economics across eight revenue and cost categories using exact integer minor-unit arithmetic.

The product is deliberately rule-first. Deterministic evaluators own every verdict, financial calculation, evidence finding, and human-review decision. Missing or provisional facts do not become invented certainty: PromiseGuard returns `indeterminate`, and MarginLeak withholds totals rather than treating missing money as zero. An optional server-only inference boundary can add advisory explanations, but it cannot change the deterministic outcome.

The working prototype includes an interactive PromiseGuard synthetic preview and a development-only MarginLeak synthetic preview. Production safety remains fail-closed: MarginLeak is still a `planned` capability, its production page returns `404`, and its production analysis API returns `403`. RescueCart is intentionally disabled.

Live AMD inference is not yet verified because the registered ACT III account is missing organizer-side Token Factory API-distribution entitlement. CommerceOS therefore runs with inference disabled and does not claim AMD-generated output. The architecture is ready for an event-authorized adapter once a legitimate credential, endpoint, and model are issued.

## Merchant problem

- Fulfillment teams need to know which promises are supported, threatened, or unknowable before a cutoff is missed.
- Finance and operations teams need to locate contribution-margin variance without confusing provisional observations, missing values, or negative-margin baselines with confirmed leakage.
- Both workflows require an evidence trail and a human-review boundary, not a black-box answer.

## Key features

1. **PromiseGuard deterministic readiness:** `supported`, `at_risk`, and `indeterminate` outcomes with evidence-linked findings.
2. **MarginLeak exact reconciliation:** eight-category expected-versus-observed contribution-margin analysis in integer minor units.
3. **Fail-closed evidence handling:** missing or provisional data withholds certainty and routes work to review.
4. **Human-review policy:** deterministic reason codes and explicit review state.
5. **Contract authority:** shared Zod contracts, generated JSON Schema, and OpenAPI artifacts prevent API/UI drift.
6. **Truthful inference boundary:** disabled, deterministic mock, and future live-provider selections with no silent live-to-mock fallback.
7. **Production safety:** development-only MarginLeak UI/API remain inaccessible in production.

## Technology stack

- Next.js 16, React 19, TypeScript 6
- Zod contracts with generated JSON Schema and OpenAPI
- Vitest, Testing Library, Playwright
- pnpm monorepo
- Server-only provider boundary prepared for an event-authorized AMD Token Factory endpoint

## AMD status

**Pending external entitlement.** No event API credential has been issued or discovered, and no authenticated AMD inference response exists. Do not add AMD Token Factory, an AMD model, or AMD hardware to the submitted technology tags until real authenticated proof is available.

## Suggested truthful tags

Ecommerce, Developer Tools, Next.js, React, TypeScript, Zod, Playwright, Human-in-the-loop

## Submission URLs

- GitHub: pending operator authorization to make `https://github.com/Rizvee355/CommerceOS` public.
- Application: no public deployment authorized.
- Video: local artifact prepared; public upload pending operator authorization.
- Presentation: local PPTX and PDF prepared; public upload pending operator authorization.

import { describe, expect, it } from "vitest";

import { evaluateMarginLeak } from "./evaluate";
import {
  FINANCIAL_CATEGORIES,
  marginLeakPrototypeRequestSchema,
  type FinancialCategory,
} from "./schema";

type AmountPair = { expected: number; observed: number };
type Amounts = Record<FinancialCategory, AmountPair>;

const expectedAmounts: Record<FinancialCategory, number> = {
  grossItemRevenue: 10_000,
  shippingRevenue: 1_000,
  discounts: 500,
  cogs: 4_000,
  shippingCost: 800,
  fulfillmentCost: 300,
  paymentCost: 300,
  platformCost: 200,
};

const requestWith = (
  observedOverrides: Partial<Record<FinancialCategory, number>>,
) => {
  const amounts = Object.fromEntries(
    FINANCIAL_CATEGORIES.map((category) => [
      category,
      {
        expected: expectedAmounts[category],
        observed: observedOverrides[category] ?? expectedAmounts[category],
      },
    ]),
  ) as Amounts;

  return marginLeakPrototypeRequestSchema.parse({
    prototypeVersion: "g4a.1",
    moduleId: "marginleak",
    scope: "single_order_contribution_margin_variance",
    scenario: { scenarioId: "ml-evaluator", synthetic: true },
    orderRef: "ORDER-SYN-EVAL",
    currency: "USD",
    observationState: "final",
    financials: Object.fromEntries(
      FINANCIAL_CATEGORIES.map((category) => [
        category,
        {
          expected: {
            amountMinor: amounts[category].expected,
            currency: "USD",
            evidenceId: `ev-${category}-expected`,
            source: {
              kind: "synthetic_fixture",
              label: `Expected ${category}`,
              recordedAt: "2026-10-16T08:00:00.000Z",
            },
          },
          observed: {
            amountMinor: amounts[category].observed,
            currency: "USD",
            evidenceId: `ev-${category}-observed`,
            source: {
              kind: "synthetic_fixture",
              label: `Observed ${category}`,
              recordedAt: "2026-10-16T09:00:00.000Z",
            },
          },
        },
      ]),
    ),
  });
};

describe("MarginLeak deterministic evaluator", () => {
  it("identifies an exact source-backed contribution-margin leak", () => {
    const request = requestWith({
      grossItemRevenue: 9_800,
      discounts: 600,
      shippingCost: 1_000,
      paymentCost: 350,
    });

    const result = evaluateMarginLeak(request);

    expect(result).toMatchObject({
      assessment: "leak_detected",
      completeness: "complete",
      currency: "USD",
      observationState: "final",
      rulesetVersion: "marginleak-contribution-g4a.1",
      totals: {
        expectedContributionMargin: { amountMinor: 4_900, currency: "USD" },
        observedContributionMargin: { amountMinor: 4_350, currency: "USD" },
        netContributionVariance: { amountMinor: 550, currency: "USD" },
        leakAmount: { amountMinor: 550, currency: "USD" },
      },
      humanReview: {
        required: true,
        reasonCodes: ["MARGINLEAK_LEAK_DETECTED"],
        decidedBy: "deterministic_policy",
        policyVersion: "marginleak-review-g4a.1",
      },
    });
    expect(result.componentBreakdown.map(({ category }) => category)).toEqual(
      FINANCIAL_CATEGORIES,
    );

    const grossRevenue = result.componentBreakdown.find(
      ({ category }) => category === "grossItemRevenue",
    );
    expect(grossRevenue).toEqual({
      category: "grossItemRevenue",
      role: "revenue",
      expected: { amountMinor: 10_000, currency: "USD" },
      observed: { amountMinor: 9_800, currency: "USD" },
      direction: "adverse",
      varianceAmount: { amountMinor: 200, currency: "USD" },
      expectedEvidenceId: "ev-grossItemRevenue-expected",
      observedEvidenceId: "ev-grossItemRevenue-observed",
    });

    const shippingRevenue = result.componentBreakdown.find(
      ({ category }) => category === "shippingRevenue",
    );
    expect(shippingRevenue?.direction).toBe("neutral");
    expect(shippingRevenue?.varianceAmount.amountMinor).toBe(0);

    expect(result.findings).toContainEqual({
      code: "ADVERSE_COMPONENT_VARIANCE",
      impact: "adverse",
      category: "paymentCost",
      amount: { amountMinor: 50, currency: "USD" },
      evidenceIds: ["ev-paymentCost-expected", "ev-paymentCost-observed"],
    });
  });

  it("reports no net leak when favorable costs offset adverse revenue", () => {
    const request = requestWith({
      grossItemRevenue: 9_900,
      cogs: 3_700,
      shippingCost: 700,
    });

    const result = evaluateMarginLeak(request);

    expect(result.assessment).toBe("no_leak_detected");
    expect(result.totals).toEqual({
      expectedContributionMargin: { amountMinor: 4_900, currency: "USD" },
      observedContributionMargin: { amountMinor: 5_200, currency: "USD" },
      netContributionVariance: { amountMinor: -300, currency: "USD" },
      leakAmount: { amountMinor: 0, currency: "USD" },
    });
    expect(result.humanReview).toMatchObject({
      required: false,
      reasonCodes: [],
    });
    expect(
      result.componentBreakdown.find(({ category }) => category === "cogs"),
    ).toMatchObject({
      role: "deduction",
      direction: "favorable",
      varianceAmount: { amountMinor: 300, currency: "USD" },
    });
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        code: "FAVORABLE_COMPONENT_VARIANCE",
        impact: "favorable",
        category: "shippingCost",
        amount: { amountMinor: 100, currency: "USD" },
      }),
    );
  });

  it("classifies an exact zero variance as no leak", () => {
    const result = evaluateMarginLeak(requestWith({}));

    expect(result.assessment).toBe("no_leak_detected");
    expect(result.totals.netContributionVariance.amountMinor).toBe(0);
    expect(result.totals.leakAmount.amountMinor).toBe(0);
    expect(
      result.componentBreakdown.every(
        ({ direction }) => direction === "neutral",
      ),
    ).toBe(true);
  });
});

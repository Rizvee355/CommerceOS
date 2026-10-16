import {
  CONTRIBUTION_ROLES,
  FINANCIAL_CATEGORIES,
  type FinancialCategory,
  type MarginLeakPrototypeRequest,
} from "./schema";

export const MARGIN_LEAK_RULESET_VERSION =
  "marginleak-contribution-g4a.1" as const;
export const MARGIN_LEAK_REVIEW_POLICY_VERSION =
  "marginleak-review-g4a.1" as const;

type Money = {
  amountMinor: number;
  currency: string;
};

type VarianceDirection = "adverse" | "favorable" | "neutral";

type ComponentBreakdown = {
  category: FinancialCategory;
  role: "revenue" | "deduction";
  expected: Money;
  observed: Money;
  direction: VarianceDirection;
  varianceAmount: Money;
  expectedEvidenceId: string;
  observedEvidenceId: string;
};

type VarianceFinding = {
  code: "ADVERSE_COMPONENT_VARIANCE" | "FAVORABLE_COMPONENT_VARIANCE";
  impact: "adverse" | "favorable";
  category: FinancialCategory;
  amount: Money;
  evidenceIds: [string, string];
};

type MarginLeakResult = {
  assessment: "leak_detected" | "no_leak_detected";
  completeness: "complete";
  currency: string;
  observationState: "final" | "provisional";
  rulesetVersion: typeof MARGIN_LEAK_RULESET_VERSION;
  componentBreakdown: ComponentBreakdown[];
  findings: VarianceFinding[];
  totals: {
    expectedContributionMargin: Money;
    observedContributionMargin: Money;
    netContributionVariance: Money;
    leakAmount: Money;
  };
  humanReview: {
    required: boolean;
    reasonCodes: string[];
    decidedBy: "deterministic_policy";
    policyVersion: typeof MARGIN_LEAK_REVIEW_POLICY_VERSION;
  };
};

const exactInteger = (value: number, label: string): number => {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} exceeds exact safe-integer arithmetic.`);
  }
  return value;
};

const money = (amountMinor: number, currency: string): Money => ({
  amountMinor: exactInteger(amountMinor, "Money amount"),
  currency,
});

export const evaluateMarginLeak = (
  request: MarginLeakPrototypeRequest,
): MarginLeakResult => {
  let expectedContributionMargin = 0;
  let observedContributionMargin = 0;
  const findings: VarianceFinding[] = [];

  const componentBreakdown = FINANCIAL_CATEGORIES.map((category) => {
    const component = request.financials[category]!;
    const expected = component.expected!;
    const observed = component.observed!;
    const sign = CONTRIBUTION_ROLES[category];
    const expectedContribution = exactInteger(
      expected.amountMinor * sign,
      `${category} expected contribution`,
    );
    const observedContribution = exactInteger(
      observed.amountMinor * sign,
      `${category} observed contribution`,
    );

    expectedContributionMargin = exactInteger(
      expectedContributionMargin + expectedContribution,
      "Expected contribution margin",
    );
    observedContributionMargin = exactInteger(
      observedContributionMargin + observedContribution,
      "Observed contribution margin",
    );

    const signedVariance = exactInteger(
      expectedContribution - observedContribution,
      `${category} variance`,
    );
    const direction: VarianceDirection =
      signedVariance > 0
        ? "adverse"
        : signedVariance < 0
          ? "favorable"
          : "neutral";
    const varianceAmount = money(Math.abs(signedVariance), request.currency);

    if (direction !== "neutral") {
      findings.push({
        code:
          direction === "adverse"
            ? "ADVERSE_COMPONENT_VARIANCE"
            : "FAVORABLE_COMPONENT_VARIANCE",
        impact: direction,
        category,
        amount: varianceAmount,
        evidenceIds: [expected.evidenceId, observed.evidenceId],
      });
    }

    return {
      category,
      role: sign === 1 ? ("revenue" as const) : ("deduction" as const),
      expected: money(expected.amountMinor, request.currency),
      observed: money(observed.amountMinor, request.currency),
      direction,
      varianceAmount,
      expectedEvidenceId: expected.evidenceId,
      observedEvidenceId: observed.evidenceId,
    };
  });

  const netContributionVariance = exactInteger(
    expectedContributionMargin - observedContributionMargin,
    "Net contribution variance",
  );
  const leakDetected = netContributionVariance > 0;

  return {
    assessment: leakDetected ? "leak_detected" : "no_leak_detected",
    completeness: "complete",
    currency: request.currency,
    observationState: request.observationState,
    rulesetVersion: MARGIN_LEAK_RULESET_VERSION,
    componentBreakdown,
    findings,
    totals: {
      expectedContributionMargin: money(
        expectedContributionMargin,
        request.currency,
      ),
      observedContributionMargin: money(
        observedContributionMargin,
        request.currency,
      ),
      netContributionVariance: money(netContributionVariance, request.currency),
      leakAmount: money(Math.max(netContributionVariance, 0), request.currency),
    },
    humanReview: {
      required: leakDetected,
      reasonCodes: leakDetected ? ["MARGINLEAK_LEAK_DETECTED"] : [],
      decidedBy: "deterministic_policy",
      policyVersion: MARGIN_LEAK_REVIEW_POLICY_VERSION,
    },
  };
};

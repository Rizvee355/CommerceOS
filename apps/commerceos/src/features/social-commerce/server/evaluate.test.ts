import { describe, expect, it } from "vitest";

import { extractOrderFromConversation } from "../domain/extractor";
import { SOCIAL_COMMERCE_SCENARIOS } from "../domain/scenarios";
import {
  buildEvaluatePayloadFromForm,
  extractionToReviewForm,
} from "../ui/draft-mapper";
import { evaluateSocialCommerceOrder } from "./evaluate";

const baseDate = new Date("2026-11-20T09:00:00.000Z");

const makeDeps = () => {
  let counter = 0;
  return {
    now: () => new Date(baseDate),
    randomUUID: () => {
      counter += 1;
      return `00000000-0000-4000-8000-${String(counter).padStart(12, "0")}`;
    },
    inferenceProvider: null,
  };
};

describe("Social-Commerce end-to-end deterministic evaluation (PromiseGuard + MarginLeak)", () => {
  it("detects confirmed BDT margin leakage on the Banglish discount + free delivery scenario", async () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-banglish-margin-leak",
    )!;
    const extracted = extractOrderFromConversation(scenario.transcript);
    const form = extractionToReviewForm(
      {
        schemaVersion: "1.0",
        metadata: {
          requestId: "11111111-1111-4111-8111-111111111111",
          traceId: "22222222-2222-4222-8222-222222222222",
          receivedAt: baseDate.toISOString(),
          respondedAt: baseDate.toISOString(),
        },
        channel: scenario.channel,
        extractionMode: "deterministic_parser_preview",
        inference: { status: "unavailable", reasonCode: "configuration" },
        draft: extracted.draft,
        catalogMatch: extracted.catalogMatch,
        syntheticDemoDisclosure:
          "demonstration_only_no_autonomous_order_confirmation",
      },
      scenario.id,
      baseDate,
    );
    const built = buildEvaluatePayloadFromForm(form, scenario.channel);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const result = await evaluateSocialCommerceOrder(built.payload, makeDeps());

    expect(result.promiseGuard?.deterministic.data.assessment).toBe(
      "supported",
    );
    expect(result.marginLeak.deterministic.data.assessment).toBe(
      "leak_detected",
    );
    // Expected margin: (2900 + 70) - (0 + 1560 + 70 + 90 + 29.70 + 0) = 1220.30 BDT (122,030 poisha)
    // Observed margin: (2900 + 0) - (300 + 1560 + 70 + 90 + 26.00 + 0) = 854.00 BDT (85,400 poisha)
    // Net adverse variance / confirmed leak: 366.30 BDT (36,630 poisha)
    expect(
      result.marginLeak.deterministic.data.totals.expectedContributionMargin
        ?.amountMinor,
    ).toBe(122_030);
    expect(
      result.marginLeak.deterministic.data.totals.observedContributionMargin
        ?.amountMinor,
    ).toBe(85_400);
    expect(
      result.marginLeak.deterministic.data.totals.leakAmount?.amountMinor,
    ).toBe(36_630);
    expect(result.combinedReview.required).toBe(true);
    expect(result.combinedReview.overallStatus).toBe("hold_for_review");
    expect(result.combinedReview.autonomousActionAllowed).toBe(false);
    expect(
      result.recommendedActions.some((a) => a.source === "marginleak"),
    ).toBe(true);
  });

  it("flags PromiseGuard AT RISK for the out-of-stock Bangla Panjabi order", async () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-bangla-promise-risk",
    )!;
    const extracted = extractOrderFromConversation(scenario.transcript);
    const form = extractionToReviewForm(
      {
        schemaVersion: "1.0",
        metadata: {
          requestId: "11111111-1111-4111-8111-111111111111",
          traceId: "22222222-2222-4222-8222-222222222222",
          receivedAt: baseDate.toISOString(),
          respondedAt: baseDate.toISOString(),
        },
        channel: scenario.channel,
        extractionMode: "deterministic_parser_preview",
        inference: { status: "unavailable", reasonCode: "configuration" },
        draft: extracted.draft,
        catalogMatch: extracted.catalogMatch,
        syntheticDemoDisclosure:
          "demonstration_only_no_autonomous_order_confirmation",
      },
      scenario.id,
      baseDate,
    );
    const built = buildEvaluatePayloadFromForm(form, scenario.channel);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const result = await evaluateSocialCommerceOrder(built.payload, makeDeps());

    expect(result.promiseGuard?.deterministic.data.assessment).toBe("at_risk");
    expect(result.combinedReview.reasonCodes).toContain("PROMISEGUARD_AT_RISK");
    expect(result.combinedReview.overallStatus).toBe("hold_for_review");
  });

  it("withholds MarginLeak totals and skips PromiseGuard when ambiguous chat lacks deadline and costs", async () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-ambiguous-missing-info",
    )!;
    const extracted = extractOrderFromConversation(scenario.transcript);
    const form = extractionToReviewForm(
      {
        schemaVersion: "1.0",
        metadata: {
          requestId: "11111111-1111-4111-8111-111111111111",
          traceId: "22222222-2222-4222-8222-222222222222",
          receivedAt: baseDate.toISOString(),
          respondedAt: baseDate.toISOString(),
        },
        channel: scenario.channel,
        extractionMode: "deterministic_parser_preview",
        inference: { status: "unavailable", reasonCode: "configuration" },
        draft: extracted.draft,
        catalogMatch: extracted.catalogMatch,
        syntheticDemoDisclosure:
          "demonstration_only_no_autonomous_order_confirmation",
      },
      scenario.id,
      baseDate,
    );
    const built = buildEvaluatePayloadFromForm(form, scenario.channel);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const result = await evaluateSocialCommerceOrder(built.payload, makeDeps());

    expect(result.promiseGuard).toBeNull();
    expect(result.promiseGuardSkippedReason).toBeTruthy();
    expect(result.marginLeak.deterministic.data.assessment).toBe(
      "indeterminate",
    );
    expect(result.marginLeak.deterministic.data.evidenceCompleteness).toBe(
      "incomplete",
    );
    expect(result.marginLeak.deterministic.data.totals).toEqual({
      expectedContributionMargin: null,
      observedContributionMargin: null,
      netContributionVariance: null,
      leakAmount: null,
    });
    expect(result.combinedReview.overallStatus).toBe("hold_for_review");
  });

  it("evaluates the full-price Dhaka Leather Tote Bag scenario as supported with zero margin leak", async () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-healthy-order",
    )!;
    const extracted = extractOrderFromConversation(scenario.transcript);
    const form = extractionToReviewForm(
      {
        schemaVersion: "1.0",
        metadata: {
          requestId: "11111111-1111-4111-8111-111111111111",
          traceId: "22222222-2222-4222-8222-222222222222",
          receivedAt: baseDate.toISOString(),
          respondedAt: baseDate.toISOString(),
        },
        channel: scenario.channel,
        extractionMode: "deterministic_parser_preview",
        inference: { status: "unavailable", reasonCode: "configuration" },
        draft: extracted.draft,
        catalogMatch: extracted.catalogMatch,
        syntheticDemoDisclosure:
          "demonstration_only_no_autonomous_order_confirmation",
      },
      scenario.id,
      baseDate,
    );
    const built = buildEvaluatePayloadFromForm(form, scenario.channel);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const result = await evaluateSocialCommerceOrder(built.payload, makeDeps());

    // Expected & observed margin: (2400 + 70) - (0 + 1300 + 70 + 60 + 24.70 + 0) = 1015.30 BDT (101,530 poisha)
    expect(result.promiseGuard?.deterministic.data.assessment).toBe(
      "supported",
    );
    expect(result.marginLeak.deterministic.data.assessment).toBe(
      "no_leak_detected",
    );
    expect(
      result.marginLeak.deterministic.data.totals.expectedContributionMargin
        ?.amountMinor,
    ).toBe(101_530);
    expect(
      result.marginLeak.deterministic.data.totals.observedContributionMargin
        ?.amountMinor,
    ).toBe(101_530);
    expect(
      result.marginLeak.deterministic.data.totals.netContributionVariance
        ?.amountMinor,
    ).toBe(0);
    expect(result.combinedReview.overallStatus).toBe(
      "ready_for_human_confirmation",
    );
    expect(result.combinedReview.autonomousActionAllowed).toBe(false);
  });

  it("withholds MarginLeak totals when chat confirms only a discount ('155 tk discnt thkbe') without an agreed selling price", async () => {
    const transcript = [
      "Customer: 5ta Vitamin C Glow Serum lagbe Mirpur e, address pore dicchi. koto discount pabo?",
      "Merchant: 155 tk discnt thkbe",
    ].join("\n");
    const extracted = extractOrderFromConversation(transcript);
    const form = extractionToReviewForm(
      {
        schemaVersion: "1.0",
        metadata: {
          requestId: "11111111-1111-4111-8111-111111111111",
          traceId: "22222222-2222-4222-8222-222222222222",
          receivedAt: baseDate.toISOString(),
          respondedAt: baseDate.toISOString(),
        },
        channel: "messenger",
        extractionMode: "deterministic_parser_preview",
        inference: { status: "unavailable", reasonCode: "configuration" },
        draft: extracted.draft,
        catalogMatch: extracted.catalogMatch,
        syntheticDemoDisclosure:
          "demonstration_only_no_autonomous_order_confirmation",
      },
      "custom-serum-discnt",
      baseDate,
    );

    expect(form.deliveryLocation).toBe("Mirpur, Dhaka");
    expect(form.categories.grossItemRevenue.expectedMajor).toBe("4750");
    expect(form.categories.grossItemRevenue.observedMajor).toBe("");
    expect(form.categories.discounts.observedMajor).toBe("155");

    const built = buildEvaluatePayloadFromForm(form, "messenger");
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const result = await evaluateSocialCommerceOrder(built.payload, makeDeps());

    expect(result.promiseGuard).toBeNull();
    expect(result.marginLeak.deterministic.data.assessment).toBe(
      "indeterminate",
    );
    expect(result.marginLeak.deterministic.data.evidenceCompleteness).toBe(
      "incomplete",
    );
    expect(result.marginLeak.deterministic.data.totals.leakAmount).toBeNull();
    const discountRow =
      result.marginLeak.deterministic.data.categoryComparisons.find(
        (c) => c.category === "discounts",
      );
    expect(discountRow?.direction).toBe("adverse");
    expect(discountRow?.varianceAmount.amountMinor).toBe(15_500);
    expect(result.combinedReview.overallStatus).toBe("hold_for_review");
  });

  it("keeps provisional MarginLeak evaluations indeterminate without reporting confirmed leakage", async () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-banglish-margin-leak",
    )!;
    const extracted = extractOrderFromConversation(scenario.transcript);
    const form = extractionToReviewForm(
      {
        schemaVersion: "1.0",
        metadata: {
          requestId: "11111111-1111-4111-8111-111111111111",
          traceId: "22222222-2222-4222-8222-222222222222",
          receivedAt: baseDate.toISOString(),
          respondedAt: baseDate.toISOString(),
        },
        channel: scenario.channel,
        extractionMode: "deterministic_parser_preview",
        inference: { status: "unavailable", reasonCode: "configuration" },
        draft: extracted.draft,
        catalogMatch: extracted.catalogMatch,
        syntheticDemoDisclosure:
          "demonstration_only_no_autonomous_order_confirmation",
      },
      scenario.id,
      baseDate,
    );
    form.observationState = "provisional";

    const built = buildEvaluatePayloadFromForm(form, scenario.channel);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    const result = await evaluateSocialCommerceOrder(built.payload, makeDeps());
    expect(result.marginLeak.deterministic.data.assessment).toBe(
      "indeterminate",
    );
    expect(result.marginLeak.deterministic.data.totals.leakAmount).toBeNull();
    expect(
      result.marginLeak.deterministic.data.totals.netContributionVariance
        ?.amountMinor,
    ).toBe(36_630);
    expect(
      result.recommendedActions.some(
        (a) => a.code === "RECONCILE_AFTER_COURIER_SETTLEMENT",
      ),
    ).toBe(true);
  });
});

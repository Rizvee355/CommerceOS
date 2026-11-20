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
    // Expected margin: (2900 + 70) - (0 + 1560 + 70 + 90 + 0 + 0) = 1250 BDT (125,000 poisha)
    // Observed margin: (2900 + 0) - (300 + 1560 + 70 + 90 + 26 + 0) = 854 BDT (85,400 poisha)
    // Net adverse variance / confirmed leak: 396 BDT (39,600 poisha)
    expect(
      result.marginLeak.deterministic.data.totals.leakAmount?.amountMinor,
    ).toBe(39_600);
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
});

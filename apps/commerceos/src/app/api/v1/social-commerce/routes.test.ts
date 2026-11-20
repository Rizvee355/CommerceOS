import { describe, expect, it } from "vitest";

import {
  socialCommerceEvaluateResponseSchema,
  socialCommerceExtractResponseSchema,
} from "../../../../features/social-commerce/domain/schema";
import { SOCIAL_COMMERCE_SCENARIOS } from "../../../../features/social-commerce/domain/scenarios";
import { createSocialCommerceEvaluateHandler } from "./evaluate/route";
import { createSocialCommerceExtractHandler } from "./extract/route";

const makeDeps = () => {
  let seq = 0;
  return {
    now: () => new Date("2026-11-20T09:00:00.000Z"),
    randomUUID: () => {
      seq += 1;
      return `10000000-0000-4000-8000-${String(seq).padStart(12, "0")}`;
    },
    getLlmConfig: () => null,
    getInferenceProvider: () => null,
  };
};

describe("Social-Commerce API routes", () => {
  it("POST /api/v1/social-commerce/extract returns schema-valid deterministic preview output", async () => {
    const handler = createSocialCommerceExtractHandler(makeDeps());
    const scenario = SOCIAL_COMMERCE_SCENARIOS[0]!;
    const response = await handler(
      new Request("http://localhost/api/v1/social-commerce/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          channel: scenario.channel,
          transcript: scenario.transcript,
          scenario: { scenarioId: scenario.id, synthetic: true },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    const parsed = socialCommerceExtractResponseSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.extractionMode).toBe("deterministic_parser_preview");
      expect(parsed.data.inference.status).toBe("unavailable");
    }
  });

  it("rejects non-JSON, malformed JSON, and invalid extraction payloads", async () => {
    const handler = createSocialCommerceExtractHandler(makeDeps());

    const wrongType = await handler(
      new Request("http://localhost/api/v1/social-commerce/extract", {
        method: "POST",
        headers: { "content-type": "text/plain" },
        body: "hello",
      }),
    );
    expect(wrongType.status).toBe(415);

    const malformed = await handler(
      new Request("http://localhost/api/v1/social-commerce/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad",
      }),
    );
    expect(malformed.status).toBe(400);

    const invalid = await handler(
      new Request("http://localhost/api/v1/social-commerce/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          channel: "messenger",
          transcript: "hi", // too short
        }),
      }),
    );
    expect(invalid.status).toBe(422);
  });

  it("POST /api/v1/social-commerce/evaluate returns dual PromiseGuard + MarginLeak output", async () => {
    const handler = createSocialCommerceEvaluateHandler(makeDeps());
    const response = await handler(
      new Request("http://localhost/api/v1/social-commerce/evaluate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: "1.0",
          scenarioId: "bd-healthy-order",
          orderRef: "SC-HEALTHY-001",
          channel: "whatsapp",
          currency: "BDT",
          productSummary: "Handcrafted Leather Tote Bag",
          quantity: 1,
          unresolvedExtractionFields: [],
          fulfillment: {
            dispatchByUtc: "2026-11-21T09:00:00.000Z",
            inventoryStatus: "secured",
            inventoryValidityKnown: true,
            fulfillmentState: "in_progress",
            blockingStatus: "none_known",
            blockerCodes: [],
            estimatedReadyAtUtc: "2026-11-21T06:00:00.000Z",
          },
          financials: {
            observationState: "final",
            categories: {
              grossItemRevenue: {
                expectedMinor: 240_000,
                observedMinor: 240_000,
              },
              shippingRevenue: { expectedMinor: 7_000, observedMinor: 7_000 },
              discounts: { expectedMinor: 0, observedMinor: 0 },
              cogs: { expectedMinor: 130_000, observedMinor: 130_000 },
              shippingCost: { expectedMinor: 7_000, observedMinor: 7_000 },
              fulfillmentCost: { expectedMinor: 6_000, observedMinor: 6_000 },
              paymentCost: { expectedMinor: 0, observedMinor: 0 },
              platformCost: { expectedMinor: 0, observedMinor: 0 },
            },
          },
        }),
      }),
    );

    expect(response.status).toBe(200);
    const body: unknown = await response.json();
    const parsed = socialCommerceEvaluateResponseSchema.safeParse(body);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.promiseGuard?.deterministic.data.assessment).toBe(
        "supported",
      );
      expect(parsed.data.marginLeak.deterministic.data.assessment).toBe(
        "no_leak_detected",
      );
      expect(parsed.data.combinedReview.overallStatus).toBe(
        "ready_for_human_confirmation",
      );
      expect(parsed.data.combinedReview.autonomousActionAllowed).toBe(false);
    }
  });
});

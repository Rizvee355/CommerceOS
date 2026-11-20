import { describe, expect, it } from "vitest";

import { extractOrderFromConversation } from "../domain/extractor";
import { SOCIAL_COMMERCE_SCENARIOS } from "../domain/scenarios";
import type { SocialCommerceExtractResponse } from "../domain/schema";
import {
  buildEvaluatePayloadFromForm,
  extractionToReviewForm,
} from "./draft-mapper";

const baseUtc = new Date("2026-11-20T04:00:00.000Z"); // 10:00 AM Bangladesh time (UTC+6)

const wrapExtraction = (
  transcript: string,
  channel: SocialCommerceExtractResponse["channel"] = "messenger",
): SocialCommerceExtractResponse => {
  const { draft, catalogMatch } = extractOrderFromConversation(transcript);
  return {
    schemaVersion: "1.0",
    metadata: {
      requestId: "11111111-1111-4111-8111-111111111111",
      traceId: "22222222-2222-4222-8222-222222222222",
      receivedAt: baseUtc.toISOString(),
      respondedAt: baseUtc.toISOString(),
    },
    channel,
    extractionMode: "deterministic_parser_preview",
    inference: { status: "unavailable", reasonCode: "configuration" },
    draft,
    catalogMatch,
    syntheticDemoDisclosure:
      "demonstration_only_no_autonomous_order_confirmation",
  };
};

describe("Social-Commerce draft-mapper (quantity preservation & Bangladesh UTC+6 timezone)", () => {
  it("maps extracted quantities accurately across all 4 preset scenarios without losing or inventing values", () => {
    const expectations: Record<string, string> = {
      "bd-banglish-margin-leak": "2",
      "bd-bangla-promise-risk": "1",
      "bd-ambiguous-missing-info": "",
      "bd-healthy-order": "1",
    };

    for (const scenario of SOCIAL_COMMERCE_SCENARIOS) {
      const form = extractionToReviewForm(
        wrapExtraction(scenario.transcript, scenario.channel),
        scenario.id,
        baseUtc,
      );
      expect(form.quantity).toBe(expectations[scenario.id]);
    }
  });

  it("never silently converts a missing quantity to 0 or 1 in the evaluate payload", () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-ambiguous-missing-info",
    )!;
    const form = extractionToReviewForm(
      wrapExtraction(scenario.transcript, scenario.channel),
      scenario.id,
      baseUtc,
    );

    expect(form.quantity).toBe("");
    const built = buildEvaluatePayloadFromForm(form, scenario.channel);
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(built.payload.quantity).toBeNull();
    expect(built.payload.unresolvedExtractionFields).toContain("quantity");
  });

  it("rejects invalid manual quantities (0, negative, decimal, non-numeric) while allowing valid merchant edits", () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS[0]!;
    const form = extractionToReviewForm(
      wrapExtraction(scenario.transcript, scenario.channel),
      scenario.id,
      baseUtc,
    );
    expect(form.quantity).toBe("2");

    for (const invalid of ["0", "-3", "2.5", "abc"]) {
      const res = buildEvaluatePayloadFromForm(
        { ...form, quantity: invalid },
        scenario.channel,
      );
      expect(res.ok).toBe(false);
    }

    const edited = buildEvaluatePayloadFromForm(
      { ...form, quantity: "4" },
      scenario.channel,
    );
    expect(edited.ok).toBe(true);
    if (edited.ok) {
      expect(edited.payload.quantity).toBe(4);
      expect(edited.payload.unresolvedExtractionFields).not.toContain(
        "quantity",
      );
    }
  });

  it("converts dispatch deadline and estimated ready time independently between Bangladesh time (UTC+6) and UTC", () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS[0]!;
    const form = extractionToReviewForm(
      wrapExtraction(scenario.transcript, scenario.channel),
      scenario.id,
      baseUtc,
    );

    // Scenario 1 offset is +1440m (24h from 2026-11-20T04:00Z = 2026-11-21T04:00Z = 2026-11-21T10:00 BD)
    expect(form.dispatchByLocal).toBe("2026-11-21T10:00");
    // Estimated ready is 180m earlier (2026-11-21T01:00Z = 2026-11-21T07:00 BD)
    expect(form.estimatedReadyAtLocal).toBe("2026-11-21T07:00");

    // Edit dispatch to 10:00 AM BD and ready estimate to 02:30 AM BD next date (crosses UTC midnight backwards)
    const built = buildEvaluatePayloadFromForm(
      {
        ...form,
        dispatchByLocal: "2026-11-20T10:00",
        estimatedReadyAtLocal: "2026-11-21T02:30",
      },
      scenario.channel,
    );
    expect(built.ok).toBe(true);
    if (!built.ok) return;

    expect(built.payload.fulfillment.dispatchByUtc).toBe(
      "2026-11-20T04:00:00.000Z",
    );
    expect(built.payload.fulfillment.estimatedReadyAtUtc).toBe(
      "2026-11-20T20:30:00.000Z",
    );
  });
});

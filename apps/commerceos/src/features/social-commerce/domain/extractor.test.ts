import { describe, expect, it } from "vitest";

import {
  extractOrderFromConversation,
  normalizeBengaliDigits,
} from "./extractor";
import { SOCIAL_COMMERCE_SCENARIOS } from "./scenarios";

describe("Bangla / Banglish / English social-commerce order extractor", () => {
  it("normalizes Bengali numerals to Arabic digits", () => {
    expect(normalizeBengaliDigits("দাম ১৮৫০ টাকা, ১টা")).toBe(
      "দাম 1850 টাকা, 1টা",
    );
  });

  it("extracts Banglish bargain order with discount, free delivery, and quotes", () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-banglish-margin-leak",
    )!;
    const { draft, catalogMatch } = extractOrderFromConversation(
      scenario.transcript,
    );

    expect(draft.detectedLanguage).toBe("banglish");
    expect(catalogMatch?.sku).toBe("SKU-HD-BLK");
    expect(draft.productName.value).toBe("Premium Fleece Hoodie (Black)");
    expect(draft.quantity.value).toBe(2);
    expect(draft.agreedTotalPriceMinor.value).toBe(260_000); // BDT 2,600.00
    expect(draft.agreedDiscountMinor.value).toBe(30_000); // BDT 300.00
    expect(draft.deliveryLocation.value).toBe("Uttara, Dhaka");
    expect(draft.deliveryZone).toBe("inside_dhaka");
    expect(draft.deliveryChargeMinor.value).toBe(0); // Free delivery
    expect(draft.paymentMethod).toBe("cod");
    expect(draft.promisedTimelineText.value).toMatch(/kal 2pm/i);
    expect(draft.productName.evidence.length).toBeGreaterThan(0);
    expect(draft.agreedDiscountMinor.evidence.length).toBeGreaterThan(0);
    expect(draft.requiresHumanVerification).toBe(true);
  });

  it("extracts Bangla script order with Bengali numerals and outside-Dhaka zone", () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-bangla-promise-risk",
    )!;
    const { draft, catalogMatch } = extractOrderFromConversation(
      scenario.transcript,
    );

    expect(draft.detectedLanguage).toBe("bn");
    expect(catalogMatch?.sku).toBe("SKU-PJ-KOT");
    expect(catalogMatch?.referenceStockStatus).toBe("not_secured");
    expect(draft.quantity.value).toBe(1);
    expect(draft.agreedTotalPriceMinor.value).toBe(185_000); // BDT 1,850.00
    expect(draft.deliveryLocation.value).toBe("Chattogram");
    expect(draft.deliveryZone).toBe("outside_dhaka");
    expect(draft.deliveryChargeMinor.value).toBe(13_000); // BDT 130.00
    expect(draft.paymentMethod).toBe("bkash");
    expect(draft.customerRequirements).toContain("Size: XL");
  });

  it("keeps missing and ambiguous fields null without inventing facts", () => {
    const scenario = SOCIAL_COMMERCE_SCENARIOS.find(
      (s) => s.id === "bd-ambiguous-missing-info",
    )!;
    const { draft, catalogMatch } = extractOrderFromConversation(
      scenario.transcript,
    );

    expect(catalogMatch?.sku).toBe("SKU-CS-SRM");
    expect(draft.quantity.value).toBeNull();
    expect(draft.quantity.confidence).toBe("missing");
    expect(draft.agreedTotalPriceMinor.value).toBeNull();
    expect(draft.agreedDiscountMinor.value).toBeNull();
    expect(draft.deliveryLocation.value).toBeNull();
    expect(draft.deliveryZone).toBe("unknown");
    expect(draft.deliveryChargeMinor.value).toBeNull();
    expect(draft.promisedTimelineText.confidence).toBe("low");
    expect(draft.suggestedDispatchByOffsetMinutes).toBeNull();
    expect(draft.uncertainties.map((u) => u.code)).toEqual(
      expect.arrayContaining([
        "MISSING_QUANTITY",
        "MISSING_AGREED_PRICE",
        "AMBIGUOUS_DISCOUNT",
        "MISSING_DELIVERY_LOCATION",
        "MISSING_DELIVERY_CHARGE",
        "AMBIGUOUS_TIMELINE",
      ]),
    );
  });

  it("does not invent catalog stock or COGS for an unrecognized product", () => {
    const { draft, catalogMatch } = extractOrderFromConversation(
      "Customer: 2ta blue denim jacket lagbe Sylhet e, 3000 taka.",
    );

    expect(catalogMatch).toBeNull();
    expect(draft.productName.confidence).toBe("low");
    expect(draft.deliveryLocation.value).toBe("Sylhet");
    expect(draft.deliveryZone).toBe("outside_dhaka");
    expect(
      draft.uncertainties.some((u) => u.code === "UNMATCHED_CATALOG_PRODUCT"),
    ).toBe(true);
  });
});

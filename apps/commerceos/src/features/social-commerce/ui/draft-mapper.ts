import {
  MARGIN_LEAK_FINANCIAL_CATEGORIES,
  type MarginLeakFinancialCategory,
  type PromiseGuardEvaluationRequest,
} from "@commerceos/contracts";

import {
  dhakaInputToUtcIso,
  offsetDateToDhakaInput,
} from "../../../lib/dhaka-time";
import {
  DEMO_COURIER_POLICY,
  referenceShippingMinorForZone,
} from "../domain/demo-catalog";
import type {
  SocialCommerceEvaluateRequest,
  SocialCommerceExtractResponse,
} from "../domain/schema";
import { minorToMajorInput, parseMajorInputToMinor } from "./format";

export type CategoryFormPair = {
  expectedMajor: string;
  observedMajor: string;
};

export type SocialCommerceReviewForm = {
  orderRef: string;
  scenarioId: string;
  productSummary: string;
  quantity: string;
  deliveryLocation: string;
  currency: "BDT";
  /** `YYYY-MM-DDTHH:mm` in Bangladesh time (Asia/Dhaka, UTC+6). Empty when missing. */
  dispatchByLocal: string;
  inventoryStatus: "secured" | "not_secured" | "unknown";
  inventoryValidityKnown: boolean;
  fulfillmentState:
    "not_started" | "in_progress" | "ready" | "blocked" | "unknown";
  blockingStatus: "none_known" | "active" | "unknown";
  blockerCodes: PromiseGuardEvaluationRequest["operationalEvidence"]["blockingState"]["codes"];
  includeReadyEstimate: boolean;
  /** `YYYY-MM-DDTHH:mm` in Bangladesh time (Asia/Dhaka, UTC+6). Empty when missing. */
  estimatedReadyAtLocal: string;
  observationState: "final" | "provisional";
  categories: Record<MarginLeakFinancialCategory, CategoryFormPair>;
};

const basisPointsOf = (amountMinor: number, bps: number): number =>
  Math.round((amountMinor * bps) / 10_000);

/**
 * Builds the editable Step 2 review form from extraction results.
 *
 * Strictly preserves missing values as empty strings ("") rather than inventing
 * zero costs, fake stock, or arbitrary dispatch deadlines.
 */
export const extractionToReviewForm = (
  extraction: SocialCommerceExtractResponse,
  scenarioId: string,
  serverAsOf: Date,
): SocialCommerceReviewForm => {
  const { draft, catalogMatch } = extraction;
  const qty = draft.quantity.value;

  const expectedGross =
    catalogMatch && qty !== null ? catalogMatch.listPriceMinor * qty : null;
  const observedGross =
    draft.agreedTotalPriceMinor.value !== null
      ? expectedGross !== null &&
        draft.agreedTotalPriceMinor.value === expectedGross
        ? expectedGross
        : draft.agreedTotalPriceMinor.value +
          (draft.agreedDiscountMinor.value ?? 0)
      : null;

  const expectedShippingRev = referenceShippingMinorForZone(draft.deliveryZone);
  const observedShippingRev = draft.deliveryChargeMinor.value;

  const expectedDiscount = catalogMatch && qty !== null ? 0 : null;
  const observedDiscount = draft.agreedDiscountMinor.value;

  const expectedCogs =
    catalogMatch && qty !== null ? catalogMatch.standardCogsMinor * qty : null;
  const observedCogs = expectedCogs;

  const expectedShippingCost = referenceShippingMinorForZone(
    draft.deliveryZone,
  );
  const observedShippingCost = expectedShippingCost;

  const expectedFulfillment =
    catalogMatch && qty !== null
      ? catalogMatch.standardFulfillmentCostMinor * qty
      : null;
  const observedFulfillment = expectedFulfillment;

  // Payment processing fee: standard rate for the chosen payment method (1.0% COD, 1.5% bKash/Nagad)
  // applied to expected vs. observed collectible amounts; stays null when payment method or totals are unknown.
  const paymentRateBps =
    draft.paymentMethod === "cod"
      ? DEMO_COURIER_POLICY.codFeeBasisPoints
      : draft.paymentMethod === "bkash" || draft.paymentMethod === "nagad"
        ? DEMO_COURIER_POLICY.mfsFeeBasisPoints
        : null;
  const expectedCollectibleMinor =
    expectedGross !== null && expectedShippingRev !== null
      ? expectedGross + expectedShippingRev
      : null;
  const observedCollectibleMinor =
    draft.agreedTotalPriceMinor.value !== null &&
    draft.deliveryChargeMinor.value !== null
      ? draft.agreedTotalPriceMinor.value + draft.deliveryChargeMinor.value
      : null;
  const expectedPaymentCost =
    expectedCollectibleMinor !== null && paymentRateBps !== null
      ? basisPointsOf(expectedCollectibleMinor, paymentRateBps)
      : null;
  const observedPaymentCost =
    observedCollectibleMinor !== null && paymentRateBps !== null
      ? basisPointsOf(observedCollectibleMinor, paymentRateBps)
      : null;

  const expectedPlatformCost =
    catalogMatch && qty !== null
      ? DEMO_COURIER_POLICY.directSocialPlatformFeeMinor
      : null;
  const observedPlatformCost = expectedPlatformCost;

  const hasTimeline = draft.suggestedDispatchByOffsetMinutes !== null;
  const dispatchByLocal = hasTimeline
    ? offsetDateToDhakaInput(
        serverAsOf,
        draft.suggestedDispatchByOffsetMinutes!,
      )
    : "";

  const stockStatus = catalogMatch?.referenceStockStatus ?? "unknown";
  const isOutOfStock = stockStatus === "not_secured";
  const isUnknownStock = stockStatus === "unknown";

  // Ready estimate: only populated when stock is known and timeline exists
  const includeReadyEstimate = hasTimeline && !isUnknownStock;
  const estimatedReadyAtLocal = includeReadyEstimate
    ? offsetDateToDhakaInput(
        serverAsOf,
        isOutOfStock
          ? draft.suggestedDispatchByOffsetMinutes! + 720 // 12h after deadline due to restock hold
          : Math.max(120, draft.suggestedDispatchByOffsetMinutes! - 180),
      )
    : "";

  const orderSeq = scenarioId
    .replace(/[^A-Za-z0-9]/g, "")
    .slice(0, 12)
    .toUpperCase();

  return {
    orderRef: `SC-${orderSeq || "DEMO"}-001`,
    scenarioId,
    productSummary: draft.productName.value ?? "",
    quantity: qty !== null ? String(qty) : "",
    deliveryLocation: draft.deliveryLocation.value ?? "",
    currency: "BDT",
    dispatchByLocal,
    inventoryStatus: stockStatus,
    inventoryValidityKnown: !isUnknownStock,
    fulfillmentState: isOutOfStock
      ? "blocked"
      : isUnknownStock
        ? "unknown"
        : "in_progress",
    blockingStatus: isOutOfStock
      ? "active"
      : isUnknownStock
        ? "unknown"
        : "none_known",
    blockerCodes: isOutOfStock
      ? [...(catalogMatch?.referenceBlockerCodes ?? ["inventory_shortage"])]
      : [],
    includeReadyEstimate,
    estimatedReadyAtLocal,
    observationState: "final",
    categories: {
      grossItemRevenue: {
        expectedMajor: minorToMajorInput(expectedGross),
        observedMajor: minorToMajorInput(observedGross),
      },
      shippingRevenue: {
        expectedMajor: minorToMajorInput(expectedShippingRev),
        observedMajor: minorToMajorInput(observedShippingRev),
      },
      discounts: {
        expectedMajor: minorToMajorInput(expectedDiscount),
        observedMajor: minorToMajorInput(observedDiscount),
      },
      cogs: {
        expectedMajor: minorToMajorInput(expectedCogs),
        observedMajor: minorToMajorInput(observedCogs),
      },
      shippingCost: {
        expectedMajor: minorToMajorInput(expectedShippingCost),
        observedMajor: minorToMajorInput(observedShippingCost),
      },
      fulfillmentCost: {
        expectedMajor: minorToMajorInput(expectedFulfillment),
        observedMajor: minorToMajorInput(observedFulfillment),
      },
      paymentCost: {
        expectedMajor: minorToMajorInput(expectedPaymentCost),
        observedMajor: minorToMajorInput(observedPaymentCost),
      },
      platformCost: {
        expectedMajor: minorToMajorInput(expectedPlatformCost),
        observedMajor: minorToMajorInput(observedPlatformCost),
      },
    },
  };
};

export const buildEvaluatePayloadFromForm = (
  form: SocialCommerceReviewForm,
  channel: SocialCommerceEvaluateRequest["channel"],
):
  | { ok: true; payload: SocialCommerceEvaluateRequest }
  | { ok: false; error: string } => {
  const productSummary =
    form.productSummary.trim() || "Unspecified item (needs verification)";

  // Never coerce a missing quantity to 0 or 1; keep null when blank and flag as unresolved.
  const rawQty = form.quantity.trim();
  let qtyNum: number | null = null;
  if (rawQty !== "") {
    if (!/^\d{1,4}$/.test(rawQty)) {
      return {
        ok: false,
        error:
          "Quantity must be a whole number between 1 and 1,000, or leave blank if missing.",
      };
    }
    const parsedQty = Number(rawQty);
    if (!Number.isInteger(parsedQty) || parsedQty < 1 || parsedQty > 1_000) {
      return {
        ok: false,
        error:
          "Quantity must be a whole number between 1 and 1,000, or leave blank if missing.",
      };
    }
    qtyNum = parsedQty;
  }

  const unresolved: string[] = [];
  if (!form.productSummary.trim()) unresolved.push("productName");
  if (qtyNum === null) unresolved.push("quantity");
  if (!form.deliveryLocation.trim()) unresolved.push("deliveryLocation");
  if (!form.dispatchByLocal.trim()) unresolved.push("dispatchByUtc");

  const categories =
    {} as SocialCommerceEvaluateRequest["financials"]["categories"];
  for (const category of MARGIN_LEAK_FINANCIAL_CATEGORIES) {
    const pair = form.categories[category];
    const expectedMinor = parseMajorInputToMinor(pair.expectedMajor);
    const observedMinor = parseMajorInputToMinor(pair.observedMajor);
    if (expectedMinor === "invalid" || observedMinor === "invalid") {
      return {
        ok: false,
        error: `Invalid BDT amount in ${category}. Enter a non-negative number (e.g. 1450 or 70.50) or leave blank if missing.`,
      };
    }
    categories[category] = { expectedMinor, observedMinor };
  }

  const dispatchRaw = form.dispatchByLocal.trim();
  const dispatchByUtc = dispatchRaw ? dhakaInputToUtcIso(dispatchRaw) : null;
  if (dispatchRaw && !dispatchByUtc) {
    return {
      ok: false,
      error:
        "Invalid promised dispatch date/time. Enter a valid Bangladesh time (UTC+6) or leave blank if missing.",
    };
  }

  const readyRaw = form.includeReadyEstimate
    ? form.estimatedReadyAtLocal.trim()
    : "";
  const estimatedReadyAtUtc = readyRaw ? dhakaInputToUtcIso(readyRaw) : null;
  if (readyRaw && !estimatedReadyAtUtc) {
    return {
      ok: false,
      error:
        "Invalid estimated ready date/time. Enter a valid Bangladesh time (UTC+6) or uncheck readiness estimate.",
    };
  }

  return {
    ok: true,
    payload: {
      schemaVersion: "1.0",
      scenarioId: form.scenarioId,
      orderRef: form.orderRef.trim() || "SC-DEMO-001",
      channel,
      currency: form.currency,
      productSummary,
      quantity: qtyNum,
      unresolvedExtractionFields: unresolved,
      fulfillment: {
        dispatchByUtc,
        inventoryStatus: form.inventoryStatus,
        inventoryValidityKnown: form.inventoryValidityKnown,
        fulfillmentState: form.fulfillmentState,
        blockingStatus: form.blockingStatus,
        blockerCodes:
          form.blockingStatus === "active"
            ? form.blockerCodes.length > 0
              ? form.blockerCodes
              : ["inventory_shortage"]
            : [],
        estimatedReadyAtUtc,
      },
      financials: {
        observationState: form.observationState,
        categories,
      },
    },
  };
};

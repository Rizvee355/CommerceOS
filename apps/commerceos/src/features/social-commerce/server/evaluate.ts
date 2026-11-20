import {
  MARGIN_LEAK_FINANCIAL_CATEGORIES,
  marginLeakEvaluationRequestSchema,
  promiseGuardEvaluationRequestSchema,
  SCHEMA_VERSION,
  type MarginLeakEvaluationRequest,
  type MarginLeakEvaluationResponse,
  type PromiseGuardEvaluationResponse,
} from "@commerceos/contracts";
import type { InferenceProvider } from "@commerceos/inference";

import { analyzeMarginLeak } from "../../marginleak/server/analyze";
import { analyzePromiseGuard } from "../../promiseguard/server/analyze";
import {
  socialCommerceEvaluateResponseSchema,
  type RecommendedAction,
  type SocialCommerceEvaluateRequest,
  type SocialCommerceEvaluateResponse,
} from "../domain/schema";

export type SocialCommerceEvaluateDependencies = {
  now: () => Date;
  randomUUID: () => string;
  inferenceProvider: InferenceProvider | null;
};

const offsetIso = (base: Date, minutes: number): string =>
  new Date(base.getTime() + minutes * 60_000).toISOString();

const buildMarginLeakRequest = (
  request: SocialCommerceEvaluateRequest,
  asOf: Date,
): MarginLeakEvaluationRequest => {
  const recordedAt = asOf.toISOString();
  const financials: MarginLeakEvaluationRequest["financials"] = {};

  for (const category of MARGIN_LEAK_FINANCIAL_CATEGORIES) {
    const pair = request.financials.categories[category];
    const component: NonNullable<
      MarginLeakEvaluationRequest["financials"][typeof category]
    > = {};

    if (pair.expectedMinor !== null) {
      component.expected = {
        amountMinor: pair.expectedMinor,
        currency: request.currency,
        evidenceId: `sc-${category}-expected`,
        source: {
          kind: "synthetic_fixture",
          label: `Expected ${category} (demo order review)`,
          recordedAt,
        },
      };
    }

    if (pair.observedMinor !== null) {
      component.observed = {
        amountMinor: pair.observedMinor,
        currency: request.currency,
        evidenceId: `sc-${category}-observed`,
        source: {
          kind: "synthetic_fixture",
          label: `Observed/quoted ${category} (chat & merchant review)`,
          recordedAt,
        },
      };
    }

    if (component.expected || component.observed) {
      financials[category] = component;
    }
  }

  return marginLeakEvaluationRequestSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    moduleId: "marginleak",
    scenario: {
      scenarioId: request.scenarioId,
      synthetic: true,
    },
    orderRef: request.orderRef,
    currency: request.currency,
    observationState: request.financials.observationState,
    financials,
  });
};

const FIELD_DISPLAY: Record<string, { en: string; bn: string }> = {
  productName: { en: "Product", bn: "পণ্য" },
  quantity: { en: "Quantity", bn: "পরিমাণ" },
  deliveryLocation: { en: "Delivery area", bn: "ডেলিভারি এলাকা" },
  dispatchByUtc: { en: "Dispatch deadline", bn: "ডিসপ্যাচ সময়সীমা" },
};

const CATEGORY_DISPLAY: Record<string, { en: string; bn: string }> = {
  grossItemRevenue: { en: "Gross item revenue", bn: "পণ্যের বিক্রয়মূল্য" },
  shippingRevenue: {
    en: "Customer delivery charge",
    bn: "ক্রেতার ডেলিভারি চার্জ",
  },
  discounts: { en: "Discounts & concessions", bn: "ছাড় ও ডিসকাউন্ট" },
  cogs: { en: "Cost of goods sold", bn: "পণ্যের ক্রয়মূল্য" },
  shippingCost: { en: "Courier shipping cost", bn: "কুরিয়ার খরচ" },
  fulfillmentCost: { en: "Packaging & handling", bn: "প্যাকেজিং ও হ্যান্ডলিং" },
  paymentCost: { en: "COD / bKash payment fee", bn: "COD / বিকাশ চার্জ" },
  platformCost: { en: "Platform commission", bn: "প্ল্যাটফর্ম কমিশন" },
};

const buildRecommendedActions = (
  request: SocialCommerceEvaluateRequest,
  promiseGuard: PromiseGuardEvaluationResponse | null,
  marginLeak: MarginLeakEvaluationResponse,
): RecommendedAction[] => {
  const actions: RecommendedAction[] = [];
  const pushAction = (action: Omit<RecommendedAction, "priority">) => {
    actions.push({ ...action, priority: actions.length + 1 });
  };

  if (request.unresolvedExtractionFields.length > 0) {
    const missingEn = request.unresolvedExtractionFields
      .map((field) => FIELD_DISPLAY[field]?.en ?? field)
      .join(", ");
    const missingBn = request.unresolvedExtractionFields
      .map((field) => FIELD_DISPLAY[field]?.bn ?? field)
      .join(", ");
    pushAction({
      source: "extraction",
      code: "CLARIFY_MISSING_CHAT_DETAILS",
      titleEn: "Confirm missing customer details in chat before accepting",
      titleBn: "অর্ডার কনফার্ম করার আগে ক্রেতার কাছ থেকে বাকি তথ্য জেনে নিন",
      detailEn: `Still missing: ${missingEn}. Reply to the customer to confirm these details instead of guessing.`,
      detailBn: `বাকি তথ্য: ${missingBn}। অনুমান না করে ক্রেতাকে রিপ্লাই করে নিশ্চিত করুন।`,
      evidenceRefs: request.unresolvedExtractionFields.slice(0, 6),
    });
  }

  if (!promiseGuard) {
    pushAction({
      source: "promiseguard",
      code: "CONFIRM_DISPATCH_DEADLINE",
      titleEn: "Set a concrete dispatch deadline before promising delivery",
      titleBn:
        "ডেলিভারি প্রতিশ্রুতি দেওয়ার আগে নির্দিষ্ট ডিসপ্যাচ সময় ঠিক করুন",
      detailEn:
        "No concrete dispatch-by timestamp was provided. Agree on an exact dispatch cutoff with the customer before confirming.",
      detailBn:
        "কোনো নির্দিষ্ট ডিসপ্যাচ সময় দেওয়া হয়নি। কনফার্ম করার আগে ক্রেতার সাথে সঠিক সময় ঠিক করুন।",
      evidenceRefs: ["/fulfillment/dispatchByUtc"],
    });
  } else {
    const pgFindings = new Set(
      promiseGuard.deterministic.data.findings.map(({ code }) => code),
    );
    if (
      pgFindings.has("INVENTORY_NOT_SECURED") ||
      pgFindings.has("ACTIVE_BLOCKER_REPORTED") ||
      pgFindings.has("FULFILLMENT_BLOCKED")
    ) {
      pushAction({
        source: "promiseguard",
        code: "HOLD_PROMISE_UNTIL_STOCK_RESOLVED",
        titleEn:
          "Do not promise next-day dispatch — resolve stock blocker first",
        titleBn:
          "এখনই ডেলিভারি প্রতিশ্রুতি দেবেন না — আগে স্টক সমস্যা সমাধান করুন",
        detailEn:
          "PromiseGuard detected unsecured stock or an active fulfillment blocker. Offer an alternate size/SKU or revised timeline after human verification.",
        detailBn:
          "PromiseGuard স্টক ঘাটতি বা ফুলফিলমেন্ট ব্লকার শনাক্ত করেছে। বিকল্প সাইজ/পণ্য বা নতুন সময় প্রস্তাব করুন।",
        evidenceRefs: ["ev-sc-inventory", "ev-sc-blocker"],
      });
    } else if (
      pgFindings.has("READY_ESTIMATE_AFTER_DEADLINE") ||
      pgFindings.has("DISPATCH_DEADLINE_ELAPSED")
    ) {
      pushAction({
        source: "promiseguard",
        code: "RENEGOTIATE_DISPATCH_WINDOW",
        titleEn: "Renegotiate the promised dispatch window with the customer",
        titleBn: "ক্রেতার সাথে ডিসপ্যাচ সময়সীমা পুনর্নির্ধারণ করুন",
        detailEn:
          "The current readiness estimate misses the promised dispatch deadline. Proactively message the customer with a realistic courier cutoff.",
        detailBn:
          "বর্তমান প্রস্তুতি সময় প্রতিশ্রুত ডিসপ্যাচ সময় অতিক্রম করছে। বাস্তবসম্মত ডেলিভারি সময় ক্রেতাকে আগেই জানান।",
        evidenceRefs: ["ev-sc-commitment", "ev-sc-estimate"],
      });
    } else if (promiseGuard.deterministic.data.assessment === "indeterminate") {
      pushAction({
        source: "promiseguard",
        code: "VERIFY_STOCK_AND_READY_TIME",
        titleEn: "Verify physical stock count and packing readiness time",
        titleBn: "সরাসরি স্টক ও প্যাকিংয়ের সম্ভাব্য সময় যাচাই করুন",
        detailEn:
          "Fulfillment evidence is incomplete or unverified. Confirm shelf stock and expected packing completion before committing.",
        detailBn:
          "ফুলফিলমেন্ট তথ্য অসম্পূর্ণ। কনফার্ম করার আগে স্টক ও প্যাকিং প্রস্তুত হওয়ার সময় যাচাই করুন।",
        evidenceRefs: ["ev-sc-inventory", "ev-sc-fulfillment"],
      });
    }
  }

  const mlData = marginLeak.deterministic.data;
  if (mlData.assessment === "leak_detected") {
    const adverseCategories = mlData.categoryComparisons
      .filter((item) => item.direction === "adverse")
      .map((item) => item.category);
    const adverseEn = adverseCategories
      .map((cat) => CATEGORY_DISPLAY[cat]?.en ?? cat)
      .join(", ");
    const adverseBn = adverseCategories
      .map((cat) => CATEGORY_DISPLAY[cat]?.bn ?? cat)
      .join(", ");
    pushAction({
      source: "marginleak",
      code: "AUDIT_MARGIN_LEAK_DRIVERS",
      titleEn:
        "Review chat discount & delivery concession before approving margin hit",
      titleBn:
        "অর্ডার অনুমোদনের আগে চ্যাটে দেওয়া ছাড় ও ডেলিভারি খরচ পর্যালোচনা করুন",
      detailEn: `Profit impact is driven by: ${adverseEn}. Confirm whether this concession is intentionally approved.`,
      detailBn: `লাভ কমার মূল কারণ: ${adverseBn}। এই ছাড় বা খরচ ইচ্ছাকৃতভাবে অনুমোদিত কিনা যাচাই করুন।`,
      evidenceRefs: adverseCategories.slice(0, 6),
    });
  } else if (mlData.evidenceCompleteness === "incomplete") {
    pushAction({
      source: "marginleak",
      code: "SUPPLY_MISSING_COST_EVIDENCE",
      titleEn: "Enter missing cost/price inputs to verify true order profit",
      titleBn: "সঠিক লাভ হিসাব করতে বাকি মূল্য ও খরচের তথ্য দিন",
      detailEn: `Aggregate contribution totals are intentionally withheld because ${mlData.missingEvidencePaths.length} financial observation(s) are missing. Missing inputs are never treated as ৳0.`,
      detailBn: `${mlData.missingEvidencePaths.length}টি আর্থিক তথ্য না থাকায় মোট লাভ হিসাব স্থগিত রাখা হয়েছে। অনুপস্থিত তথ্য কখনোই ৳০ ধরা হয় না।`,
      evidenceRefs: mlData.missingEvidencePaths.slice(0, 6),
    });
  } else if (mlData.observationState === "provisional") {
    pushAction({
      source: "marginleak",
      code: "RECONCILE_AFTER_COURIER_SETTLEMENT",
      titleEn: "Re-check final margin once courier & payment fees settle",
      titleBn: "কুরিয়ার ও পেমেন্ট ফি চূড়ান্ত হলে পুনরায় মার্জিন যাচাই করুন",
      detailEn:
        "Financial observations are currently provisional (pre-settlement). Confirmed leakage is withheld until final courier/COD statements arrive.",
      detailBn:
        "আর্থিক তথ্য বর্তমানে অস্থায়ী। কুরিয়ার ও ক্যাশ অন ডেলিভারি চার্জ চূড়ান্ত হলে পুনরায় হিসাব করুন।",
      evidenceRefs: ["/observationState"],
    });
  }

  if (actions.length === 0) {
    pushAction({
      source: "promiseguard",
      code: "READY_FOR_MANUAL_MERCHANT_CONFIRMATION",
      titleEn:
        "Order passed PromiseGuard & MarginLeak — ready for manual confirmation",
      titleBn:
        "অর্ডারটি PromiseGuard ও MarginLeak পরীক্ষায় উত্তীর্ণ — ম্যানুয়ালি কনফার্ম করুন",
      detailEn:
        "Dispatch readiness is supported and zero adverse margin leakage was detected. Review the summary and manually confirm the order with the customer.",
      detailBn:
        "ডিসপ্যাচ প্রস্তুতি সমর্থিত এবং কোনো ক্ষতিকর মার্জিন লিক নেই। সারসংক্ষেপ দেখে ক্রেতাকে ম্যানুয়ালি কনফার্ম করুন।",
      evidenceRefs: ["ev-sc-commitment"],
    });
  }

  return actions.slice(0, 10);
};

export const evaluateSocialCommerceOrder = async (
  request: SocialCommerceEvaluateRequest,
  dependencies: SocialCommerceEvaluateDependencies,
): Promise<SocialCommerceEvaluateResponse> => {
  const receivedAt = dependencies.now();
  const requestId = dependencies.randomUUID();
  const traceId = dependencies.randomUUID();

  let promiseGuardResponse: PromiseGuardEvaluationResponse | null = null;
  let promiseGuardSkippedReason: string | null = null;

  if (request.fulfillment.dispatchByUtc) {
    const pgRequest = promiseGuardEvaluationRequestSchema.parse({
      schemaVersion: SCHEMA_VERSION,
      moduleId: "promiseguard",
      scenario: {
        scenarioId: request.scenarioId,
        synthetic: true,
      },
      fulfillmentRef: request.orderRef,
      commitment: {
        evidenceId: "ev-sc-commitment",
        kind: "dispatch_by",
        dispatchBy: request.fulfillment.dispatchByUtc,
      },
      operationalEvidence: {
        inventoryAllocation: {
          evidenceId: "ev-sc-inventory",
          origin: "synthetic_fixture",
          observedAt: offsetIso(receivedAt, -10),
          validUntil: request.fulfillment.inventoryValidityKnown
            ? offsetIso(receivedAt, 360)
            : null,
          status: request.fulfillment.inventoryStatus,
        },
        fulfillmentState: {
          evidenceId: "ev-sc-fulfillment",
          origin: "synthetic_fixture",
          observedAt: offsetIso(receivedAt, -10),
          validUntil: offsetIso(receivedAt, 360),
          state: request.fulfillment.fulfillmentState,
        },
        blockingState: {
          evidenceId: "ev-sc-blocker",
          origin: "synthetic_fixture",
          observedAt: offsetIso(receivedAt, -10),
          validUntil: offsetIso(receivedAt, 360),
          status: request.fulfillment.blockingStatus,
          codes:
            request.fulfillment.blockingStatus === "active"
              ? request.fulfillment.blockerCodes.length > 0
                ? request.fulfillment.blockerCodes
                : ["other_operational_blocker"]
              : [],
        },
        ...(request.fulfillment.estimatedReadyAtUtc
          ? {
              readyTimeEstimate: {
                evidenceId: "ev-sc-estimate",
                origin: "synthetic_fixture",
                observedAt: offsetIso(receivedAt, -5),
                validUntil: offsetIso(receivedAt, 240),
                estimatedReadyAt: request.fulfillment.estimatedReadyAtUtc,
              },
            }
          : {}),
      },
    });

    promiseGuardResponse = await analyzePromiseGuard(pgRequest, {
      inferenceProvider: dependencies.inferenceProvider,
      now: dependencies.now,
      randomUUID: dependencies.randomUUID,
    });
  } else {
    promiseGuardSkippedReason =
      "No concrete dispatch deadline was confirmed in chat or by the merchant; PromiseGuard requires an explicit dispatch-by timestamp rather than inventing one.";
  }

  const mlRequest = buildMarginLeakRequest(request, receivedAt);
  const marginLeakResponse = analyzeMarginLeak(mlRequest, {
    now: dependencies.now,
    randomUUID: dependencies.randomUUID,
  });

  const combinedReasonCodes = [
    ...(request.unresolvedExtractionFields.length > 0
      ? ["SOCIAL_COMMERCE_UNRESOLVED_EXTRACTION"]
      : []),
    ...(!promiseGuardResponse
      ? ["SOCIAL_COMMERCE_MISSING_DISPATCH_DEADLINE"]
      : []),
    ...(promiseGuardResponse?.humanReview.reasonCodes ?? []),
    ...marginLeakResponse.humanReview.reasonCodes,
  ];
  const uniqueReasonCodes = [...new Set(combinedReasonCodes)];
  const reviewRequired = uniqueReasonCodes.length > 0;

  const recommendedActions = buildRecommendedActions(
    request,
    promiseGuardResponse,
    marginLeakResponse,
  );

  return socialCommerceEvaluateResponseSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      requestId,
      traceId,
      receivedAt: receivedAt.toISOString(),
      respondedAt: dependencies.now().toISOString(),
    },
    orderRef: request.orderRef,
    channel: request.channel,
    currency: request.currency,
    promiseGuard: promiseGuardResponse,
    promiseGuardSkippedReason,
    marginLeak: marginLeakResponse,
    combinedReview: {
      required: reviewRequired,
      reasonCodes: uniqueReasonCodes,
      decidedBy: "deterministic_policy",
      policyVersion: "social-commerce-combined-1.0.0",
      autonomousActionAllowed: false,
      overallStatus: reviewRequired
        ? "hold_for_review"
        : "ready_for_human_confirmation",
    },
    recommendedActions,
    syntheticDemoDisclosure:
      "demonstration_only_no_autonomous_order_confirmation",
  });
};

import {
  currencyCodeSchema,
  humanReviewMetadataSchema,
  inferenceMetadataSchema,
  MARGIN_LEAK_FINANCIAL_CATEGORIES,
  MARGIN_LEAK_MAX_COMPONENT_AMOUNT_MINOR,
  marginLeakEvaluationResponseSchema,
  marginLeakObservationStateSchema,
  promiseGuardBlockerCodeSchema,
  promiseGuardEvaluationResponseSchema,
  responseMetadataSchema,
  SCHEMA_VERSION,
  scenarioRefSchema,
} from "@commerceos/contracts";
import { z } from "zod";

const utcTimestampSchema = z
  .string()
  .datetime({ offset: false })
  .describe("RFC 3339 UTC timestamp");

export const socialCommerceChannelSchema = z.enum([
  "messenger",
  "whatsapp",
  "facebook_comment",
]);

export const socialCommerceLanguageSchema = z.enum([
  "bn",
  "en",
  "banglish",
  "mixed",
]);

export const fieldConfidenceSchema = z.enum([
  "high",
  "medium",
  "low",
  "missing",
]);

export const evidenceSpanSchema = z.strictObject({
  lineNumber: z.number().int().min(1).max(500),
  speaker: z.enum(["customer", "merchant", "unknown"]),
  quote: z.string().trim().min(1).max(320),
});

const extractedFieldOf = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.strictObject({
    value: valueSchema.nullable(),
    confidence: fieldConfidenceSchema,
    needsVerification: z.boolean(),
    reason: z.string().trim().min(1).max(280).optional(),
    evidence: z.array(evidenceSpanSchema).max(6),
  });

export const deliveryZoneSchema = z.enum([
  "inside_dhaka",
  "outside_dhaka",
  "unknown",
]);

export const extractionUncertaintySchema = z.strictObject({
  field: z.string().trim().min(1).max(64),
  code: z.string().trim().min(1).max(64),
  messageEn: z.string().trim().min(1).max(280),
  messageBn: z.string().trim().min(1).max(280),
});

export const demoCatalogMatchSchema = z.strictObject({
  sku: z.string().trim().min(1).max(64),
  nameEn: z.string().trim().min(1).max(160),
  nameBn: z.string().trim().min(1).max(160),
  listPriceMinor: z.number().int().nonnegative().safe(),
  standardCogsMinor: z.number().int().nonnegative().safe(),
  standardFulfillmentCostMinor: z.number().int().nonnegative().safe(),
  currency: currencyCodeSchema,
  referenceStockStatus: z.enum(["secured", "not_secured", "unknown"]),
  referenceStockNoteEn: z.string().trim().min(1).max(240),
  referenceStockNoteBn: z.string().trim().min(1).max(240),
  referenceBlockerCodes: z.array(promiseGuardBlockerCodeSchema).max(5),
  syntheticDemoData: z.literal(true),
});

export const socialCommerceOrderDraftSchema = z.strictObject({
  detectedLanguage: socialCommerceLanguageSchema,
  productName: extractedFieldOf(z.string().trim().min(1).max(160)),
  quantity: extractedFieldOf(z.number().int().min(1).max(1_000)),
  agreedTotalPriceMinor: extractedFieldOf(
    z.number().int().nonnegative().max(MARGIN_LEAK_MAX_COMPONENT_AMOUNT_MINOR),
  ),
  agreedDiscountMinor: extractedFieldOf(
    z.number().int().nonnegative().max(MARGIN_LEAK_MAX_COMPONENT_AMOUNT_MINOR),
  ),
  deliveryLocation: extractedFieldOf(z.string().trim().min(1).max(160)),
  deliveryZone: deliveryZoneSchema,
  deliveryChargeMinor: extractedFieldOf(
    z.number().int().nonnegative().max(MARGIN_LEAK_MAX_COMPONENT_AMOUNT_MINOR),
  ),
  promisedTimelineText: extractedFieldOf(z.string().trim().min(1).max(160)),
  suggestedDispatchByOffsetMinutes: z
    .number()
    .int()
    .min(-1440)
    .max(20160)
    .nullable(),
  customerRequirements: z.array(z.string().trim().min(1).max(120)).max(12),
  paymentMethod: z.enum(["cod", "bkash", "nagad", "bank", "unknown"]),
  uncertainties: z.array(extractionUncertaintySchema).max(24),
  requiresHumanVerification: z.boolean(),
});

export const socialCommerceExtractRequestSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  channel: socialCommerceChannelSchema,
  transcript: z.string().trim().min(5).max(8_000),
  scenario: scenarioRefSchema.optional(),
});

export const socialCommerceExtractResponseSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  metadata: responseMetadataSchema,
  channel: socialCommerceChannelSchema,
  extractionMode: z.enum(["live_llm", "deterministic_parser_preview"]),
  inference: inferenceMetadataSchema,
  draft: socialCommerceOrderDraftSchema,
  catalogMatch: demoCatalogMatchSchema.nullable(),
  syntheticDemoDisclosure: z.literal(
    "demonstration_only_no_autonomous_order_confirmation",
  ),
});

const optionalMinorAmountSchema = z
  .number()
  .int()
  .nonnegative()
  .max(MARGIN_LEAK_MAX_COMPONENT_AMOUNT_MINOR)
  .nullable();

const financialCategoryPairSchema = z.strictObject({
  expectedMinor: optionalMinorAmountSchema,
  observedMinor: optionalMinorAmountSchema,
});

const socialCommerceFinancialsInputSchema = z.strictObject(
  Object.fromEntries(
    MARGIN_LEAK_FINANCIAL_CATEGORIES.map((category) => [
      category,
      financialCategoryPairSchema,
    ]),
  ) as Record<
    (typeof MARGIN_LEAK_FINANCIAL_CATEGORIES)[number],
    typeof financialCategoryPairSchema
  >,
);

export const socialCommerceEvaluateRequestSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  scenarioId: z.string().trim().min(1).max(64),
  orderRef: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Za-z0-9][A-Za-z0-9._:-]*$/),
  channel: socialCommerceChannelSchema,
  currency: currencyCodeSchema,
  productSummary: z.string().trim().min(1).max(200),
  quantity: z.number().int().min(1).max(1_000).nullable(),
  unresolvedExtractionFields: z.array(z.string().trim().min(1).max(64)).max(16),
  fulfillment: z.strictObject({
    dispatchByUtc: utcTimestampSchema.nullable(),
    inventoryStatus: z.enum(["secured", "not_secured", "unknown"]),
    inventoryValidityKnown: z.boolean(),
    fulfillmentState: z.enum([
      "not_started",
      "in_progress",
      "ready",
      "blocked",
      "unknown",
    ]),
    blockingStatus: z.enum(["none_known", "active", "unknown"]),
    blockerCodes: z.array(promiseGuardBlockerCodeSchema).max(5),
    estimatedReadyAtUtc: utcTimestampSchema.nullable(),
  }),
  financials: z.strictObject({
    observationState: marginLeakObservationStateSchema,
    categories: socialCommerceFinancialsInputSchema,
  }),
});

export const recommendedActionSchema = z.strictObject({
  priority: z.number().int().min(1).max(10),
  source: z.enum(["extraction", "promiseguard", "marginleak"]),
  code: z.string().trim().min(1).max(64),
  titleEn: z.string().trim().min(1).max(160),
  titleBn: z.string().trim().min(1).max(160),
  detailEn: z.string().trim().min(1).max(360),
  detailBn: z.string().trim().min(1).max(360),
  evidenceRefs: z.array(z.string().trim().min(1).max(128)).max(8),
});

export const socialCommerceEvaluateResponseSchema = z.strictObject({
  schemaVersion: z.literal(SCHEMA_VERSION),
  metadata: responseMetadataSchema,
  orderRef: z.string().trim().min(1).max(64),
  channel: socialCommerceChannelSchema,
  currency: currencyCodeSchema,
  promiseGuard: promiseGuardEvaluationResponseSchema.nullable(),
  promiseGuardSkippedReason: z.string().trim().min(1).max(280).nullable(),
  marginLeak: marginLeakEvaluationResponseSchema,
  combinedReview: humanReviewMetadataSchema.extend({
    autonomousActionAllowed: z.literal(false),
    overallStatus: z.enum(["ready_for_human_confirmation", "hold_for_review"]),
  }),
  recommendedActions: z.array(recommendedActionSchema).max(10),
  syntheticDemoDisclosure: z.literal(
    "demonstration_only_no_autonomous_order_confirmation",
  ),
});

export type SocialCommerceChannel = z.infer<typeof socialCommerceChannelSchema>;
export type SocialCommerceLanguage = z.infer<
  typeof socialCommerceLanguageSchema
>;
export type FieldConfidence = z.infer<typeof fieldConfidenceSchema>;
export type EvidenceSpan = z.infer<typeof evidenceSpanSchema>;
export type DeliveryZone = z.infer<typeof deliveryZoneSchema>;
export type ExtractionUncertainty = z.infer<typeof extractionUncertaintySchema>;
export type DemoCatalogMatch = z.infer<typeof demoCatalogMatchSchema>;
export type SocialCommerceOrderDraft = z.infer<
  typeof socialCommerceOrderDraftSchema
>;
export type SocialCommerceExtractRequest = z.infer<
  typeof socialCommerceExtractRequestSchema
>;
export type SocialCommerceExtractResponse = z.infer<
  typeof socialCommerceExtractResponseSchema
>;
export type SocialCommerceEvaluateRequest = z.infer<
  typeof socialCommerceEvaluateRequestSchema
>;
export type RecommendedAction = z.infer<typeof recommendedActionSchema>;
export type SocialCommerceEvaluateResponse = z.infer<
  typeof socialCommerceEvaluateResponseSchema
>;

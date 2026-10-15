import { z } from "zod";

export const SCHEMA_VERSION = "1.0" as const;

const schemaVersionSchema = z.literal(SCHEMA_VERSION);
const utcTimestampSchema = z
  .string()
  .datetime({ offset: false })
  .describe("RFC 3339 timestamp assigned by the server");
const opaqueIdSchema = z.string().trim().min(1).max(128);
const generatedIdSchema = z.uuid().describe("Server-generated UUID");

const supportedCurrencyCodes = Intl.supportedValuesOf("currency");
if (supportedCurrencyCodes.length === 0) {
  throw new Error("The runtime does not provide ISO-4217 currency data.");
}

export const currencyCodeSchema = z.enum(
  supportedCurrencyCodes as [string, ...string[]],
);

export const moneySchema = z.strictObject({
  amountMinor: z
    .number()
    .int()
    .safe()
    .describe("Integer amount in the currency's minor units"),
  currency: currencyCodeSchema.describe("ISO-4217 currency code"),
});

export const scenarioRefSchema = z.strictObject({
  scenarioId: opaqueIdSchema,
  synthetic: z.boolean(),
});

export const evidenceRefSchema = z.strictObject({
  evidenceId: opaqueIdSchema,
  factPath: z.string().startsWith("/").max(512),
  sourceKind: z.enum([
    "validated_input",
    "deterministic_rule",
    "synthetic_fixture",
  ]),
});

export const analysisModuleIdSchema = z.enum(["promiseguard", "marginleak"]);

export const analysisStatusSchema = z.enum([
  "complete",
  "limited",
  "needs_review",
]);

export const requestMetadataSchema = z.strictObject({
  requestId: generatedIdSchema,
  traceId: generatedIdSchema,
  receivedAt: utcTimestampSchema,
});

export const responseMetadataSchema = requestMetadataSchema.extend({
  respondedAt: utcTimestampSchema,
});

export const humanReviewMetadataSchema = z.strictObject({
  required: z.boolean(),
  reasonCodes: z.array(opaqueIdSchema).max(32),
  decidedBy: z.literal("deterministic_policy"),
  policyVersion: opaqueIdSchema,
});

const availableInferenceMetadataSchema = z
  .strictObject({
    status: z.literal("available"),
    providerId: opaqueIdSchema,
    modelId: opaqueIdSchema,
    adapterVersion: opaqueIdSchema,
    generatedAt: utcTimestampSchema,
    durationMs: z.number().int().nonnegative().safe(),
    provenance: z.enum(["live", "synthetic_mock"]),
  })
  .superRefine((value, context) => {
    const isDeterministicMock = value.providerId === "deterministic-mock";
    if (value.provenance === "synthetic_mock" && !isDeterministicMock) {
      context.addIssue({
        code: "custom",
        path: ["providerId"],
        message: "Synthetic mock provenance must identify deterministic-mock.",
      });
    }
    if (value.provenance === "live" && isDeterministicMock) {
      context.addIssue({
        code: "custom",
        path: ["providerId"],
        message: "The deterministic mock cannot claim live provenance.",
      });
    }
  });

const unavailableInferenceMetadataSchema = z.strictObject({
  status: z.literal("unavailable"),
  providerId: opaqueIdSchema.optional(),
  reasonCode: z.enum([
    "configuration",
    "malformed_output",
    "provider_unavailable",
    "rate_limited",
    "timeout",
  ]),
});

export const inferenceMetadataSchema = z.discriminatedUnion("status", [
  availableInferenceMetadataSchema,
  unavailableInferenceMetadataSchema,
]);

const genericDataSchema = z.record(z.string(), z.unknown());

export const deterministicResultSchema = z.strictObject({
  data: genericDataSchema,
  rulesetVersion: opaqueIdSchema,
  evidenceRefs: z.array(evidenceRefSchema).max(128),
});

export const aiRecommendationSchema = z.strictObject({
  data: genericDataSchema,
  reasoningSummary: z.string().trim().min(1).max(2_000),
  evidenceRefs: z.array(opaqueIdSchema).min(1).max(128),
});

export const analysisResponseEnvelopeSchema = z
  .strictObject({
    schemaVersion: schemaVersionSchema,
    moduleId: analysisModuleIdSchema,
    analysisStatus: analysisStatusSchema,
    metadata: responseMetadataSchema,
    scenario: scenarioRefSchema.optional(),
    deterministic: deterministicResultSchema.optional(),
    aiRecommendation: aiRecommendationSchema.optional(),
    humanReview: humanReviewMetadataSchema,
    inference: inferenceMetadataSchema.optional(),
  })
  .superRefine((value, context) => {
    if (!value.deterministic && !value.aiRecommendation) {
      context.addIssue({
        code: "custom",
        path: ["deterministic"],
        message: "At least one result section is required.",
      });
    }

    if (
      value.analysisStatus === "needs_review" &&
      !value.humanReview.required
    ) {
      context.addIssue({
        code: "custom",
        path: ["humanReview", "required"],
        message: "needs_review requires deterministic human review.",
      });
    }

    if (value.inference?.status === "unavailable") {
      if (value.analysisStatus !== "limited") {
        context.addIssue({
          code: "custom",
          path: ["analysisStatus"],
          message: "Unavailable inference requires limited analysis status.",
        });
      }
      if (value.aiRecommendation) {
        context.addIssue({
          code: "custom",
          path: ["aiRecommendation"],
          message: "Unavailable inference cannot produce an AI recommendation.",
        });
      }
    }

    if (
      value.aiRecommendation &&
      (!value.inference || value.inference.status !== "available")
    ) {
      context.addIssue({
        code: "custom",
        path: ["inference"],
        message: "An AI recommendation requires available inference metadata.",
      });
    }

    if (value.aiRecommendation) {
      const validatedEvidenceIds = new Set(
        value.deterministic?.evidenceRefs.map(({ evidenceId }) => evidenceId),
      );
      value.aiRecommendation.evidenceRefs.forEach((evidenceId, index) => {
        if (!validatedEvidenceIds.has(evidenceId)) {
          context.addIssue({
            code: "custom",
            path: ["aiRecommendation", "evidenceRefs", index],
            message:
              "AI evidence must reference evidence validated by deterministic processing.",
          });
        }
      });
    }
  });

export const errorCategorySchema = z.enum([
  "authorization",
  "internal",
  "provider",
  "rate_limit",
  "timeout",
  "validation",
]);

export const fieldErrorSchema = z.strictObject({
  path: z.string().startsWith("/").max(512),
  code: opaqueIdSchema,
  message: z.string().trim().min(1).max(512),
});

export const errorEnvelopeSchema = z.strictObject({
  schemaVersion: schemaVersionSchema,
  requestId: generatedIdSchema,
  traceId: generatedIdSchema,
  timestamp: utcTimestampSchema,
  error: z.strictObject({
    code: opaqueIdSchema,
    category: errorCategorySchema,
    message: z.string().trim().min(1).max(512),
    retryable: z.boolean(),
    fieldErrors: z.array(fieldErrorSchema).max(64).optional(),
  }),
});

export const capabilityStateSchema = z.enum([
  "planned",
  "stub",
  "active",
  "disabled",
]);

export const capabilityIdSchema = z.enum([
  "promiseguard",
  "marginleak",
  "rescuecart",
]);

export const capabilityStatusSchema = z
  .strictObject({
    id: capabilityIdSchema,
    label: z.string().trim().min(1).max(64),
    description: z.string().trim().min(1).max(280),
    state: capabilityStateSchema,
    routes: z.array(z.string().startsWith("/")).max(16),
  })
  .superRefine((value, context) => {
    if (
      value.id === "rescuecart" &&
      (value.state !== "disabled" || value.routes.length > 0)
    ) {
      context.addIssue({
        code: "custom",
        message: "RescueCart must remain disabled and route-free.",
      });
    }
  });

const apiMetadataShape = {
  schemaVersion: schemaVersionSchema,
  requestId: generatedIdSchema,
  traceId: generatedIdSchema,
  timestamp: utcTimestampSchema,
};

export const capabilitiesResponseSchema = z.strictObject({
  ...apiMetadataShape,
  capabilities: z.array(capabilityStatusSchema).length(3),
});

export const healthResponseSchema = z.strictObject({
  ...apiMetadataShape,
  status: z.literal("ok"),
  service: z.literal("commerceos"),
  version: opaqueIdSchema,
});

export type Money = z.infer<typeof moneySchema>;
export type ScenarioRef = z.infer<typeof scenarioRefSchema>;
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;
export type AnalysisResponseEnvelope = z.infer<
  typeof analysisResponseEnvelopeSchema
>;
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;
export type InferenceMetadata = z.infer<typeof inferenceMetadataSchema>;
export type HumanReviewMetadata = z.infer<typeof humanReviewMetadataSchema>;
export type CapabilityStatus = z.infer<typeof capabilityStatusSchema>;
export type CapabilitiesResponse = z.infer<typeof capabilitiesResponseSchema>;
export type HealthResponse = z.infer<typeof healthResponseSchema>;

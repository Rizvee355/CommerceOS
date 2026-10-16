import { currencyCodeSchema } from "@commerceos/contracts";
import { z } from "zod";

export const FINANCIAL_CATEGORIES = [
  "grossItemRevenue",
  "shippingRevenue",
  "discounts",
  "cogs",
  "shippingCost",
  "fulfillmentCost",
  "paymentCost",
  "platformCost",
] as const;

export type FinancialCategory = (typeof FINANCIAL_CATEGORIES)[number];

export const CONTRIBUTION_ROLES = {
  grossItemRevenue: 1,
  shippingRevenue: 1,
  discounts: -1,
  cogs: -1,
  shippingCost: -1,
  fulfillmentCost: -1,
  paymentCost: -1,
  platformCost: -1,
} as const satisfies Record<FinancialCategory, 1 | -1>;

export const MAX_COMPONENT_AMOUNT_MINOR = Math.floor(
  Number.MAX_SAFE_INTEGER / (FINANCIAL_CATEGORIES.length * 2),
);

const opaqueIdSchema = z.string().trim().min(1).max(128);
const sourceLabelSchema = z.string().trim().min(1).max(160);
const utcTimestampSchema = z
  .string()
  .datetime({ offset: false })
  .describe("UTC timestamp for the submitted synthetic evidence");

const sourceSchema = z.strictObject({
  kind: z.literal("synthetic_fixture"),
  label: sourceLabelSchema,
  recordedAt: utcTimestampSchema,
});

const financialObservationSchema = z.strictObject({
  amountMinor: z.number().int().nonnegative().max(MAX_COMPONENT_AMOUNT_MINOR),
  currency: currencyCodeSchema,
  evidenceId: opaqueIdSchema,
  source: sourceSchema,
});

const financialComponentSchema = z.strictObject({
  expected: financialObservationSchema.optional(),
  observed: financialObservationSchema.optional(),
});

const financialsSchema = z.strictObject({
  grossItemRevenue: financialComponentSchema.optional(),
  shippingRevenue: financialComponentSchema.optional(),
  discounts: financialComponentSchema.optional(),
  cogs: financialComponentSchema.optional(),
  shippingCost: financialComponentSchema.optional(),
  fulfillmentCost: financialComponentSchema.optional(),
  paymentCost: financialComponentSchema.optional(),
  platformCost: financialComponentSchema.optional(),
});

export const marginLeakPrototypeRequestSchema = z
  .strictObject({
    prototypeVersion: z.literal("g4a.1"),
    moduleId: z.literal("marginleak"),
    scope: z.literal("single_order_contribution_margin_variance"),
    scenario: z.strictObject({
      scenarioId: opaqueIdSchema,
      synthetic: z.boolean(),
    }),
    orderRef: opaqueIdSchema,
    currency: currencyCodeSchema,
    observationState: z.enum(["final", "provisional"]),
    financials: financialsSchema,
  })
  .superRefine((request, context) => {
    if (!request.scenario.synthetic) {
      context.addIssue({
        code: "custom",
        path: ["scenario", "synthetic"],
        message: "MarginLeak G4A accepts synthetic scenarios only.",
      });
    }

    const evidenceIds = new Set<string>();
    for (const category of FINANCIAL_CATEGORIES) {
      const component = request.financials[category];
      for (const side of ["expected", "observed"] as const) {
        const observation = component?.[side];
        if (!observation) continue;

        if (observation.currency !== request.currency) {
          context.addIssue({
            code: "custom",
            path: ["financials", category, side, "currency"],
            message: "Every financial input must use the request currency.",
          });
        }

        if (evidenceIds.has(observation.evidenceId)) {
          context.addIssue({
            code: "custom",
            path: ["financials", category, side, "evidenceId"],
            message: "Evidence identifiers must be unique within the request.",
          });
        }
        evidenceIds.add(observation.evidenceId);
      }
    }
  });

export type MarginLeakPrototypeRequest = z.infer<
  typeof marginLeakPrototypeRequestSchema
>;

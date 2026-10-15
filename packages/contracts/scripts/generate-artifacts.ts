import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z, type ZodType } from "zod";

import {
  analysisResponseEnvelopeSchema,
  capabilitiesResponseSchema,
  capabilityStatusSchema,
  errorEnvelopeSchema,
  evidenceRefSchema,
  healthResponseSchema,
  humanReviewMetadataSchema,
  inferenceMetadataSchema,
  moneySchema,
  requestMetadataSchema,
  responseMetadataSchema,
  scenarioRefSchema,
} from "../src/v1/index";

const schemaDefinitions = {
  AnalysisResponseEnvelope: analysisResponseEnvelopeSchema,
  CapabilitiesResponse: capabilitiesResponseSchema,
  CapabilityStatus: capabilityStatusSchema,
  ErrorEnvelope: errorEnvelopeSchema,
  EvidenceRef: evidenceRefSchema,
  HealthResponse: healthResponseSchema,
  HumanReviewMetadata: humanReviewMetadataSchema,
  InferenceMetadata: inferenceMetadataSchema,
  Money: moneySchema,
  RequestMetadata: requestMetadataSchema,
  ResponseMetadata: responseMetadataSchema,
  ScenarioRef: scenarioRefSchema,
} satisfies Record<string, ZodType>;

const fileNames: Record<keyof typeof schemaDefinitions, string> = {
  AnalysisResponseEnvelope: "analysis-response-envelope.schema.json",
  CapabilitiesResponse: "capabilities-response.schema.json",
  CapabilityStatus: "capability-status.schema.json",
  ErrorEnvelope: "error-envelope.schema.json",
  EvidenceRef: "evidence-ref.schema.json",
  HealthResponse: "health-response.schema.json",
  HumanReviewMetadata: "human-review-metadata.schema.json",
  InferenceMetadata: "inference-metadata.schema.json",
  Money: "money.schema.json",
  RequestMetadata: "request-metadata.schema.json",
  ResponseMetadata: "response-metadata.schema.json",
  ScenarioRef: "scenario-ref.schema.json",
};

const asJsonSchema = (
  name: string,
  schema: ZodType,
): Record<string, unknown> => ({
  ...z.toJSONSchema(schema, { target: "draft-2020-12" }),
  $id: `https://commerceos.dev/contracts/v1/${fileNames[name as keyof typeof fileNames]}`,
  title: name,
  "x-commerceos-runtime-validation": true,
});

export const createArtifacts = (): Map<string, unknown> => {
  const artifacts = new Map<string, unknown>();
  const components: Record<string, unknown> = {};

  for (const [name, schema] of Object.entries(schemaDefinitions)) {
    const jsonSchema = asJsonSchema(name, schema);
    components[name] = jsonSchema;
    artifacts.set(
      `json-schema/${fileNames[name as keyof typeof fileNames]}`,
      jsonSchema,
    );
  }

  artifacts.set("openapi/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "CommerceOS Foundation API",
      version: "1.0.0",
      description:
        "Approved G2 skeleton endpoints only. No product analysis endpoints are defined.",
    },
    paths: {
      "/api/v1/capabilities": {
        get: {
          operationId: "getCapabilities",
          summary: "Report truthful module readiness",
          responses: {
            "200": {
              description: "Capability status",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/CapabilitiesResponse" },
                },
              },
            },
          },
        },
      },
      "/api/v1/health": {
        get: {
          operationId: "getHealth",
          summary: "Report application process health",
          responses: {
            "200": {
              description: "Healthy application process",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/HealthResponse" },
                },
              },
            },
          },
        },
      },
    },
    components: { schemas: components },
  });

  return artifacts;
};

const sortKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, sortKeys(nested)]),
    );
  }
  return value;
};

const serialize = (value: unknown): string =>
  `${JSON.stringify(sortKeys(value), null, 2)}\n`;

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(packageRoot, "generated");

const run = (): void => {
  const check = process.argv.includes("--check");
  const mismatches: string[] = [];

  for (const [relativePath, content] of createArtifacts()) {
    const target = resolve(outputRoot, relativePath);
    const expected = serialize(content);

    if (check) {
      if (!existsSync(target) || readFileSync(target, "utf8") !== expected) {
        mismatches.push(relativePath);
      }
      continue;
    }

    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, expected, "utf8");
  }

  if (mismatches.length > 0) {
    throw new Error(
      `Generated contract artifacts are stale: ${mismatches.join(", ")}`,
    );
  }
};

const invokedDirectly =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) run();

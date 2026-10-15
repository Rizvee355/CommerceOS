import { describe, expect, it } from "vitest";

import { createArtifacts } from "./generate-artifacts";

describe("contract artifact generation", () => {
  it("generates OpenAPI 3.1 with only approved skeleton routes", () => {
    const artifacts = createArtifacts();
    const openapi = artifacts.get("openapi/openapi.json") as {
      openapi: string;
      paths: Record<string, unknown>;
    };

    expect(openapi.openapi).toBe("3.1.0");
    expect(Object.keys(openapi.paths).sort()).toEqual([
      "/api/v1/capabilities",
      "/api/v1/health",
    ]);
  });

  it("derives integer money and ISO currency constraints from Zod", () => {
    const artifacts = createArtifacts();
    const money = artifacts.get("json-schema/money.schema.json") as {
      properties: {
        amountMinor: { type: string };
        currency: { enum: string[] };
      };
    };

    expect(money.properties.amountMinor.type).toBe("integer");
    expect(money.properties.currency.enum).toContain("USD");
    expect(money.properties.currency.enum).not.toContain("ZZZ");
  });
});

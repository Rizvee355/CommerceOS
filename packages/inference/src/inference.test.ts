import { z } from "zod";
import { describe, expect, it } from "vitest";

import {
  createInferenceProvider,
  DeterministicMockProvider,
  InferenceProviderError,
} from "./index";

const outputSchema = z.strictObject({
  fixture: z.literal("synthetic-foundation-output"),
});

const request = {
  requestId: "52dd0dc8-dcd2-4131-85ec-c14a9af75e88",
  traceId: "90c3d1ef-97ee-454d-92ce-5e16609ae170",
  scenario: { scenarioId: "success", synthetic: true as const },
  input: { purpose: "foundation-contract-test" },
};

describe("DeterministicMockProvider", () => {
  it("returns repeatable validated synthetic output and honest provenance", async () => {
    const provider = new DeterministicMockProvider();

    const first = await provider.generateStructured(request, outputSchema);
    const second = await provider.generateStructured(request, outputSchema);

    expect(first).toEqual(second);
    expect(first.output).toEqual({ fixture: "synthetic-foundation-output" });
    expect(first.metadata).toMatchObject({
      providerId: "deterministic-mock",
      modelId: "fixture-v1",
      provenance: "synthetic_mock",
      status: "available",
    });
  });

  it.each([
    ["timeout", "TIMEOUT", true],
    ["rate-limited", "RATE_LIMITED", true],
    ["unavailable", "PROVIDER_UNAVAILABLE", true],
    ["malformed-output", "MALFORMED_OUTPUT", false],
  ])(
    "normalizes the %s scenario",
    async (scenarioId, expectedCode, retryable) => {
      const provider = new DeterministicMockProvider();
      const promise = provider.generateStructured(
        { ...request, scenario: { scenarioId, synthetic: true } },
        outputSchema,
      );

      await expect(promise).rejects.toMatchObject({
        code: expectedCode,
        retryable,
      });
    },
  );

  it("refuses a scenario that is not visibly synthetic", async () => {
    const provider = new DeterministicMockProvider();
    await expect(
      provider.generateStructured(
        { ...request, scenario: { scenarioId: "success", synthetic: false } },
        outputSchema,
      ),
    ).rejects.toMatchObject({ code: "INVALID_MOCK_SCENARIO" });
  });
});

describe("provider selection", () => {
  it("selects mock explicitly outside production", () => {
    expect(
      createInferenceProvider({
        provider: "mock",
        environment: "test",
      }),
    ).toBeInstanceOf(DeterministicMockProvider);
  });

  it("refuses mock mode in production by default", () => {
    expect(() =>
      createInferenceProvider({
        provider: "mock",
        environment: "production",
      }),
    ).toThrowError(
      expect.objectContaining({ code: "MOCK_FORBIDDEN_IN_PRODUCTION" }),
    );
  });

  it("does not fall back when AMD is selected but not activated", () => {
    expect(() =>
      createInferenceProvider({
        provider: "amd-token-factory",
        environment: "development",
      }),
    ).toThrowError(
      expect.objectContaining({ code: "LIVE_PROVIDER_NOT_ACTIVATED" }),
    );
  });

  it("exposes only sanitized normalized provider errors", () => {
    const error = new InferenceProviderError(
      "PROVIDER_UNAVAILABLE",
      "Inference is temporarily unavailable.",
      true,
    );

    expect(error.toJSON()).toEqual({
      code: "PROVIDER_UNAVAILABLE",
      message: "Inference is temporarily unavailable.",
      retryable: true,
    });
    expect(error.toJSON()).not.toHaveProperty("stack");
  });
});

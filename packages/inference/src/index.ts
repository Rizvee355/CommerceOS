import type { InferenceMetadata, ScenarioRef } from "@commerceos/contracts";
import { type ZodType } from "zod";

export type InferenceErrorCode =
  | "INVALID_MOCK_SCENARIO"
  | "LIVE_PROVIDER_NOT_ACTIVATED"
  | "MALFORMED_OUTPUT"
  | "MOCK_FORBIDDEN_IN_PRODUCTION"
  | "PROVIDER_UNAVAILABLE"
  | "RATE_LIMITED"
  | "TIMEOUT";

export class InferenceProviderError extends Error {
  readonly code: InferenceErrorCode;
  readonly retryable: boolean;

  constructor(code: InferenceErrorCode, message: string, retryable: boolean) {
    super(message);
    this.name = "InferenceProviderError";
    this.code = code;
    this.retryable = retryable;
  }

  toJSON(): { code: InferenceErrorCode; message: string; retryable: boolean } {
    return {
      code: this.code,
      message: this.message,
      retryable: this.retryable,
    };
  }
}

export type InferenceRequest = {
  requestId: string;
  traceId: string;
  scenario: ScenarioRef;
  input: Readonly<Record<string, unknown>>;
};

export type InferenceResult<T> = {
  output: T;
  metadata: Extract<InferenceMetadata, { status: "available" }>;
};

export interface InferenceProvider {
  readonly providerId: string;

  generateStructured<T>(
    request: InferenceRequest,
    outputSchema: ZodType<T>,
    signal?: AbortSignal,
  ): Promise<InferenceResult<T>>;
}

type Fixture =
  | { kind: "output"; value: Readonly<Record<string, unknown>> }
  | {
      kind: "error";
      code: InferenceErrorCode;
      message: string;
      retryable: boolean;
    };

const fixtures: Readonly<Record<string, Fixture>> = {
  success: {
    kind: "output",
    value: { fixture: "synthetic-foundation-output" },
  },
  "needs-review": {
    kind: "output",
    value: { fixture: "synthetic-foundation-output" },
  },
  timeout: {
    kind: "error",
    code: "TIMEOUT",
    message: "Synthetic inference timeout.",
    retryable: true,
  },
  "rate-limited": {
    kind: "error",
    code: "RATE_LIMITED",
    message: "Synthetic inference rate limit.",
    retryable: true,
  },
  unavailable: {
    kind: "error",
    code: "PROVIDER_UNAVAILABLE",
    message: "Synthetic inference provider unavailable.",
    retryable: true,
  },
  "malformed-output": {
    kind: "output",
    value: { malformed: true },
  },
};

export class DeterministicMockProvider implements InferenceProvider {
  readonly providerId = "deterministic-mock";

  async generateStructured<T>(
    request: InferenceRequest,
    outputSchema: ZodType<T>,
    signal?: AbortSignal,
  ): Promise<InferenceResult<T>> {
    if (signal?.aborted) {
      throw new InferenceProviderError(
        "TIMEOUT",
        "Synthetic inference was cancelled.",
        true,
      );
    }

    if (!request.scenario.synthetic) {
      throw new InferenceProviderError(
        "INVALID_MOCK_SCENARIO",
        "Mock inference accepts visibly synthetic scenarios only.",
        false,
      );
    }

    const fixture = fixtures[request.scenario.scenarioId];
    if (!fixture) {
      throw new InferenceProviderError(
        "INVALID_MOCK_SCENARIO",
        "The requested synthetic scenario is not registered.",
        false,
      );
    }

    if (fixture.kind === "error") {
      throw new InferenceProviderError(
        fixture.code,
        fixture.message,
        fixture.retryable,
      );
    }

    const parsed = outputSchema.safeParse(fixture.value);
    if (!parsed.success) {
      throw new InferenceProviderError(
        "MALFORMED_OUTPUT",
        "Inference output did not match the approved output schema.",
        false,
      );
    }

    return {
      output: parsed.data,
      metadata: {
        status: "available",
        providerId: this.providerId,
        modelId: "fixture-v1",
        adapterVersion: "1.0.0",
        generatedAt: "2026-10-15T00:00:00.000Z",
        durationMs: 0,
        provenance: "synthetic_mock",
      },
    };
  }
}

export type ProviderSelection = {
  provider: "mock" | "amd-token-factory";
  environment: "development" | "test" | "production";
};

export type AmdTokenFactoryBoundary = {
  provider: "amd-token-factory";
  activationStatus: "pending_credentials";
  officialPlatform: "https://notebooks.amd.com/tokenfactory";
};

export const amdTokenFactoryBoundary: AmdTokenFactoryBoundary = {
  provider: "amd-token-factory",
  activationStatus: "pending_credentials",
  officialPlatform: "https://notebooks.amd.com/tokenfactory",
};

export const createInferenceProvider = (
  selection: ProviderSelection,
): InferenceProvider => {
  if (selection.provider === "amd-token-factory") {
    throw new InferenceProviderError(
      "LIVE_PROVIDER_NOT_ACTIVATED",
      "AMD Token Factory is not activated in the G2 foundation.",
      false,
    );
  }

  if (selection.environment === "production") {
    throw new InferenceProviderError(
      "MOCK_FORBIDDEN_IN_PRODUCTION",
      "Mock inference is not authorized in production.",
      false,
    );
  }

  return new DeterministicMockProvider();
};

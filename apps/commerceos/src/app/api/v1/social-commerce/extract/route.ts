import type { ErrorEnvelope } from "@commerceos/contracts";
import { randomUUID } from "node:crypto";

import { socialCommerceExtractRequestSchema } from "../../../../../features/social-commerce/domain/schema";
import {
  extractSocialCommerceOrder,
  resolveSocialCommerceLlmConfig,
  type SocialCommerceLlmConfig,
} from "../../../../../features/social-commerce/server/extract";
import { readJsonRequest } from "../../../../../server/api/json-request";
import {
  createApiErrorResponse,
  createErrorResponse,
  type ServerContextFactory,
} from "../../../../../server/api/responses";

export const runtime = "nodejs";

export type SocialCommerceExtractRouteDependencies = ServerContextFactory & {
  getLlmConfig: () => SocialCommerceLlmConfig | null;
};

const defaultDependencies: SocialCommerceExtractRouteDependencies = {
  now: () => new Date(),
  randomUUID,
  getLlmConfig: () => resolveSocialCommerceLlmConfig(process.env),
};

const errorResponse = (
  status: number,
  error: ErrorEnvelope["error"],
  dependencies: SocialCommerceExtractRouteDependencies,
): Response =>
  Response.json(createApiErrorResponse(error, dependencies), { status });

const validationPath = (path: PropertyKey[]): string =>
  path.length === 0
    ? "/"
    : `/${path
        .map((segment) =>
          String(segment).replaceAll("~", "~0").replaceAll("/", "~1"),
        )
        .join("/")}`;

export const createSocialCommerceExtractHandler =
  (
    dependencies: SocialCommerceExtractRouteDependencies = defaultDependencies,
  ) =>
  async (request: Request): Promise<Response> => {
    const body = await readJsonRequest(request);
    if (body.status === "unsupported_media_type") {
      return errorResponse(
        415,
        {
          code: "UNSUPPORTED_MEDIA_TYPE",
          category: "validation",
          message: "Content-Type must be application/json.",
          retryable: false,
        },
        dependencies,
      );
    }
    if (body.status === "too_large") {
      return errorResponse(
        413,
        {
          code: "PAYLOAD_TOO_LARGE",
          category: "validation",
          message: "The request exceeds the 16 KiB limit.",
          retryable: false,
        },
        dependencies,
      );
    }
    if (body.status === "malformed_json") {
      return errorResponse(
        400,
        {
          code: "MALFORMED_JSON",
          category: "validation",
          message: "The request body is not valid JSON.",
          retryable: false,
        },
        dependencies,
      );
    }

    const parsed = socialCommerceExtractRequestSchema.safeParse(body.value);
    if (!parsed.success) {
      return errorResponse(
        422,
        {
          code: "INVALID_REQUEST",
          category: "validation",
          message:
            "The conversation extraction request did not match the approved schema.",
          retryable: false,
          fieldErrors: parsed.error.issues.slice(0, 64).map((issue) => ({
            path: validationPath(issue.path),
            code: "INVALID_FIELD",
            message: "The field is invalid.",
          })),
        },
        dependencies,
      );
    }

    try {
      const response = await extractSocialCommerceOrder(parsed.data, {
        now: dependencies.now,
        randomUUID: dependencies.randomUUID,
        llmConfig: dependencies.getLlmConfig(),
      });
      return Response.json(response);
    } catch (error) {
      return Response.json(createErrorResponse(error, dependencies), {
        status: 500,
      });
    }
  };

export const POST = createSocialCommerceExtractHandler();

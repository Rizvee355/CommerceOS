import { SCHEMA_VERSION } from "@commerceos/contracts";
import { z } from "zod";

import { matchDemoCatalogItem } from "../domain/demo-catalog";
import { extractOrderFromConversation } from "../domain/extractor";
import {
  socialCommerceExtractResponseSchema,
  socialCommerceOrderDraftSchema,
  type SocialCommerceExtractRequest,
  type SocialCommerceExtractResponse,
} from "../domain/schema";

export type SocialCommerceLlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
  providerId: string;
  timeoutMs?: number;
};

export type SocialCommerceExtractDependencies = {
  now: () => Date;
  randomUUID: () => string;
  llmConfig?: SocialCommerceLlmConfig | null;
  fetchImpl?: typeof fetch;
};

const EXTRACTION_SYSTEM_PROMPT = `You are a structured social-commerce order extraction engine for Bangladeshi SMEs (Messenger/WhatsApp).
Read the Bangla, Banglish, or English customer conversation and return ONE valid JSON object matching the exact CommerceOS socialCommerceOrderDraftSchema.
Rules:
1. Extract ONLY facts explicitly stated in the conversation. Never invent product prices, discounts, quantities, stock, delivery areas, or dispatch deadlines.
2. Convert Bengali numerals (০-৯) to Arabic numerals and express monetary amounts in BDT minor units (poisha = BDT * 100).
3. If a field is unstated or ambiguous (e.g. "taratari", "kichu discount", "address pore dicchi"), set its value to null, set needsVerification to true, and add an entry in uncertainties with English and Bangla explanations.
4. For every extracted value, copy an exact quote from the conversation line into evidence[].quote with its 1-based lineNumber.
5. Always set requiresHumanVerification to true.
Return raw JSON only without Markdown code fences.`;

const llmEnvelopeSchema = z.object({
  model: z.string().trim().min(1).max(128).optional(),
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().trim().min(1),
        }),
      }),
    )
    .min(1),
});

export const resolveSocialCommerceLlmConfig = (
  env: NodeJS.ProcessEnv = process.env,
): SocialCommerceLlmConfig | null => {
  // Never activate unauthenticated live LLM extraction automatically in production
  if (env.NODE_ENV === "production") {
    return null;
  }

  const customKey = env.SOCIAL_COMMERCE_LLM_API_KEY?.trim();
  const customBaseUrl = env.SOCIAL_COMMERCE_LLM_BASE_URL?.trim();
  const customModel = env.SOCIAL_COMMERCE_LLM_MODEL?.trim();
  if (customKey && customBaseUrl && customModel) {
    return {
      apiKey: customKey,
      baseUrl: customBaseUrl,
      model: customModel,
      providerId: "openai-compatible-llm",
      timeoutMs: 30_000,
    };
  }

  const amdKey = env.AMD_TOKEN_FACTORY_API_KEY?.trim();
  if (
    env.INFERENCE_PROVIDER === "amd-token-factory" &&
    amdKey &&
    /^rc-[0-9A-Fa-f]{48}$/.test(amdKey)
  ) {
    return {
      apiKey: amdKey,
      baseUrl: "https://developer.amd.com.cn/radeon/api/v1/chat/completions",
      model: env.AMD_TOKEN_FACTORY_MODEL?.trim() || "DeepSeek-V4-Flash",
      providerId: "amd-token-factory",
      timeoutMs: 45_000,
    };
  }

  return null;
};

const allQuotesGroundedInTranscript = (
  transcript: string,
  draft: z.infer<typeof socialCommerceOrderDraftSchema>,
): boolean => {
  const normalizedTranscript = transcript.toLowerCase();
  const fields = [
    draft.productName,
    draft.quantity,
    draft.agreedTotalPriceMinor,
    draft.agreedDiscountMinor,
    draft.deliveryLocation,
    draft.deliveryChargeMinor,
    draft.promisedTimelineText,
  ];
  return fields.every((field) =>
    field.evidence.every((span) =>
      normalizedTranscript.includes(span.quote.toLowerCase().slice(0, 24)),
    ),
  );
};

export const extractSocialCommerceOrder = async (
  request: SocialCommerceExtractRequest,
  dependencies: SocialCommerceExtractDependencies,
): Promise<SocialCommerceExtractResponse> => {
  const receivedAt = dependencies.now();
  const requestId = dependencies.randomUUID();
  const traceId = dependencies.randomUUID();

  const llmConfig = dependencies.llmConfig ?? null;
  let unavailableReason:
    | "configuration"
    | "malformed_output"
    | "provider_unavailable"
    | "rate_limited"
    | "timeout" = "configuration";

  if (llmConfig) {
    const fetcher = dependencies.fetchImpl ?? fetch;
    const startedMs = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      llmConfig.timeoutMs ?? 30_000,
    );

    try {
      const response = await fetcher(llmConfig.baseUrl, {
        method: "POST",
        headers: {
          accept: "application/json",
          authorization: `Bearer ${llmConfig.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: llmConfig.model,
          messages: [
            { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify({
                channel: request.channel,
                transcript: request.transcript,
              }),
            },
          ],
          temperature: 0.1,
          max_tokens: 900,
          stream: false,
        }),
        cache: "no-store",
        signal: controller.signal,
      });

      if (response.status === 429) {
        unavailableReason = "rate_limited";
      } else if (!response.ok) {
        unavailableReason = "provider_unavailable";
      } else {
        const envelope = llmEnvelopeSchema.safeParse(await response.json());
        if (!envelope.success) {
          unavailableReason = "malformed_output";
        } else {
          const content = envelope.data.choices[0]!.message.content;
          const parsedDraft = socialCommerceOrderDraftSchema.safeParse(
            JSON.parse(content),
          );
          if (
            parsedDraft.success &&
            allQuotesGroundedInTranscript(request.transcript, parsedDraft.data)
          ) {
            const catalogMatch = matchDemoCatalogItem(
              `${parsedDraft.data.productName.value ?? ""} ${request.transcript}`,
            );
            return socialCommerceExtractResponseSchema.parse({
              schemaVersion: SCHEMA_VERSION,
              metadata: {
                requestId,
                traceId,
                receivedAt: receivedAt.toISOString(),
                respondedAt: dependencies.now().toISOString(),
              },
              channel: request.channel,
              extractionMode: "live_llm",
              inference: {
                status: "available",
                providerId: llmConfig.providerId,
                modelId: envelope.data.model ?? llmConfig.model,
                adapterVersion: "1.0.0",
                generatedAt: dependencies.now().toISOString(),
                durationMs: Math.max(0, Date.now() - startedMs),
                provenance: "live",
              },
              draft: parsedDraft.data,
              catalogMatch,
              syntheticDemoDisclosure:
                "demonstration_only_no_autonomous_order_confirmation",
            });
          }
          unavailableReason = "malformed_output";
        }
      }
    } catch {
      unavailableReason = controller.signal.aborted
        ? "timeout"
        : "provider_unavailable";
    } finally {
      clearTimeout(timer);
    }
  }

  // Transparent deterministic Bangla/Banglish/English parser fallback — never claims live AI provenance
  const deterministic = extractOrderFromConversation(request.transcript);
  return socialCommerceExtractResponseSchema.parse({
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      requestId,
      traceId,
      receivedAt: receivedAt.toISOString(),
      respondedAt: dependencies.now().toISOString(),
    },
    channel: request.channel,
    extractionMode: "deterministic_parser_preview",
    inference: {
      status: "unavailable",
      ...(llmConfig ? { providerId: llmConfig.providerId } : {}),
      reasonCode: unavailableReason,
    },
    draft: deterministic.draft,
    catalogMatch: deterministic.catalogMatch,
    syntheticDemoDisclosure:
      "demonstration_only_no_autonomous_order_confirmation",
  });
};

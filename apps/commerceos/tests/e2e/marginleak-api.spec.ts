import { marginLeakEvaluationResponseSchema } from "@commerceos/contracts";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "@playwright/test";

const requestFixture = JSON.parse(
  readFileSync(
    resolve(
      process.cwd(),
      "packages/contracts/fixtures/v1/marginleak/valid/no-leak-request.json",
    ),
    "utf8",
  ),
);

test("MarginLeak synthetic preview evaluates a real HTTP request", async ({
  request,
}) => {
  const response = await request.post("/api/v1/marginleak/analyze", {
    data: requestFixture,
  });
  const body: unknown = await response.json();

  expect(response.status()).toBe(200);
  expect(marginLeakEvaluationResponseSchema.safeParse(body).success).toBe(true);
  expect(body).toMatchObject({
    moduleId: "marginleak",
    analysisStatus: "complete",
    deterministic: {
      data: {
        assessment: "no_leak_detected",
        totals: {
          expectedContributionMargin: { amountMinor: 4_900, currency: "USD" },
          observedContributionMargin: { amountMinor: 5_200, currency: "USD" },
          netContributionVariance: { amountMinor: -300, currency: "USD" },
          leakAmount: { amountMinor: 0, currency: "USD" },
        },
      },
    },
  });
});

test("MarginLeak preview rejects unsupported GET requests", async ({
  request,
}) => {
  const response = await request.get("/api/v1/marginleak/analyze");

  expect(response.status()).toBe(405);
});

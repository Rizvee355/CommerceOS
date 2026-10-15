import { expect, test } from "@playwright/test";

test.describe("PromiseGuard E2E workflows", () => {
  test("navigates from Overview to PromiseGuard synthetic preview", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /PromiseGuard/i }).click();

    await expect(page).toHaveURL("/promiseguard");
    await expect(
      page.getByRole("heading", { name: "Dispatch Readiness Intelligence" }),
    ).toBeVisible();
    await expect(page.getByText(/Synthetic Preview/i).first()).toBeVisible();
  });

  test("evaluates Preset 1 (Supported) with truthful verdicts and offline inference", async ({
    page,
  }) => {
    await page.goto("/promiseguard");

    // Default preset is aligned/supported
    await page.getByRole("button", { name: /Run analysis/i }).click();

    // Verify results heading and assessment banner
    await expect(
      page.getByRole("heading", { name: "Evaluation Results" }),
    ).toBeVisible();
    await expect(page.getByText("Supported", { exact: true })).toBeVisible();
    await expect(
      page.getByText("Current evidence supports dispatch readiness"),
    ).toBeVisible();
    await expect(
      page.getByText(/It is not a guarantee of dispatch or delivery/i),
    ).toBeVisible();

    // Verify truthful inference state in test environment (inference disabled)
    await expect(page.getByText("Inference Offline")).toBeVisible();
    await expect(
      page.getByText("AI assistance is not enabled in this environment."),
    ).toBeVisible();

    // Verify human review status is clear
    await expect(
      page.getByText("Automated Review Status: Clear"),
    ).toBeVisible();

    // Verify provenance details
    await expect(page.getByText("Audit & Provenance Record")).toBeVisible();
  });

  test("evaluates Preset 2 (At Risk) and displays adverse findings and review required", async ({
    page,
  }) => {
    await page.goto("/promiseguard");

    // Select Preset 2: Adverse evidence
    await page.getByRole("radio", { name: /Adverse evidence/i }).click();

    await page.getByRole("button", { name: /Run analysis/i }).click();

    // Verify At Risk assessment
    await expect(page.getByText("At risk", { exact: true })).toBeVisible();
    await expect(
      page.getByText(
        "The evidence identifies a risk to this dispatch commitment",
      ),
    ).toBeVisible();

    // Verify adverse findings
    await expect(
      page.getByRole("heading", { name: /Adverse Findings/i }),
    ).toBeVisible();
    await expect(
      page.locator(".pg-finding-title").getByText("Inventory is not secured"),
    ).toBeVisible();

    // Verify human review required
    await expect(page.getByText("Review Required")).toBeVisible();
    await expect(
      page.locator(".pg-code-pill").getByText("PROMISEGUARD_AT_RISK"),
    ).toBeVisible();
  });

  test("evaluates Preset 3 (Indeterminate) and shows uncertain evidence", async ({
    page,
  }) => {
    await page.goto("/promiseguard");

    // Select Preset 3: Incomplete evidence
    await page.getByRole("radio", { name: /Incomplete evidence/i }).click();

    await page.getByRole("button", { name: /Run analysis/i }).click();

    // Verify Indeterminate assessment
    await expect(
      page.getByText("Indeterminate", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "The evidence is not sufficient for a reliable assessment",
      ),
    ).toBeVisible();

    // Verify uncertain / missing evidence
    await expect(
      page.getByRole("heading", { name: /Uncertain or Missing Evidence/i }),
    ).toBeVisible();

    // Verify human review required
    await expect(page.getByText("Review Required")).toBeVisible();
    await expect(
      page
        .locator(".pg-code-pill")
        .getByText("PROMISEGUARD_EVIDENCE_INCOMPLETE"),
    ).toBeVisible();
  });

  test("displays validation errors when mandatory fields are cleared", async ({
    page,
  }) => {
    await page.goto("/promiseguard");

    const refInput = page.getByLabel(/Fulfillment reference/i);
    await refInput.fill("");

    await page.getByRole("button", { name: /Run analysis/i }).click();

    await expect(
      page.getByRole("heading", {
        name: "There is a problem with your submission",
      }),
    ).toBeVisible();
    await expect(
      page.getByText("Fulfillment reference: Enter a fulfillment reference."),
    ).toBeVisible();
  });
});

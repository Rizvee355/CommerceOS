import { mkdirSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const SCREENSHOT_DIR = path.resolve(process.cwd(), "artifacts/g4c-review");

const ensureScreenshotDir = () => {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
};

const assertZeroHorizontalOverflow = async (
  page: Page,
  viewportLabel: string,
) => {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(
    metrics.scrollWidth,
    `Expected zero horizontal overflow at ${viewportLabel} (scrollWidth=${metrics.scrollWidth}, innerWidth=${metrics.innerWidth})`,
  ).toBeLessThanOrEqual(metrics.innerWidth);
};

test.describe("MarginLeak development synthetic preview end-to-end & visual evidence", () => {
  test("verifies all 4 synthetic presets, loss-leader negative margin, missing-input recovery, validation errors, 403 restricted preview, and captures 11 visual artifacts", async ({
    page,
  }) => {
    ensureScreenshotDir();

    // 1. Desktop (1440x900) — Scenario 1: Confirmed leak
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/marginleak");

    await expect(
      page.getByText("PLANNED · SYNTHETIC DEVELOPMENT PREVIEW"),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: /Contribution-Margin Variance & Leakage Intelligence/i,
      }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();

    const resultsHeading = page.getByRole("heading", {
      name: /Contribution-margin evaluation results/i,
    });
    await expect(resultsHeading).toBeVisible();
    await expect(resultsHeading).toBeFocused();

    await expect(page.locator('[data-kpi="expected-margin"]')).toContainText(
      "$49.00",
    );
    await expect(page.locator('[data-kpi="observed-margin"]')).toContainText(
      "$43.50",
    );
    await expect(page.locator('[data-kpi="net-variance"]')).toContainText(
      "+$5.50 · Adverse to expected margin",
    );
    await expect(page.locator('[data-kpi="leak-amount"]')).toContainText(
      "$5.50",
    );
    await assertZeroHorizontalOverflow(page, "1440px Scenario 1");

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        "01-scenario-1-leak-detected-desktop.png",
      ),
      fullPage: true,
    });

    // 2. Mobile (375x812) — Scenario 1: Confirmed leak
    await page.setViewportSize({ width: 375, height: 812 });
    await assertZeroHorizontalOverflow(page, "375px Scenario 1");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "02-scenario-1-leak-detected-mobile.png"),
      fullPage: true,
    });

    // Also verify 320px, 768px, 1024px zero overflow on Scenario 1 results
    for (const width of [320, 768, 1024]) {
      await page.setViewportSize({ width, height: 800 });
      await assertZeroHorizontalOverflow(page, `${width}px Scenario 1`);
    }

    // 3. Desktop (1440x900) — Scenario 2: No leak / favorable offset
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByText("Favorable cost offset", { exact: true }).click();

    // Switching scenario immediately clears previous results
    await expect(resultsHeading).toHaveCount(0);

    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();
    await expect(resultsHeading).toBeVisible();
    await expect(page.locator('[data-kpi="net-variance"]')).toContainText(
      "-$3.00 · Favorable to expected margin",
    );
    await expect(page.locator('[data-kpi="leak-amount"]')).toContainText(
      "$0.00",
    );
    await expect(page.getByText("No Review Required")).toBeVisible();
    await assertZeroHorizontalOverflow(page, "1440px Scenario 2");

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        "03-scenario-2-no-leak-favorable-offset-desktop.png",
      ),
      fullPage: true,
    });

    // 4. Mobile (375x812) — Scenario 2: No leak / favorable offset
    await page.setViewportSize({ width: 375, height: 812 });
    await assertZeroHorizontalOverflow(page, "375px Scenario 2");
    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        "04-scenario-2-no-leak-favorable-offset-mobile.png",
      ),
      fullPage: true,
    });

    // 5. Desktop (1440x900) — Scenario 3: Provisional evidence
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .getByText("Provisional unsettled evidence", { exact: true })
      .click();
    await expect(resultsHeading).toHaveCount(0);

    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();
    await expect(resultsHeading).toBeVisible();
    await expect(page.locator('[data-kpi="net-variance"]')).toContainText(
      "+$2.25 · Adverse to expected margin",
    );
    await expect(page.locator('[data-kpi="leak-amount"]')).toContainText(
      "Unconfirmed — provisional evidence",
    );
    await expect(page.getByText("MARGINLEAK_PROVISIONAL_INPUTS")).toBeVisible();
    await assertZeroHorizontalOverflow(page, "1440px Scenario 3");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "05-scenario-3-provisional-desktop.png"),
      fullPage: true,
    });

    // 6. Mobile (375x812) — Scenario 3: Provisional evidence
    await page.setViewportSize({ width: 375, height: 812 });
    await assertZeroHorizontalOverflow(page, "375px Scenario 3");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "06-scenario-3-provisional-mobile.png"),
      fullPage: true,
    });

    // 7. Desktop (1440x900) — Scenario 4: Incomplete evidence
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .getByText("Incomplete financial evidence", { exact: true })
      .click();
    await expect(resultsHeading).toHaveCount(0);

    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();
    await expect(resultsHeading).toBeVisible();
    await expect(page.locator('[data-kpi="leak-amount"]')).toContainText(
      "Not calculable — evidence incomplete",
    );
    await expect(
      page.getByText("MARGINLEAK_EVIDENCE_INCOMPLETE"),
    ).toBeVisible();
    await assertZeroHorizontalOverflow(page, "1440px Scenario 4");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "07-scenario-4-incomplete-desktop.png"),
      fullPage: true,
    });

    // 8. Mobile (375x812) — Scenario 4: Incomplete evidence
    await page.setViewportSize({ width: 375, height: 812 });
    await assertZeroHorizontalOverflow(page, "375px Scenario 4");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "08-scenario-4-incomplete-mobile.png"),
      fullPage: true,
    });

    // 9. Desktop (1440x900) — Negative-margin non-leak loss-leader example
    await page.setViewportSize({ width: 1440, height: 900 });
    await page
      .getByRole("button", {
        name: /Load loss-leader example \(-\$1\.00 margin\)/i,
      })
      .click();
    await expect(resultsHeading).toHaveCount(0);

    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();
    await expect(resultsHeading).toBeVisible();
    await expect(page.locator('[data-kpi="expected-margin"]')).toContainText(
      "-$2.00",
    );
    await expect(page.locator('[data-kpi="observed-margin"]')).toContainText(
      "-$1.00",
    );
    await expect(page.locator('[data-kpi="observed-margin"]')).toContainText(
      "Negative contribution margin · Not a leak when matching or beating expected margin",
    );
    await expect(page.locator('[data-kpi="net-variance"]')).toContainText(
      "-$1.00 · Favorable to expected margin",
    );
    await expect(page.locator('[data-kpi="leak-amount"]')).toContainText(
      "$0.00",
    );
    await assertZeroHorizontalOverflow(page, "1440px Negative Margin");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "09-negative-margin-no-leak-desktop.png"),
      fullPage: true,
    });

    // 10. Desktop (1440x900) — Validation error summary
    await page.getByLabel("Order reference").fill("");
    await page.getByLabel("ISO-4217 currency code").fill("US");
    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();

    const errorAlert = page.locator("#ml-error-summary");
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toBeFocused();
    await assertZeroHorizontalOverflow(page, "1440px Validation Error");

    await page.screenshot({
      path: path.join(
        SCREENSHOT_DIR,
        "10-validation-error-summary-desktop.png",
      ),
      fullPage: true,
    });

    // Reset preset and verify HTTP 403 restricted preview state
    await page
      .getByRole("button", { name: /Reset to scenario/i })
      .first()
      .click();
    await expect(errorAlert).toHaveCount(0);

    await page.route("**/api/v1/marginleak/analyze", async (route) => {
      await route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          schemaVersion: "1.0",
          requestId: "33333333-3333-4333-8333-333333333333",
          traceId: "44444444-4444-4444-8444-444444444444",
          timestamp: "2026-10-16T10:00:00.000Z",
          error: {
            code: "MARGINLEAK_PREVIEW_UNAVAILABLE",
            category: "authorization",
            message: "The MarginLeak synthetic preview is unavailable.",
            retryable: false,
          },
        }),
      });
    });

    await page
      .getByRole("button", { name: /Run Margin Analysis/i })
      .first()
      .click();

    const restrictedPanel = page.locator("#ml-restricted-state");
    await expect(restrictedPanel).toBeVisible();
    await expect(restrictedPanel).toBeFocused();
    await expect(restrictedPanel).toContainText(
      "MARGINLEAK_PREVIEW_UNAVAILABLE",
    );
    await assertZeroHorizontalOverflow(page, "1440px Restricted 403");

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "11-restricted-preview-403-desktop.png"),
      fullPage: true,
    });
  });
});

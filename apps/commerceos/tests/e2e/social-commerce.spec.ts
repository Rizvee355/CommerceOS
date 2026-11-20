import { expect, test } from "@playwright/test";

test.describe("DIU Social-Commerce Operations Demo E2E", () => {
  test("runs Bangla/Banglish extraction, PromiseGuard + MarginLeak evaluation, Bangla toggle, and zero mobile overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await page
      .getByRole("link", { name: /Open DIU Social-Commerce Demo/i })
      .click();
    await expect(page).toHaveURL("/social-commerce");
    await expect(
      page.getByRole("heading", {
        name: "Social-Commerce Operations Intelligence",
      }),
    ).toBeVisible();

    // 1. Default Banglish margin-leak scenario
    await page
      .getByRole("button", { name: /Extract Structured Order/i })
      .click();
    await expect(
      page.getByText("Premium Fleece Hoodie (Black)").first(),
    ).toBeVisible();

    await page
      .getByRole("button", { name: /Run PromiseGuard & MarginLeak Audit/i })
      .click();
    await expect(page.getByTestId("sc-human-gate")).toContainText(
      /Hold for Human Review/i,
    );
    await expect(page.getByTestId("sc-promiseguard-card")).toContainText(
      /supported/i,
    );
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /leak detected/i,
    );
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /৳396\.00/,
    );

    // 2. Mobile viewport (375x812) zero horizontal overflow check
    await page.setViewportSize({ width: 375, height: 812 });
    const mobileOverflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(mobileOverflow.scrollWidth).toBeLessThanOrEqual(
      mobileOverflow.innerWidth,
    );

    // 3. Bangla localization toggle
    await page.getByRole("button", { name: "বাংলা" }).click();
    await expect(
      page.getByRole("heading", {
        name: "সোশ্যাল-কমার্স অপারেশনস ইন্টেলিজেন্স",
      }),
    ).toBeVisible();

    // 4. Ambiguous / missing information scenario
    await page.getByRole("button", { name: "English" }).click();
    await page
      .getByRole("radio", { name: /Ambiguous chat with missing price/i })
      .click();
    await page
      .getByRole("button", { name: /Extract Structured Order/i })
      .click();
    await expect(page.getByTestId("sc-uncertainties")).toContainText(
      /MISSING_QUANTITY/,
    );
    await page
      .getByRole("button", { name: /Run PromiseGuard & MarginLeak Audit/i })
      .click();
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /Withheld \(incomplete\)/i,
    );
  });

  test("PromiseGuard results remain overflow-free on 375px mobile even with raw JSON open", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/promiseguard");

    await page.getByRole("button", { name: /Run analysis/i }).click();
    await expect(
      page.getByRole("heading", { name: "Evaluation Results" }),
    ).toBeVisible();

    await page.getByText(/View raw contract response payload/i).click();

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.innerWidth);
  });
});

import { expect, test } from "@playwright/test";

test.describe("Social-Commerce Order Workspace E2E", () => {
  test("runs Bangla/Banglish extraction, PromiseGuard + MarginLeak 8-category ledger, custom Vitamin C Serum discount fix, Bangla toggle, and zero mobile overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/");

    await page
      .getByRole("link", { name: /Open Order Workspace/i })
      .first()
      .click();
    await expect(page).toHaveURL("/social-commerce");
    await expect(
      page.getByRole("heading", {
        name: "Social-Commerce Order Workspace",
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
      .getByRole("button", { name: /Check Fulfilment & Profit/i })
      .click();
    await expect(page.getByTestId("sc-human-gate")).toContainText(
      /Hold for Review/i,
    );
    await expect(page.getByTestId("sc-promiseguard-card")).toContainText(
      /Ready to Fulfil/i,
    );
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /Margin Loss Detected/i,
    );
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /-৳366\.30/,
    );
    await expect(page.getByTestId("sc-marginleak-ledger")).toContainText(
      /8\/8 categories complete/i,
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
        name: "সোশ্যাল-কমার্স অর্ডার ওয়ার্কস্পেস",
      }),
    ).toBeVisible();

    // 4. Healthy full-price order scenario -> Ready for Manual Confirmation
    await page.getByRole("button", { name: "English" }).click();
    await page
      .getByRole("radio", {
        name: /Full-price Dhaka order with secured stock/i,
      })
      .click();
    await page
      .getByRole("button", { name: /Extract Structured Order/i })
      .click();
    await page
      .getByRole("button", { name: /Check Fulfilment & Profit/i })
      .click();
    await expect(page.getByTestId("sc-human-gate")).toContainText(
      /Ready for Manual Confirmation/i,
    );
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /Margin Protected/i,
    );

    // 5. Custom Vitamin C Serum Banglish shorthand discount ('155 tk discnt thkbe')
    await page
      .getByLabel(/Customer & merchant conversation/i)
      .fill(
        "Customer: 5ta Vitamin C Glow Serum lagbe Mirpur e, address pore dicchi. koto discount pabo?\nMerchant: 155 tk discnt thkbe",
      );
    await page
      .getByRole("button", { name: /Extract Structured Order/i })
      .click();
    await expect(page.getByTestId("sc-uncertainties")).toContainText(
      /Agreed selling price was not confirmed/i,
    );
    await expect(page.locator("body")).not.toContainText("৳4,595");
    await page
      .getByRole("button", { name: /Check Fulfilment & Profit/i })
      .click();
    await expect(page.getByTestId("sc-marginleak-card")).toContainText(
      /Withheld \(incomplete\)/i,
    );
    await expect(page.getByTestId("sc-marginleak-ledger")).toContainText(
      /-৳155\.00/,
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

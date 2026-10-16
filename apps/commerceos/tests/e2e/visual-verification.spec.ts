import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

const localScreenshotDir = path.join(
  process.cwd(),
  "test-results",
  "screenshots",
);
const brainScreenshotDir =
  "C:\\Users\\HP\\.gemini\\antigravity\\brain\\78ffd127-4563-4245-87c8-bac1485ff785\\screenshots";

const saveScreenshot = async (page: Page, filename: string) => {
  fs.mkdirSync(localScreenshotDir, { recursive: true });
  const localPath = path.join(localScreenshotDir, filename);
  await page.screenshot({ path: localPath, fullPage: true });

  if (fs.existsSync(brainScreenshotDir)) {
    try {
      fs.copyFileSync(localPath, path.join(brainScreenshotDir, filename));
    } catch {
      // Continue safely if artifact directory is unavailable in certain environments
    }
  }
};

const assertNoHorizontalOverflow = async (page: Page) => {
  await page.waitForTimeout(100);
  const result = await page.evaluate(() => {
    const docWidth = document.documentElement.clientWidth || window.innerWidth;
    const scrollWidth = document.documentElement.scrollWidth;

    const isInsideScrollContainer = (el: Element): boolean => {
      let parent = el.parentElement;
      while (
        parent &&
        parent !== document.body &&
        parent !== document.documentElement
      ) {
        const style = window.getComputedStyle(parent);
        const overflowX = style.overflowX;
        if (
          overflowX === "auto" ||
          overflowX === "scroll" ||
          overflowX === "hidden"
        ) {
          return true;
        }
        parent = parent.parentElement;
      }
      return false;
    };

    const elements = Array.from(document.querySelectorAll("*"));
    const overflowing = elements
      .filter((el) => {
        if (isInsideScrollContainer(el)) return false;
        const rect = el.getBoundingClientRect();
        return rect.right > docWidth + 1.5;
      })
      .map((el) => ({
        tag: el.tagName,
        className: typeof el.className === "string" ? el.className : "",
        id: el.id,
        parent: el.parentElement
          ? `${el.parentElement.tagName}.${el.parentElement.className}`
          : "",
        text: (el.textContent || "").slice(0, 50),
        right: Math.round(el.getBoundingClientRect().right),
        width: Math.round(el.getBoundingClientRect().width),
      }));

    return {
      docWidth,
      scrollWidth,
      overflowing,
    };
  });

  if (result.overflowing.length > 0) {
    console.log(
      `[OVERFLOW AUDIT] Doc width ${result.docWidth}px, scrollWidth ${result.scrollWidth}px. Overflowing:`,
      JSON.stringify(result.overflowing.slice(0, 5), null, 2),
    );
  }

  expect(result.overflowing.length).toBe(0);
  expect(result.scrollWidth).toBeLessThanOrEqual(result.docWidth + 1);
};

test.describe("Visual verification & responsive layout audits", () => {
  test("Scenario 1 (Supported): captures desktop and mobile results without overflow", async ({
    page,
  }) => {
    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/promiseguard");

    // Default preset 1 is aligned/supported
    await page.getByRole("button", { name: /Run analysis/i }).click();
    await expect(
      page.getByRole("heading", { name: "Evaluation Results" }),
    ).toBeVisible();
    await expect(page.getByText("Supported", { exact: true })).toBeVisible();

    await assertNoHorizontalOverflow(page);
    await saveScreenshot(page, "scenario-1-supported-desktop.png");

    // 2. Mobile Viewport (iPhone 14/15 size: 390x844)
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page);
    await saveScreenshot(page, "scenario-1-supported-mobile.png");
  });

  test("Scenario 2 (At Risk): captures desktop and mobile results without overflow", async ({
    page,
  }) => {
    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/promiseguard");

    // Select Preset 2 (Adverse evidence)
    await page.getByRole("radio", { name: /Adverse evidence/i }).click();
    await page.getByRole("button", { name: /Run analysis/i }).click();

    await expect(
      page.getByRole("heading", { name: "Evaluation Results" }),
    ).toBeVisible();
    await expect(page.getByText("At risk", { exact: true })).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Adverse Findings/i }),
    ).toBeVisible();

    await assertNoHorizontalOverflow(page);
    await saveScreenshot(page, "scenario-2-at-risk-desktop.png");

    // 2. Mobile Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page);
    await saveScreenshot(page, "scenario-2-at-risk-mobile.png");
  });

  test("Scenario 3 (Indeterminate): captures desktop and mobile results without overflow", async ({
    page,
  }) => {
    // 1. Desktop Viewport
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto("/promiseguard");

    // Select Preset 3 (Incomplete evidence)
    await page.getByRole("radio", { name: /Incomplete evidence/i }).click();
    await page.getByRole("button", { name: /Run analysis/i }).click();

    await expect(
      page.getByRole("heading", { name: "Evaluation Results" }),
    ).toBeVisible();
    await expect(
      page.getByText("Indeterminate", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /Uncertain or Missing Evidence/i }),
    ).toBeVisible();

    await assertNoHorizontalOverflow(page);
    await saveScreenshot(page, "scenario-3-indeterminate-desktop.png");

    // 2. Mobile Viewport
    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoHorizontalOverflow(page);
    await saveScreenshot(page, "scenario-3-indeterminate-mobile.png");
  });
});

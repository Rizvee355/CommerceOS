import { expect, test } from "@playwright/test";

test("customer overview shell and approved APIs are available", async ({
  page,
  request,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /Understand every order\. Protect every promise\. Protect every margin\./i,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Open Order Workspace/i }).first(),
  ).toHaveAttribute("href", "/social-commerce");

  // Expand technical governance drawer and verify honest registry states
  await page.getByText(/System & Governance Details/i).click();
  await expect(page.getByTestId("capability-promiseguard")).toContainText(
    "Stub",
  );
  await expect(page.getByTestId("capability-marginleak")).toContainText(
    "Planned",
  );
  await expect(page.getByTestId("capability-rescuecart")).toContainText(
    "Disabled",
  );
  await expect(
    page.getByText(/Public live LLM inference remains disabled by default/i),
  ).toBeVisible();

  const health = await request.get("/api/v1/health");
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({
    schemaVersion: "1.0",
    service: "commerceos",
    status: "ok",
  });

  const capabilities = await request.get("/api/v1/capabilities");
  expect(capabilities.status()).toBe(200);
  expect(await capabilities.json()).toMatchObject({
    schemaVersion: "1.0",
    capabilities: [
      { id: "promiseguard", state: "stub", routes: [] },
      { id: "marginleak", state: "planned", routes: [] },
      { id: "rescuecart", state: "disabled", routes: [] },
    ],
  });
});

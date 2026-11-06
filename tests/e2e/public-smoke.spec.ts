import { expect, test } from "@playwright/test";

test("public paw directory remains available on desktop and mobile", async ({ page }) => {
  await page.goto("/dogs");
  await expect(page.getByRole("heading", { name: /every paw has a story/i })).toBeVisible();
  await expect(page.getByRole("article")).toHaveCount(6);
});

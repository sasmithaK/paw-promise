import { expect, test } from "@playwright/test";

test("public paw directory remains available on desktop and mobile", async ({ page }) => {
  await page.goto("/paws");
  await expect(page.getByRole("heading", { name: /every paw has a story/i })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("article").first()).toBeVisible({ timeout: 30_000 });
});

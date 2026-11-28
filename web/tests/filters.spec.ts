import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
import { preparePageForReview } from "./pageReady";

for (const width of [390, 1440]) {
  test(`saved source filter is visible and can restore all subscriptions at ${width}`, async ({ page }, info) => {
    await page.setViewportSize({ width, height: 1000 });
    await installBackend(page);
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("filter-seeded")) {
        localStorage.setItem("sub-tag", "remote");
        sessionStorage.setItem("filter-seeded", "true");
      }
    });
    await page.goto("/subs");
    const cards = page.locator(".studio-card");
    await expect(cards).toHaveCount(1);
    const clear = page.getByRole("button", { name: "清除筛选：远程订阅", exact: true });
    await expect(clear).toBeVisible();
    await preparePageForReview(page, "dark");
    await page.screenshot({ path: info.outputPath("active-source-filter.png"), fullPage: true });
    await clear.focus();
    await clear.press("Enter");
    await expect(cards).toHaveCount(3);
    await expect(page.getByRole("heading", { name: "ByWave · 示例订阅", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "全部来源 · 示例组合", exact: true })).toBeVisible();
    await expect(clear).toHaveCount(0);
    await expect.poll(() => page.evaluate(() => localStorage.getItem("sub-tag"))).toBeNull();
    await page.reload();
    await expect(cards).toHaveCount(3);
    await expect(clear).toHaveCount(0);
  });
}

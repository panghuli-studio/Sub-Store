import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { installBackend } from "./fixtures";
for (const path of ["/subs", "/files", "/sync", "/shares", "/archives", "/my"])
  test(`accessible main page ${path}`, async ({ page }) => {
    await installBackend(page);
    await page.goto(path);
    await page
      .locator(path === "/my" ? ".studio-setting-card" : ".studio-card")
      .first()
      .waitFor();
    if (path === "/my")
      await expect(page.locator(".studio-setting-card").first()).toBeEnabled();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
  });

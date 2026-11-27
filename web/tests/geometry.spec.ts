import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
for (const width of [375, 1280])
  test(`approved geometry ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await installBackend(page);
    await page.goto("/subs");
    await page.locator(".studio-card").first().waitFor();
    const first = await page.locator(".studio-card").first().boundingBox();
    expect(first!.x).toBe(width === 375 ? 16 : 248);
    expect(first!.width).toBe(width === 375 ? 343 : 486);
    expect(first!.height).toBe(width === 375 ? 176 : 191);
    const third = await page.locator(".studio-card").nth(2).boundingBox();
    const second = await page.locator(".studio-card").nth(1).boundingBox();
    expect(
      third!.y -
        (width === 375 ? second!.y + second!.height : first!.y + first!.height),
    ).toBeCloseTo(20, 0);
    for (const path of ["/sync", "/shares", "/archives"]) {
      await page.goto(path);
      await page.locator(".studio-card").first().waitFor();
      const card = await page.locator(".studio-card").first().boundingBox();
      expect(card!.y).toBe(width === 375 ? 112 : 128);
      expect(card!.width).toBe(width === 375 ? 343 : 486);
    }
    await page.goto("/my");
    await page.locator(".studio-setting-card").first().waitFor();
    const setting = await page
      .locator(".studio-setting-card")
      .first()
      .boundingBox();
    expect(setting!.width).toBe(width === 375 ? 343 : 780);
    expect(setting!.height).toBe(100);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });

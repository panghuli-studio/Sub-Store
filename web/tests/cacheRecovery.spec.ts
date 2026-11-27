import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
import { preparePageForReview } from "./pageReady";

for (const width of [375, 1280])
  test(`frontend cache recovery remains reachable at ${width}`, async ({
    page,
  }, testInfo) => {
    const { requests } = await installBackend(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator.serviceWorker, "getRegistrations", {
        value: async () => [
          {
            unregister: async () => {
              localStorage.setItem("cache-recovery-worker", "yes");
              return true;
            },
          },
        ],
      });
      Object.defineProperty(window, "caches", {
        value: {
          keys: async () => ["ui-regression-cache"],
          delete: async (key: string) => {
            localStorage.setItem("cache-recovery-cache", key);
            return true;
          },
        },
      });
    });
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/my");
    await preparePageForReview(page, "dark");
    await page
      .locator(".studio-setting-card")
      .filter({ hasText: "前端" })
      .click();
    await page.screenshot({
      path: testInfo.outputPath("frontend-cache.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "重建前端缓存", exact: true })
      .click();
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("cache-recovery-worker")),
      )
      .toBe("yes");
    await expect
      .poll(() =>
        page.evaluate(() => localStorage.getItem("cache-recovery-cache")),
      )
      .toBe("ui-regression-cache");
    expect(requests.filter((r) => r.method === "PATCH")).toHaveLength(0);
  });

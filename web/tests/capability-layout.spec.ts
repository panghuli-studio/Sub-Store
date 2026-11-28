import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
import { preparePageForReview } from "./pageReady";

for (const width of [375, 1280])
  for (const theme of ["dark", "light"])
    test(`restored information fits ${width} ${theme}`, async ({ page }, info) => {
      const { db } = await installBackend(page, theme);
      await page.setViewportSize({ width, height: 1000 });
      db.settings.appearanceSetting.isSimpleMode = true;
      db.settings.appearanceSetting.isSimpleShowRemark = true;
      db.subs[0].noFlow = false;
      db.subs[0].tag = ["旅行"];
      db.artifacts[0].remark = "保留同步来源与更新时间";
      db.artifacts[0].updated = Date.now();
      db.archives[0].remark = "保留这个版本";
      await page.route("**/api/sub/flow/**", route => route.fulfill({ json: {
        status: "success", data: { total: 107374182400, usage: { upload: 1073741824, download: 1073741824 }, expires: 1893456000, remainingDays: 30, planName: "Plan A" },
      }}));
      for (const path of ["/subs", "/sync", "/shares", "/archives", "/logs"]) {
        await page.goto(path);
        await preparePageForReview(page, theme);
        if (path === "/subs") await expect(page.locator(".studio-card").first()).toContainText("2 GB");
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: info.outputPath(path.slice(1) + ".png"), fullPage: true });
      }
    });

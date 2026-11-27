import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
import { preparePageForReview } from './pageReady';
for (const width of [375, 1280])
  for (const theme of ["dark", "light"])
    test(`approved layout ${width} ${theme}`, async ({ page }, testInfo) => {
      const { requests } = await installBackend(page, theme);
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/subs",
        "/files",
        "/sync",
        "/shares",
        "/archives",
        "/my",
      ]) {
        await page.goto(path);
        await expect(
          page
            .locator(path === "/my" ? ".studio-setting-card" : ".studio-card")
            .first(),
        ).toBeVisible();
        if (path === "/my")
          await expect(
            page.locator(".studio-setting-card").first(),
          ).toBeEnabled();
        if(path!=='/my'){
          await expect(page.getByRole('button',{name:'筛选与批量管理',exact:true})).toBeVisible();
          if(path!=='/archives')await expect(page.getByRole('button',{name:'新建条目',exact:true})).toBeVisible();
        }
        await preparePageForReview(page, theme);
        await page.screenshot({
          path: testInfo.outputPath(`${path.slice(1)}.png`),
          fullPage: true,
        });
      }
      expect(errors).toEqual([]);
    });

import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
for (const width of [375, 1280])
  for (const theme of ["dark", "light"])
    test(`details ${width} ${theme}`, async ({ page }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await installBackend(page, theme);
      await page.setViewportSize({ width, height: 900 });
      for (const path of [
        "/edit/subs/JMS-demo",
        "/settings/more",
        "/settings/api",
        "/logs",
      ]) {
        await page.goto(path);
        const dialog = page.locator(".studio-route-dialog");
        await expect(dialog).toBeVisible();
        await page.locator(".Toastify__toast").waitFor({ state: "hidden" });
        await page.screenshot({
          path: info.outputPath(path.replaceAll("/", "-") + ".png"),
          fullPage: false,
        });
        const box = await dialog.boundingBox();
        expect(box!.width).toBe(
          width === 375 ? 343 : path.startsWith("/settings/") ? 680 : 520,
        );
        expect(box!.x).toBeGreaterThanOrEqual(0);
      }
      expect(errors).toEqual([]);
    });

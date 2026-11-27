import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";
import { preparePageForReview } from "./pageReady";

test("review waits for initialization and can dismiss a paused notification", async ({
  page,
}) => {
  await installBackend(page);
  let releaseSettings!: () => void;
  const settingsReady = new Promise<void>((resolve) => {
    releaseSettings = resolve;
  });
  await page.route("**/api/settings", async (route) => {
    await settingsReady;
    await route.fallback();
  });
  try {
    await page.goto("/my");
    await expect(page.locator("main.studio-page")).toHaveAttribute(
      "aria-busy",
      "true",
    );
  } finally {
    releaseSettings();
  }
  await page.locator(".Toastify__toast").first().waitFor();
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await expect(page.locator(".Toastify__progress-bar").first()).toHaveCSS(
    "animation-play-state",
    "paused",
  );
  await preparePageForReview(page, "dark");
  await expect(page.locator(".studio-setting-card").first()).toBeEnabled();
  await expect(page.locator(".Toastify__toast")).toHaveCount(0);
});

import { expect, type Page } from "@playwright/test";

export async function preparePageForReview(page: Page, theme: string) {
  await expect(page.locator("main.studio-page")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  });
  await page.locator(".Toastify__close-button").evaluateAll((buttons) => {
    // A toast may auto-close during Playwright's actionability wait.
    for (const button of buttons) (button as HTMLButtonElement).click();
  });
  await expect(page.locator(".Toastify__toast")).toHaveCount(0);
}

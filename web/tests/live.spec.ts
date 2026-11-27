import { test, expect } from "@playwright/test";
if (
  process.env.LIVE_BACKEND_URL &&
  new URL(process.env.LIVE_BACKEND_URL).hostname !== "127.0.0.1"
)
  throw Error("Live checks require an isolated localhost backend");
test.describe("isolated real backend", () => {
  test.skip(
    !process.env.LIVE_BACKEND_URL,
    "Set LIVE_BACKEND_URL to the isolated backend",
  );
  test.use({ baseURL: process.env.LIVE_BACKEND_URL });
  test("subscription URL and settings save via original endpoints", async ({
    page,
    request,
  }) => {
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.goto("/subs");
    const card = page
      .locator(".studio-card")
      .filter({
        has: page.getByRole("heading", { name: "JMS · 示例订阅", exact: true }),
      });
    await card.getByRole("button", { name: "编辑", exact: true }).click();
    const popup = page.locator(".studio-route-dialog");
    await expect(popup.locator("textarea:visible")).toHaveCount(1);
    await popup
      .locator("textarea:visible")
      .fill("https://example.invalid/updated");
    const saved = page.waitForResponse(
      (r) =>
        r.request().method() === "PATCH" &&
        r.url().includes("/api/sub/JMS-demo"),
    );
    await popup.locator(".submit-btn").click();
    expect((await (await saved).json()).status).toBe("success");
    const sub = await (await request.get("/api/sub/JMS-demo")).json();
    expect(sub.data.url).toBe("https://example.invalid/updated");
    await page.goto("/my");
    await page.getByRole("button", { name: /请求配置/ }).click();
    const settingsPopup = page.locator(".studio-settings-detail");
    await settingsPopup
      .getByPlaceholder("默认超时(单位: 毫秒, 默认: 8000)")
      .fill("12345");
    const patched = page.waitForResponse(
      (r) =>
        r.request().method() === "PATCH" && r.url().endsWith("/api/settings"),
    );
    await settingsPopup.locator(".save-btn").click();
    expect((await (await patched).json()).status).toBe("success");
    const settings = await (await request.get("/api/settings")).json();
    expect(Number(settings.data.defaultTimeout)).toBe(12345);
  });
  test("file categories keep all resources reachable", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.goto("/files");
    await expect(page.locator(".studio-card")).toHaveCount(2);
    await page.getByText("节点文件", { exact: true }).first().click();
    await expect(page.locator(".studio-card")).toHaveCount(2);
    await page.getByText("普通文件", { exact: true }).first().click();
    await expect(page.locator(".studio-card")).toHaveCount(1);
  });
});

test.describe("isolated archive lifecycle", () => {
  test.skip(
    !process.env.LIVE_BACKEND_URL,
    "Requires an isolated localhost backend",
  );
  test.use({ baseURL: process.env.LIVE_BACKEND_URL });
  test("file archive and restore persist through original endpoints", async ({
    page,
    request,
  }) => {
    const name = "ui-archive-check";
    await request.post("/api/files", {
      data: {
        name,
        displayName: name,
        source: "local",
        uiCategory: "config",
        content: "mode: rule",
        process: [],
      },
    });
    await page.addInitScript(() => localStorage.setItem("locale", "zh"));
    await page.goto("/files");
    const card = page
      .locator(".studio-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await card.getByRole("button", { name: "删除", exact: true }).click();
    const archived = page.waitForResponse(
      (r) =>
        r.request().method() === "DELETE" &&
        r.url().includes("/api/file/" + name),
    );
    await page.locator(".nut-dialog__footer-cancel").click();
    expect((await (await archived).json()).status).toBe("success");
    await page.goto("/archives");
    const archive = page
      .locator(".studio-card")
      .filter({ has: page.getByRole("heading", { name, exact: true }) });
    await expect(archive).toHaveCount(1);
    const restored = page.waitForResponse(
      (r) => r.request().method() === "POST" && r.url().endsWith("/restore"),
    );
    await archive
      .getByRole("button", { name: "恢复", exact: true })
      .last()
      .click();
    expect((await (await restored).json()).status).toBe("success");
    const files = await (await request.get("/api/wholeFiles")).json();
    expect(files.data.find((file: any) => file.name === name).content).toBe(
      "mode: rule",
    );
    await request.delete("/api/file/" + name);
  });
});

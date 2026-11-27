import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";

test("search and management preserve the approved default card layout", async ({
  page,
}) => {
  await installBackend(page);
  await page.goto("/subs");
  const cards = page.locator(".studio-card");
  await expect(cards).toHaveCount(3);
  await expect(
    cards.first().locator(".studio-card-actions button"),
  ).toHaveCount(4);
  await expect(cards.first().getByRole("checkbox")).toHaveCount(0);
  await page.getByRole("searchbox").fill("ByWave");
  await expect(cards).toHaveCount(1);
  await page.getByRole("searchbox").fill("");
  await expect(cards).toHaveCount(3);
  const manage = page.getByRole("button", {
    name: "筛选与批量管理",
    exact: true,
  });
  await manage.focus();
  await manage.press("Enter");
  const popup = page.locator(".studio-management");
  await expect(popup).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "导入配置", exact: true }),
  ).toBeVisible();
  await expect(
    popup.getByRole("button", { name: "创建副本", exact: true }),
  ).toHaveCount(3);
  await popup.getByText("本地订阅", { exact: true }).click();
  await expect(cards).toHaveCount(1);
  await popup
    .getByRole("button", { name: "展开或收起 · 订阅", exact: true })
    .click();
  await expect(cards).toHaveCount(0);
  await popup
    .getByRole("button", { name: "展开或收起 · 订阅", exact: true })
    .click();
  await expect(cards).toHaveCount(1);
});

test("subscription editor retains URL, request fields, processing and saving", async ({
  page,
}) => {
  const { requests } = await installBackend(page);
  await page.goto("/subs");
  await page
    .locator(".studio-card")
    .first()
    .getByRole("button", { name: "编辑", exact: true })
    .click();
  const popup = page.locator(".studio-route-dialog");
  await expect(popup).toBeVisible();
  await popup
    .locator("textarea:visible")
    .fill("https://example.invalid/updated");
  await popup.getByRole("tab", { name: "请求与输出", exact: true }).click();
  await expect(popup.locator("textarea:visible")).toHaveCount(0);
  await expect(
    popup.getByText("代理/策略", { exact: true }).first(),
  ).toBeVisible();
  await popup.getByRole("tab", { name: "加工链", exact: true }).click();
  await expect(popup.locator(".actions-title-wrapper")).toBeVisible();
  await popup.locator(".submit-btn").click();
  await expect
    .poll(
      () =>
        requests.find(
          (r) => r.method === "PATCH" && r.path === "/api/sub/JMS-demo",
        )?.payload.url,
    )
    .toBe("https://example.invalid/updated");
});

test("file actions stay visible and duplicate uses the original API", async ({
  page,
}) => {
  const { requests } = await installBackend(page);
  await page.goto("/files");
  const card = page.locator(".studio-card").first();
  await expect(card.locator(".studio-card-actions button")).toHaveCount(3);
  await expect(card.locator(".studio-card-extra button")).toHaveCount(4);
  await card.getByRole("button", { name: "创建副本", exact: true }).click();
  await expect
    .poll(
      () =>
        requests.filter((r) => r.method === "POST" && r.path === "/api/files")
          .length,
    )
    .toBe(1);
  await expect(page.locator(".studio-card")).toHaveCount(3);
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "导出配置", exact: true }).click();
  await download;
});

test("settings preserve all ten categories and save the original payload", async ({
  page,
}, info) => {
  const { requests } = await installBackend(page);
  await page.goto("/my");
  await expect(page.locator(".studio-setting-card")).toHaveCount(10);
  await page.getByRole("button", { name: /请求配置/ }).click();
  const popup = page.locator(".studio-settings-detail");
  await popup
    .getByPlaceholder("默认超时(单位: 毫秒, 默认: 8000)")
    .fill("12345");
  await page.locator(".Toastify__toast").waitFor({ state: "hidden" });
  await page.screenshot({
    path: info.outputPath("request-settings.png"),
    fullPage: true,
  });
  await popup.locator(".save-btn").press("Enter");
  await expect
    .poll(
      () =>
        requests.find(
          (r) =>
            r.method === "PATCH" &&
            r.path === "/api/settings" &&
            r.payload.defaultTimeout === "12345",
        )?.payload.defaultTimeout,
    )
    .toBe("12345");
});

test("appearance preferences still affect the redesigned cards", async ({
  page,
}) => {
  const { db } = await installBackend(page);
  db.settings.appearanceSetting.isSimpleMode = true;
  db.settings.appearanceSetting.isShowIcon = false;
  db.settings.theme.name = "mocha";
  await page.goto("/subs");
  const card = page.locator(".studio-card").first();
  await expect(card).toHaveClass(/studio-simple/);
  await expect(card.locator(".studio-symbol")).toHaveCount(0);
  await expect(card.locator(".studio-card-type")).toBeHidden();
  await expect
    .poll(() =>
      page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim(),
      ),
    )
    .toBe("#f5f3ee");
});

test("sync switch in management still saves the original artifact", async ({
  page,
}) => {
  const { requests } = await installBackend(page);
  await page.goto("/sync");
  await page.locator(".studio-card").first().waitFor();
  await page
    .getByRole("button", { name: "筛选与批量管理", exact: true })
    .click();
  await page.locator(".studio-management .nut-switch").click();
  await expect
    .poll(
      () =>
        requests.find(
          (r) => r.method === "PATCH" && r.path === "/api/artifact/phone",
        )?.payload.sync,
    )
    .toBe(true);
});

test("wide screen narrow navigation remains available", async ({ page }) => {
  const { db } = await installBackend(page);
  db.settings.appearanceSetting.useNarrowModeOnWideScreen = true;
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/subs");
  await expect(page.locator(".studio-card").first()).toBeVisible();
  await expect(page.locator(".studio-sidebar")).toBeHidden();
  await expect(page.locator(".studio-mobile-nav")).toBeVisible();
  expect((await page.locator(".studio-card").first().boundingBox())!.x).toBe(
    140,
  );
});


test('mobile add subscription keeps the URL field reachable',async({page})=>{
 await installBackend(page);await page.setViewportSize({width:375,height:900});await page.goto('/subs');await page.locator('.studio-card').first().waitFor();
 await page.getByRole('button',{name:'新建条目',exact:true}).click();await page.locator('.add-sub-popup').getByRole('link',{name:'单条订阅',exact:true}).click();
 await expect(page.locator('.studio-route-dialog textarea:visible')).toHaveCount(1);
});

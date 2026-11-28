import { test, expect } from "@playwright/test";
import { installBackend } from "./fixtures";

for (const simple of [false, true]) {
  test(`subscription usage and collection sources remain visible (simple=${simple})`, async ({ page }) => {
    const { db } = await installBackend(page);
    db.settings.appearanceSetting.isSimpleMode = simple;
    db.settings.appearanceSetting.isSimpleShowRemark = false;
    db.subs[0].noFlow = false;
    await page.route("**/api/sub/flow/**", route => route.fulfill({ json: {
      status: "success", data: { total: 107374182400, usage: { upload: 1073741824, download: 1073741824 }, expires: 1893456000, remainingDays: 30, planName: "Plan A" },
    }}));
    await page.goto("/subs");
    const remote = page.locator(".studio-card").filter({ has: page.getByRole("heading", { name: "JMS · 示例订阅", exact: true }) });
    await expect(remote).toContainText("2 GB");
    await expect(remote).toContainText("100 GB");
    await expect(remote).toContainText("2030-01-01");
    const collection = page.locator(".studio-card").filter({ has: page.getByRole("heading", { name: "全部来源 · 示例组合", exact: true }) });
    await expect(collection).toContainText("JMS · 示例订阅");
    await expect(collection).toContainText("ByWave · 示例订阅");
  });
  test(`share limits remain visible (simple=${simple})`, async ({ page }) => {
    const { db } = await installBackend(page);
    db.settings.appearanceSetting.isSimpleMode = simple;
    db.settings.appearanceSetting.isSimpleShowRemark = false;
    await page.goto("/shares");
    await expect(page.locator(".studio-card").first()).toContainText("5/100");
    await expect(page.locator(".studio-card").nth(1)).toContainText("2030-01-01");
  });
  test(`sync source and execution time survive remarks (simple=${simple})`, async ({ page }) => {
    const { db } = await installBackend(page);
    db.settings.appearanceSetting.isSimpleMode = simple;
    db.settings.appearanceSetting.isSimpleShowRemark = false;
    db.artifacts[0].remark = "Important note";
    db.artifacts[0].updated = Date.now();
    await page.goto("/sync");
    await expect(page.locator(".studio-card").first()).toContainText("Stash configuration");
    await expect(page.locator(".studio-card").first()).toContainText("自动同步已关闭");
    await expect(page.locator(".studio-card").first()).toContainText(simple ? /秒|刚刚/ : "上次执行");
  });
}

test("log actions are reachable inside the route dialog", async ({ page }) => {
  await installBackend(page);
  await page.goto("/logs");
  await expect(page.locator(".logs-page-wrapper")).toBeVisible();
  const refresh = page.getByRole("button", { name: "刷新", exact: true });
  await expect(refresh).toBeEnabled();
  await refresh.click({ trial: true, timeout: 1500 });
  await page.getByRole("button", { name: "多选", exact: true }).click();
  await expect(page.locator(".logs-selection-actions")).toBeVisible();
});

test("saved collapsed sections can be restored without opening management", async ({ page }) => {
  await installBackend(page);
  await page.addInitScript(() => localStorage.setItem("sub-fold", JSON.stringify({ sub: { all: 1 }, col: { all: 1 } })));
  await page.goto("/subs");
  await expect(page.locator(".studio-card")).toHaveCount(0);
  await page.getByRole("button", { name: "展开全部分组", exact: true }).click();
  await expect(page.locator(".studio-card")).toHaveCount(3);
});

test("language preference remains reachable from settings", async ({ page }) => {
  await installBackend(page);
  await page.goto("/my");
  await page.getByRole("button", { name: /语言.*界面语言/ }).click();
  await expect(page.locator(".language-switch-popup:visible")).toBeVisible();
  await page.locator(".language-switch-popup:visible").getByText("English", { exact: true }).click();
  await expect(page.locator(".studio-settings")).toContainText("Language");
});

test("resource tags remain readable in management", async ({ page }) => {
  const { db } = await installBackend(page);
  db.subs[0].tag = ["旅行"];
  await page.goto("/subs");
  await page.getByRole("button", { name: "筛选与批量管理", exact: true }).click();
  await expect(page.locator(".studio-management-item").filter({ hasText: "JMS · 示例订阅" }).locator(".studio-resource-tags")).toHaveText("旅行");
});

for (const simple of [false, true]) {
  test(`archive context and remarks remain visible (simple=${simple})`, async ({ page }) => {
    const { db } = await installBackend(page);
    db.settings.appearanceSetting.isSimpleMode = simple;
    db.settings.appearanceSetting.isSimpleShowRemark = true;
    db.archives[0].remark = "保留这个版本";
    await page.goto("/archives");
    const card = page.locator(".studio-card").filter({ has: page.getByRole("heading", { name: "旧版手机配置", exact: true }) });
    await expect(card).toContainText("归档:");
    await expect(card).toContainText("保留这个版本");
  });
}

test("management preserves share selection and protected deletion choices", async ({ page }) => {
  await installBackend(page);
  await page.goto("/shares");
  await page.getByRole("button", { name: "筛选与批量管理", exact: true }).click();
  const management = page.locator(".studio-management");
  await management.getByRole("button", { name: "全选当前结果", exact: true }).click();
  await expect(management.getByRole("button", { name: "删除", exact: true }).first()).toBeEnabled();
  await management.getByRole("button", { name: "删除", exact: true }).first().click();
  await expect(page.getByText("彻底删除", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("归档", { exact: true }).last()).toBeVisible();
});

test("sync management keeps the upstream platform and empty-list guards", async ({ page }) => {
  const { db } = await installBackend(page);
  db.settings.syncPlatform = "gitlab";
  db.artifacts[0].sync = false;
  await page.goto("/sync");
  await page.getByRole("button", { name: "筛选与批量管理", exact: true }).click();
  const bulk = page.locator(".studio-management-bulk");
  await expect(bulk.getByRole("button", { name: "下载", exact: true })).toHaveCount(0);
  db.artifacts = [];
  await page.reload();
  await page.getByRole("button", { name: "筛选与批量管理", exact: true }).click();
  await expect(bulk.getByRole("button", { name: "上传", exact: true })).toHaveCount(0);
});

test("mobile search can expose both a source filter and collapsed state", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await installBackend(page);
  await page.addInitScript(() => {
    localStorage.setItem("sub-tag", "remote");
    localStorage.setItem("sub-fold", JSON.stringify({ sub: { remote: 1 } }));
  });
  await page.goto("/subs");
  const expand = page.getByRole("button", { name: "展开全部分组", exact: true });
  await expect(expand).toBeVisible();
  await expect(page.getByRole("button", { name: "清除筛选：远程订阅", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expand.click();
  await expect(page.locator(".studio-card")).toHaveCount(1);
});

for (const path of ["/shares", "/archives"]) {
  test(`management can select one resource type independently (${path})`, async ({ page }) => {
    const { db } = await installBackend(page);
    if (path === "/shares") {
      db.tokens.push({ ...db.tokens[0], token: "second-stash-share" });
      db.tokens.push({ ...db.tokens[0], type: "sub", name: "JMS-demo", token: "single-sub-share" });
    }
    await page.goto(path);
    await page.getByRole("button", { name: "筛选与批量管理", exact: true }).click();
    const management = page.locator(".studio-management");
    await management.getByRole("button", { name: "全选文件", exact: true }).click({ timeout: 1500 });
    const selected = management.locator(".studio-management-item").filter({ has: page.locator(".nut-icon-checked") });
    await expect(selected).toHaveCount(path === "/shares" ? 3 : 1);
    await expect(selected.first()).toContainText(path === "/shares" ? "configuration" : "旧版手机配置");
    await management.getByRole("button", { name: "取消文件全选", exact: true }).click();
    await expect(selected).toHaveCount(0);
    await management.getByRole("button", { name: "全选单条订阅", exact: true }).click();
    await expect(selected).toHaveCount(1);
    await expect(selected.first()).toContainText(path === "/shares" ? "JMS-demo" : "旅行备用订阅");
  });
}

import type { Page } from "@playwright/test";
export async function installBackend(page: Page, theme = "dark") {
  const file = (name: string, type: string) => ({
    name,
    type,
    uiCategory: type === "mihomoConfig" ? "config" : "nodes",
    source: "local",
    content:
      type === "mihomoConfig"
        ? "mode: rule\nproxies: []\nproxy-groups: []\nrules: []"
        : "proxies: []",
    process: [],
    tag: [type === "mihomoConfig" ? "完整配置" : "节点文件"],
    displayName: name,
    remark:
      type === "mihomoConfig"
        ? "DNS、策略组和分流规则"
        : "由配置引用，按需生成节点",
  });
  const defaults = {
    settings: {
      syncPlatform: "gist",
      githubUser: "",
      gistToken: "",
      defaultTimeout: "10000",
      backendRequestConcurrency: "10",
      backendRequestConcurrencyWaitTime: "0",
      logsMaxCount: "100",
      gistUpload: "base64",
      gistDownloadTokenStrategy: "ask",
      theme: { auto: false, name: theme, dark: "dark", light: "light" },
      appearanceSetting: {
        isSimpleMode: false,
        isShowIcon: true,
        isIconColor: true,
        isSubItemMenuFold: false,
        listPageViewMode: "dual-column",
        editorGroupingMode: "always",
        editorCommonDisplayMode: "expanded",
        manualSubscriptionsDisplayMode: "expanded",
        actionButtonsDisplayMode: "loose",
        displayPreviewInWebPage: true,
        showFloatingRefreshButton: false,
        showFloatingAddButton: false,
      },
    },
    subs: [
      {
        name: "JMS-demo",
        displayName: "JMS · 示例订阅",
        source: "remote",
        url: "https://example.com/subscription",
        remark: "远程来源 · 示例",
        process: [],
        tag: [],
        noFlow: true,
      },
      {
        name: "ByWave-demo",
        displayName: "ByWave · 示例订阅",
        source: "local",
        content: "",
        remark: "本地导入 · 示例",
        process: [],
        tag: [],
        noFlow: true,
      },
    ],
    collections: [
      {
        name: "all",
        displayName: "全部来源 · 示例组合",
        subscriptions: ["JMS-demo", "ByWave-demo"],
        process: [],
        tag: [],
      },
    ],
    files: [
      file("Stash configuration", "mihomoConfig"),
      file("Clash Verge configuration", "mihomoConfig"),
      file("Stash nodes", "file"),
      file("Clash Verge nodes", "file"),
      {
        ...file("import-urls", "file"),
        uiCategory: "other",
        tag: ["普通文件"],
      },
    ],
    artifacts: [
      {
        name: "phone",
        displayName: "手机配置",
        type: "file",
        source: "Stash configuration",
        platform: "Stash",
        sync: false,
        tag: [],
      },
    ],
    tokens: [
      {
        type: "file",
        name: "Stash configuration",
        token: "preview-stash",
        mode: "count",
        count: 100,
        usedCount: 5,
        tag: ["手机"],
      },
      {
        type: "file",
        name: "Clash Verge configuration",
        token: "preview-clash",
        mode: "duration",
        expiresValue: "7",
        expiresUnit: "day",
        createdAt: 1795766400000,
        exp: 1893456000000,
        tag: ["桌面"],
      },
    ],
    archives: [
      {
        id: "preview-archive-file",
        itemType: "file",
        name: "old-phone",
        displayName: "旧版手机配置",
        archivedAt: 1795766400000,
        tag: ["手机"],
        snapshot: {
          name: "old-phone",
          source: "local",
          type: "file",
          content: "mode: rule",
          process: [],
        },
      },
      {
        id: "preview-archive-sub",
        itemType: "sub",
        name: "old-sub",
        displayName: "旅行备用订阅",
        archivedAt: 1795766400000,
        tag: ["旅行"],
        snapshot: {
          name: "old-sub",
          source: "remote",
          url: "https://example.com/old",
          process: [],
        },
      },
    ],
    logs: [
      {
        id: "preview-log-1",
        time: 1795766400000,
        level: "info",
        message: "[示例] 已加载完整设置界面",
      },
      {
        id: "preview-log-2",
        time: 1795766401000,
        level: "warn",
        message: "[示例] 当前为隔离预览，不连接真实后端",
      },
    ],
  };

  const db: any = defaults;
  const requests: any[] = [];
  await page.addInitScript(() => {
    localStorage.setItem("locale", "zh");
    localStorage.setItem("backendConfigured", "true");
  });
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (!path.startsWith("/api/")) return route.continue();
    const method = request.method();
    const payload = request.postDataJSON();
    requests.push({ path, method, payload });
    let data: any = {};
    let status = "success";
    if (path === "/api/utils/env")
      data = {
        backend: "Node",
        version: "2.44.28",
        feature: { share: true, archive: true },
        meta: { node: { env: {} } },
      };
    else if (path === "/api/settings") {
      if (method === "PATCH")
        db.settings = {
          ...db.settings,
          ...payload,
          appearanceSetting: {
            ...db.settings.appearanceSetting,
            ...payload?.appearanceSetting,
          },
        };
      data = db.settings;
    } else if (path === "/api/logs")
      data = { logs: db.logs, total: db.logs.length, maxCount: 100 };
    else if (path === "/api/storage") data = db;
    else if (path.startsWith("/api/sub/flow/")) data = { status: "noFlow" };
    else {
      const [, api, key, name] = path.split("/");
      const mapping: any = {
        subs: "subs",
        sub: "subs",
        collections: "collections",
        collection: "collections",
        files: "files",
        file: "files",
        wholeFiles: "files",
        wholeFile: "files",
        artifacts: "artifacts",
        artifact: "artifacts",
        tokens: "tokens",
        token: "tokens",
        archives: "archives",
      };
      const group = mapping[key];
      if (group) {
        const index = db[group].findIndex(
          (item: any) =>
            (item.name || item.id || item.token) ===
            decodeURIComponent(name || ""),
        );
        if (method === "GET") data = name ? db[group][index] || {} : db[group];
        if (method === "POST") {
          db[group].push(payload);
          data = payload;
        }
        if (method === "PATCH" && index >= 0) {
          db[group][index] = { ...db[group][index], ...payload };
          data = db[group][index];
        }
        if (method === "DELETE" && index >= 0) {
          db[group].splice(index, 1);
        }
      }
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ status, data }),
    });
  });
  return { db, requests };
}

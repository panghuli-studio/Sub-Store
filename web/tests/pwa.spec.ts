import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname } from "node:path";
import type { AddressInfo } from "node:net";

let server: Server;
let origin: string;
let version: number;
let callbackHits: number;
const dist = resolve("dist");
const mime: Record<string, string> = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

test.beforeAll(async () => {
  version = 1;
  callbackHits = 0;
  server = createServer(async (req, res) => {
    const path = new URL(req.url!, "http://localhost").pathname;
    res.setHeader("Cache-Control", "no-store");
    if (path.startsWith("/cdn-cgi/")) {
      callbackHits++;
      res.setHeader("x-auth-callback", "network");
      res.setHeader("Content-Type", "text/plain");
      res.end("Authentication callback reached the network");
      return;
    }
    if (path === "/") {
      res.setHeader("Content-Type", "text/html");
      res.end("<!doctype html><title>Worker test bootstrap</title>");
      return;
    }
    const file = resolve(dist, "." + path);
    if (!file.startsWith(dist + "/")) {
      res.writeHead(404).end();
      return;
    }
    try {
      const data = await readFile(file);
      res.setHeader(
        "Content-Type",
        mime[extname(file)] || "application/octet-stream",
      );
      if (path === "/sw.js") {
        res.end(
          data.toString() +
            `\nself.addEventListener('message', e => {if(e.data === 'BUILD')e.ports[0].postMessage(${version})});`,
        );
      } else res.end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
test.afterAll(async () => {
  await new Promise<void>((done) => server.close(() => done()));
});

async function activate(page: Page) {
  await page.goto(origin);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
}

test("a controlled page sends authentication callbacks to the network", async ({
  page,
}) => {
  await activate(page);
  const response = await page.goto(
    origin + "/cdn-cgi/access/authorized?nonce=regression",
  );
  expect(response?.headers()["x-auth-callback"]).toBe("network");
  expect(callbackHits).toBe(1);
  await expect(page.locator("body")).toHaveText(
    "Authentication callback reached the network",
  );
});

test("an updated worker activates while an existing page remains open", async ({
  page,
}) => {
  await activate(page);
  version = 2;
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((done) => {
            const channel = new MessageChannel();
            channel.port1.onmessage = (event) => done(event.data);
            navigator.serviceWorker.controller!.postMessage("BUILD", [
              channel.port2,
            ]);
          }),
      ),
    )
    .toBe(2);
});

test("normal application navigation remains available offline", async ({
  page,
  context,
}) => {
  await activate(page);
  await context.setOffline(true);
  const response = await page.goto(origin + "/subs");
  expect(response?.status()).toBe(200);
  expect(await response!.text()).toContain('<div id="app">');
});

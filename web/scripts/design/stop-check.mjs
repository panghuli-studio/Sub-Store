import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const result = spawnSync("pnpm", ["exec", "playwright", "test"], {
  cwd: fileURLToPath(new URL("../../", import.meta.url)),
  stdio: "inherit",
  env: {
    ...process.env,
    UI_BASE_URL: process.env.UI_BASE_URL || "http://127.0.0.1:4320",
  },
});
process.exitCode = result.status || 0;

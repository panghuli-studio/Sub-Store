import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { spawnSync } from "node:child_process";
test("new native controls are rejected", () => {
  const probe = "src/UiGateProbe.vue";
  try {
    fs.writeFileSync(probe, "<template><button>probe</button></template>");
    const result = spawnSync(
      process.execPath,
      ["scripts/design/check-ui-base.mjs"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /new native button/);
  } finally {
    fs.rmSync(probe, { force: true });
  }
});

import fs from "node:fs";
import crypto from "node:crypto";
const source = fs.readFileSync("../docs/design/mockups/site/proto.css", "utf8");
const fileColor = source.match(/\.file-symbol\{[^}]*color:(#[a-f0-9]+)/i)[1];
const groupColor = source.match(
  /\.type-remote,\.type-collection\{color:(#[a-f0-9]+)/i,
)[1];
const blocks =
  source
    .match(/:root(?:\[data-theme=light\])?\{[^}]+\}/g)
    .slice(0, 2)
    .join("\n") +
  "\n:root{--symbol-file:" +
  fileColor +
  ";--symbol-group:" +
  groupColor +
  "}\n";
const target = "src/assets/styles/design-tokens.css";
if (process.argv.includes("--write")) fs.writeFileSync(target, blocks);
else if (!fs.existsSync(target) || fs.readFileSync(target, "utf8") !== blocks)
  throw Error("Design tokens differ from approved prototype");
const pin = JSON.parse(
  fs.readFileSync("../docs/design/approved-baseline.json", "utf8"),
);
for (const [file, hash] of Object.entries(pin.files)) {
  const actual = crypto
    .createHash("sha256")
    .update(fs.readFileSync("../" + file))
    .digest("hex");
  if (actual !== hash) throw Error("Approved design changed: " + file);
}
console.log("Approved design and tokens passed");

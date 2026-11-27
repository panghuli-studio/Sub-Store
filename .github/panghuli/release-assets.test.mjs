import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const script = fileURLToPath(new URL('./prepare-release-assets.sh', import.meta.url));

function fixture(t) {
  const root = mkdtempSync(join(tmpdir(), 'sub-store-release-assets-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const [name, content] of Object.entries({
    'backend/dist/sub-store.bundle.js': 'console.log("backend");',
    'frontend/index.html': '<script type="module" src="/index.js"></script>',
    'frontend/index.js': 'import("./chunks/page.js");',
    'frontend/chunks/page.js': 'export default "page";',
  })) {
    const path = join(root, name);
    mkdirSync(join(path, '..'), { recursive: true });
    writeFileSync(path, content);
  }
  return root;
}

test('release attachments contain the compiled frontend and valid checksums', t => {
  const root = fixture(t);
  const result = spawnSync('sh', [script], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const checksum = readFileSync(join(root, 'checksums.txt'), 'utf8');
  assert.match(checksum, /sub-store\.bundle\.js/);
  assert.match(checksum, /frontend\.zip/);
  assert.doesNotMatch(checksum, /dist\.zip/);
  const chunk = spawnSync('unzip', ['-p', 'frontend.zip', 'chunks/page.js'], { cwd: root, encoding: 'utf8' });
  assert.equal(chunk.status, 0, chunk.stderr);
  assert.equal(chunk.stdout, 'export default "page";');
  rmSync(join(root, 'frontend/chunks/page.js'));
  const rebuilt = spawnSync('sh', [script], { cwd: root, encoding: 'utf8' });
  assert.equal(rebuilt.status, 0, rebuilt.stdout + rebuilt.stderr);
  const entries = spawnSync('unzip', ['-Z1', 'frontend.zip'], { cwd: root, encoding: 'utf8' });
  assert.doesNotMatch(entries.stdout, /chunks\/page\.js/);
});

test('missing frontend entry rejects the release before producing attachments', t => {
  const root = fixture(t);
  rmSync(join(root, 'frontend/index.js'));
  const result = spawnSync('sh', [script], { cwd: root, encoding: 'utf8' });
  assert.notEqual(result.status, 0);
});

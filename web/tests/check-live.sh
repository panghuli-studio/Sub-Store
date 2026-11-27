#!/bin/sh
set -eu
: "${UI_BACKEND_DATA:?Set an isolated temporary directory}"
export LIVE_BACKEND_URL="http://127.0.0.1:${UI_BACKEND_PORT:-4322}"
node --input-type=module <<'JS'
try {
  await fetch(process.env.LIVE_BACKEND_URL+'/api/utils/env',{signal:AbortSignal.timeout(500)});
} catch { process.exit(0); }
throw Error('The requested test port is already in use');
JS
mkdir -p "$UI_BACKEND_DATA"
sh tests/run-backend.sh > "$UI_BACKEND_DATA/backend.log" 2>&1 &
ui_backend_pid=$!
trap 'kill "$ui_backend_pid" 2>/dev/null || true' EXIT INT TERM
node --input-type=module <<'JS'
for (let attempt=0; attempt<80; attempt++) {
  try {
    const response=await fetch(process.env.LIVE_BACKEND_URL+'/api/utils/env');
    if(response.ok)process.exit(0);
  } catch {}
  await new Promise(resolve=>setTimeout(resolve,250));
}
throw Error('The isolated backend did not start');
JS
node tests/seed-live.mjs
pnpm exec playwright test tests/live.spec.ts --project chromium --workers=1

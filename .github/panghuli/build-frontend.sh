#!/bin/sh
set -eu
. .github/panghuli/frontend.env
source_version=$(node -p "require('./web/package.json').version")
if [ "$source_version" != "$FRONTEND_VERSION" ]; then
  printf '%s\n' 'Update web/ from the pinned upstream release before building.' >&2
  exit 1
fi
pnpm --dir web install --frozen-lockfile
pnpm --dir web build
node --input-type=module <<'JS'
import { cpSync, rmSync } from 'node:fs';
rmSync('frontend', { recursive: true, force: true });
cpSync('web/dist', 'frontend', { recursive: true });
JS
printf 'FRONTEND_VERSION=%s\n' "${FRONTEND_VERSION}" >> "${GITHUB_ENV:-/dev/null}"

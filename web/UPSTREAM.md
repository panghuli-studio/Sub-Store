# Frontend source

This directory contains Sub-Store-Front-End 2.34.4, commit `4d94748b80c2bb946569636a9abc22016f8dcb05`, from https://github.com/sub-store-org/Sub-Store-Front-End, under GPL-3.0 (`LICENSE`).

The existing API clients, stores, editors, processing actions and settings remain the functional implementation. The approved visual reference is `../docs/design/mockups/`; its demonstration data layer is not used here.

## Build

`pnpm install --frozen-lockfile && pnpm build` produces `dist/`. The shared `.github/panghuli/build-frontend.sh` copies this build to the image's `frontend/` directory. CI and release use the same build script.

The packaged frontend defaults to its own serving origin rather than a public third-party API. Explicit `VITE_API_URL`, saved backends and URL `api`/`magicpath` configuration retain precedence. Set the backend's `SUB_STORE_CORS_ALLOWED_ORIGINS` to the actual serving origin when serving the merged application.

## Updating upstream

Update the vendored source and lockfile together with `FRONTEND_VERSION`. The shared build script rejects a version mismatch, so an archive-only update from the upstream watcher cannot silently package the previous source. Reapply the reviewed UI changes and run the design and functional checks before accepting an update.

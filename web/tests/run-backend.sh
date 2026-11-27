#!/bin/sh
set -eu
: "${UI_BACKEND_DATA:?Set UI_BACKEND_DATA to an isolated temporary directory}"
export SUB_STORE_BACKEND_API_HOST=127.0.0.1
export SUB_STORE_BACKEND_API_PORT="${UI_BACKEND_PORT:-4322}"
export SUB_STORE_DATA_BASE_PATH="$UI_BACKEND_DATA"
export SUB_STORE_BACKEND_MERGE=true
export SUB_STORE_FRONTEND_BACKEND_PATH=/
export SUB_STORE_FRONTEND_PATH="$(pwd)/dist"
export SUB_STORE_CORS_ALLOWED_ORIGINS="${UI_TEST_ORIGIN:-http://127.0.0.1:$SUB_STORE_BACKEND_API_PORT}"
exec node ../backend/dist/sub-store.bundle.js

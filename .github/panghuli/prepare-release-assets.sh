#!/bin/sh
set -eu

test -s backend/dist/sub-store.bundle.js
test -s frontend/index.html
test -s frontend/index.js

cp backend/dist/sub-store.bundle.js sub-store.bundle.js
rm -f frontend.zip
(cd frontend && zip -qr ../frontend.zip .)
unzip -tqq frontend.zip
sha256sum sub-store.bundle.js frontend.zip > checksums.txt
sha256sum -c checksums.txt

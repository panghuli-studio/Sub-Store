#!/bin/sh
# Downloads DB-IP IP to City Lite (CC BY 4.0, https://db-ip.com) into dbip/ so the image ships
# a geo database and deployments need no internet access at startup. DB-IP publishes it at the
# start of each month; early in a month the new file may not exist yet, so fall back to last month.
# Prints DBIP_VERSION=<yyyy-mm> for $GITHUB_ENV.
set -eu
out=dbip/dbip-city-lite.mmdb
mkdir -p dbip
now=$(date -u +%s)
for m in "$(date -u -d "@$now" +%Y-%m)" "$(date -u -d "@$((now - 2592000))" +%Y-%m)"; do
  if curl -fsSL --retry 3 --max-time 600 "https://download.db-ip.com/free/dbip-city-lite-${m}.mmdb.gz" \
      | gunzip > "$out.new" && [ -s "$out.new" ]; then
    # MaxMind DB metadata sits at the end of the file and names the database type.
    tail -c 200000 "$out.new" | grep -aq 'DBIP-City-Lite' || { echo "not a DB-IP City Lite mmdb" >&2; exit 1; }
    [ "$(wc -c < "$out.new")" -gt 50000000 ] || { echo "mmdb suspiciously small" >&2; exit 1; }
    mv "$out.new" "$out"
    echo "DBIP_VERSION=${m}"
    exit 0
  fi
done
echo "could not download DB-IP City Lite" >&2
exit 1

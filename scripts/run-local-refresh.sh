#!/bin/bash
# launchd tarafından periyodik çağrılır. cnnturk/atv/nowtv'yi bu ağdan (TV ile
# aynı IP) yeniler ve overrides.json değişikliğini GitHub'a gönderir.
set -e
cd "$(dirname "$0")/.."

git pull --rebase origin main --quiet

/usr/local/bin/node scripts/refresh-ip-locked.js || /opt/homebrew/bin/node scripts/refresh-ip-locked.js

if ! git diff --quiet -- overrides.json; then
  git add overrides.json
  git commit -m "Yerel IP-kilitli kanal yenilemesi (cnnturk/atv/nowtv)" --quiet
  git push --quiet
  echo "$(date): pushed changes"
else
  echo "$(date): no changes"
fi

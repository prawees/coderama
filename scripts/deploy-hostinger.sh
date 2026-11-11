#!/usr/bin/env bash
# Builds Code Rama for its own domain and uploads it to Hostinger over SSH with a key (no password).
#   1. cp .deploy.env.example .deploy.env and fill it in (it is not committed)
#   2. scripts/deploy-hostinger.sh            (add --dry-run to see what would change)
set -euo pipefail
cd "$(dirname "$0")/.."
[ -f .deploy.env ] || { echo "Missing .deploy.env, copy .deploy.env.example first"; exit 1; }
# shellcheck disable=SC1091
source .deploy.env
: "${HOSTINGER_HOST:?set in .deploy.env}" "${HOSTINGER_PORT:?}" "${HOSTINGER_USER:?}" "${HOSTINGER_PATH:?}" "${SITE_URL:?}"
KEY="${HOSTINGER_KEY:-$HOME/.ssh/coderama_hostinger}"
DRY=""; [ "${1:-}" = "--dry-run" ] && DRY="--dry-run"

echo "== checks"
npx tsc --noEmit
npm run validate | grep -E "error\(s\)|problem\(s\)"

echo "== build for $SITE_URL"
rm -rf out
NEXT_PUBLIC_SHARE_URL="${SITE_URL#https://}" npm run build >/dev/null
# Hashed build files never change, so browsers can keep them for a year
cat > out/_next/static/.htaccess <<'HT'
<IfModule mod_headers.c>
  Header set Cache-Control "public, max-age=31536000, immutable"
</IfModule>
HT

SSH="ssh -i $KEY -p $HOSTINGER_PORT -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
# Uploading deletes whatever is not part of the game, so only ever upload into a folder that is empty
# (apart from Hostinger's default page) or one this script has filled before
echo "coderama" > out/.coderama-site
if ! $SSH "$HOSTINGER_USER@$HOSTINGER_HOST" "cd '$HOSTINGER_PATH' 2>/dev/null || exit 3; [ -f .coderama-site ] && exit 0; left=\$(ls -A | grep -v -x -e .well-known -e default.php -e index.html -e .htaccess | head -1); [ -z \"\$left\" ]"; then
  echo "Refusing to upload: $HOSTINGER_PATH is missing or holds files that are not Code Rama's. Check HOSTINGER_PATH."
  exit 1
fi

echo "== upload to $HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH"
rsync -az --delete $DRY --exclude ".well-known" -e "$SSH" out/ "$HOSTINGER_USER@$HOSTINGER_HOST:$HOSTINGER_PATH/"

[ -n "$DRY" ] && exit 0
echo "== live check"
for p in / /hub /cases /login /summary /simulator/play/case_01 /logo.png; do
  printf "%-28s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' "$SITE_URL$p")"
done

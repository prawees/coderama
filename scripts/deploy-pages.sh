#!/usr/bin/env bash
# Builds the static export for GitHub Pages and pushes it to the gh-pages branch.
# One-time setup on GitHub: Settings > Pages > Build and deployment > Source: Deploy from a branch,
# Branch: gh-pages, folder: / (root). The game is then served at https://<user>.github.io/coderama/
set -euo pipefail
cd "$(dirname "$0")/.."
REPO_NAME="${PAGES_REPO_NAME:-coderama}"
rm -rf out-pages
NEXT_PUBLIC_BASE_PATH="/$REPO_NAME" npx next build
mv out out-pages
touch out-pages/.nojekyll   # without this, Pages drops the _next folder
SHA="$(git rev-parse --short HEAD)"
TMP="$(mktemp -d)"
cp -r out-pages/. "$TMP"
cd "$TMP"
git init -q -b gh-pages
git add -A
git -c user.name="$(git -C "$OLDPWD" config user.name || echo deploy)" -c user.email="$(git -C "$OLDPWD" config user.email || echo deploy@localhost)" \
  commit -q -m "Deploy $SHA to GitHub Pages"
git push -q -f "$(git -C "$OLDPWD" remote get-url origin)" gh-pages
echo "Pushed $SHA to gh-pages"

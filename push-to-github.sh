#!/usr/bin/env bash
# push-to-github.sh — One-time helper to push hermosskills-site to a new GitHub repo.
#
# Run this from YOUR machine (not the VPS — the VPS doesn't have gh auth).
# It assumes you have gh CLI authed, OR you've created the empty repo on
# GitHub and are using SSH / a personal access token.
#
# Steps you do manually first:
#   1. On GitHub, create an empty repo named `hermosskills-site` under your user
#      (or `Pdbjork/hermosskills-site` per the naming brainstorm).
#      - Visibility: your call. Public = OpenClaw discovery. Private = safer.
#   2. Clone this repo locally OR add the remote via either:
#        gh repo create Pdbjork/hermosskills-site --public --source=. --remote=origin --push
#      OR (without gh):
#        git remote add origin git@github.com:Pdbjork/hermosskills-site.git
#        git push -u origin main
#
# This script does the remote-add + push using gh if available, else falls back
# to a provided remote URL via HERMOSSKILLS_REMOTE_URL env var.
set -euo pipefail

cd "$(dirname "$0")"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "not a git repo: $(pwd)" >&2
  exit 1
fi

if git remote get-url origin >/dev/null 2>&1; then
  echo "origin already set: $(git remote get-url origin)"
  echo "push attempt:"
  git push -u origin main
  exit 0
fi

if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
  echo "gh auth detected, creating repo..."
  gh repo create Pdbjork/hermosskills-site --public --source=. --remote=origin --push
  exit 0
fi

if [[ -n "${HERMOSSKILLS_REMOTE_URL:-}" ]]; then
  echo "using HERMOSSKILLS_REMOTE_URL=$HERMOSSKILLS_REMOTE_URL"
  git remote add origin "$HERMOSSKILLS_REMOTE_URL"
  git push -u origin main
  exit 0
fi

cat >&2 <<'EOF'
No git remote configured and gh isn't authed here.

Pick one:
  A) Auth gh on this machine:  gh auth login
     then re-run this script.

  B) Set a remote URL explicitly:
     export HERMOSSKILLS_REMOTE_URL=git@github.com:Pdbjork/hermosskills-site.git
     ./push-to-github.sh

  C) Push from your laptop instead — clone the repo or rsync it locally first.
EOF
exit 1
#!/usr/bin/env bash
# build-skills.sh — Mirror charter SKILL.md files from ~/.hermes/skills/business/
# into the hermosskills-site/skills/{slug}/ tree, and copy the per-skill API JSON.
#
# Idempotent. Safe to re-run. Run from anywhere.
set -euo pipefail

REPO="/root/repos/hermosskills-site"
SRC="/root/.hermes/skills"
CATALOG="$REPO/data/skills.json"

if [[ ! -f "$CATALOG" ]]; then
  echo "missing $CATALOG" >&2
  exit 1
fi

mkdir -p "$REPO/skills" "$REPO/catalog/v1/skills"

# Mirror SKILL.md from local hermes skills dir. Walks top-level dirs in $SRC
# AND the business/ subdir so we capture charter skills and class-level skills
# (like dogfood) used on the homepage.
mirrored=0
for dir in "$SRC"/*/ "$SRC"/business/*/; do
  slug="$(basename "$dir")"
  [[ "$slug" == "business" ]] && continue  # skip the parent business/ itself
  if [[ -f "$dir/SKILL.md" ]]; then
    mkdir -p "$REPO/skills/$slug"
    cp "$dir/SKILL.md" "$REPO/skills/$slug/SKILL.md"
    echo "mirrored $slug/SKILL.md"
    mirrored=$((mirrored+1))
  fi
done
echo "$mirrored skills mirrored"

# Per-skill API JSON (one endpoint per skill, returned as application/json).
python3 - "$CATALOG" "$REPO/catalog/v1/skills" <<'PY'
import json, sys, os
catalog_path, out_dir = sys.argv[1], sys.argv[2]
with open(catalog_path) as f:
    catalog = json.load(f)
os.makedirs(out_dir, exist_ok=True)
for skill in catalog["skills"]:
    slug = skill["id"]
    with open(f"{out_dir}/{slug}.json", "w") as out:
        json.dump({"success": True, "skill": skill}, out, indent=2)
    print(f"wrote {out_dir}/{slug}.json")
PY

echo "build-skills.sh: done"
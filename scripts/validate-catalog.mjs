import { existsSync, readFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import process from "node:process";

const root = process.cwd();

function readJson(path) {
  return JSON.parse(readFileSync(resolve(root, path), "utf8"));
}

function requireFile(path) {
  const absolute = resolve(root, path);
  if (!existsSync(absolute)) {
    throw new Error(`Missing expected catalog file: ${relative(root, absolute)}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const dataCatalog = readJson("data/skills.json");
const publicCatalog = readJson("catalog/v1/skills.json");
const openclawManifest = readJson(".well-known/openclaw.json");
const skillsIndex = readFileSync(resolve(root, "skills/index.html"), "utf8");

assert(Array.isArray(dataCatalog.skills), "data/skills.json must expose a skills array.");
assert(Array.isArray(publicCatalog.skills), "catalog/v1/skills.json must expose a skills array.");

const dataIds = dataCatalog.skills.map((skill) => skill.id);
const publicIds = publicCatalog.skills.map((skill) => skill.id);
const uniqueIds = new Set(dataIds);
const expectedCount = dataIds.length;

assert(uniqueIds.size === expectedCount, "Skill ids must be unique.");
assert(
  JSON.stringify(dataIds) === JSON.stringify(publicIds),
  "data/skills.json and catalog/v1/skills.json must list skills in the same order.",
);
assert(
  openclawManifest.surfaces.curated_charter.count === expectedCount,
  "OpenClaw curated_charter.count must match the catalog skill count.",
);

const articleCount = (skillsIndex.match(/<article class="skill">/g) ?? []).length;
assert(articleCount === expectedCount, "skills/index.html card count must match the catalog.");

for (const skill of dataCatalog.skills) {
  assert(skill.id === skill.name, `${skill.id} must keep name aligned with id.`);
  assert(skill.id === skill.identifier, `${skill.id} must keep identifier aligned with id.`);
  assert(skill.homepage.endsWith(`/skills/${skill.id}/`), `${skill.id} homepage must match id.`);
  assert(skill.skill_md.endsWith(`/skills/${skill.id}/SKILL.md`), `${skill.id} skill_md must match id.`);

  requireFile(`skills/${skill.id}/SKILL.md`);
  requireFile(`skills/${skill.id}/index.html`);

  const detailPath = `catalog/v1/skills/${skill.id}.json`;
  requireFile(detailPath);
  const detail = readJson(detailPath);
  assert(detail.success === true, `${detailPath} must use a success wrapper.`);
  assert(detail.skill?.id === skill.id, `${detailPath} must match its skill id.`);
}

console.log(`Catalog validation passed for ${expectedCount} skills.`);

import { readFile } from "node:fs/promises";

const FILE = new URL("../public/data/articles.json", import.meta.url);
const REPLACEMENT = /�/;            // mojibake guard (RULES §9)
const PLACEHOLDER = /\[占位\]|TODO|TBD/;

function fail(msg) { console.error(`articles.json validation failed: ${msg}`); process.exit(1); }

const data = JSON.parse(await readFile(FILE, "utf8"));
if (!data || typeof data.generatedAt !== "string") fail("missing generatedAt");
if (!Array.isArray(data.papers)) fail("papers must be an array");

for (const [i, p] of data.papers.entries()) {
  const where = `papers[${i}] (${p?.id ?? "?"})`;
  for (const f of ["id","title","authors","venue","sourceName","sourceUrl","verifiedAt","leadJudgment"]) {
    if (typeof p?.[f] !== "string" || !p[f]) fail(`${where}: missing ${f}`);
  }
  if (!["light","deep"].includes(p.tier)) fail(`${where}: tier must be light|deep`);
  if (!Array.isArray(p.sections) || p.sections.length === 0) fail(`${where}: sections empty`);
  for (const [j, s] of p.sections.entries()) {
    if (typeof s?.heading !== "string" || !s.heading) fail(`${where}.sections[${j}]: missing heading`);
    if (typeof s?.summary !== "string" || !s.summary) fail(`${where}.sections[${j}]: missing summary`);
  }
  if (typeof p?.limitsAndFuture?.paperStated !== "string") fail(`${where}: limitsAndFuture.paperStated`);
  if (typeof p?.limitsAndFuture?.evidenceNotes !== "string") fail(`${where}: limitsAndFuture.evidenceNotes`);
  if (!p?.provenance?.sourceUrl) fail(`${where}: provenance.sourceUrl`);
  const blob = JSON.stringify(p);
  if (REPLACEMENT.test(blob)) fail(`${where}: mojibake (U+FFFD)`);
  if (PLACEHOLDER.test(blob)) fail(`${where}: placeholder text`);
}
console.log(`articles.json validation passed (${data.papers.length} papers)`);

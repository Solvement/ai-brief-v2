import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

const ROOT = process.cwd();
const SCORE_AXES = [
  "准确性",
  "证据引用",
  "边界意识",
  "幻觉率",
  "可验证实验",
];

async function readYamlFile(file) {
  const text = await readFile(file, "utf8");
  return { text, data: parseYaml(text) ?? {} };
}

async function listYamlFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && /\.ya?ml$/i.test(entry.name))
      .map((entry) => path.join(dir, entry.name))
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

export async function findObjectBySlug(slug, { root = ROOT } = {}) {
  const objectsDir = path.join(root, "data", "knowledge-graph", "objects");
  for (const file of await listYamlFiles(objectsDir)) {
    const object = await readYamlFile(file);
    if (object.data?.slug === slug || path.basename(file, path.extname(file)) === slug) {
      return { ...object, file };
    }
  }
  return null;
}

function renderQuestions(questions) {
  return questions.map((question, index) => {
    const expected = Array.isArray(question.expected_points) && question.expected_points.length
      ? question.expected_points.map((point) => `   - ${point}`).join("\n")
      : "   - （评卷 agent 根据对象库与原文证据判定）";
    return [
      `${index + 1}. [${question.type || "unknown"}] ${question.q || ""}`,
      "   Expected points:",
      expected,
      `   Tested objects: ${(Array.isArray(question.tested_objects) ? question.tested_objects : []).join(", ") || "未标注"}`,
    ].join("\n");
  }).join("\n\n");
}

function renderScoreAxes() {
  return SCORE_AXES.map((axis) => `- ${axis}: 1-5 分；必须写一句理由。`).join("\n");
}

function renderPaper({ condition, slug, object, objectYaml }) {
  const questions = Array.isArray(object.exam_questions) ? object.exam_questions : [];
  const context = condition === "A"
    ? [
      `Title: ${object.title || ""}`,
      `One-sentence thesis: ${object.one_sentence_thesis || ""}`,
    ].join("\n")
    : ["```yaml", objectYaml.trimEnd(), "```"].join("\n");

  return [
    `# ROS Blind Test ${slug} · Condition ${condition}`,
    "",
    condition === "A"
      ? "Condition A: only title and one_sentence_thesis are provided."
      : "Condition B: the full Research Object YAML is provided.",
    "",
    "## Context",
    "",
    context,
    "",
    "## Questions",
    "",
    renderQuestions(questions),
    "",
    "## Scoring Axes",
    "",
    renderScoreAxes(),
    "",
    "## Reviewer Notes",
    "",
    "- Do not auto-score with this script; an independent reviewer fills scores and rationale.",
    "- Penalize unsupported source claims and over-generalization beyond the provided evidence.",
    "",
  ].join("\n");
}

export async function writeBlindtest(slug, { root = ROOT, outDir = path.join(ROOT, ".agent", "blindtest") } = {}) {
  const found = await findObjectBySlug(slug, { root });
  if (!found) throw new Error(`object not found for slug: ${slug}`);
  if (!Array.isArray(found.data.exam_questions) || found.data.exam_questions.length === 0) {
    throw new Error(`object ${slug} has no exam_questions`);
  }

  await mkdir(outDir, { recursive: true });
  const aFile = path.join(outDir, `${slug}-A.md`);
  const bFile = path.join(outDir, `${slug}-B.md`);
  await writeFile(aFile, renderPaper({ condition: "A", slug, object: found.data, objectYaml: found.text }), "utf8");
  await writeFile(bFile, renderPaper({ condition: "B", slug, object: found.data, objectYaml: found.text }), "utf8");
  return { aFile, bFile, questions: found.data.exam_questions.length };
}

function parseArgs(argv) {
  const slug = argv.find((arg) => !arg.startsWith("--"));
  return {
    slug,
    root: argv.find((arg) => arg.startsWith("--root="))?.slice("--root=".length) || ROOT,
    outDir: argv.find((arg) => arg.startsWith("--out-dir="))?.slice("--out-dir=".length),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const options = parseArgs(process.argv.slice(2));
  if (!options.slug) {
    process.stderr.write("Usage: node scripts/kg/exam-blindtest.mjs <slug>\n");
    process.exit(1);
  }
  const result = await writeBlindtest(options.slug, {
    root: options.root,
    outDir: options.outDir || path.join(ROOT, ".agent", "blindtest"),
  });
  process.stdout.write(`WROTE ${result.questions} questions: ${result.aFile}, ${result.bFile}\n`);
}

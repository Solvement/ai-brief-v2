import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { buildBriefData } from "../../brief/build.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_WIKI_ROOT = "brief-wiki";

export function isBriefWikiProjectPipeline(options = {}) {
  return Boolean(options.projectBriefWiki || options.briefWikiDaily || options.dailyDeepDive);
}

export function isProjectAlreadyDeepDived(candidate, options = {}) {
  return isProjectCompletedDeepDive(candidate, options);
}

export function isProjectCompletedDeepDive(candidate, options = {}) {
  const candidateId = candidate?.id || candidate?.candidateId || candidate?.candidate_id;
  if (!candidateId || typeof options.db?.listAnalyses !== "function") return false;
  return options.db
    .listAnalyses(candidateId)
    .filter((analysis) => analysis.tier === "brief-wiki")
    .some((analysis) => isBriefWikiAnalysisCompleted(analysis));
}

export function isBriefWikiAnalysisCompleted(analysis = {}) {
  const payload = analysis?.payload || analysis;
  return tierTemplateHasAuthoredBody(tierTemplateFromBriefWikiPayload(payload));
}

export function tierTemplateFromBriefWikiPayload(briefWiki = {}) {
  if (!briefWiki || typeof briefWiki !== "object") return null;
  const direct = briefWiki.tier_template || briefWiki.tierTemplate;
  if (direct && typeof direct === "object") return normalizeAuthoredTierTemplate(direct);

  const rawPayloadPath = briefWiki.rawPayload && path.resolve(ROOT, briefWiki.rawPayload);
  if (rawPayloadPath) {
    try {
      const raw = JSON.parse(readFileSync(rawPayloadPath, "utf8"));
      const template = normalizeAuthoredTierTemplate(raw.tier_template || raw.tierTemplate || raw.light_spine || raw.lightSpine);
      if (template) return template;
    } catch {
      // Older brief-wiki rows can point at ephemeral codex logs that are not
      // retained. Fall through to the durable markdown mirror below.
    }
  }

  for (const filePath of deepDiveMarkdownCandidates(briefWiki)) {
    try {
      const meta = parseMarkdownFrontmatter(readFileSync(filePath, "utf8"));
      const template = normalizeAuthoredTierTemplate(meta.tier_template || meta.tierTemplate || meta.light_spine || meta.lightSpine);
      if (template) return template;
    } catch {
      // Try the next durable path.
    }
  }

  return null;
}

export function normalizeAuthoredTierTemplate(template = {}) {
  if (!template || typeof template !== "object") return null;
  const comparison = sectionText(template.comparison);
  const howItWorks = cleanTemplateText(
    template.how_it_works_with_analogy
    || template.howItWorksWithAnalogy
    || sectionText(template.how_it_works)
  );
  const reusable = reusableTemplateText(template.reusable_abstractions);
  const practitioner = cleanTemplateText(
    template.practitioner_meaning
    || template.practitionerMeaning
    || sectionText(template.judgment)
  );
  const painPoint = cleanTemplateText(
    template.pain_point
    || template.painPoint
    || sectionText(template.why_worth_attention)
  );
  return {
    ...template,
    comparison: cleanTemplateText(comparison),
    how_it_works_with_analogy: howItWorks,
    essential_design_difference: cleanTemplateText(
      template.essential_design_difference
      || template.essentialDesignDifference
      || reusable
    ),
    practitioner_meaning: practitioner,
    pain_point: painPoint,
  };
}

/** No-fabrication sentinels the deterministic stub emits when it has nothing real. */
const DEEP_BODY_SENTINELS = ["数据不足", "官方未披露"];

/** True iff `s` is real authored prose (not empty / not just a sentinel). */
export function isAuthoredText(s) {
  if (typeof s !== "string") return false;
  const t = s.trim();
  if (!t) return false;
  return !DEEP_BODY_SENTINELS.some((sentinel) => t === sentinel || t.startsWith(sentinel));
}

/**
 * The Tier 2/3 narrative fields the deep-dive renderer reads. If ANY of them
 * holds authored prose, the tier_template is a real deep-dive, not the stub.
 */
export function tierTemplateHasAuthoredBody(tpl) {
  if (!tpl || typeof tpl !== "object") return false;
  const narrativeFields = [
    tpl.pain_point,
    tpl.comparison,
    tpl.how_it_works_with_analogy,
    tpl.essential_design_difference,
    tpl.practitioner_meaning,
  ];
  return narrativeFields.some(isAuthoredText);
}

export async function runProjectBriefWikiGuard({ options = {}, logger = console } = {}) {
  const lint = await runBriefLintGuard({ wikiRoot: wikiRoot(options), logger });
  const reviewer = await runReviewerLayerBGuard({ options, logger });
  return {
    verdict: "pass",
    lint,
    reviewer,
  };
}

export async function runBriefLintGuard({ wikiRoot: wikiRootInput = DEFAULT_WIKI_ROOT, logger = console } = {}) {
  const relativeWikiRoot = relativeToRoot(wikiRootInput);
  const result = await spawnProcess(process.execPath, ["scripts/brief/lint.mjs", relativeWikiRoot], { cwd: ROOT });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  const summary = parseBriefLintSummary(output);

  if (summary.missingSummary) {
    const suffix = output.trim() ? `: ${lastLine(output)}` : "";
    throw new Error(`brief:lint summary not found${suffix}`);
  }

  if (summary.red > 0) {
    throw new Error(`brief:lint failed with RED ${summary.red} issue(s); brief mirror publish blocked`);
  }

  if (result.code !== 0) {
    const suffix = output.trim() ? `: ${lastLine(output)}` : "";
    throw new Error(`brief:lint exited ${result.code}${suffix}`);
  }

  logger?.info?.(`brief:lint passed RED ${summary.red}, YELLOW ${summary.yellow}, BLUE ${summary.blue}`);
  return {
    ...summary,
    code: result.code,
  };
}

export async function publishBriefMirror({ options = {}, logger = console } = {}) {
  const index = await buildBriefData(relativeToRoot(wikiRoot(options)));
  logger?.info?.(`brief:build refreshed ${Object.keys(index.outputs || {}).length} brief output(s)`);
  return index;
}

export async function runReviewerLayerBGuard() {
  // TODO(project-merge P4): add the reviewer/layer-B groundedness guard for brief-wiki project deep-dives.
  return {
    verdict: "skipped",
    reason: "reviewer layer-B is not wired yet",
  };
}

export function parseBriefLintSummary(output) {
  const match = String(output || "").match(/Summary:\s*RED\s+(\d+),\s*YELLOW\s+(\d+),\s*BLUE\s+(\d+)/i);
  if (!match) {
    return {
      red: 0,
      yellow: 0,
      blue: 0,
      missingSummary: true,
    };
  }
  return {
    red: Number(match[1]) || 0,
    yellow: Number(match[2]) || 0,
    blue: Number(match[3]) || 0,
    missingSummary: false,
  };
}

function spawnProcess(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      ...options,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      resolve({ code, stdout, stderr });
    });
  });
}

function sectionText(value) {
  if (typeof value === "string") {
    const structured = parseJsonObject(value);
    if (structured) return sectionText(structured);
    return value;
  }
  if (!value || typeof value !== "object") return "";
  return cleanTemplateText(value.body_md || value.summary || "");
}

function reusableTemplateText(section = {}) {
  const body = sectionText(section);
  const items = asArray(section?.items).map((item) => {
    if (typeof item === "string") return cleanTemplateText(item);
    const name = cleanTemplateText(item?.name || "");
    const copy = cleanTemplateText(item?.copy || "");
    const skip = cleanTemplateText(item?.skip || "");
    const why = cleanTemplateText(item?.why_it_matters || item?.whyItMatters || "");
    return [name, copy, skip, why].filter(Boolean).join("；");
  }).filter(Boolean);
  return [body, ...items.map((item) => `- ${item}`)].filter(Boolean).join("\n");
}

function cleanTemplateText(value) {
  return String(value || "").trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function deepDiveMarkdownCandidates(briefWiki = {}) {
  const paths = briefWiki.paths || {};
  return unique([
    ...Object.entries(paths)
      .filter(([key]) => String(key).replace(/\\/g, "/").includes("deep-dives/"))
      .map(([, value]) => value),
    briefWiki.entitySlugs?.deepDive
      ? path.join(ROOT, DEFAULT_WIKI_ROOT, "deep-dives", `${briefWiki.entitySlugs.deepDive}.md`)
      : null,
    briefWiki.slug
      ? path.join(ROOT, DEFAULT_WIKI_ROOT, "deep-dives", `${briefWiki.slug}-deep-dive.md`)
      : null,
  ].map(resolveExistingPath));
}

function resolveExistingPath(value) {
  if (!value) return "";
  return path.isAbsolute(String(value)) ? String(value) : path.resolve(ROOT, String(value));
}

function parseMarkdownFrontmatter(raw) {
  const normalized = String(raw || "").replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) return {};
  const parsed = YAML.parse(match[1]) ?? {};
  return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
}

function parseJsonObject(value) {
  const text = String(value || "").trim();
  if (!text.startsWith("{") || !text.endsWith("}")) return null;
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function wikiRoot(options = {}) {
  return options.wikiRoot || DEFAULT_WIKI_ROOT;
}

function relativeToRoot(value) {
  const resolved = path.resolve(ROOT, value || DEFAULT_WIKI_ROOT);
  return path.relative(ROOT, resolved) || ".";
}

function lastLine(value) {
  const lines = String(value || "").trim().split(/\r?\n/).filter(Boolean);
  return lines[lines.length - 1] || "";
}

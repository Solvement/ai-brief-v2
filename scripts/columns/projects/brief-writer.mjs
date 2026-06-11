import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeProjectMindPalace } from "./project-facet.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_WIKI_ROOT = path.join(ROOT, "brief-wiki");
const NOT_FOUND = "not_found";
const NOT_EXPLAINED = "未在 README/artifact 说明";
const LIGHT_SPINE_SCHEMA_VERSION = "project-light-spine/v1";

const PROJECT_TYPES = new Set(["ai_app", "agent_framework", "agent_skill", "devtool_cli", "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate", "non_ai_eng"]);
const PROJECT_VERDICTS = new Set(["skip", "watch", "L1", "deep_dive", "clone_and_run"]);
const EVIDENCE_STRENGTHS = new Set(["high", "medium", "low", "none"]);
const CONCEPT_MATURITY = new Set(["stable", "active", "emerging", "deprecated"]);
const ARTIFACT_TYPES = new Set(["repo", "dataset", "model", "benchmark", "demo", "prompt", "eval_code"]);
const ARTIFACT_STATUS = new Set(["available", "partial", "on_hold", "missing", "broken"]);
const ARTIFACT_OWNER = new Set(["official", "third_party", "referenced"]);
const RUNNABLE = new Set(["yes", "no", "unknown"]);
const REPRODUCIBILITY_STATUS = new Set(["reproducible", "code_available_but_heavy", "partial", "paper_only", "unverifiable"]);

export const PROJECT_TYPE_TO_SHAPE = {
  ai_app: "howto-use",
  agent_framework: "agent-build",
  agent_skill: "roadmap",
  devtool_cli: "howto-use",
  model_infra: "howto-use",
  frontend_ui: "howto-use",
  dataset_benchmark: "research-impl",
  library_sdk: "howto-use",
  template_boilerplate: "install",
  non_ai_eng: "howto-use",
};

export const PROJECT_TYPE_TO_PROJECT_KIND = {
  ai_app: "functional_software",
  agent_framework: "functional_software",
  agent_skill: "skill",
  devtool_cli: "functional_software",
  model_infra: "functional_software",
  frontend_ui: "functional_software",
  dataset_benchmark: "research",
  library_sdk: "functional_software",
  template_boilerplate: "skill",
  non_ai_eng: "functional_software",
};

const TECH_HEADING_LABELS = {
  ai_app: "ai app / wrapper 还是真工作流",
  agent_framework: "agent framework / agent 怎么跑起来",
  devtool_cli: "devtool / 工具怎么嵌进开发流",
  model_infra: "model infra / 性能成本部署怎么交代",
  frontend_ui: "frontend ui / 交互和状态怎么迁移",
  dataset_benchmark: "dataset-benchmark / 数据和评测怎么可信",
  library_sdk: "library-sdk / API 抽象怎么设计",
  template_boilerplate: "template / 脚手架覆盖什么",
  non_ai_eng: "non-ai engineering / 工程价值在哪里",
};

export async function writeProjectBriefWikiEntities({
  candidate,
  evidence,
  triage,
  deepDive,
  options = {},
  logger,
} = {}) {
  const wikiRoot = path.resolve(options.wikiRoot || DEFAULT_WIKI_ROOT);
  const audit = artifactAuditFrom(evidence);
  const repo = normalizeRepo(candidate?.raw || candidate || {}, audit);
  const checkedDate = dateOnly(options.checkedDate || evidence?.fetchedAt || candidate?.discoveredAt || nowIso(options));
  const existingSlugs = await readExistingSlugs(wikiRoot);
  const existingContentSlugs = await readExistingContentSlugs(wikiRoot);

  const contentSlug = deriveSlug(repo, existingContentSlugs);
  existingSlugs.add(contentSlug);
  existingContentSlugs.add(contentSlug);
  const sourcePackSlug = reserveSlug(`${contentSlug}-source-pack`, existingSlugs);
  const evidencePackSlug = reserveSlug(`${contentSlug}-evidence-pack`, existingSlugs);
  const deepDiveSlug = reserveSlug(`${contentSlug}-deep-dive`, existingSlugs);
  const normalized = normalizeProjectDeepDive(deepDive, { repo, audit, evidence, triage, checkedDate });
  const concepts = normalizeConcepts(normalized.concepts, { contentSlug, repo, checkedDate, existingSlugs });
  const claim = normalizeClaim(normalized.claim_ledger[0], { contentSlug, concepts, repo, existingSlugs });
  const artifact = normalizeArtifact(normalized.artifact, { contentSlug, repo, audit, triage, checkedDate, existingSlugs });
  const context = {
    wikiRoot,
    logger,
    candidate,
    repo,
    audit,
    evidence,
    triage,
    checkedDate,
    contentSlug,
    sourcePackSlug,
    evidencePackSlug,
    deepDiveSlug,
    concepts,
    claim,
    artifact,
    deepDive: normalized,
  };

  const files = [
    ["content", `${contentSlug}.md`, renderContent(context)],
    ["source-packs", `${sourcePackSlug}.md`, renderSourcePack(context)],
    ["evidence-packs", `${evidencePackSlug}.md`, renderEvidencePack(context)],
    ["deep-dives", `${deepDiveSlug}.md`, renderDeepDive(context)],
    ...concepts.map((concept) => ["concepts", `${concept.slug}.md`, renderConcept(context, concept)]),
    ["claims", `${claim.slug}.md`, renderClaim(context, claim)],
    ["artifacts", `${artifact.slug}.md`, renderArtifact(context, artifact)],
  ];

  const written = {};
  for (const [dir, fileName, content] of files) {
    const absPath = path.join(wikiRoot, dir, fileName);
    await mkdir(path.dirname(absPath), { recursive: true });
    await writeFile(absPath, content, "utf8");
    written[`${dir}/${fileName}`] = absPath;
  }

  logger?.info?.(`project deep-dive wrote ${files.length} brief-wiki files for ${repo.fullName || contentSlug}`);

  return {
    slug: contentSlug,
    paths: written,
    entitySlugs: {
      content: contentSlug,
      sourcePack: sourcePackSlug,
      evidencePack: evidencePackSlug,
      deepDive: deepDiveSlug,
      concepts: concepts.map((concept) => concept.slug),
      claim: claim.slug,
      artifact: artifact.slug,
    },
  };
}

export function shapeForProjectType(projectType, triage = {}) {
  if (normalizeIntent(triage.intent) === "teaching") return "roadmap";
  return PROJECT_TYPE_TO_SHAPE[normalizeProjectType(projectType)] || "howto-use";
}

export function projectKindForProjectType(projectType, triage = {}) {
  if (normalizeIntent(triage.intent) === "teaching") return "teaching";
  return PROJECT_TYPE_TO_PROJECT_KIND[normalizeProjectType(projectType)] || "functional_software";
}

function renderContent(ctx) {
  const { repo, triage, checkedDate, contentSlug, sourcePackSlug, evidencePackSlug, deepDiveSlug, concepts, claim, artifact, deepDive } = ctx;
  const source = normalizeSource(repo, triage, ctx);
  const tags = normalizeTags([
    ...(triage?.tags || []),
    normalizeProjectType(deepDive.project_type),
    repo.language,
  ]);
  const frontmatter = compactObject({
    title: contentTitle(repo, contentSlug),
    slug: contentSlug,
    kind: "content",
    type: "project",
    source,
    url: repo.url || repo.auditUrl || NOT_FOUND,
    authors_or_creators: repo.owner ? [repo.owner] : [],
    date: repoDate(repo, ctx.audit),
    discovered_at: dateOnly(repo.discoveredAt || checkedDate),
    content_track: "FDE",
    status: "deep_dived",
    project_kind: projectKindForProjectType(deepDive.project_type, triage),
    tags,
    importance: importanceFromVerdict(deepDive.project_verdict),
    why_discovered: whyDiscovered(repo, triage, source),
    why_selected: whySelected(deepDive, triage),
    relation_to_existing_memory: concepts.length ? "extends_existing" : "creates_new_track",
  });

  const body = `## Summary

${deepDive.one_line_positioning}

## Pipeline
- [[source-packs/${sourcePackSlug}]]
- [[evidence-packs/${evidencePackSlug}]]
- [[deep-dives/${deepDiveSlug}]]

## Concepts
${concepts.map((concept) => `- [[concepts/${concept.slug}]]`).join("\n")}

## Claims
- [[claims/${claim.slug}]]

## Artifacts
- [[artifacts/${artifact.slug}]]`;

  return markdown(frontmatter, body);
}

function renderSourcePack(ctx) {
  const { contentSlug, repo, audit, evidence, checkedDate } = ctx;
  const missingSources = sourceMissingDetails(audit, evidence);
  const frontmatter = compactObject({
    content: contentSlug,
    kind: "source-pack",
    title: `${repo.name || contentSlug} — Source Pack`,
    fetched_materials: {
      repo: repo.url || audit.repo_url || NOT_FOUND,
      readme: evidence?.content ? `${repo.url || audit.repo_url || "repo"}#readme` : NOT_FOUND,
      release_notes: isFound(audit.latest_release_tag_name) ? cleanString(audit.latest_release_tag_name) : NOT_FOUND,
      docs: audit.has_docs === true ? "artifactAudit.has_docs=true" : NOT_FOUND,
      website: isFound(audit.homepage) ? cleanString(audit.homepage) : NOT_FOUND,
    },
    primary_sources: primarySources(repo, audit, evidence),
    discovery_sources: [ctx.triage?.provenance?.source || ctx.candidate?.source || normalizeSource(repo, ctx.triage, ctx)].filter(Boolean),
    source_reliability: sourceReliability(repo, evidence),
    missing_sources: missingSources,
    last_checked: checkedDate,
  });

  const body = `## Notes

一手来源只使用 GitHub repo README 与 artifactAudit。没有在 README/artifactAudit 中出现的信息不作为结论;缺失项记录为 ${NOT_FOUND} / ${NOT_EXPLAINED}。See [[content/${contentSlug}]]。`;

  return markdown(frontmatter, body);
}

function renderEvidencePack(ctx) {
  const { contentSlug, repo, audit, evidence, deepDive, artifact, claim } = ctx;
  const sourcePointer = sourcePointerForRepo(repo, audit);
  const frontmatter = compactObject({
    content: contentSlug,
    kind: "evidence-pack",
    title: `${repo.name || contentSlug} — Evidence Pack`,
    technical_objects: technicalObjectsForProject(deepDive, sourcePointer),
    pipeline_steps: evidencePipelineSteps(deepDive, audit),
    experiments: [],
    claims: [`[[claims/${claim.slug}]]`],
    artifacts: [`[[artifacts/${artifact.slug}]]`],
    metrics: auditMetrics(audit),
    baselines: [],
    failure_modes: deepDive.risks,
    missing_details: sourceMissingDetails(audit, evidence),
    source_pointers: [sourcePointer],
  });

  const body = `## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/${claim.slug}]],官方 artifact 落库为 [[artifacts/${artifact.slug}]]。See [[content/${contentSlug}]]。`;

  return markdown(frontmatter, body);
}

function renderDeepDive(ctx) {
  const { contentSlug, repo, audit, checkedDate, deepDive, concepts, claim } = ctx;
  const body = deepDive.tier_template
    ? renderTierTemplateDeepDiveBody({ contentSlug, deepDive, concepts, claim })
    : deepDive.light_spine
      ? renderLightSpineDeepDiveBody({ contentSlug, deepDive, concepts, claim })
      : renderLegacyDeepDiveBody({ contentSlug, audit, deepDive, concepts, claim });

  const renderWarnings = projectDeepDiveFaithfulnessWarnings({ body, unknowns: deepDive.unknowns });
  for (const warning of renderWarnings) {
    ctx.logger?.warn?.(`project deep-dive faithfulness warning ${repo.fullName || contentSlug}: ${warning}`);
  }

  const frontmatter = compactObject({
    content: contentSlug,
    kind: "deep-dive",
    schema_version: deepDive.schema_version,
    shape: shapeForProjectType(deepDive.project_type, ctx.triage),
    project_type: deepDive.project_type,
    title: `${repo.name || contentSlug} — 深度拆解`,
    tier_template: deepDive.tier_template,
    light_spine: deepDive.light_spine,
    authoring: deepDive.authoring,
    reasoning_trace: deepDive.reasoning_trace,
    mind_palace: deepDive.mind_palace,
    project_verdict: deepDive.project_verdict,
    next_actions: deepDive.next_actions,
    unknowns: deepDive.unknowns,
    builder_reuse: deepDive.builder_reuse,
    dependency_platform_risk: deepDive.dependency_platform_risk,
    claim_ledger: deepDive.claim_ledger,
    render_warnings: renderWarnings.length ? renderWarnings : undefined,
    artifact_audit: artifactAuditFrontmatter(repo, audit, deepDive, checkedDate),
  });

  return markdown(frontmatter, body);
}

function renderTierTemplateDeepDiveBody({ contentSlug, deepDive, concepts, claim }) {
  const template = deepDive.tier_template || {};
  const tier = Number(template.tier || 0);
  const conceptLinks = concepts.map((concept) => `[[concepts/${concept.slug}]]`).join("、");
  const tier2 = tier >= 2
    ? `\n\n## 解决什么痛点\n\n${formatNarrativeMarkdown(template.pain_point || "数据不足")}\n\n## 核心能力\n\n${formatBullets(template.core_capabilities || [], "数据不足")}\n\n## 怎么跑起来\n\n- 安装命令：${formatNarrativeText(template.how_to_run?.install_command || "数据不足")}\n- 最小可运行示例：${formatNarrativeText(template.how_to_run?.minimal_example || "数据不足")}\n\n## 成熟度信号\n\n${formatKeyValueTable(template.maturity_signals || {})}\n\n## 和同类的区别\n\n${formatNarrativeMarkdown(template.comparison || "数据不足")}\n\n## 轨迹备注\n\n${formatNarrativeMarkdown(template.trajectory_note || "数据不足")}`
    : "";
  const tier3 = tier >= 3
    ? `\n\n## 它怎么工作 + 类比\n\n${formatNarrativeMarkdown(template.how_it_works_with_analogy || "数据不足")}\n\n## 本质不同的设计取舍\n\n${formatNarrativeMarkdown(template.essential_design_difference || "数据不足")}\n\n## 对从业者意味着什么\n\n${formatNarrativeMarkdown(template.practitioner_meaning || "数据不足")}\n\n## 交叉链接\n\n${formatBullets(template.cross_links || [], "数据不足")}`
    : "";

  return `## ${formatNarrativeText(template.tag || `[Tier ${tier}｜${template.bucket || "数据不足"}]`)}

## 一句话定位

${formatNarrativeMarkdown(template.one_sentence_positioning || deepDive.one_line_positioning || NOT_EXPLAINED)}

## 干什么

${formatNarrativeMarkdown(template.what_it_does || NOT_EXPLAINED)}

## 元数据

${formatKeyValueTable(template.metadata || {})}

## 标签

${formatBullets(template.labels || [], "数据不足")}${tier2}${tier3}

可复用范式落库:${conceptLinks || NOT_EXPLAINED}。另见 [[content/${contentSlug}]]、[[claims/${claim.slug}]]。`;
}

function renderLegacyDeepDiveBody({ contentSlug, audit, deepDive, concepts, claim }) {
  const conceptLinks = concepts.map((concept) => `[[concepts/${concept.slug}]]`).join("、");
  const punchlineBlock = deepDive.one_line_punchline ? `\n\n> 一句话:${deepDive.one_line_punchline}` : "";
  return `## 大白话定位

**${formatNarrativeText(deepDive.one_line_positioning)}**${punchlineBlock}

## 为什么火

${formatWhyHot(deepDive.why_hot)}

## Artifact audit

${formatArtifactAuditTable(deepDive.artifact_audit_rows)}

一句话:**${formatNarrativeText(artifactAuditConclusion(audit), "artifactAudit")}**

## 技术拆解(${TECH_HEADING_LABELS[deepDive.project_type] || deepDive.project_type})

${formatNarrativeMarkdown(normalizeTechBreakdownMarkdown(deepDive.tech_breakdown_md))}

## 对我的价值

${formatValueTable(deepDive.value_to_us)}

## 如果我要造类似的东西

${formatBuilderReuse(deepDive.builder_reuse)}

## 依赖/平台风险场景

${formatDependencyPlatformRisk(deepDive.dependency_platform_risk)}

## 风险

${formatBullets(deepDive.risks)}

## 未知与待确认

${formatBullets(deepDive.unknowns, "README/artifact 未说明")}

## Memory card

\`\`\`text
${formatMemoryCard(deepDive.memory_card)}
\`\`\`

可复用范式落库:${conceptLinks || NOT_EXPLAINED}。另见 [[content/${contentSlug}]]、[[claims/${claim.slug}]]。`;
}

function renderLightSpineDeepDiveBody({ contentSlug, deepDive, concepts, claim }) {
  const spine = deepDive.light_spine || {};
  const conceptLinks = concepts.map((concept) => `[[concepts/${concept.slug}]]`).join("、");
  return `## 一句话

${formatSpineSection(spine.one_sentence, deepDive.one_line_positioning)}

## 为什么值得看

${formatSpineSection(spine.why_worth_attention, formatWhyHot(deepDive.why_hot))}

## 关键主张与证据

${formatSpineClaimTable(spine.key_claims_evidence?.items || deepDive.claim_ledger)}
${formatSpineOptionalBody(spine.key_claims_evidence)}

## 它怎么work

${formatSpineSection(spine.how_it_works, deepDive.tech_breakdown_md)}

## 复用什么抽象

${formatSpineSection(spine.reusable_abstractions, formatBuilderReuse(deepDive.builder_reuse))}

## 依赖平台风险

${formatSpineSection(spine.dependency_platform_risk, formatDependencyPlatformRisk(deepDive.dependency_platform_risk))}

## 未知与待确认

${formatSpineSection(spine.unknowns_to_confirm, formatBullets(deepDive.unknowns, "README/artifact 未说明"))}

## 判断

${formatSpineJudgment(spine.judgment || deepDive.project_verdict)}

可复用范式落库:${conceptLinks || NOT_EXPLAINED}。另见 [[content/${contentSlug}]]、[[claims/${claim.slug}]]。`;
}

function formatSpineSection(section = {}, fallback = NOT_EXPLAINED) {
  const body = sectionBody(section);
  if (body) return formatNarrativeMarkdown(body);
  if (Array.isArray(section.bullets) && section.bullets.length) return formatBullets(section.bullets);
  if (Array.isArray(section.items) && section.items.length) return formatSpineItems(section.items);
  return formatNarrativeMarkdown(fallback);
}

function formatSpineOptionalBody(section = {}) {
  const body = sectionBody(section);
  return body ? `\n\n${formatNarrativeMarkdown(body)}` : "";
}

function formatSpineItems(items = []) {
  const lines = asArray(items).map((item) => {
    if (typeof item === "string") return formatNarrativeText(item);
    const label = cleanString(item?.name || item?.pattern || item?.dependency || item?.claim || item?.item || item?.title || "");
    const body = cleanString(item?.body || item?.summary || item?.risk || item?.text || item?.value || "");
    return formatNarrativeText([label, body].filter(Boolean).join(": "));
  }).filter(Boolean);
  return lines.length ? lines.map((line) => `- ${line}`).join("\n") : `- ${NOT_EXPLAINED}`;
}

function formatKeyValueTable(value = {}) {
  const rows = Object.entries(value || {})
    .map(([key, item]) => [cleanString(key), cleanString(item)])
    .filter(([key]) => key);
  if (!rows.length) return "| 项 | 值 |\n| --- | --- |\n| 数据不足 | 数据不足 |";
  return [
    "| 项 | 值 |",
    "| --- | --- |",
    ...rows.map(([key, item]) => `| ${escapeTable(key)} | ${escapeTable(item || "数据不足")} |`),
  ].join("\n");
}

function formatSpineClaimTable(items = []) {
  const rows = asArray(items).map((entry) => ({
    claim: cleanString(entry?.claim || entry?.text || ""),
    plain: cleanString(entry?.plain_english || entry?.plainEnglish || entry?.claim || ""),
    source: cleanString(entry?.source || entry?.source_pointer || ""),
    attribution: normalizeAttribution(entry?.attribution || entry?.verification || entry?.source_type),
    strength: normalizeEvidenceStrength(entry?.evidence_strength || entry?.confidence),
  })).filter((entry) => entry.claim);

  if (!rows.length) return "| 主张 | 大白话 | 来源 | 归因 | 强度 |\n| --- | --- | --- | --- | --- |\n| 未知 | 未知 | README/artifact 未说明 | 自称 | none |";

  return [
    "| 主张 | 大白话 | 来源 | 归因 | 强度 |",
    "| --- | --- | --- | --- | --- |",
    ...rows.map((row) => `| ${escapeNarrativeCell(row.claim)} | ${escapeNarrativeCell(row.plain)} | ${escapeTable(row.source || NOT_EXPLAINED)} | ${escapeTable(row.attribution)} | ${escapeTable(row.strength)} |`),
  ].join("\n");
}

function formatSpineJudgment(judgment = {}) {
  const ratings = judgment.ratings || judgment;
  const action = cleanString(judgment.action || judgment.verdict || "");
  const body = sectionBody(judgment);
  const table = [
    "| 项 | 值 |",
    "| --- | --- |",
    `| action | ${escapeTable(action || normalizeVerdict(judgment.verdict || "deep_dive"))} |`,
    `| 相关度 | ${clampRating(ratings["相关度"] ?? ratings.relevance_to_ai_engineer ?? judgment.relevance_to_ai_engineer)}/5 |`,
    `| 工程深度 | ${clampRating(ratings["工程深度"] ?? ratings.engineering_depth ?? judgment.engineering_depth)}/5 |`,
    `| 复用价值 | ${clampRating(ratings["复用价值"] ?? ratings.reuse_value ?? judgment.reuse_value)}/5 |`,
    `| 成熟度 | ${clampRating(ratings["成熟度"] ?? ratings.maturity ?? judgment.maturity)}/5 |`,
  ].join("\n");
  return body ? `${table}\n\n${formatNarrativeMarkdown(body)}` : table;
}

const MAX_RENDER_WARNINGS = 12;
const HIGH_RISK_METRIC_RE = /(?:\d+\s*\/\s*\d+|\d+(?:\.\d+)?\s*(?:%|x|倍)|\d+\s*(?:个|种|项|家)\s*[\p{L}\p{N}\s._/-]{0,8}(?:平台|语言|模型|风险|模块|SDK)?|(?:10\+|十多)\s*(?:个|种|项)?\s*(?:平台|语言|模型|风险)?)/iu;
const HIGH_RISK_CONTEXT_RE = /覆盖|支持|benchmark|基准|性能|快|加速|提升|超过|优于|领先|最佳|最快|最高|最低|唯一|首个|全覆盖|完全覆盖|全面覆盖|OWASP|Top\s*\d+|SOTA|state-of-the-art|平台|语言|模型|风险|SDK/i;
const HIGH_RISK_SUPERLATIVE_RE = /(?:唯一|首个|最佳|最快|最高|最低|领先|全覆盖|完全覆盖|全面覆盖|state-of-the-art|SOTA)/i;
const SOURCE_MARKER_RE = /（来源[:：][^）]+）|来源[:：]|出处[:：]|README|artifactAudit|docs?\//i;
const CLAIM_ATTRIBUTION_RE = /(?:自称|声称|宣称|标称|README\s*(?:[^。；;，,]{0,12})?(?:称|写到|列出|显示|提到|说明)|(?:徽章|badge)\s*(?:[^。；;，,]{0,8})?(?:称|写到|列出|显示|提到)|文档\s*(?:称|写到|列出|显示|提到)|官方\s*(?:称|写到|列出|显示|提到))/i;
const UNKNOWN_ASSERTION_RE = /提供|通过|实现|负责|内置|采用|支持|运行|限制|封装|调用|执行|覆盖|包含|具备|形成|迁移|复制|可复用|自动|借鉴|学习/i;
const UNKNOWN_HEDGE_BEFORE_RE = /未在|未说明|未详述|未公开|未提供|未提及|未知|待确认|需确认|不保证|无法验证|不能确认|没有说明|不要把|跳过|skip|不直接复用|不应|不能|未确认/i;
const UNKNOWN_GENERIC_TERMS = new Set([
  "README",
  "artifact",
  "artifactAudit",
  "Agent",
  "agent",
  "项目",
  "平台",
  "功能",
  "能力",
  "内部",
  "具体",
  "实现",
  "机制",
  "流程",
  "策略",
  "说明",
  "质量",
  "范围",
  "结果",
  "数据",
  "指标",
  "状态",
]);

export function projectDeepDiveFaithfulnessWarnings({ body = "", unknowns = [] } = {}) {
  const warnings = [];
  const seen = new Set();
  const bodyText = String(body || "");

  for (const { line, lineNo } of auditLines(bodyText)) {
    if (!hasHighRiskClaim(line)) continue;
    if (!SOURCE_MARKER_RE.test(line)) {
      pushWarning(warnings, seen, `faithfulness.high_risk_source line ${lineNo}: ${clampText(line, 140)}`);
      continue;
    }
    if (!CLAIM_ATTRIBUTION_RE.test(line)) {
      pushWarning(warnings, seen, `faithfulness.high_risk_claim_attribution line ${lineNo}: ${clampText(line, 140)}`);
    }
  }

  const unknownBody = bodyBeforeUnknownsSection(bodyText);
  const unknownText = normalizeStringArray(unknowns).join(" ");
  const unknownTerms = extractUnknownTerms(unknowns);
  for (const { line, lineNo } of auditLines(unknownBody)) {
    if (unknownText.includes("特权环") && lineAssertsUnknownTerm(line, "特权环")) {
      pushWarning(warnings, seen, `faithfulness.unknown_assertion line ${lineNo} term "特权环": ${clampText(line, 140)}`);
      continue;
    }
    for (const term of unknownTerms) {
      if (!lineAssertsUnknownTerm(line, term)) continue;
      pushWarning(warnings, seen, `faithfulness.unknown_assertion line ${lineNo} term "${term}": ${clampText(line, 140)}`);
      break;
    }
  }

  return warnings.slice(0, MAX_RENDER_WARNINGS);
}

function hasHighRiskClaim(line) {
  const text = cleanString(line);
  if (!text) return false;
  return (HIGH_RISK_METRIC_RE.test(text) && HIGH_RISK_CONTEXT_RE.test(text))
    || HIGH_RISK_SUPERLATIVE_RE.test(text);
}

function auditLines(text) {
  return String(text || "")
    .split(/\r?\n/)
    .map((line, index) => ({ line: cleanString(line), lineNo: index + 1 }))
    .filter(({ line }) => (
      line
      && !/^```/.test(line)
      && !/^\|?\s*:?-{2,}:?\s*(?:\|\s*:?-{2,}:?\s*)*$/.test(line)
    ));
}

function bodyBeforeUnknownsSection(body) {
  const match = String(body || "").match(/^##\s+未知与待确认/m);
  return match ? String(body || "").slice(0, match.index) : String(body || "");
}

function extractUnknownTerms(unknowns) {
  const terms = new Set();
  for (const unknown of normalizeStringArray(unknowns)) {
    const text = unknown
      .replace(/（来源[:：][^）]+）/g, " ")
      .replace(/README\/artifact|artifactAudit|README|artifact|文档|仓库/g, " ")
      .replace(/未在[^。；;，,]*?说明/g, " ")
      .replace(/未说明|未详述|未公开|未提供|未提及|没有说明|未知|待确认|不详/g, " ");

    for (const match of text.matchAll(/[一二三四五六七八九十\d]+[个层]?[^\s，。；;]{0,4}特权环/g)) {
      addUnknownTerm(match[0], terms);
    }

    for (const chunk of text.split(/[，。；;：:（）()[\]【】]/)) {
      addUnknownTermVariants(chunk, terms);
    }
  }
  return [...terms].sort((left, right) => right.length - left.length).slice(0, 24);
}

function addUnknownTermVariants(chunk, terms) {
  const value = cleanString(chunk);
  if (!value) return;

  addUnknownTerm(value, terms);
  addUnknownTerm(value.replace(/^(?:执行)?沙箱/, ""), terms);
  const firstPossessiveIndex = value.indexOf("的");
  if (firstPossessiveIndex >= 0) {
    addUnknownTerm(value.slice(0, firstPossessiveIndex), terms);
    addUnknownTerm(value.slice(0, firstPossessiveIndex).replace(/^(?:执行)?沙箱/, ""), terms);
    addUnknownTerm(value.slice(firstPossessiveIndex + 1), terms);
  }

  for (const part of value.split(/[、/]|以及|和|与|及/)) {
    addUnknownTerm(part, terms);
    addUnknownTerm(part.replace(/^(?:执行)?沙箱/, ""), terms);
    const possessiveIndex = part.indexOf("的");
    if (possessiveIndex >= 0) {
      addUnknownTerm(part.slice(0, possessiveIndex), terms);
      addUnknownTerm(part.slice(0, possessiveIndex).replace(/^(?:执行)?沙箱/, ""), terms);
      addUnknownTerm(part.slice(possessiveIndex + 1), terms);
    }
  }
}

function addUnknownTerm(rawTerm, terms) {
  let term = cleanString(rawTerm)
    .replace(/（[^）]*）/g, " ")
    .replace(/[^\p{L}\p{N}\s._/-]+/gu, " ")
    .replace(/^[:：\s的]+|[:：\s的]+$/g, "")
    .replace(/^(?:其|内部|具体|项目|平台|功能|能力)\s*/g, "")
    .replace(/的(?:具体)?(?:能力|隔离机制|隔离能力|权限模型|实现细节|技术实现|实现方式|状态转换|异常处理|任务编排逻辑|调用参数|安全边界|质量|范围|结果|数据|指标|策略|流程|机制).*$/g, "")
    .replace(/(?:具体)?(?:能力|隔离机制|隔离能力|权限模型|实现细节|技术实现|实现方式|质量|范围|结果|数据|指标|流程|机制|策略)$/g, "");
  term = cleanString(term);
  if (!isSpecificUnknownTerm(term)) return;
  terms.add(term);
}

function isSpecificUnknownTerm(term) {
  if (!term || UNKNOWN_GENERIC_TERMS.has(term)) return false;
  const chineseLength = (term.match(/[\u4e00-\u9fff]/g) || []).length;
  const asciiLength = (term.match(/[A-Za-z0-9]/g) || []).length;
  return chineseLength >= 4 || asciiLength >= 3;
}

function lineAssertsUnknownTerm(line, term) {
  const index = indexOfTerm(line, term);
  if (index < 0) return false;
  const prefix = line.slice(Math.max(0, index - 32), index);
  if (UNKNOWN_HEDGE_BEFORE_RE.test(prefix)) return false;
  const local = line.slice(Math.max(0, index - 32), index + term.length + 90);
  return UNKNOWN_ASSERTION_RE.test(local);
}

function indexOfTerm(line, term) {
  const source = String(line || "");
  const needle = String(term || "");
  if (!needle) return -1;
  if (/^[\x00-\x7F]+$/.test(needle)) return source.toLowerCase().indexOf(needle.toLowerCase());
  return source.indexOf(needle);
}

function pushWarning(warnings, seen, warning) {
  if (seen.has(warning) || warnings.length >= MAX_RENDER_WARNINGS) return;
  seen.add(warning);
  warnings.push(warning);
}

function renderConcept(ctx, concept) {
  const frontmatter = compactObject({
    name: concept.name,
    slug: concept.slug,
    kind: "concept",
    tags: concept.tags,
    maturity: concept.maturity,
    first_seen_in: ctx.contentSlug,
    related_content: [ctx.contentSlug],
    related_concepts: concept.related_concepts || [],
    explanation: concept.explanation,
    examples: concept.examples,
    common_misunderstandings: concept.common_misunderstandings,
    open_questions: concept.open_questions,
  });

  const body = `## Explanation

${concept.explanation} 出处:${sourcePointerForRepo(ctx.repo, ctx.audit)}。See [[content/${ctx.contentSlug}]]。

## Supported by
- [[claims/${ctx.claim.slug}]]`;

  return markdown(frontmatter, body);
}

function renderClaim(ctx, claim) {
  const frontmatter = compactObject({
    text: claim.text,
    slug: claim.slug,
    kind: "claim",
    content: ctx.contentSlug,
    source_pointer: claim.source_pointer,
    evidence_strength: claim.evidence_strength,
    supports: claim.supports,
    contradicts: [],
    open_challenges: claim.open_challenges,
    status: claim.status,
  });

  const body = `## Claim

${claim.plain_english}

证据:${claim.supports_text || NOT_EXPLAINED}。边界:${claim.does_not_support || NOT_EXPLAINED}。风险:${claim.threat || NOT_EXPLAINED}。See [[content/${ctx.contentSlug}]]。`;

  return markdown(frontmatter, body);
}

function renderArtifact(ctx, artifact) {
  const frontmatter = compactObject({
    slug: artifact.slug,
    kind: "artifact",
    content: ctx.contentSlug,
    artifact_type: artifact.artifact_type,
    url: artifact.url,
    official_or_third_party: artifact.official_or_third_party,
    status: artifact.status,
    license: artifact.license,
    runnable: artifact.runnable,
    missing_parts: artifact.missing_parts,
    last_checked: artifact.last_checked,
  });

  const body = `## Artifact audit

${artifact.summary}

出处:${sourcePointerForRepo(ctx.repo, ctx.audit)}。See [[content/${ctx.contentSlug}]]。`;

  return markdown(frontmatter, body);
}

function normalizeProjectDeepDive(input = {}, { repo, audit, evidence, triage, checkedDate }) {
  const rawTierTemplate = input.tier_template || input.tierTemplate;
  const lightSpine = normalizeLightSpine(input.light_spine || input.lightSpine || rawTierTemplate, input);
  const tierTemplate = normalizeTierTemplate(rawTierTemplate, { repo, triage, lightSpine, input });
  const projectType = normalizeProjectType(input.project_type || input.project_verdict?.project_type || triage?.project_type);
  const projectVerdict = normalizeProjectVerdict(input.project_verdict || lightSpine?.judgment, triage);
  const risks = normalizeStringArray(input.risks).length
    ? normalizeStringArray(input.risks)
    : normalizeStringArray(lightSpine?.dependency_platform_risk?.items).length
      ? normalizeStringArray(lightSpine.dependency_platform_risk.items)
      : [projectVerdict.main_risk || NOT_EXPLAINED];
  const oneLinePositioning = cleanString(
    input.one_line_positioning
    || lightSpine?.one_sentence?.summary
    || lightSpine?.one_sentence?.body_md
    || triage?.tldr
    || repo.description
    || `${repo.fullName || "project"}: ${NOT_EXPLAINED}`,
  );
  const oneLinePunchline = normalizePunchline(input.one_line_punchline || input.punchline, oneLinePositioning);
  const claimLedger = normalizeClaimLedger(input.claim_ledger || lightSpine?.key_claims_evidence?.items, {
    repo,
    fallbackClaim: oneLinePositioning || triage?.tldr || repo.description || repo.fullName,
    fallbackRisk: risks[0],
  });
  const unknowns = normalizeUnknowns(input.unknowns || lightSpine?.unknowns_to_confirm?.items || input["未知与待确认"]);
  const builderReuse = demoteUnknownBuilderPatterns(
    normalizeBuilderReuse(input.builder_reuse || input.builderReuse || builderReuseFromLightSpine(lightSpine)),
    unknowns,
  );

  return {
    schema_version: input.schema_version || (lightSpine ? LIGHT_SPINE_SCHEMA_VERSION : undefined),
    tier_template: tierTemplate || undefined,
    light_spine: lightSpine || undefined,
    authoring: input.authoring || undefined,
    one_line_positioning: oneLinePositioning,
    one_line_punchline: oneLinePunchline,
    why_hot: normalizeWhyHot(input.why_hot || whyHotFromLightSpine(lightSpine), triage, repo, audit),
    artifact_audit_rows: normalizeArtifactRows(input.artifact_audit_rows, { audit, evidence }),
    tech_breakdown_md: normalizeTechBreakdownMarkdown(input.tech_breakdown_md || sectionBody(lightSpine?.how_it_works) || `${NOT_EXPLAINED}。只能确认 README/artifactAudit 中出现的项目类型:${projectType}。`),
    value_to_us: normalizeValueToUs(input.value_to_us),
    builder_reuse: builderReuse,
    dependency_platform_risk: normalizeDependencyPlatformRisk(input.dependency_platform_risk || input.dependencyPlatformRisk || dependencyRiskFromLightSpine(lightSpine)),
    unknowns,
    risks,
    next_actions: normalizeStringArray(input.next_actions).length ? normalizeStringArray(input.next_actions) : normalizeStringArray(lightSpine?.judgment?.action).length ? normalizeStringArray(lightSpine.judgment.action) : nextActionsFromVerdict(projectVerdict.verdict),
    memory_card: normalizeMemoryCard(input.memory_card, projectType),
    mind_palace: normalizeProjectMindPalace(input) || undefined,
    reasoning_trace: normalizeReasoningTrace(input.reasoning_trace, { repo, projectType, claimLedger, risks }),
    project_type: projectType,
    project_verdict: projectVerdict,
    claim_ledger: claimLedger,
    concepts: normalizeStringArray(input.concepts).length ? input.concepts : defaultConceptInputs(projectType, repo),
    artifact: input.artifact || {},
    checkedDate,
  };
}

function normalizeTierTemplate(input, { repo = {}, triage = {}, lightSpine = null, input: fullInput = {} } = {}) {
  if (!input || typeof input !== "object") return null;
  const tier = clampInt(Number(input.tier ?? triage.project_tier ?? triage.depth_decision?.project_tier ?? tierFromDepth(triage.final_depth || triage.depth_decision?.final_depth)), 0, 3);
  const bucket = cleanString(input.bucket || triage.project_bucket || triage.bucket || triage.depth_decision?.project_bucket || "数据不足");
  const reusableBody = reusableAbstractionsMarkdown(lightSpine?.reusable_abstractions);
  const judgmentBody = sectionBody(lightSpine?.judgment) || cleanString(fullInput.value_to_us || "");
  const whyWorthAttention = sectionBody(lightSpine?.why_worth_attention);
  return compactObject({
    tier,
    bucket,
    tag: cleanString(input.tag || `[Tier ${tier}｜${bucket}]`),
    one_sentence_positioning: cleanString(input.one_sentence_positioning || input.oneSentencePositioning || input.positioning || input.summary || triage.tldr || repo.description || NOT_EXPLAINED),
    what_it_does: cleanString(input.what_it_does || input.whatItDoes || input.body || input.description || repo.description || NOT_EXPLAINED),
    metadata: {
      language: cleanString(input.metadata?.language || repo.language || "数据不足"),
      total_stars: cleanString(input.metadata?.total_stars ?? input.metadata?.totalStars ?? repo.stars ?? "0"),
      stars_in_period: cleanString(input.metadata?.stars_in_period ?? input.metadata?.starsInPeriod ?? repo.starsGained ?? "0"),
      author: cleanString(input.metadata?.author || repo.owner || "数据不足"),
    },
    labels: normalizeStringArray(input.labels || input.tags || triage.tags).slice(0, 6),
    pain_point: cleanString(input.pain_point || input.painPoint || whyWorthAttention || ""),
    core_capabilities: normalizeStringArray(input.core_capabilities || input.coreCapabilities).length
      ? normalizeStringArray(input.core_capabilities || input.coreCapabilities).slice(0, 3)
      : asArray(lightSpine?.reusable_abstractions?.items).slice(0, 3).map((item) => cleanString(item?.name || item)).filter(Boolean),
    how_to_run: {
      install_command: cleanString(input.how_to_run?.install_command || input.howToRun?.installCommand || input.install_command || ""),
      minimal_example: cleanString(input.how_to_run?.minimal_example || input.howToRun?.minimalExample || input.minimal_example || ""),
    },
    maturity_signals: input.maturity_signals || input.maturitySignals || undefined,
    comparison: cleanString(input.comparison || input.horizontal_comparison || ""),
    trajectory_note: cleanString(input.trajectory_note || input.trajectoryNote || ""),
    manual_confirmation: Boolean(input.manual_confirmation || tier === 3),
    how_it_works_with_analogy: cleanString(input.how_it_works_with_analogy || input.howItWorksWithAnalogy || sectionBody(lightSpine?.how_it_works) || ""),
    essential_design_difference: cleanString(input.essential_design_difference || input.essentialDesignDifference || reusableBody || ""),
    practitioner_meaning: cleanString(input.practitioner_meaning || input.practitionerMeaning || judgmentBody || ""),
    cross_links: normalizeStringArray(input.cross_links || input.crossLinks),
    core_concepts: normalizeCoreConcepts(input.core_concepts || input.coreConcepts),
    prose_body: cleanString(input.prose_body || input.proseBody || ""),
  });
}

// KG-2 标准件:Tier 3 承重概念 {name, role, evidence},是 paper↔project 判边的项目侧锚。
// 保留原始结构(不压成字符串),空则不写入(compactObject 会丢弃空数组)。
function normalizeCoreConcepts(input) {
  const concepts = asArray(input)
    .map((entry) => {
      if (!entry || typeof entry !== "object") return null;
      const name = cleanString(entry.name || entry.concept || "");
      const role = cleanString(entry.role).toLowerCase() === "primary" ? "primary" : "supporting";
      const evidence = cleanString(entry.evidence || entry.why || "");
      if (!name || !evidence) return null;
      return { name, role, evidence };
    })
    .filter(Boolean)
    .slice(0, 5);
  return concepts.length ? concepts : undefined;
}

function tierTemplateFromLightSpine(lightSpine, input = {}) {
  if (!lightSpine) return null;
  const tier = tierFromDepth(input.final_depth || input.finalDepth);
  return {
    tier,
    bucket: input.project_bucket || input.bucket || "数据不足",
    one_sentence_positioning: sectionBody(lightSpine.one_sentence),
    what_it_does: sectionBody(lightSpine.why_worth_attention),
    labels: [],
    pain_point: sectionBody(lightSpine.why_worth_attention),
    core_capabilities: asArray(lightSpine.reusable_abstractions?.items).slice(0, 3).map((item) => cleanString(item?.name || item)),
    maturity_signals: {},
    comparison: sectionBody(lightSpine.reusable_abstractions) || "数据不足",
    trajectory_note: "数据不足",
    how_it_works_with_analogy: sectionBody(lightSpine.how_it_works),
    essential_design_difference: sectionBody(lightSpine.reusable_abstractions),
    practitioner_meaning: sectionBody(lightSpine.judgment),
  };
}

function reusableAbstractionsMarkdown(section = {}) {
  const body = sectionBody(section);
  const items = asArray(section?.items)
    .map((item) => {
      if (typeof item === "string") return cleanString(item);
      const name = cleanString(item?.name || "");
      const copy = cleanString(item?.copy || "");
      const skip = cleanString(item?.skip || "");
      const why = cleanString(item?.why_it_matters || item?.whyItMatters || "");
      const details = [
        copy ? `copy: ${copy}` : "",
        skip ? `skip: ${skip}` : "",
        why ? `why: ${why}` : "",
      ].filter(Boolean).join("；");
      return [name, details].filter(Boolean).join(" — ");
    })
    .filter(Boolean);
  return [body, ...items.map((item) => `- ${item}`)].filter(Boolean).join("\n");
}

function tierFromDepth(depth) {
  if (depth === "deep") return 3;
  if (depth === "analysis") return 2;
  if (depth === "light") return 1;
  return 0;
}

function normalizeLightSpine(input, fullInput = {}) {
  if (!input || typeof input !== "object") return null;
  const keyClaims = normalizeSpineClaims(
    input.key_claims_evidence
    || input.key_claims
    || input.claims
    || input["关键主张与证据"],
  );
  const judgment = normalizeSpineJudgment(input.judgment || input["判断"] || fullInput.project_verdict || {});

  return {
    schema_version: cleanString(input.schema_version || fullInput.schema_version || LIGHT_SPINE_SCHEMA_VERSION),
    one_sentence: normalizeSpineSection(input.one_sentence || input.oneSentence || input["一句话"]),
    why_worth_attention: normalizeSpineSection(input.why_worth_attention || input.whyWorthAttention || input.why_hot || input["为什么值得看"]),
    key_claims_evidence: {
      ...normalizeSpineSection(input.key_claims_evidence || input.key_claims || input.claims || input["关键主张与证据"]),
      items: keyClaims,
    },
    how_it_works: normalizeSpineSection(input.how_it_works || input.howItWorks || input["它怎么work"] || input["它怎么 work"]),
    reusable_abstractions: normalizeSpineSection(input.reusable_abstractions || input.reusableAbstractions || input.builder_reuse || input["复用什么抽象"]),
    dependency_platform_risk: normalizeSpineSection(input.dependency_platform_risk || input.dependencyPlatformRisk || input["依赖平台风险"]),
    unknowns_to_confirm: normalizeSpineSection(input.unknowns_to_confirm || input.unknowns || input["未知与待确认"]),
    judgment,
  };
}

function normalizeSpineSection(input) {
  if (input == null) return { body_md: "" };
  if (typeof input === "string") return { body_md: cleanMultiline(input) };
  if (Array.isArray(input)) return { body_md: "", items: input };
  const bodyMd = cleanMultiline(input.body_md || input.body || input.markdown || input.text || input.summary || "");
  const out = {
    summary: cleanString(input.summary || input.title || ""),
    body_md: bodyMd,
  };
  if (Array.isArray(input.bullets)) out.bullets = input.bullets.map((item) => cleanString(item)).filter(Boolean);
  if (Array.isArray(input.items)) out.items = input.items;
  if (Array.isArray(input.claims)) out.items = input.claims;
  return compactObject(out);
}

function normalizeSpineClaims(input) {
  const source = Array.isArray(input)
    ? input
    : Array.isArray(input?.items)
      ? input.items
      : Array.isArray(input?.claims)
        ? input.claims
        : [];

  return source.slice(0, 8).map((entry) => ({
    claim: cleanString(entry?.claim || entry?.text || ""),
    plain_english: cleanString(entry?.plain_english || entry?.plainEnglish || entry?.explain || entry?.claim || ""),
    source: cleanString(entry?.source || entry?.["来源"] || entry?.source_pointer || ""),
    attribution: normalizeAttribution(entry?.attribution || entry?.["归因"] || entry?.verification || entry?.source_type),
    evidence_strength: normalizeEvidenceStrength(entry?.evidence_strength || entry?.strength || entry?.confidence),
    supports: cleanString(entry?.supports || entry?.evidence || ""),
    does_not_support: cleanString(entry?.does_not_support || entry?.boundary || ""),
    threat: cleanString(entry?.threat || entry?.risk || ""),
  })).filter((entry) => entry.claim);
}

function normalizeSpineJudgment(input = {}) {
  const ratings = input.ratings || {};
  return {
    action: cleanString(input.action || input.verdict || input.recommended_action || ""),
    ratings: {
      "相关度": clampRating(ratings["相关度"] ?? ratings.relevance ?? ratings.relevance_to_ai_engineer ?? input.relevance_to_ai_engineer),
      "工程深度": clampRating(ratings["工程深度"] ?? ratings.engineering_depth ?? input.engineering_depth),
      "复用价值": clampRating(ratings["复用价值"] ?? ratings.reuse_value ?? input.reuse_value),
      "成熟度": clampRating(ratings["成熟度"] ?? ratings.maturity ?? input.maturity),
    },
    body_md: cleanMultiline(input.body_md || input.body || input.rationale || input.main_risk || ""),
  };
}

function normalizeAttribution(value) {
  const raw = cleanString(value);
  if (raw === "已核实" || /verified|核实|artifact|source/i.test(raw)) return "已核实";
  if (raw === "自称" || /claim|self|readme|marketing|badge|声称|自称|宣称/i.test(raw)) return "自称";
  return raw || "自称";
}

function sectionBody(section = {}) {
  return cleanMultiline(section?.body_md || section?.body || section?.summary || "");
}

function whyHotFromLightSpine(lightSpine) {
  const section = lightSpine?.why_worth_attention;
  if (!section) return null;
  if (Array.isArray(section.bullets) && section.bullets.length) return section.bullets;
  if (Array.isArray(section.items) && section.items.length) return section.items;
  const body = sectionBody(section);
  return body ? [{ title: "为什么值得看", body }] : null;
}

function builderReuseFromLightSpine(lightSpine) {
  const section = lightSpine?.reusable_abstractions;
  if (!section) return null;
  const items = asArray(section.items).filter(Boolean);
  const first = items.find((item) => item && typeof item === "object") || null;
  const body = sectionBody(section);
  return {
    pattern: cleanString(first?.pattern || first?.name || first?.abstraction || section.summary || body || NOT_EXPLAINED),
    copy: cleanString(first?.copy || first?.copy_this || body || NOT_EXPLAINED),
    skip: cleanString(first?.skip || first?.do_not_copy || NOT_EXPLAINED),
    why_it_matters: cleanString(first?.why_it_matters || first?.value || body || NOT_EXPLAINED),
  };
}

function dependencyRiskFromLightSpine(lightSpine) {
  const section = lightSpine?.dependency_platform_risk;
  if (!section) return null;
  const items = asArray(section.items).filter(Boolean);
  const first = items.find((item) => item && typeof item === "object") || null;
  const body = sectionBody(section);
  return {
    dependency: cleanString(first?.dependency || first?.platform || section.summary || body || NOT_EXPLAINED),
    what_if_change: cleanString(first?.what_if_change || first?.risk || first?.what_breaks || body || NOT_EXPLAINED),
    exposure: cleanString(first?.exposure || "unknown"),
    mitigation_or_unknown: cleanString(first?.mitigation_or_unknown || first?.mitigation || first?.unknown || NOT_EXPLAINED),
  };
}

function normalizeProjectVerdict(input = {}, triage = {}) {
  const ratings = normalizeRatings(input.ratings || input, triage.ratings || {});
  return {
    verdict: normalizeVerdict(input.verdict || input.action || triage.verdict),
    relevance_to_ai_engineer: ratings.relevance_to_ai_engineer,
    engineering_depth: ratings.engineering_depth,
    reuse_value: ratings.reuse_value,
    maturity: ratings.maturity,
    main_risk: cleanString(input.main_risk || input.body_md || input.body || triage.reason || NOT_EXPLAINED),
  };
}

function normalizeClaimLedger(input, { repo, fallbackClaim, fallbackRisk }) {
  const entries = asArray(input).slice(0, 6).map((entry) => ({
    claim: cleanString(entry?.claim || entry?.text || ""),
    plain_english: cleanString(entry?.plain_english || entry?.plainEnglish || entry?.claim || ""),
    source: cleanString(entry?.source || entry?.source_pointer || sourcePointerForRepo(repo, {})),
    attribution: normalizeAttribution(entry?.attribution || entry?.verification || entry?.source_type),
    evidence_strength: normalizeEvidenceStrength(entry?.evidence_strength || entry?.confidence),
    supports: cleanString(entry?.supports || entry?.evidence || NOT_EXPLAINED),
    does_not_support: cleanString(entry?.does_not_support || entry?.boundary || NOT_EXPLAINED),
    threat: cleanString(entry?.threat || entry?.risk || NOT_EXPLAINED),
  })).filter((entry) => entry.claim);

  if (entries.length) return entries;
  return [{
    claim: cleanString(fallbackClaim || `${repo.fullName || "project"} 值得进一步看。`),
    plain_english: cleanString(fallbackClaim || "离线/缺证据情况下只能保守记录这个项目的 README 定位。"),
    source: sourcePointerForRepo(repo, {}),
    attribution: "自称",
    evidence_strength: "low",
    supports: cleanString(fallbackClaim || NOT_EXPLAINED),
    does_not_support: NOT_EXPLAINED,
    threat: cleanString(fallbackRisk || NOT_EXPLAINED),
  }];
}

function normalizeConcepts(input, { contentSlug, repo, existingSlugs }) {
  const concepts = asArray(input).slice(0, 2).map((entry, index) => {
    const base = slugify(entry?.slug || entry?.name || `${contentSlug}-pattern-${index + 1}`);
    const slug = reserveSlug(base, existingSlugs, contentSlug);
    return {
      slug,
      name: cleanString(entry?.name || `${repo.name || contentSlug} 可复用模式`),
      explanation: cleanString(entry?.explanation || entry?.body || NOT_EXPLAINED),
      tags: normalizeTags(entry?.tags || ["project-pattern"]),
      maturity: normalizeEnum(entry?.maturity, CONCEPT_MATURITY, "active"),
      examples: normalizeStringArray(entry?.examples).length ? normalizeStringArray(entry?.examples) : [`${repo.fullName || repo.name}: ${NOT_EXPLAINED}`],
      common_misunderstandings: normalizeStringArray(entry?.common_misunderstandings || entry?.misunderstandings),
      open_questions: normalizeStringArray(entry?.open_questions),
      related_concepts: normalizeStringArray(entry?.related_concepts),
    };
  });

  if (concepts.length) return concepts;
  const slug = reserveSlug(`${contentSlug}-reusable-pattern`, existingSlugs);
  return [{
    slug,
    name: `${repo.name || contentSlug} 可复用模式`,
    explanation: NOT_EXPLAINED,
    tags: ["project-pattern"],
    maturity: "active",
    examples: [`${repo.fullName || repo.name}: ${NOT_EXPLAINED}`],
    common_misunderstandings: [],
    open_questions: [],
    related_concepts: [],
  }];
}

function normalizeClaim(entry, { contentSlug, concepts, existingSlugs }) {
  const slug = reserveSlug(slugify(entry?.slug || `${contentSlug}-main-claim`), existingSlugs, contentSlug);
  const evidenceStrength = normalizeEvidenceStrength(entry?.evidence_strength);
  return {
    slug,
    text: cleanString(entry?.claim || NOT_EXPLAINED),
    plain_english: cleanString(entry?.plain_english || entry?.claim || NOT_EXPLAINED),
    source_pointer: cleanString(entry?.source || NOT_EXPLAINED),
    attribution: normalizeAttribution(entry?.attribution),
    evidence_strength: evidenceStrength,
    supports: concepts.map((concept) => concept.slug),
    supports_text: cleanString(entry?.supports || NOT_EXPLAINED),
    does_not_support: cleanString(entry?.does_not_support || NOT_EXPLAINED),
    threat: cleanString(entry?.threat || NOT_EXPLAINED),
    open_challenges: normalizeStringArray([entry?.does_not_support, entry?.threat]).filter((value) => value && value !== NOT_EXPLAINED),
    status: evidenceStrength === "high" || evidenceStrength === "medium" ? "supported" : "untested",
  };
}

function normalizeArtifact(input = {}, { contentSlug, repo, audit, triage, checkedDate, existingSlugs }) {
  const slug = reserveSlug(`${contentSlug}-repo`, existingSlugs);
  const repoUrl = cleanString(input.url || repo.url || audit.repo_url || "");
  const statusFallback = audit.archived === true ? "on_hold" : repoUrl ? "available" : "missing";
  const license = cleanString(input.license || audit.license_spdx_id || NOT_EXPLAINED);
  const missingParts = normalizeStringArray(input.missing_parts);
  return {
    slug,
    artifact_type: normalizeEnum(input.artifact_type, ARTIFACT_TYPES, "repo"),
    url: repoUrl || NOT_FOUND,
    official_or_third_party: normalizeEnum(input.official_or_third_party, ARTIFACT_OWNER, "official"),
    status: normalizeEnum(input.status, ARTIFACT_STATUS, statusFallback),
    license: license === NOT_FOUND ? NOT_EXPLAINED : license,
    runnable: normalizeEnum(input.runnable || runnableFromVerdict(triage?.verdict), RUNNABLE, "unknown"),
    missing_parts: missingParts,
    last_checked: dateOnly(input.last_checked || checkedDate),
    summary: cleanString(input.summary || artifactSummary(repo, audit, license, missingParts)),
  };
}

function artifactAuditFrontmatter(repo, audit, deepDive, checkedDate) {
  return {
    official_repo: repo.url || audit.repo_url || NOT_FOUND,
    official_data: NOT_FOUND,
    evaluation_code: audit.has_tests === true ? "artifactAudit.has_tests=true" : NOT_FOUND,
    prompts_or_rubrics: NOT_FOUND,
    benchmark_tasks: NOT_FOUND,
    model_checkpoints: NOT_FOUND,
    appendix: NOT_FOUND,
    license: isFound(audit.license_spdx_id) ? cleanString(audit.license_spdx_id) : NOT_EXPLAINED,
    minimal_demo: audit.has_examples === true || audit.has_docs === true ? "artifactAudit.has_examples/has_docs=true" : NOT_FOUND,
    closed_dependencies: [],
    third_party_dependencies: [],
    broken_links: [],
    hardware: NOT_EXPLAINED,
    reproducibility_status: inferReproducibility(audit, deepDive),
  };
}

function inferReproducibility(audit, deepDive) {
  if (deepDive?.artifact?.reproducibility_status) {
    return normalizeEnum(deepDive.artifact.reproducibility_status, REPRODUCIBILITY_STATUS, "partial");
  }
  if (audit.archived === true) return "unverifiable";
  if (audit.has_src === true && audit.has_tests === true && audit.has_packages === true && isFound(audit.license_spdx_id)) return "reproducible";
  if (audit.has_src === true && (audit.has_packages === true || audit.has_docs === true)) return "code_available_but_heavy";
  if (audit.has_src === true || isFound(audit.repo_url)) return "partial";
  return "unverifiable";
}

function technicalObjectsForProject(deepDive, sourcePointer) {
  const type = {
    agent_framework: "planner",
    devtool_cli: "tool",
    library_sdk: "API",
    model_infra: "component",
    dataset_benchmark: "benchmark",
    frontend_ui: "component",
    template_boilerplate: "schema",
  }[deepDive.project_type] || "tool";

  return [{
    name: "README/artifact 中说明的核心项目对象",
    type,
    input: NOT_EXPLAINED,
    output: NOT_EXPLAINED,
    role: deepDive.one_line_positioning,
    internal_logic: deepDive.tech_breakdown_md,
    failure_mode: deepDive.risks[0] || NOT_EXPLAINED,
    source_pointer: sourcePointer,
  }];
}

function evidencePipelineSteps(deepDive, audit) {
  return [
    `project_type 分诊:${deepDive.project_type}`,
    `verdict:${deepDive.project_verdict.verdict}`,
    `artifactAudit src/tests/docs/examples/license/release:${[
      audit.has_src,
      audit.has_tests,
      audit.has_docs,
      audit.has_examples,
      audit.license_spdx_id,
      audit.latest_release_tag_name,
    ].map((value) => cleanString(value ?? NOT_FOUND)).join("/")}`,
  ];
}

function normalizeArtifactRows(input, { audit, evidence }) {
  const rows = asArray(input).map((row) => ({
    item: cleanString(row?.item || row?.name || row?.key || ""),
    status: cleanString(row?.status || row?.value || ""),
    evidence: cleanString(row?.evidence || row?.source || ""),
  })).filter((row) => row.item);

  if (rows.length) return rows;
  return [
    { item: "README", status: evidence?.content ? "available" : NOT_FOUND, evidence: evidence?.content ? "README fetched" : NOT_FOUND },
    { item: "src", status: audit.has_src === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_src" },
    { item: "tests", status: audit.has_tests === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_tests" },
    { item: "docs", status: audit.has_docs === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_docs" },
    { item: "examples", status: audit.has_examples === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_examples" },
    { item: "releases", status: isFound(audit.latest_release_tag_name) ? cleanString(audit.latest_release_tag_name) : NOT_FOUND, evidence: "artifactAudit.latest_release_tag_name" },
    { item: "license", status: isFound(audit.license_spdx_id) ? cleanString(audit.license_spdx_id) : NOT_FOUND, evidence: "artifactAudit.license_spdx_id" },
  ];
}

function normalizeWhyHot(input, triage, repo, audit) {
  const rows = asArray(input).filter(Boolean);
  if (rows.length) return rows.slice(0, 5);
  return [
    { title: "分诊原因", body: cleanString(triage?.reason || triage?.light || NOT_EXPLAINED) },
    { title: "工程信号", body: `src=${cleanString(audit.has_src ?? NOT_FOUND)}, tests=${cleanString(audit.has_tests ?? NOT_FOUND)}, docs=${cleanString(audit.has_docs ?? NOT_FOUND)}, license=${cleanString(audit.license_spdx_id ?? NOT_FOUND)}` },
    { title: "项目定位", body: cleanString(repo.description || NOT_EXPLAINED) },
  ];
}

function normalizeValueToUs(input = {}) {
  return {
    learn: cleanString(input.learn || input.what_to_learn || NOT_EXPLAINED),
    to_aibrief: cleanString(input.to_aibrief || input.ai_brief || NOT_EXPLAINED),
    to_briefmem: cleanString(input.to_briefmem || input.briefmem || NOT_EXPLAINED),
    resume: cleanString(input.resume || input.resume_story || NOT_EXPLAINED),
  };
}

function normalizeBuilderReuse(input = {}) {
  return {
    pattern: cleanString(input.pattern || input.name || input.reusable_pattern || NOT_EXPLAINED),
    copy: cleanString(input.copy || input.copy_this || input.what_to_copy || NOT_EXPLAINED),
    skip: cleanString(input.skip || input.do_not_copy || input.what_to_skip || NOT_EXPLAINED),
    why_it_matters: cleanString(input.why_it_matters || input.unlocks || input.value || NOT_EXPLAINED),
  };
}

function demoteUnknownBuilderPatterns(builderReuse, unknowns = []) {
  const unknownText = normalizeStringArray(unknowns).join(" ");
  if (!unknownText) return builderReuse;

  const parts = String(builderReuse.pattern || "")
    .split(/[、,，+]/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (!parts.length) return builderReuse;

  const kept = [];
  const demoted = [];
  for (const part of parts) {
    const core = part.replace(/[（(].*?[）)]/g, "").trim();
    if (core && unknownText.includes(core)) {
      demoted.push(part);
    } else {
      kept.push(part);
    }
  }
  if (!demoted.length) return builderReuse;

  const demotionText = `不要把 ${demoted.join("、")} 当作可复用模式；其机制未在 README/artifact 说明。`;
  return {
    ...builderReuse,
    pattern: kept.length ? kept.join("、") : NOT_EXPLAINED,
    skip: [builderReuse.skip, demotionText].filter(Boolean).join(" "),
  };
}

function normalizeDependencyPlatformRisk(input = {}) {
  return {
    dependency: cleanString(input.dependency || input.platform || input.third_party || NOT_EXPLAINED),
    what_if_change: cleanString(input.what_if_change || input.what_breaks || input.scenario || NOT_EXPLAINED),
    exposure: normalizeEnum(input.exposure, new Set(["high", "medium", "low", "unknown"]), "unknown"),
    mitigation_or_unknown: cleanString(input.mitigation_or_unknown || input.mitigation || input.unknown || NOT_EXPLAINED),
  };
}

function normalizeUnknowns(input) {
  const unknowns = normalizeStringArray(input).slice(0, 8);
  return unknowns.length ? unknowns : [NOT_EXPLAINED];
}

function normalizeMemoryCard(input = {}, projectType) {
  return {
    problem_pattern: cleanString(input.problem_pattern || NOT_EXPLAINED),
    architecture_pattern: cleanString(input.architecture_pattern || `${projectType}: ${NOT_EXPLAINED}`),
    reusable_pattern: cleanString(input.reusable_pattern || NOT_EXPLAINED),
    risk_pattern: cleanString(input.risk_pattern || NOT_EXPLAINED),
    similar_projects: cleanString(input.similar_projects || NOT_EXPLAINED),
  };
}

function normalizeReasoningTrace(input = {}, { repo, projectType, claimLedger, risks }) {
  return {
    paper_type_decision: cleanString(input.paper_type_decision || `project_type = ${projectType}; evidence from README/artifactAudit only.`),
    central_contribution: cleanString(input.central_contribution || repo.description || NOT_EXPLAINED),
    inspected: normalizeStringArray(input.inspected).length ? normalizeStringArray(input.inspected) : ["README", "artifactAudit"],
    top_claims: normalizeStringArray(input.top_claims).length ? normalizeStringArray(input.top_claims) : claimLedger.slice(0, 3).map((entry) => entry.claim),
    evidence_needed: normalizeStringArray(input.evidence_needed).length ? normalizeStringArray(input.evidence_needed) : ["README statements", "artifactAudit fields"],
    main_threats: normalizeStringArray(input.main_threats).length ? normalizeStringArray(input.main_threats) : risks,
    transfer_decision: cleanString(input.transfer_decision || NOT_EXPLAINED),
  };
}

function defaultConceptInputs(projectType, repo) {
  return [{
    slug: `${slugify(repo.name || "project")}-${projectType}-pattern`,
    name: `${repo.name || "项目"} ${projectType} 模式`,
    explanation: NOT_EXPLAINED,
    tags: [projectType, "project-pattern"],
    maturity: "active",
    examples: [`${repo.fullName || repo.name}: ${NOT_EXPLAINED}`],
    common_misunderstandings: [],
    open_questions: [],
  }];
}

function formatArtifactAuditTable(rows) {
  const bodyRows = rows.map((row) => `| ${escapeTable(row.item)} | ${escapeTable(row.status)} | ${escapeNarrativeCell(row.evidence || NOT_EXPLAINED)} |`);
  return ["| 项 | 状态 | 证据 |", "| --- | --- | --- |", ...bodyRows].join("\n");
}

function formatValueTable(value) {
  return [
    "| 维度 | 具体 |",
    "| --- | --- |",
    `| 能学什么 | ${escapeNarrativeCell(value.learn)} |`,
    `| 迁移到 AI-Brief | ${escapeNarrativeCell(value.to_aibrief)} |`,
    `| 迁移到 BriefMem | ${escapeNarrativeCell(value.to_briefmem)} |`,
    `| 简历故事 | ${escapeNarrativeCell(value.resume)} |`,
  ].join("\n");
}

function formatBuilderReuse(value) {
  return [
    "| 项 | 具体 |",
    "| --- | --- |",
    `| 关键抽象/模式 | ${escapeNarrativeCell(value.pattern)} |`,
    `| 复制什么 | ${escapeNarrativeCell(value.copy)} |`,
    `| 跳过什么 | ${escapeNarrativeCell(value.skip)} |`,
    `| 对 AI 应用构建的意义 | ${escapeNarrativeCell(value.why_it_matters)} |`,
  ].join("\n");
}

function formatDependencyPlatformRisk(value) {
  return [
    "| 项 | 具体 |",
    "| --- | --- |",
    `| 依赖对象 | ${escapeNarrativeCell(value.dependency)} |`,
    `| what-if 变化 | ${escapeNarrativeCell(value.what_if_change)} |`,
    `| 暴露度 | ${escapeTable(value.exposure)} |`,
    `| 缓解/未知 | ${escapeNarrativeCell(value.mitigation_or_unknown)} |`,
  ].join("\n");
}

function formatMemoryCard(card) {
  return [
    `problem_pattern:        ${formatNarrativeText(card.problem_pattern)}`,
    `architecture_pattern:   ${formatNarrativeText(card.architecture_pattern)}`,
    `reusable_pattern:       ${formatNarrativeText(card.reusable_pattern)}`,
    `risk_pattern:           ${formatNarrativeText(card.risk_pattern)}`,
    `similar_projects:       ${formatNarrativeText(card.similar_projects)}`,
  ].join("\n");
}

function formatWhyHot(items) {
  return asArray(items).map((item) => {
    if (typeof item === "string") return `- ${formatNarrativeText(item)}`;
    const title = cleanString(item?.title || item?.name || "原因");
    const body = formatNarrativeText(item?.body || item?.text || item?.reason || NOT_EXPLAINED);
    return `- **${title}:** ${body}`;
  }).join("\n") || `- ${NOT_EXPLAINED}`;
}

function formatBullets(items, fallbackSource = "README/artifactAudit") {
  return normalizeStringArray(items).map((item) => `- ${formatNarrativeText(item, fallbackSource)}`).join("\n") || `- ${NOT_EXPLAINED}`;
}

function escapeNarrativeCell(value, fallbackSource = "README/artifactAudit") {
  return escapeTable(formatNarrativeText(value, fallbackSource));
}

function formatNarrativeText(value, fallbackSource = "README/artifactAudit") {
  const text = hardenGroundingLanguage(cleanString(value));
  if (!text) return NOT_EXPLAINED;
  if (hasSourceAnchor(text)) return text;
  return `${text}（来源：${fallbackSource}）`;
}

function formatNarrativeMarkdown(value, fallbackSource = "README/artifactAudit") {
  const text = hardenGroundingLanguage(cleanMultiline(value));
  if (!text) return NOT_EXPLAINED;
  if (hasSourceAnchor(text)) return text;
  return `${text}\n\n（来源：${fallbackSource}）`;
}

function hasSourceAnchor(value) {
  return /（来源[:：][^）]+）/.test(String(value || ""));
}

function hardenGroundingLanguage(value) {
  return String(value || "")
    .replace(/README 未详述应对方案，但[^。]*?可能允许[^。]*?可能切换[^。]*?。?/g, "README 未详述应对方案；是否可替换策略后端或切换 DID 方法未在 README/artifact 说明。")
    .replace(/README 未详述应对方案；是否可替换策略后端或切换 DID 方法未在 README\/artifact 说明。[^。]*?评估为/g, "README 未详述应对方案；是否可替换策略后端或切换 DID 方法未在 README/artifact 说明。评估为")
    .replace(/。到其他 DID 方法，但需要额外开发。/g, "。")
    .replace(/可能包含/g, "是否包含需确认")
    .replace(/可能因/g, "原因需确认：")
    .replace(/可能允许/g, "README 未说明是否允许")
    .replace(/可能切换/g, "README 未说明是否可切换")
    .replace(/可能 API 变更/g, "存在 API 变更风险")
    .replace(/可能过于刚性/g, "存在过于刚性的风险")
    .replace(/可能不包含/g, "不保证包含")
    .replace(/可能违反/g, "存在违反风险")
    .replace(/可能引入/g, "存在引入风险")
    .replace(/可能不兼容/g, "存在不兼容风险")
    .replace(/可能不稳定/g, "存在不稳定风险")
    .replace(/可能不足/g, "存在不足风险")
    .replace(/可能失效/g, "存在失效风险")
    .replace(/可能中断/g, "存在中断风险")
    .replace(/可能导致/g, "会增加")
    .replace(/可能存在/g, "存在")
    .replace(/可能/g, "存在风险")
    .replace(/存在风险包含/g, "是否包含需确认")
    .replace(/存在风险触发/g, "存在触发")
    .replace(/存在风险增加/g, "存在增加")
    .replace(/存在违反风险([^，。；;]*)/g, "存在违反$1的风险")
    .replace(/存在引入风险([^，。；;]*)/g, "存在引入$1的风险")
    .replace(/也许|大概|看起来|应该/g, "未确认");
}

function normalizeTechBreakdownMarkdown(markdownText) {
  return cleanMultiline(markdownText)
    .replace(/^#{1,2}\s+技术拆解[^\n]*\n+/i, "")
    .replace(/^(#{1,2})(\s+)/gm, "###$2")
    .trim() || NOT_EXPLAINED;
}

function plainOneLine(value) {
  return cleanString(value).replace(/^一句话[:：]\s*/, "");
}

function normalizePunchline(value, positioning) {
  const punchline = plainOneLine(value);
  if (!punchline || sameLooseText(punchline, positioning)) return "";
  return punchline;
}

function sameLooseText(left, right) {
  const normalize = (value) => plainOneLine(value).replace(/[*_`"']/g, "").replace(/\s+/g, "").toLowerCase();
  return normalize(left) === normalize(right);
}

function artifactAuditConclusion(audit) {
  if (audit.has_src === true && audit.has_tests === true && isFound(audit.license_spdx_id)) return "artifact 至少有源码、测试和 license 信号,可进入深挖";
  if (audit.has_src === true) return "artifact 有源码信号,但测试/license/release 等成熟度需继续核验";
  return "artifact 证据偏薄,缺失项不能脑补";
}

function sourcePointerForRepo(repo = {}, audit = {}) {
  return cleanString(audit.repo_url || repo.url || (repo.fullName ? `https://github.com/${repo.fullName}` : "README/artifactAudit"));
}

function auditMetrics(audit = {}) {
  return [
    `stars=${cleanString(audit.stargazers_count ?? NOT_FOUND)}`,
    `forks=${cleanString(audit.forks_count ?? NOT_FOUND)}`,
    `open_issues=${cleanString(audit.open_issues_count ?? NOT_FOUND)}`,
    `latest_release=${cleanString(audit.latest_release_tag_name ?? NOT_FOUND)}`,
    `pushed_at=${cleanString(audit.pushed_at ?? NOT_FOUND)}`,
  ];
}

function sourceMissingDetails(audit = {}, evidence = {}) {
  const missing = [];
  if (!evidence?.content) missing.push("README");
  for (const field of ["license_spdx_id", "latest_release_tag_name", "latest_release_published_at", "homepage", "top_level_entries"]) {
    if (!isFound(audit[field])) missing.push(field);
  }
  return missing.slice(0, 12).map((field) => `${field}: ${NOT_FOUND}`);
}

function primarySources(repo, audit, evidence) {
  const source = sourcePointerForRepo(repo, audit);
  const parts = [`${source} README/artifactAudit`];
  if (evidence?.content) parts.push("README fetched");
  if (isFound(audit.repo_full_name)) parts.push(`repo_full_name=${audit.repo_full_name}`);
  if (isFound(audit.license_spdx_id)) parts.push(`license=${audit.license_spdx_id}`);
  return [parts.join(" / ")];
}

function sourceReliability(repo, evidence) {
  if ((repo.url || repo.fullName) && evidence?.content) return "high";
  if (repo.url || repo.fullName) return "medium";
  return "low";
}

function whyDiscovered(repo, triage, source) {
  const sourceText = source || "github-trending";
  const ranking = triage?.rankingReason?.explanation ? `; ranking=${triage.rankingReason.explanation}` : "";
  return cleanString(`${repo.fullName || repo.name || "repo"} came from ${sourceText}${ranking}`) || NOT_EXPLAINED;
}

function whySelected(deepDive, triage) {
  return cleanString(triage?.reason || deepDive.one_line_positioning) || NOT_EXPLAINED;
}

function normalizeSource(repo, triage, ctx) {
  const rawSource = ctx?.candidate?.source || triage?.provenance?.source || "";
  if (rawSource.startsWith("github-trending:")) return rawSource;
  const firstWindow = asArray(repo.windows)[0] || "direct";
  return `github-trending:${firstWindow}`;
}

function repoDate(repo, audit) {
  return dateOnly(audit.latest_release_published_at || audit.pushed_at || repo.pushedAt || repo.updatedAt || "");
}

function contentTitle(repo, contentSlug) {
  const name = cleanString(repo.name || repo.fullName || contentSlug);
  const description = cleanString(repo.description);
  if (!description) return clampText(name, 70);

  const separator = " — ";
  const remaining = Math.max(12, 70 - name.length - separator.length);
  return clampText(`${name}${separator}${clampText(description, remaining)}`, 70);
}

function clampText(value, maxLength) {
  const text = cleanString(value);
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function importanceFromVerdict(verdict = {}) {
  const avg = [
    verdict.relevance_to_ai_engineer,
    verdict.engineering_depth,
    verdict.reuse_value,
    verdict.maturity,
  ].reduce((sum, value) => sum + clampRating(value), 0) / 4;
  if (verdict.verdict === "clone_and_run" && avg >= 4) return 5;
  if (verdict.verdict === "deep_dive" && avg >= 3.75) return 4;
  return clampInt(Math.round(avg), 1, 5);
}

function artifactSummary(repo, audit, license, missingParts) {
  const parts = [
    `官方 repo:${repo.url || audit.repo_url || NOT_FOUND}`,
    `src=${cleanString(audit.has_src ?? NOT_FOUND)}`,
    `tests=${cleanString(audit.has_tests ?? NOT_FOUND)}`,
    `docs=${cleanString(audit.has_docs ?? NOT_FOUND)}`,
    `examples=${cleanString(audit.has_examples ?? NOT_FOUND)}`,
    `license=${license || NOT_EXPLAINED}`,
  ];
  if (missingParts.length) parts.push(`missing=${missingParts.join(", ")}`);
  return `${parts.join("; ")}。`;
}

function runnableFromVerdict(verdict) {
  return verdict === "clone_and_run" ? "unknown" : "unknown";
}

function nextActionsFromVerdict(verdict) {
  if (verdict === "clone_and_run") return ["clone-and-run", "extract-pattern", "star/watch"];
  if (verdict === "deep_dive") return ["write-deepdive", "extract-pattern", "read-docs"];
  if (verdict === "L1") return ["read-docs"];
  if (verdict === "watch") return ["star/watch"];
  return ["skip"];
}

function normalizeRepo(repo = {}, audit = {}) {
  const fullName = cleanString(repo.fullName || audit.repo_full_name || parseGitHubFullName(repo.url || audit.repo_url));
  const [ownerFromFull, nameFromFull] = fullName.split("/");
  const owner = cleanString(repo.owner || ownerFromFull);
  const name = cleanString(repo.name || nameFromFull || fullName || "project");
  return {
    ...repo,
    fullName,
    owner,
    name,
    url: cleanString(repo.url || audit.repo_url || (fullName ? `https://github.com/${fullName}` : "")),
    description: cleanString(repo.description || audit.description || audit.repo_description || ""),
    language: cleanString(repo.language || ""),
    discoveredAt: repo.discoveredAt,
  };
}

function artifactAuditFrom(evidence = {}) {
  return evidence?.artifactAudit || evidence?.metadata?.artifactAudit || {};
}

async function readExistingSlugs(wikiRoot) {
  const slugs = new Set();
  async function walk(dir) {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(abs);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
      slugs.add(slugify(path.basename(entry.name, ".md")));
      try {
        const text = await readFile(abs, "utf8");
        const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        const slugMatch = match?.[1]?.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m);
        if (slugMatch) slugs.add(slugify(slugMatch[1]));
      } catch {
        // Ignore unreadable wiki files; slug reservation is best-effort.
      }
    }
  }
  await walk(wikiRoot);
  return slugs;
}

async function readExistingContentSlugs(wikiRoot) {
  const slugs = new Set();
  let entries;
  try {
    entries = await readdir(path.join(wikiRoot, "content"), { withFileTypes: true });
  } catch {
    return slugs;
  }

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) continue;
    const abs = path.join(wikiRoot, "content", entry.name);
    slugs.add(slugify(path.basename(entry.name, ".md")));
    try {
      const text = await readFile(abs, "utf8");
      const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
      const slugMatch = match?.[1]?.match(/^slug:\s*["']?([^"'\n]+)["']?\s*$/m);
      if (slugMatch) slugs.add(slugify(slugMatch[1]));
    } catch {
      // Content slug collision checks are best-effort, same as global reservation.
    }
  }

  return slugs;
}

export function deriveSlug(repo = {}, existingContentSlugs = new Set()) {
  const fullName = cleanString(repo.fullName || "");
  const [ownerFromFull, nameFromFull] = fullName.split("/");
  const ownerSlug = slugify(repo.owner || ownerFromFull || "");
  const nameSlug = slugify(repo.name || nameFromFull || fullName || "project");
  const ownerPrefixed = ownerSlug && !nameSlug.startsWith(`${ownerSlug}-`) ? `${ownerSlug}-${nameSlug}` : nameSlug;
  if (ownerSlug) return ownerPrefixed;
  if (!existingContentSlugs.has(nameSlug)) return nameSlug;

  let index = 2;
  while (existingContentSlugs.has(`${nameSlug}-${index}`)) index += 1;
  return `${nameSlug}-${index}`;
}

function reserveSlug(base, existingSlugs, prefix = "") {
  const cleanBase = slugify(base || "project");
  const cleanPrefix = slugify(prefix || "");
  const candidates = [];
  candidates.push(cleanBase);
  if (cleanPrefix && !cleanBase.startsWith(`${cleanPrefix}-`)) candidates.push(`${cleanPrefix}-${cleanBase}`);
  for (const candidate of candidates) {
    if (!existingSlugs.has(candidate)) {
      existingSlugs.add(candidate);
      return candidate;
    }
  }
  let index = 2;
  while (existingSlugs.has(`${cleanBase}-${index}`)) index += 1;
  const slug = `${cleanBase}-${index}`;
  existingSlugs.add(slug);
  return slug;
}

function markdown(frontmatter, body) {
  return `---\n${yamlObject(frontmatter)}---\n\n${body.trimEnd()}\n`;
}

function yamlObject(object, indent = 0) {
  const lines = [];
  for (const [key, value] of Object.entries(object || {})) {
    if (value === undefined || value === null) continue;
    lines.push(...yamlField(key, value, indent));
  }
  return `${lines.join("\n")}\n`;
}

function yamlField(key, value, indent) {
  const pad = " ".repeat(indent);
  if (isScalar(value)) return [`${pad}${key}: ${yamlScalar(value)}`];
  if (Array.isArray(value)) {
    if (!value.length) return [`${pad}${key}: []`];
    return [`${pad}${key}:`, ...yamlArray(value, indent + 2)];
  }
  if (!Object.keys(value || {}).length) return [`${pad}${key}: {}`];
  return [`${pad}${key}:`, ...yamlObject(value, indent + 2).trimEnd().split("\n").filter(Boolean)];
}

function yamlArray(array, indent) {
  const pad = " ".repeat(indent);
  if (!array.length) return [`${pad}[]`];
  const lines = [];
  for (const item of array) {
    if (isScalar(item)) {
      lines.push(`${pad}- ${yamlScalar(item)}`);
      continue;
    }
    if (Array.isArray(item)) {
      lines.push(`${pad}- ${JSON.stringify(item)}`);
      continue;
    }
    const entries = Object.entries(item || {}).filter(([, value]) => value !== undefined && value !== null);
    if (!entries.length) {
      lines.push(`${pad}- {}`);
      continue;
    }
    const [firstKey, firstValue] = entries[0];
    if (isScalar(firstValue)) {
      lines.push(`${pad}- ${firstKey}: ${yamlScalar(firstValue)}`);
    } else {
      lines.push(`${pad}- ${firstKey}: ${JSON.stringify(firstValue)}`);
    }
    for (const [key, value] of entries.slice(1)) {
      lines.push(...yamlField(key, value, indent + 2));
    }
  }
  return lines;
}

function yamlScalar(value) {
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "0";
  if (typeof value === "boolean") return value ? "true" : "false";
  return JSON.stringify(String(value));
}

function isScalar(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function compactObject(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== undefined && value !== null));
}

function normalizeProjectType(value) {
  const raw = cleanString(value).toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = {
    app: "ai_app",
    ai_app: "ai_app",
    agent_skill: "agent_skill",
    agent_skills: "agent_skill",
    skill: "agent_skill",
    skills: "agent_skill",
    plugin: "agent_skill",
    plugins: "agent_skill",
    prompt_collection: "agent_skill",
    prompt_collections: "agent_skill",
    meta_skill: "agent_skill",
    agent_runtime: "agent_framework",
    agent_framework: "agent_framework",
    devtool: "devtool_cli",
    devtool_cli: "devtool_cli",
    cli: "devtool_cli",
    model_infra: "model_infra",
    frontend: "frontend_ui",
    frontend_ui: "frontend_ui",
    dataset: "dataset_benchmark",
    benchmark: "dataset_benchmark",
    dataset_benchmark: "dataset_benchmark",
    library: "library_sdk",
    sdk: "library_sdk",
    library_sdk: "library_sdk",
    template: "template_boilerplate",
    boilerplate: "template_boilerplate",
    template_boilerplate: "template_boilerplate",
    non_ai: "non_ai_eng",
    non_ai_eng: "non_ai_eng",
  }[raw] || raw;
  return PROJECT_TYPES.has(mapped) ? mapped : "non_ai_eng";
}

function normalizeIntent(value) {
  const raw = cleanString(value).toLowerCase();
  if (["teaching", "tutorial", "course", "教学型"].includes(raw)) return "teaching";
  if (["tool", "utility", "工具型"].includes(raw)) return "tool";
  return "understanding";
}

function normalizeVerdict(value) {
  const raw = cleanString(value).toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = {
    skip: "skip",
    watch: "watch",
    l1: "L1",
    light: "L1",
    deep: "deep_dive",
    deep_dive: "deep_dive",
    clone: "clone_and_run",
    clone_run: "clone_and_run",
    clone_and_run: "clone_and_run",
  }[raw] || value;
  return PROJECT_VERDICTS.has(mapped) ? mapped : "deep_dive";
}

function normalizeRatings(input = {}, fallback = {}) {
  return {
    relevance_to_ai_engineer: clampRating(input.relevance_to_ai_engineer ?? input.relevance ?? input["相关度"] ?? fallback.relevance_to_ai_engineer ?? fallback["相关度"]),
    engineering_depth: clampRating(input.engineering_depth ?? input["工程深度"] ?? fallback.engineering_depth ?? fallback["工程深度"]),
    reuse_value: clampRating(input.reuse_value ?? input["复用价值"] ?? fallback.reuse_value ?? fallback["复用价值"]),
    maturity: clampRating(input.maturity ?? input["成熟度"] ?? fallback.maturity ?? fallback["成熟度"]),
  };
}

function normalizeEvidenceStrength(value) {
  const raw = cleanString(value).toLowerCase();
  return EVIDENCE_STRENGTHS.has(raw) ? raw : "low";
}

function normalizeEnum(value, allowed, fallback) {
  const raw = cleanString(value);
  const normalized = raw.toLowerCase().replace(/[\s-]+/g, "_");
  if (allowed.has(raw)) return raw;
  if (allowed.has(normalized)) return normalized;
  return fallback;
}

function normalizeTags(values) {
  return unique(asArray(values).flatMap((value) => asArray(value)).map((value) => {
    const tag = slugify(cleanString(value));
    return tag === "not-found" ? "" : tag;
  }).filter(Boolean)).slice(0, 8);
}

const STRUCTURED_TEXT_FIELDS = [
  "text",
  "body",
  "summary",
  "description",
  "statement",
  "claim",
  "plain_english",
  "pattern",
  "copy",
  "skip",
  "contribution",
  "central_contribution",
  "decision",
  "reason",
  "evidence",
  "source",
  "source_pointer",
  "supports",
  "value",
  "name",
  "title",
  "path",
  "field",
  "item",
  "key",
  "dependency",
  "platform",
  "what_if_change",
  "what_breaks",
  "exposure",
  "mitigation",
];

function normalizeStringArray(value) {
  return asArray(value).map((item) => cleanString(item)).filter(Boolean);
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function cleanString(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim();
  if (Array.isArray(value)) return value.map((item) => cleanString(item)).filter(Boolean).join("; ");
  if (typeof value === "object") {
    const extracted = extractStructuredText(value);
    if (extracted) return extracted;
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value).replace(/\s+/g, " ").trim();
}

function cleanMultiline(value) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value.replace(/\r\n/g, "\n").trim();
  if (Array.isArray(value)) return value.map((item) => cleanMultiline(item)).filter(Boolean).join("\n\n");
  return cleanString(value).replace(/\r\n/g, "\n").trim();
}

function extractStructuredText(value) {
  for (const field of STRUCTURED_TEXT_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(value, field) || value[field] === value) continue;
    const text = cleanString(value[field]);
    if (text) return text;
  }
  return "";
}

function isFound(value) {
  if (value === undefined || value === null) return false;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed !== "" && trimmed !== NOT_FOUND;
  }
  return true;
}

function dateOnly(value) {
  const text = String(value || "").trim();
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function clampRating(value) {
  return clampInt(Math.round(Number(value) || 3), 1, 5);
}

function clampInt(value, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return min;
  return Math.max(min, Math.min(max, number));
}

function slugify(value) {
  const slug = cleanString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  return slug || "project";
}

function parseGitHubFullName(url) {
  const raw = String(url || "")
    .trim()
    .replace(/^github\.com\//i, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "");
  const match = raw.match(/^([^/\s?#]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  return match ? `${match[1]}/${match[2]}` : "";
}

function escapeTable(value) {
  return cleanString(value).replace(/\|/g, "\\|") || NOT_EXPLAINED;
}

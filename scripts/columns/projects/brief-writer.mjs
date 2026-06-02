import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const DEFAULT_WIKI_ROOT = path.join(ROOT, "brief-wiki");
const NOT_FOUND = "not_found";
const NOT_EXPLAINED = "未在 README/artifact 说明";

const PROJECT_TYPES = new Set(["ai_app", "agent_framework", "devtool_cli", "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate", "non_ai_eng"]);
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
  const frontmatter = compactObject({
    content: contentSlug,
    kind: "deep-dive",
    shape: shapeForProjectType(deepDive.project_type, ctx.triage),
    project_type: deepDive.project_type,
    title: `${repo.name || contentSlug} — 深度拆解`,
    reasoning_trace: deepDive.reasoning_trace,
    project_verdict: deepDive.project_verdict,
    next_actions: deepDive.next_actions,
    claim_ledger: deepDive.claim_ledger,
    artifact_audit: artifactAuditFrontmatter(repo, audit, deepDive, checkedDate),
  });

  const conceptLinks = concepts.map((concept) => `[[concepts/${concept.slug}]]`).join("、");
  const punchlineBlock = deepDive.one_line_punchline ? `\n\n> 一句话:${deepDive.one_line_punchline}` : "";
  const body = `## 大白话定位

**${deepDive.one_line_positioning}**${punchlineBlock}

## 为什么火

${formatWhyHot(deepDive.why_hot)}

## Artifact audit

${formatArtifactAuditTable(deepDive.artifact_audit_rows)}

一句话:**${artifactAuditConclusion(audit)}**

## 技术拆解(${TECH_HEADING_LABELS[deepDive.project_type] || deepDive.project_type})

${normalizeTechBreakdownMarkdown(deepDive.tech_breakdown_md)}

## 对我的价值

${formatValueTable(deepDive.value_to_us)}

## 风险

${formatBullets(deepDive.risks)}

## Memory card

\`\`\`text
${formatMemoryCard(deepDive.memory_card)}
\`\`\`

可复用范式落库:${conceptLinks || NOT_EXPLAINED}。另见 [[content/${contentSlug}]]、[[claims/${claim.slug}]]。`;

  return markdown(frontmatter, body);
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
  const projectType = normalizeProjectType(input.project_type || input.project_verdict?.project_type || triage?.project_type);
  const projectVerdict = normalizeProjectVerdict(input.project_verdict, triage);
  const risks = normalizeStringArray(input.risks).length ? normalizeStringArray(input.risks) : [projectVerdict.main_risk || NOT_EXPLAINED];
  const oneLinePositioning = cleanString(input.one_line_positioning || triage?.tldr || repo.description || `${repo.fullName || "project"}: ${NOT_EXPLAINED}`);
  const oneLinePunchline = normalizePunchline(input.one_line_punchline || input.punchline, oneLinePositioning);
  const claimLedger = normalizeClaimLedger(input.claim_ledger, {
    repo,
    fallbackClaim: oneLinePositioning || triage?.tldr || repo.description || repo.fullName,
    fallbackRisk: risks[0],
  });

  return {
    one_line_positioning: oneLinePositioning,
    one_line_punchline: oneLinePunchline,
    why_hot: normalizeWhyHot(input.why_hot, triage, repo, audit),
    artifact_audit_rows: normalizeArtifactRows(input.artifact_audit_rows, { audit, evidence }),
    tech_breakdown_md: normalizeTechBreakdownMarkdown(input.tech_breakdown_md || `${NOT_EXPLAINED}。只能确认 README/artifactAudit 中出现的项目类型:${projectType}。`),
    value_to_us: normalizeValueToUs(input.value_to_us),
    risks,
    next_actions: normalizeStringArray(input.next_actions).length ? normalizeStringArray(input.next_actions) : nextActionsFromVerdict(projectVerdict.verdict),
    memory_card: normalizeMemoryCard(input.memory_card, projectType),
    reasoning_trace: normalizeReasoningTrace(input.reasoning_trace, { repo, projectType, claimLedger, risks }),
    project_type: projectType,
    project_verdict: projectVerdict,
    claim_ledger: claimLedger,
    concepts: normalizeStringArray(input.concepts).length ? input.concepts : defaultConceptInputs(projectType, repo),
    artifact: input.artifact || {},
    checkedDate,
  };
}

function normalizeProjectVerdict(input = {}, triage = {}) {
  const ratings = normalizeRatings(input.ratings || input, triage.ratings || {});
  return {
    verdict: normalizeVerdict(input.verdict || triage.verdict),
    relevance_to_ai_engineer: ratings.relevance_to_ai_engineer,
    engineering_depth: ratings.engineering_depth,
    reuse_value: ratings.reuse_value,
    maturity: ratings.maturity,
    main_risk: cleanString(input.main_risk || triage.reason || NOT_EXPLAINED),
  };
}

function normalizeClaimLedger(input, { repo, fallbackClaim, fallbackRisk }) {
  const entries = asArray(input).slice(0, 6).map((entry) => ({
    claim: cleanString(entry?.claim || entry?.text || ""),
    plain_english: cleanString(entry?.plain_english || entry?.plainEnglish || entry?.claim || ""),
    source: cleanString(entry?.source || entry?.source_pointer || sourcePointerForRepo(repo, {})),
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
  const bodyRows = rows.map((row) => `| ${escapeTable(row.item)} | ${escapeTable(row.status)} | ${escapeTable(row.evidence || NOT_EXPLAINED)} |`);
  return ["| 项 | 状态 | 证据 |", "| --- | --- | --- |", ...bodyRows].join("\n");
}

function formatValueTable(value) {
  return [
    "| 维度 | 具体 |",
    "| --- | --- |",
    `| 能学什么 | ${escapeTable(value.learn)} |`,
    `| 迁移到 AI-Brief | ${escapeTable(value.to_aibrief)} |`,
    `| 迁移到 BriefMem | ${escapeTable(value.to_briefmem)} |`,
    `| 简历故事 | ${escapeTable(value.resume)} |`,
  ].join("\n");
}

function formatMemoryCard(card) {
  return [
    `problem_pattern:        ${card.problem_pattern}`,
    `architecture_pattern:   ${card.architecture_pattern}`,
    `reusable_pattern:       ${card.reusable_pattern}`,
    `risk_pattern:           ${card.risk_pattern}`,
    `similar_projects:       ${card.similar_projects}`,
  ].join("\n");
}

function formatWhyHot(items) {
  return asArray(items).map((item) => {
    if (typeof item === "string") return `- ${item}`;
    const title = cleanString(item?.title || item?.name || "原因");
    const body = cleanString(item?.body || item?.text || item?.reason || NOT_EXPLAINED);
    return `- **${title}:** ${body}`;
  }).join("\n") || `- ${NOT_EXPLAINED}`;
}

function formatBullets(items) {
  return normalizeStringArray(items).map((item) => `- ${item}`).join("\n") || `- ${NOT_EXPLAINED}`;
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
  if (!existingContentSlugs.has(nameSlug)) return nameSlug;

  const ownerPrefixed = ownerSlug && !nameSlug.startsWith(`${ownerSlug}-`) ? `${ownerSlug}-${nameSlug}` : nameSlug;
  if (!existingContentSlugs.has(ownerPrefixed)) return ownerPrefixed;

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
    relevance_to_ai_engineer: clampRating(input.relevance_to_ai_engineer ?? fallback.relevance_to_ai_engineer),
    engineering_depth: clampRating(input.engineering_depth ?? fallback.engineering_depth),
    reuse_value: clampRating(input.reuse_value ?? fallback.reuse_value),
    maturity: clampRating(input.maturity ?? fallback.maturity),
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

#!/usr/bin/env node

import path from "node:path";
import { fileURLToPath } from "node:url";
import { createDeepSeekClient, projectDeepModel } from "../../lib/llm.mjs";
import { collectEvidence, isOffline } from "./sources.mjs";
import { evaluate } from "./evaluate.mjs";
import { projectDeepDiveSystemPrompt, projectDeepDiveUser } from "./deepdive-prompts.mjs";
import { writeProjectBriefWikiEntities } from "./brief-writer.mjs";
import { emitProjectAutoSciPrimitive } from "./autosci-primitives.mjs";
import { depthAtLeast, isBriefDepth } from "./project-ranking.mjs";
import {
  applyReviewToDepthDecision,
  downgradedDepth,
  isReviewableDepth,
  reviewProjectAnalysis,
} from "./review.mjs";

const NOT_FOUND = "not_found";
const NOT_EXPLAINED = "未在 README/artifact 说明";

export async function generateProjectDeepDive({
  candidate,
  evidence,
  triage,
  options = {},
  logger = console,
} = {}) {
  if (!candidate) throw new Error("generateProjectDeepDive requires candidate");
  if (!evidence) throw new Error("generateProjectDeepDive requires evidence");
  if (!triage) throw new Error("generateProjectDeepDive requires triage");

  const offline = isOffline(options) || options.offline === true;
  const repo = candidate.raw || candidate;
  const model = options.projectDeepModel || projectDeepModel();
  let depthDecision = triage.depth_decision || {
    ranking_score: triage.ranking_score || triage.score || 0,
    max_allowed_depth: triage.max_allowed_depth || "list_only",
    final_depth: triage.final_depth || "list_only",
    ranking_reasons: triage.ranking_reasons || [],
    rejection_reasons: triage.rejection_reasons || [],
    recommended_action: triage.recommended_action || "monitor",
    needs_enrichment: Boolean(triage.needs_enrichment),
  };
  let finalDepth = triage.final_depth || depthDecision.final_depth || "list_only";
  const maxAllowedDepth = triage.max_allowed_depth || depthDecision.max_allowed_depth || "list_only";
  let payload = options.deepDivePayload || null;
  let review = null;

  if (!isBriefDepth(finalDepth) || !depthAtLeast(maxAllowedDepth, finalDepth)) {
    return {
      tier: "brief-wiki",
      status: "skipped",
      skipped: true,
      generated: false,
      repo: repo.fullName || repo.name || "",
      final_depth: finalDepth,
      max_allowed_depth: maxAllowedDepth,
      depth_decision: depthDecision,
      reason: "deterministic depth gate does not allow brief generation",
      offline,
      model: "deterministic-depth-gate",
    };
  }

  if (!payload && offline) {
    payload = buildOfflineProjectDeepDiveStub({ candidate, evidence, triage, options });
  }

  let chatJson = null;
  if (!payload) {
    chatJson = options.chatJson || createDeepSeekClient({
      apiTimeoutMs: options.apiTimeoutMs,
      logger,
    }).chatJson;

    payload = await chatJson({
      system: projectDeepDiveSystemPrompt(triage.project_type, finalDepth),
      user: projectDeepDiveUser(candidate, evidence, triage, options),
      model,
      maxTokens: options.deepDiveMaxTokens || options.deepMaxTokens || Number(process.env.PROJECT_DEEP_DIVE_MAX_TOKENS) || Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 16000,
    });
  }

  if (isReviewableDepth(finalDepth) && !options.skipReview) {
    review = await reviewProjectAnalysis({
      candidate,
      evidence,
      triage: { ...triage, depth_decision: depthDecision, final_depth: finalDepth },
      analysis: payload,
      options,
      logger,
    });

    if (review.verdict === "revise" && !offline) {
      chatJson = chatJson || options.chatJson || createDeepSeekClient({
        apiTimeoutMs: options.apiTimeoutMs,
        logger,
      }).chatJson;
      payload = await chatJson({
        system: projectDeepDiveSystemPrompt(triage.project_type, finalDepth),
        user: projectDeepDiveUser(candidate, evidence, triage, { ...options, reviewIssues: review.issues }),
        model,
        maxTokens: options.deepDiveMaxTokens || options.deepMaxTokens || Number(process.env.PROJECT_DEEP_DIVE_MAX_TOKENS) || Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 16000,
      });
      const secondReview = await reviewProjectAnalysis({
        candidate,
        evidence,
        triage: { ...triage, depth_decision: depthDecision, final_depth: finalDepth },
        analysis: payload,
        options,
        logger,
      });
      review = {
        ...secondReview,
        first_pass: {
          verdict: review.verdict,
          issues: review.issues,
          rationale: review.rationale,
          model: review.model,
        },
      };
    }

    if (review.verdict === "revise") {
      review = {
        ...review,
        verdict: "downgrade",
        issues: ["review_still_requested_revision_after_one_allowed_pass", ...(review.issues || [])],
      };
    }

    if (review.verdict === "downgrade") {
      finalDepth = downgradedDepth(finalDepth);
    }
    depthDecision = applyReviewToDepthDecision(depthDecision, review, finalDepth);
  }

  if (!isBriefDepth(finalDepth)) {
    return {
      tier: "brief-wiki",
      status: "downgraded",
      skipped: true,
      generated: false,
      repo: repo.fullName || repo.name || "",
      final_depth: finalDepth,
      max_allowed_depth: maxAllowedDepth,
      depth_decision: depthDecision,
      reason: "review_downgraded_below_brief_depth",
      review,
      offline,
      model: offline ? "offline-project-deepdive-stub" : model,
    };
  }

  const triageForWrite = {
    ...triage,
    final_depth: finalDepth,
    verdict: legacyVerdictForDepth(finalDepth),
    depth_decision: depthDecision,
    review_verdict: review?.verdict || triage.review_verdict,
    review_issues: review?.issues || triage.review_issues || [],
  };
  payload = alignPayloadWithFinalDepth(payload, finalDepth);
  const written = await writeProjectBriefWikiEntities({
    candidate,
    evidence,
    triage: triageForWrite,
    deepDive: payload,
    options,
    logger,
  });
  const autosciPrimitive = await emitProjectAutoSciPrimitive({
    candidate,
    evidence,
    triage: triageForWrite,
    deepDive: payload,
    finalDepth,
    options,
  });
  const autosciPrimitiveCount = autosciPrimitive ? 1 : 0;
  logger?.info?.(`projects AutoSci primitives ${repo.fullName || repo.name || candidate?.id || ""}: 本次抽取 ${autosciPrimitiveCount} 条原语`);

  return {
    ...written,
    autosciPrimitive,
    autosciPrimitiveCount,
    repo: repo.fullName || repo.name || "",
    final_depth: finalDepth,
    depth_decision: depthDecision,
    review,
    offline,
    model: offline ? "offline-project-deepdive-stub" : model,
  };
}

function alignPayloadWithFinalDepth(payload = {}, finalDepth = "analysis") {
  const verdict = legacyVerdictForDepth(finalDepth);
  return {
    ...payload,
    project_verdict: {
      ...(payload.project_verdict || {}),
      verdict,
    },
  };
}

function legacyVerdictForDepth(depth) {
  if (depth === "deep") return "clone_and_run";
  if (depth === "analysis") return "deep_dive";
  if (depth === "light") return "L1";
  return "skip";
}

export function buildOfflineProjectDeepDiveStub({ candidate, evidence, triage, options = {} } = {}) {
  throw new Error("Offline project deep-dive stubs are disabled by the Projects Radar paradigm; use --offline for deterministic radar cards only.");
  const repo = candidate?.raw || candidate || {};
  const audit = evidence?.artifactAudit || evidence?.metadata?.artifactAudit || {};
  const checkedDate = dateOnly(options.checkedDate || evidence?.fetchedAt || candidate?.discoveredAt || new Date().toISOString());
  const projectType = normalizeProjectType(triage?.project_type);
  const verdict = normalizeVerdict(triage?.verdict);
  const ratings = normalizeRatings(triage?.ratings);
  const fullName = repo.fullName || audit.repo_full_name || parseGitHubFullName(repo.url || audit.repo_url) || repo.name || "project";
  const repoUrl = repo.url || audit.repo_url || (fullName.includes("/") ? `https://github.com/${fullName}` : NOT_FOUND);
  const readmeSignal = evidence?.content ? String(evidence.content).slice(0, 240) : repo.description || NOT_EXPLAINED;
  const sourcePointer = repoUrl !== NOT_FOUND ? repoUrl : "README/artifactAudit";

  return {
    one_line_positioning: `[离线 stub] ${fullName}: ${cleanString(triage?.tldr || repo.description || readmeSignal || NOT_EXPLAINED)}`,
    one_line_punchline: "[离线 stub] 只验证 writer 形状,不产出真实技术结论。",
    why_hot: [
      { title: "离线 stub", body: "未调用 LLM;只用 candidate/evidence/triage 组装,供 writer 与 brief:lint 验证。" },
      { title: "分诊信号", body: `project_type=${projectType}, verdict=${verdict}, ratings=${ratings.relevance_to_ai_engineer}/${ratings.engineering_depth}/${ratings.reuse_value}/${ratings.maturity}` },
      { title: "artifact 信号", body: `src=${String(audit.has_src ?? NOT_FOUND)}, tests=${String(audit.has_tests ?? NOT_FOUND)}, docs=${String(audit.has_docs ?? NOT_FOUND)}, license=${String(audit.license_spdx_id ?? NOT_FOUND)}` },
    ],
    artifact_audit_rows: [
      { item: "README", status: evidence?.content ? "available" : NOT_FOUND, evidence: evidence?.content ? "collectEvidence.content" : NOT_FOUND },
      { item: "src", status: audit.has_src === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_src" },
      { item: "tests", status: audit.has_tests === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_tests" },
      { item: "docs", status: audit.has_docs === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_docs" },
      { item: "examples", status: audit.has_examples === true ? "available" : NOT_FOUND, evidence: "artifactAudit.has_examples" },
      { item: "license", status: audit.license_spdx_id || NOT_FOUND, evidence: "artifactAudit.license_spdx_id" },
      { item: "release", status: audit.latest_release_tag_name || NOT_FOUND, evidence: "artifactAudit.latest_release_tag_name" },
    ],
    tech_breakdown_md: `[离线 stub] 技术拆解只记录分诊方向:${projectType}。README 摘要:${cleanString(readmeSignal)}。\n\n术语说明:project_type 是 P1 triage 给出的项目类型,用于决定深挖重点;artifactAudit 是 P1 从 GitHub metadata/tree/release/license 抓到的工程证据。缺失事实:${NOT_EXPLAINED}。`,
    value_to_us: {
      learn: `[离线 stub] 先学 README/artifact 已显示的工程信号;缺失事实不补。`,
      to_aibrief: `[离线 stub] 可用作 AI-Brief 项目分析 writer/lint 的验证样本。`,
      to_briefmem: `[离线 stub] 可验证 content/source-pack/evidence-pack/deep-dive/concept/claim/artifact 的 typed-memory 写入。`,
      resume: `[离线 stub] 不生成简历故事;真实故事需在线 deep-dive 或人工核验。`,
    },
    risks: [
      `[离线 stub] 未调用 LLM,没有真实技术拆解;只适合验证文件形状。`,
      triage?.reason || NOT_EXPLAINED,
    ].filter(Boolean),
    next_actions: verdict === "clone_and_run"
      ? ["clone-and-run", "extract-pattern", "brief-lint"]
      : ["write-deepdive", "extract-pattern", "brief-lint"],
    memory_card: {
      problem_pattern: `[离线 stub] ${projectType} 项目候选的证据收集与落库。`,
      architecture_pattern: `[离线 stub] candidate + README + artifactAudit + triage -> brief-wiki entity set。`,
      reusable_pattern: "[离线 stub] typed-memory writer contract verification。",
      risk_pattern: "[离线 stub] 缺少 LLM 技术判断,不要发布为真实分析。",
      similar_projects: NOT_EXPLAINED,
    },
    reasoning_trace: {
      paper_type_decision: `[离线 stub] project_type=${projectType};来自 triage,非 LLM 重判。`,
      central_contribution: `[离线 stub] ${cleanString(triage?.tldr || repo.description || NOT_EXPLAINED)}`,
      inspected: ["candidate.raw", "evidence.content", "evidence.artifactAudit", "triage"],
      top_claims: [`[离线 stub] ${fullName} 的分诊结果是 ${projectType}/${verdict}`],
      evidence_needed: ["README 具体架构说明", "artifactAudit src/tests/docs/license/release 字段", "人工或 LLM 技术拆解"],
      main_threats: ["离线 stub 不能替代真实 deep-dive", "README/artifact 缺失项不能脑补"],
      transfer_decision: "[离线 stub] 只转移 writer/lint 形状,不转移技术结论。",
    },
    project_verdict: {
      verdict,
      ...ratings,
      main_risk: `[离线 stub] ${cleanString(triage?.reason || NOT_EXPLAINED)}`,
    },
    claim_ledger: [{
      claim: `[离线 stub] ${fullName} 被 P1 分诊为 ${projectType}/${verdict}。`,
      plain_english: "这条只是离线占位:它说明 pipeline 形状通了,不说明项目真的值得采用。",
      source: sourcePointer,
      evidence_strength: "low",
      supports: "candidate/evidence/triage 存在,可驱动 writer 生成 typed-memory 文件。",
      does_not_support: "不支持任何未在 README/artifact 说明的技术细节、性能、license、硬件或命令。",
      threat: "如果把 stub 当正式分析发布,会污染 BriefMem。",
    }],
    concepts: [{
      slug: `${slugify(repo.name || fullName)}-${projectType}-stub-pattern`,
      name: `${repo.name || fullName} 离线 stub 写入模式`,
      explanation: "用离线 evidence/triage 构造 typed-memory entity set,只验证格式、链接和 schema。",
      tags: ["project-pipeline", "typed-memory", projectType],
      maturity: "emerging",
      examples: [`${fullName}: offline stub deep-dive writer exercise`],
      common_misunderstandings: ["离线 stub 不是项目真实技术判断。"],
      open_questions: ["真实 LLM deep-dive 后,哪些 claim/concept 应替换 stub?"],
    }],
    artifact: {
      slug: `${slugify(repo.name || fullName)}-repo`,
      artifact_type: "repo",
      url: repoUrl,
      official_or_third_party: "official",
      status: repoUrl !== NOT_FOUND ? "available" : "missing",
      license: audit.license_spdx_id && audit.license_spdx_id !== NOT_FOUND ? audit.license_spdx_id : NOT_EXPLAINED,
      runnable: "unknown",
      missing_parts: ["离线 stub 未核验运行命令/API key/环境要求"],
      last_checked: checkedDate,
      summary: `[离线 stub] repo=${repoUrl}; src=${String(audit.has_src ?? NOT_FOUND)}; tests=${String(audit.has_tests ?? NOT_FOUND)}; license=${String(audit.license_spdx_id ?? NOT_FOUND)}。`,
    },
  };
}

async function cli(argv) {
  const { repoArg, options } = parseArgs(argv);
  if (!repoArg || options.help) {
    printUsage();
    return;
  }

  const candidate = candidateFromRepoArg(repoArg, options);
  const logger = console;
  const evidence = await collectEvidence(candidate, { options, logger });
  const triage = await evaluate(candidate, evidence, { options, logger });

  if (!isBriefDepth(triage.final_depth || triage.depth_decision?.final_depth)) {
    logger.warn(`deterministic final_depth is ${triage.final_depth || triage.depth_decision?.final_depth || "unknown"}; brief generation will be skipped`);
  }

  const result = await generateProjectDeepDive({ candidate, evidence, triage, options, logger });
  console.log(JSON.stringify({
    repo: result.repo,
    slug: result.slug,
    offline: result.offline,
    model: result.model,
    triage: {
      project_type: triage.project_type,
      final_depth: triage.final_depth,
      max_allowed_depth: triage.max_allowed_depth,
      ranking_score: triage.ranking_score,
      recommended_action: triage.recommended_action,
    },
    paths: result.paths,
  }, null, 2));
}

function parseArgs(argv) {
  const options = {};
  let repoArg = "";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--offline" || arg === "--no-llm") {
      options.noLlm = true;
      options.offline = true;
    } else if (arg === "--wiki-root") {
      options.wikiRoot = argv[++index];
    } else if (arg === "--source") {
      options.source = argv[++index];
    } else if (arg === "--readme-max-chars") {
      options.readmeMaxChars = Number(argv[++index]);
    } else if (arg === "--deep-max-tokens" || arg === "--deep-dive-max-tokens") {
      options.deepDiveMaxTokens = Number(argv[++index]);
    } else if (arg === "--api-timeout-ms") {
      options.apiTimeoutMs = Number(argv[++index]);
    } else if (!repoArg) {
      repoArg = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  return { repoArg, options };
}

function candidateFromRepoArg(repoArg, options = {}) {
  const fullName = parseGitHubFullName(repoArg);
  if (!fullName) throw new Error(`Expected GitHub repo owner/name or URL, got: ${repoArg}`);
  const [owner, name] = fullName.split("/");
  const source = options.source || "github-trending:direct";
  const window = source.startsWith("github-trending:") ? source.split(":")[1] : "direct";
  const raw = {
    fullName,
    owner,
    name,
    url: `https://github.com/${fullName}`,
    ownerAvatarUrl: `https://github.com/${owner}.png?size=80`,
    description: null,
    language: null,
    languageColor: null,
    stars: 0,
    forks: 0,
    starsGained: 0,
    windows: window ? [window] : [],
    ranksByWindow: window ? { [window]: 1 } : {},
    sourceTerms: [],
  };
  return {
    id: `project:${fullName.toLowerCase()}`,
    column: "projects",
    source,
    raw,
    dedupeKey: fullName.toLowerCase(),
    discoveredAt: new Date().toISOString(),
  };
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/projects/deepdive.mjs <owner/name> [--offline] [--wiki-root brief-wiki] [--source github-trending:weekly]

Online mode runs collectEvidence + deterministic evaluate + analyst LLM + separate reviewer LLM.
Offline mode sets noLlm/offline and writes the deterministic offline stub shape for analysis/deep when the gate allows it.`);
}

function normalizeProjectType(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const allowed = new Set(["ai_app", "agent_framework", "devtool_cli", "model_infra", "frontend_ui", "dataset_benchmark", "library_sdk", "template_boilerplate", "non_ai_eng"]);
  return allowed.has(raw) ? raw : "non_ai_eng";
}

function normalizeVerdict(value) {
  const raw = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const mapped = raw === "l1" ? "L1" : raw;
  return ["skip", "watch", "L1", "deep_dive", "clone_and_run"].includes(mapped) ? mapped : "deep_dive";
}

function normalizeRatings(value = {}) {
  return {
    relevance_to_ai_engineer: clampRating(value.relevance_to_ai_engineer),
    engineering_depth: clampRating(value.engineering_depth),
    reuse_value: clampRating(value.reuse_value),
    maturity: clampRating(value.maturity),
  };
}

function clampRating(value) {
  const number = Math.round(Number(value));
  return Math.max(1, Math.min(5, Number.isFinite(number) ? number : 3));
}

function parseGitHubFullName(value) {
  const raw = String(value || "")
    .trim()
    .replace(/^github\.com\//i, "")
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/^git@github\.com:/i, "");
  const match = raw.match(/^([^/\s?#]+)\/([^/\s?#]+?)(?:\.git)?(?:[/?#].*)?$/);
  return match ? `${match[1]}/${match[2]}` : "";
}

function dateOnly(value) {
  const match = String(value || "").match(/\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "project";
}

const thisFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === thisFile) {
  cli(process.argv.slice(2)).catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

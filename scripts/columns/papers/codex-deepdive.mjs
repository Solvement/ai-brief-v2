#!/usr/bin/env node

import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { evaluate } from "./evaluate.mjs";
import {
  fetchFullPaperText,
  finalizeCandidate,
  paperEvidence,
  toKernelCandidate,
} from "./sources.mjs";
import { parseJson } from "../../lib/llm.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const HF_DAILY_URL = "https://huggingface.co/papers";
const PAPER_PARADIGM_SCHEMA_VERSION = "paper-paradigm/v1";
const CODEX_DEEP_MODEL = "gpt-5.5";
const CODEX_REASONING_EFFORT = "high";
const DEFAULT_LOG_ROOT = path.join(ROOT, "logs", "papers-v2-daily");
const DEFAULT_TEXT_MAX_CHARS = 160000;
const DEFAULT_DEEP_LIMIT = 5;
const DEFAULT_MAX_DEEP_LIMIT = 12;
const DEFAULT_ACTIVE_ARTICLES_LIMIT = 12;
const ARTICLES_FILE = path.join(ROOT, "public", "data", "articles.json");
const ARTICLES_ARCHIVE_FILE = path.join(ROOT, "public", "data", "articles-archive.json");

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printUsage();
    return null;
  }

  await mkdir(options.logRoot, { recursive: true });
  const discovery = await discoverHfDailyTop(options);
  const ranked = await rankHfDailyPapers(discovery.papers, options);
  const selected = ranked.slice(0, options.limit);
  const lightItems = ranked.slice(options.limit).map((item) => lightArticleFromRankedPaper(item, {
    generatedAt: nowIso(options),
    hfDate: discovery.dateString,
    hfSourceUrl: discovery.sourceUrl,
  }));
  const results = [];
  const deepArticles = [];

  for (const item of selected) {
    const result = await authorOnePaper(item, {
      ...options,
      hfDate: discovery.dateString,
      hfSourceUrl: discovery.sourceUrl,
    });
    results.push(result);
    if (result.payload) {
      deepArticles.push(articleFromParadigmPayload(result.payload, item, {
        generatedAt: nowIso(options),
        hfDate: discovery.dateString,
        hfSourceUrl: discovery.sourceUrl,
      }));
    }
    console.log(`papers codex deep-dive ${result.status} ${item.paper.arxivId}: ${item.paper.title}`);
  }

  const publishResult = await publishArticlesV2({
    generatedAt: nowIso(options),
    deepArticles,
    lightArticles: lightItems,
    options,
  });

  const summary = {
    generatedAt: nowIso(options),
    schema_version: PAPER_PARADIGM_SCHEMA_VERSION,
    integration: "decoupled-papers-codex-deep-dive-authoring",
    model: options.model,
    model_reasoning_effort: options.reasoningEffort,
    source: {
      name: "Hugging Face Daily Papers",
      url: discovery.sourceUrl,
      hfDate: discovery.dateString,
      rawCount: discovery.papers.length,
      selectionPolicy: "sort by Hugging Face upvotes descending, then existing evaluator score",
    },
    limit: options.limit,
    maxLimit: options.maxLimit,
    activeArticlesLimit: options.activeArticlesLimit,
    codexCallCount: results.filter((item) => item.codexCalled).length,
    deepArticleCount: deepArticles.length,
    lightCardCount: lightItems.length,
    publish: publishResult,
    results: results.map(summaryResult),
  };
  const summaryPath = path.join(options.logRoot, "summary.json");
  await writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ summaryPath, results: results.map(summaryResult) }, null, 2));
  return summary;
}

export function parseArgs(argv = []) {
  const options = {
    limit: numberOption(process.env.PAPERS_DEEP_LIMIT ?? process.env.PAPERS_TOP_N, DEFAULT_DEEP_LIMIT),
    maxLimit: numberOption(process.env.PAPERS_MAX_DEEP_LIMIT, DEFAULT_MAX_DEEP_LIMIT),
    candidateLimit: 45,
    logRoot: DEFAULT_LOG_ROOT,
    model: CODEX_DEEP_MODEL,
    reasoningEffort: CODEX_REASONING_EFFORT,
    codexBin: "codex",
    timeoutMs: Number(process.env.PAPERS_CODEX_DEEP_DIVE_TIMEOUT_MS) || 30 * 60 * 1000,
    fullTextTimeoutMs: Number(process.env.PAPERS_FULL_TEXT_TIMEOUT_MS) || 60000,
    paperTextMaxChars: Number(process.env.PAPERS_CODEX_TEXT_MAX_CHARS) || DEFAULT_TEXT_MAX_CHARS,
    activeArticlesLimit: numberOption(process.env.PAPERS_ARTICLES_ACTIVE_LIMIT, DEFAULT_ACTIVE_ARTICLES_LIMIT),
    sourceUrl: HF_DAILY_URL,
    noCodex: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const nextValue = () => {
      if (index + 1 >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[++index];
    };
    if (arg === "--help" || arg === "-h") options.help = true;
    else if (arg === "--limit") options.limit = numberOption(nextValue(), options.limit);
    else if (arg.startsWith("--limit=")) options.limit = numberOption(valueAfterEquals(arg), options.limit);
    else if (arg === "--max-limit") options.maxLimit = numberOption(nextValue(), options.maxLimit);
    else if (arg.startsWith("--max-limit=")) options.maxLimit = numberOption(valueAfterEquals(arg), options.maxLimit);
    else if (arg === "--candidate-limit") options.candidateLimit = numberOption(nextValue(), options.candidateLimit);
    else if (arg.startsWith("--candidate-limit=")) options.candidateLimit = numberOption(valueAfterEquals(arg), options.candidateLimit);
    else if (arg === "--active-limit") options.activeArticlesLimit = numberOption(nextValue(), options.activeArticlesLimit);
    else if (arg.startsWith("--active-limit=")) options.activeArticlesLimit = numberOption(valueAfterEquals(arg), options.activeArticlesLimit);
    else if (arg === "--log-root") options.logRoot = path.resolve(ROOT, nextValue());
    else if (arg.startsWith("--log-root=")) options.logRoot = path.resolve(ROOT, valueAfterEquals(arg));
    else if (arg === "--model") options.model = nextValue();
    else if (arg.startsWith("--model=")) options.model = valueAfterEquals(arg);
    else if (arg === "--reasoning-effort") options.reasoningEffort = nextValue();
    else if (arg.startsWith("--reasoning-effort=")) options.reasoningEffort = valueAfterEquals(arg);
    else if (arg === "--codex-bin") options.codexBin = nextValue();
    else if (arg.startsWith("--codex-bin=")) options.codexBin = valueAfterEquals(arg);
    else if (arg === "--timeout-ms") options.timeoutMs = numberOption(nextValue(), options.timeoutMs);
    else if (arg.startsWith("--timeout-ms=")) options.timeoutMs = numberOption(valueAfterEquals(arg), options.timeoutMs);
    else if (arg === "--source-url") options.sourceUrl = nextValue();
    else if (arg.startsWith("--source-url=")) options.sourceUrl = valueAfterEquals(arg);
    else if (arg === "--no-codex") options.noCodex = true;
    else throw new Error(`Unexpected argument: ${arg}`);
  }

  options.maxLimit = Math.max(1, Math.min(DEFAULT_MAX_DEEP_LIMIT, Math.floor(numberOption(options.maxLimit, DEFAULT_MAX_DEEP_LIMIT))));
  options.limit = Math.max(1, Math.min(options.maxLimit, Math.floor(numberOption(options.limit, DEFAULT_DEEP_LIMIT))));
  options.candidateLimit = Math.max(options.limit, Math.floor(numberOption(options.candidateLimit, 45)));
  options.activeArticlesLimit = Math.max(options.limit, Math.floor(numberOption(options.activeArticlesLimit, DEFAULT_ACTIVE_ARTICLES_LIMIT)));
  options.logRoot = path.resolve(ROOT, options.logRoot);
  return options;
}

async function discoverHfDailyTop(options = {}) {
  const html = await fetchText(options.sourceUrl || HF_DAILY_URL, {
    timeoutMs: numberOption(options.sourceTimeoutMs, 30000),
  });
  const daily = parseHuggingFaceDailyPayload(html, options.sourceUrl || HF_DAILY_URL);
  return {
    dateString: daily.dateString,
    sourceUrl: options.sourceUrl || HF_DAILY_URL,
    papers: daily.papers.slice(0, options.candidateLimit || 45),
  };
}

export function parseHuggingFaceDailyPayload(html = "", baseUrl = HF_DAILY_URL) {
  const match = String(html).match(/data-target="DailyPapers"\s+data-props="([\s\S]*?)"/);
  if (!match) throw new Error("Hugging Face DailyPapers payload not found");
  const props = JSON.parse(decodeHtmlAttribute(match[1]));
  const papers = asArray(props.dailyPapers)
    .map((row) => hfDailyRowToPaper(row, baseUrl))
    .filter((paper) => paper.title && paper.arxivId);
  return {
    dateString: cleanString(props.dateString),
    papers,
  };
}

function hfDailyRowToPaper(row = {}, baseUrl = HF_DAILY_URL) {
  const paper = row.paper || {};
  const arxivId = cleanString(paper.id);
  const authors = asArray(paper.authors).map((author) => cleanString(author.name || author.fullname)).filter(Boolean);
  return finalizeCandidate({
    title: cleanString(paper.title),
    authors,
    abstract: cleanString(paper.summary),
    arxivId,
    source: "huggingface_daily",
    sourceName: "Hugging Face Daily Papers",
    sourceUrl: absoluteUrl(baseUrl, `/papers/${arxivId}`),
    paperUrl: `https://arxiv.org/abs/${baseArxivId(arxivId)}`,
    pdfUrl: `https://arxiv.org/pdf/${baseArxivId(arxivId)}`,
    publishedAt: cleanString(paper.publishedAt),
    updatedAt: cleanString(paper.submittedOnDailyAt || paper.publishedAt),
    sourceSignals: ["Hugging Face Daily Papers"],
    upvotes: numberOption(row.upvotes ?? paper.upvotes, 0),
    comments: numberOption(row.numComments ?? paper.numComments, 0),
    hfSubmittedOnDailyAt: cleanString(paper.submittedOnDailyAt),
    projectPage: cleanString(row.projectPage),
    codeUrl: cleanString(row.githubRepo),
  });
}

export async function selectTopPapers(papers = [], options = {}) {
  return (await rankHfDailyPapers(papers, options)).slice(0, Math.min(options.maxLimit || DEFAULT_MAX_DEEP_LIMIT, options.limit || DEFAULT_DEEP_LIMIT));
}

export async function rankHfDailyPapers(papers = [], options = {}) {
  const evaluated = [];
  for (const paper of papers) {
    const candidate = toKernelCandidate(paper, { discoveredAt: nowIso(options) });
    const evaluation = await evaluate(candidate, { kind: "paper-text", content: paper.abstract || paper.title }, {
      options: { noLlm: true, now: options.now },
      logger: options.logger || console,
    });
    evaluated.push({ paper, candidate, evaluation });
  }
  return evaluated
    .sort((left, right) => Number(right.paper.upvotes || 0) - Number(left.paper.upvotes || 0)
      || Number(right.evaluation.score || 0) - Number(left.evaluation.score || 0)
      || cleanString(left.paper.title).localeCompare(cleanString(right.paper.title)));
}

export async function authorOnePaper(item, options = {}) {
  const safeId = slugify(item.paper.arxivId || item.paper.title);
  const itemLogDir = path.join(options.logRoot, safeId);
  const responsePath = path.join(itemLogDir, "codex-last-message.json");
  const promptPath = path.join(itemLogDir, "prompt.md");
  const evidencePath = path.join(itemLogDir, "evidence.txt");
  const payloadPath = path.join(itemLogDir, "paper-paradigm.json");
  await mkdir(itemLogDir, { recursive: true });

  const fullText = await fetchFullPaperText(item.paper, options);
  const evidence = paperEvidence(item.candidate.id, item.paper, {
    fullText,
    sourceText: "",
    fetchedAt: nowIso(options),
    maxChars: options.paperTextMaxChars || DEFAULT_TEXT_MAX_CHARS,
  });
  await writeFile(evidencePath, evidence.content, "utf8");

  const evidenceTrace = buildEvidenceTrace(evidence, fullText, item);
  if (!evidenceTrace.fullTextRead) {
    const payload = failurePayload(item, evidenceTrace, "full_text_unavailable");
    await writeFile(payloadPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
    return {
      paper: paperSummary(item),
      status: "needs_full_text",
      codexCalled: false,
      paths: { evidence: evidencePath, payload: payloadPath },
      evidenceTrace,
      validation: payload.validation,
      payload,
    };
  }

  const prompt = buildCodexAuthorPrompt({
    item,
    evidence,
    evidencePath,
    evidenceTrace,
    options,
  });
  await writeFile(promptPath, prompt, "utf8");

  let parsed;
  let invocation = null;
  if (options.noCodex) {
    parsed = dryRunPayload(item, evidenceTrace);
  } else {
    invocation = await runCodexExec({
      prompt,
      outputPath: responsePath,
      itemLogDir,
      options,
    });
    parsed = parseJson(await readFile(responsePath, "utf8"));
  }

  const normalized = normalizePaperParadigmPayload(parsed, {
    item,
    evidenceTrace,
    invocation,
    promptPath,
    responsePath,
  });
  await writeFile(payloadPath, `${JSON.stringify(normalized, null, 2)}\n`, "utf8");

  return {
    paper: paperSummary(item),
    status: normalized.validation.passed ? "generated" : "generated_with_warnings",
    codexCalled: !options.noCodex,
    paths: {
      prompt: promptPath,
      response: options.noCodex ? null : responsePath,
      evidence: evidencePath,
      payload: payloadPath,
      invocation: invocation?.invocationPath || null,
    },
    evidenceTrace,
    validation: normalized.validation,
    payload: normalized,
  };
}

function buildCodexAuthorPrompt({ item, evidence, evidencePath, evidenceTrace, options }) {
  return `You are the AI-Brief papers deep analysis author.

Task: write one Chinese full-paper interpretation in the style of a senior 机器之心 editor.

Production v2 spec (authoritative; if earlier/later Chinese text is mojibake/corrupted, follow this block):
- Output Chinese prose for smart AI practitioners who are not specialists in this exact subfield.
- Preserve the 机器之心 deep 解读 feel: dense, concrete, mechanism-first, no hype filler.
- Density zoning:
  1. Title/hook may use at most one headline number.
  2. lookahead / 看点先读 must be 2-3 conceptual bullets with no digits, no percentages, no equations, and no repeated body sentences.
  3. Method intuition should use a repeatable analogy and almost no numbers. If a formula appears, immediately translate it into plain language.
  4. Results and ablations are the number-heavy zones. Every number must name the baseline/comparator and keep an internal source anchor.
  5. Meaning and limitations return to plain language and should be light on numbers.
- Terminology: the first appearance of important English terms should include a short Chinese gloss in parentheses.
- Sources: keep structured grounding fields such as evidenceTrace, numeric_claims, section evidence, ablations, and source_anchor. In prose_markdown, do not append inline "(来源: Table X)" labels. Use footnotes only near the headline number and the most counterintuitive claims, e.g. [^1], with short footnotes at the end.
- Ablation discipline: explicitly answer whether the reported gain supports the mechanism or could simply be model scale / tuning.
- No fabrication: use only the metadata and full paper text below. If a number, limitation, ablation, code release, or implementation detail is not in the paper text, write "论文未提供".
- Structure of prose_markdown: title -> one-sentence hook -> metadata -> opening tension -> one-sentence claim -> result-first lift -> 看点先读 -> sectioned expansion -> meaning -> limitations -> closing line -> footnotes.
- Return strict parseable JSON only.

Paper:
${JSON.stringify({
  title: item.paper.title,
  arxivId: item.paper.arxivId,
  authors: item.paper.authors,
  hfUpvotes: item.paper.upvotes,
  hfDate: options.hfDate,
  sourceUrl: item.paper.sourceUrl,
  arxivUrl: item.paper.paperUrl,
  evaluation: item.evaluation,
}, null, 2)}

Full-text evidence:
- The caller fetched full paper text, not just abstract.
- Evidence file path: ${evidencePath}
- Evidence trace: ${JSON.stringify(evidenceTrace)}
- Use only the paper text below and paper metadata above. Do not browse. Do not invent numbers.

Hard grounding/no-fabrication rules:
- Base the article on the full paper text and metadata only. Do not browse. Do not invent numbers.
- Keep internal grounding unchanged: every hard number in numeric_claims, section evidence, ablations, result_first.source_anchor, evidenceTrace, and other structured evidence fields must keep paper anchors such as Table/Figure/Section/Appendix/Equation.
- Because we cannot reproduce experiments, frame results as "论文报告" rather than established fact.
- If the paper does not provide a number or ablation, say "论文未提供".
- Do not analyze from abstract alone. Use design choices, comparisons, ablations, limitations, and full-paper mechanisms.

Kevin's papers 解读 paradigm v2, implement faithfully while preserving the JSON fields:
读者 = 聪明但非本子领域专家的从业者：不能注水，但每个术语/公式/关键数字都要让他读懂。

【密度分区——最重要】
- 标题/钩子：只甩 1 个最亮的头条数字。
- 看点先读：2-3 条，每条讲清一个"贡献是什么"的概念，禁止出现任何数字，禁止和正文重复。
- 方法直觉段：几乎不放数字。必须用一个非专家能复述的类比讲清核心机制；引用公式必须紧跟一句人话翻译。
- 主结果段 / 消融段：数字集中堆在这里，且每个数字都要带对比对象。
- 消融必须明确回答："这是机制在起作用，还是只是模型大/调参好？"
- 意义/局限段：回到人话，少用数字。

【术语与节奏】
- 关键英文术语首次出现，括号给一句中文注解，例如 validity（题目自洽合格率）。
- 每 2-3 个数据密集段，插一句"所以这对读者意味着什么"的人话喘息句。

【来源——v2 的关键修正】
- 必须基于原文 grounding，内部记住每个结论出处用于自核；保留 evidenceTrace / numeric_claims / evidence / ablations 等内部 grounding 字段不变，用于自核与校验。
- prose_markdown 成品正文里默认不要挂来源；只在头条数字和最反直觉的结论上，用脚注补来源。
- 严禁在 prose_markdown 正文每句话后挂 "(来源：表X)"、"（来源：Figure X）"、"来源：..."。这是审计报告，不是解读。
- 脚注只能出现在 headline number 和 most counterintuitive claims 附近，例如 "[^1]"，并在文末列出简短脚注。不要用内联 "(来源：...)"。

【禁止】
- 禁空话"显著提升性能"；必须落到"改了哪个组件、哪个数字变成多少"，且数字放在结果/消融密度区。
- 禁照搬原文措辞复述；用自己的话拆机制。
- 章节标题写成问句或主张，不写"背景/方法/实验"。

【结构】
标题 -> 一句话钩子 -> 元信息 -> 开篇张力 -> 一句话主张 -> 结果前置+拔高 -> 看点先读(概念,≤3,无数字) -> 分节展开(问句标题；方法段配类比少数字，结果/消融段堆数字带对比) -> 工作意义(工程/方法论/应用) -> 局限 -> 一句话结语

Applied-builder angle:
- In the 应用 view, explain what this unlocks for someone building AI apps, grounded in the paper.

Return strict JSON only. It must be parseable and include both structured data and prose:
{
  "schema_version": "${PAPER_PARADIGM_SCHEMA_VERSION}",
  "paper": {"title": "...", "arxivId": "...", "authors": ["..."], "sourceUrl": "..."},
  "meta": {"title_result_institution_mechanism": "...", "one_sentence_hook": "...", "paper_type": "...", "hf_upvotes": 0, "full_text_basis": true},
  "opening_tension": "...",
  "one_sentence_claim": "...",
  "result_first": {"body": "结果前置+拔高；body 可有人话解读，source_anchor 保留内部 grounding", "source_anchor": "Table/Figure/Section ..."},
  "lookahead": ["2-3 concept bullets, no numbers"],
  "sections": [
    {
      "title": "question/claim-style heading",
      "body": "...",
      "design_comparisons": [{"choice": "...", "why_not_common_alternative": "...", "paper_anchor": "Section ..."}],
      "evidence": [{"claim": "...", "reported_number": "...", "opponent_or_baseline": "...", "source_anchor": "Table/Figure/Section ..."}],
      "ablations": [{"question_answered": "是机制在起作用，还是只是模型大/调参好", "paper_report": "...", "source_anchor": "Table/Figure/Section ..."}]
    }
  ],
  "meaning": {"engineering": "...", "methodology": "...", "application_builder": "..."},
  "limitations": [{"limit": "...", "paper_anchor": "Section ... or 论文未提供"}],
  "closing_line": "...",
  "numeric_claims": [{"value": "...", "claim": "...", "source_anchor": "Table/Figure/Section ..."}],
  "prose_markdown": "完整中文稿件，结构顺序必须是：标题 -> 一句话钩子 -> 元信息 -> 开篇张力 -> 一句话主张 -> 结果前置+拔高 -> 看点先读(≤3,无数字) -> 分节展开(方法段类比少数字；结果/消融数字集中且带对比) -> 工作意义 -> 局限 -> 一句话结语。正文禁止内联(来源：...)，只在头条数字和最反直觉结论用脚注。"
}

Paper full text evidence:
${evidence.content}`;
}

function normalizePaperParadigmPayload(input = {}, { item, evidenceTrace, invocation, promptPath, responsePath } = {}) {
  const payload = {
    ...input,
    schema_version: input.schema_version || PAPER_PARADIGM_SCHEMA_VERSION,
    paper: {
      title: cleanString(input.paper?.title || item.paper.title),
      arxivId: cleanString(input.paper?.arxivId || item.paper.arxivId),
      authors: asArray(input.paper?.authors || item.paper.authors).map(cleanString).filter(Boolean),
      sourceUrl: cleanString(input.paper?.sourceUrl || item.paper.sourceUrl),
    },
    meta: {
      ...(input.meta || {}),
      hf_upvotes: Number(input.meta?.hf_upvotes ?? item.paper.upvotes ?? 0),
      full_text_basis: Boolean(input.meta?.full_text_basis ?? evidenceTrace.fullTextRead),
    },
    selection: {
      hf_upvotes: Number(item.paper.upvotes || 0),
      evaluator_score: Number(item.evaluation?.score || 0),
      evaluator_reason: cleanString(item.evaluation?.reason),
      hf_date: evidenceTrace.hfDate,
    },
    evidenceTrace,
    authoring: invocation ? {
      method: "codex-exec",
      model: invocation.model,
      model_reasoning_effort: invocation.model_reasoning_effort,
      prompt: relativeToRoot(promptPath),
      raw_response: relativeToRoot(responsePath),
      invoked_at: invocation.startedAt,
      completed_at: invocation.finishedAt,
    } : { method: "dry-run" },
  };
  payload.validation = validateParadigmPayload(payload);
  return payload;
}

export function validateParadigmPayload(payload = {}) {
  const required = [
    ["meta.title_result_institution_mechanism", payload.meta?.title_result_institution_mechanism],
    ["meta.one_sentence_hook", payload.meta?.one_sentence_hook],
    ["opening_tension", payload.opening_tension],
    ["one_sentence_claim", payload.one_sentence_claim],
    ["result_first.body", payload.result_first?.body],
    ["lookahead", Array.isArray(payload.lookahead) && payload.lookahead.length >= 2 && payload.lookahead.length <= 4],
    ["sections", Array.isArray(payload.sections) && payload.sections.length > 0],
    ["meaning.engineering", payload.meaning?.engineering],
    ["meaning.methodology", payload.meaning?.methodology],
    ["meaning.application_builder", payload.meaning?.application_builder],
    ["limitations", Array.isArray(payload.limitations) && payload.limitations.length > 0],
    ["closing_line", payload.closing_line],
    ["prose_markdown", payload.prose_markdown],
    ["evidenceTrace.fullTextRead", payload.evidenceTrace?.fullTextRead],
  ];
  const missing = required.filter(([, value]) => !value).map(([field]) => field);
  const numericClaims = asArray(payload.numeric_claims);
  const unanchoredNumbers = numericClaims
    .filter((claim) => !cleanString(claim?.value) || !hasSourceAnchor(claim?.source_anchor))
    .map((claim) => cleanString(claim?.value || claim?.claim || "unknown"));
  const sectionIssues = asArray(payload.sections).flatMap((section, index) => {
    const out = [];
    if (!isParadigmSectionTitle(section?.title)) {
      out.push(`sections[${index}].title_not_question_or_claim`);
    }
    for (const evidence of asArray(section?.evidence)) {
      if (cleanString(evidence?.reported_number) && !hasSourceAnchor(evidence?.source_anchor)) {
        out.push(`sections[${index}].evidence_unanchored_number`);
      }
    }
    return out;
  });
  const warnings = [...missing, ...unanchoredNumbers.map((item) => `numeric_claim_unanchored:${item}`), ...sectionIssues];
  return {
    passed: warnings.length === 0,
    warnings,
    checked: [
      "full_text_read",
      "paradigm_sections_present",
      "numeric_claims_have_source_anchors",
      "builder_application_view_present",
    ],
  };
}

function isParadigmSectionTitle(value) {
  const title = cleanString(value);
  if (!title) return false;
  if (/^(?:背景|方法|实验|结果|结论|局限|future work|background|method|methods|experiments?|results?|conclusion)$/i.test(title)) return false;
  if (/[?？吗何为何以能否如何]/.test(title)) return true;
  // Claim-style Chinese headings in this paradigm often state the core tension directly
  // without punctuation. Accept substantial, non-generic titles with a verb/comparison cue.
  return title.length >= 10 && /(不是|要|让|把|能|也|先|再|变成|重新|拉回|只为|来自|说了算|长出来|区间|信号)/.test(title);
}

async function runCodexExec({ prompt, outputPath, itemLogDir, options = {} }) {
  const startedAt = nowIso(options);
  const codexArgs = [
    "exec",
    "-c",
    `model_reasoning_effort="${options.reasoningEffort}"`,
    "-m",
    options.model,
    "-s",
    "danger-full-access",
    "-C",
    ROOT,
    "--color",
    "never",
    "--output-last-message",
    outputPath,
    "-",
  ];
  const resolved = resolveCodexCommand(options);
  const spawnArgs = [...resolved.argsPrefix, ...codexArgs];
  const command = [resolved.command, ...spawnArgs].map(quoteArg).join(" ");
  const invocationPath = path.join(itemLogDir, "codex-invocation.json");
  await writeFile(invocationPath, `${JSON.stringify({
    command,
    argv: [resolved.command, ...spawnArgs],
    model: options.model,
    model_reasoning_effort: options.reasoningEffort,
    startedAt,
  }, null, 2)}\n`, "utf8");

  const result = await spawnWithInput(resolved.command, spawnArgs, prompt, {
    cwd: ROOT,
    timeoutMs: options.timeoutMs,
  });
  const finishedAt = nowIso(options);
  await writeFile(path.join(itemLogDir, "codex-stdout.log"), result.stdout, "utf8");
  await writeFile(path.join(itemLogDir, "codex-stderr.log"), result.stderr, "utf8");

  const invocation = {
    command,
    model: options.model,
    model_reasoning_effort: options.reasoningEffort,
    startedAt,
    finishedAt,
    exitCode: result.code,
    invocationPath,
  };
  await writeFile(invocationPath, `${JSON.stringify(invocation, null, 2)}\n`, "utf8");
  if (result.code !== 0) throw new Error(`codex exec exited ${result.code}: ${lastLines(result.stderr || result.stdout, 8)}`);
  return invocation;
}

function spawnWithInput(command, args, input, { cwd, timeoutMs }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`codex exec timed out after ${timeoutMs}ms`));
        return;
      }
      resolve({ code, stdout, stderr });
    });
    child.stdin.end(input);
  });
}

function buildEvidenceTrace(evidence, fullText, item) {
  return {
    source: "Hugging Face Daily Papers",
    sourceUrl: item.paper.sourceUrl,
    hfDate: item.paper.hfSubmittedOnDailyAt?.slice(0, 10) || "",
    arxivId: item.paper.arxivId,
    arxivUrl: item.paper.paperUrl,
    fullTextRead: Boolean(fullText?.text && asArray(evidence.sections).includes("Full paper text")),
    fullTextUrl: cleanString(fullText?.url),
    fullTextKind: cleanString(fullText?.kind),
    evidenceKind: evidence.kind,
    evidenceChars: String(evidence.content || "").length,
    sections: asArray(evidence.sections),
  };
}

function failurePayload(item, evidenceTrace, reason) {
  const payload = {
    schema_version: PAPER_PARADIGM_SCHEMA_VERSION,
    paper: paperSummary(item),
    status: "needs_full_text",
    reason,
    evidenceTrace,
  };
  payload.validation = validateParadigmPayload(payload);
  return payload;
}

function dryRunPayload(item, evidenceTrace) {
  return {
    schema_version: PAPER_PARADIGM_SCHEMA_VERSION,
    paper: paperSummary(item),
    meta: {
      title_result_institution_mechanism: `${item.paper.title} - dry-run title`,
      one_sentence_hook: "dry-run hook",
      paper_type: "system",
      hf_upvotes: item.paper.upvotes,
      full_text_basis: evidenceTrace.fullTextRead,
    },
    opening_tension: "dry-run opening tension",
    one_sentence_claim: "dry-run claim",
    result_first: { body: "论文报告 dry-run（来源：Section 1）", source_anchor: "Section 1" },
    lookahead: ["dry-run point one", "dry-run point two"],
    sections: [{
      title: "为什么这个机制不是常见替代方案?",
      body: "dry-run body",
      design_comparisons: [{ choice: "A", why_not_common_alternative: "B", paper_anchor: "Section 2" }],
      evidence: [{ claim: "dry", reported_number: "1", opponent_or_baseline: "baseline", source_anchor: "Table 1" }],
      ablations: [{ question_answered: "是机制在起作用，还是只是模型大/调参好", paper_report: "dry-run", source_anchor: "Table 2" }],
    }],
    meaning: { engineering: "dry", methodology: "dry", application_builder: "dry" },
    limitations: [{ limit: "dry", paper_anchor: "Section Limitations" }],
    closing_line: "dry-run closing",
    numeric_claims: [{ value: "1", claim: "dry", source_anchor: "Table 1" }],
    prose_markdown: "# dry-run",
  };
}

function paperSummary(item = {}) {
  return {
    title: cleanString(item.paper?.title),
    arxivId: cleanString(item.paper?.arxivId),
    authors: asArray(item.paper?.authors).map(cleanString).filter(Boolean),
    sourceUrl: cleanString(item.paper?.sourceUrl),
    arxivUrl: cleanString(item.paper?.paperUrl),
    hfUpvotes: Number(item.paper?.upvotes || 0),
    evaluatorScore: Number(item.evaluation?.score || 0),
  };
}

function articleFromParadigmPayload(payload = {}, item = {}, { generatedAt, hfDate, hfSourceUrl } = {}) {
  const paper = item.paper || payload.paper || {};
  const id = paperArticleId(paper);
  const lookahead = asArray(payload.lookahead).map(cleanString).filter(Boolean).slice(0, 4);
  const sections = asArray(payload.sections);
  const numericClaims = asArray(payload.numeric_claims);
  const sourceUrl = cleanString(paper.sourceUrl || payload.paper?.sourceUrl || item.paper?.sourceUrl || item.paper?.paperUrl);
  const analysisMarkdown = cleanString(payload.prose_markdown || payload.analystNotes || payload.one_sentence_claim);
  return {
    id,
    title: cleanString(paper.title || payload.paper?.title || item.paper?.title),
    authors: authorsString(paper.authors || payload.paper?.authors || item.paper?.authors),
    venue: "Hugging Face Daily Papers / arXiv",
    sourceName: "Hugging Face Daily Papers",
    sourceUrl,
    arxivId: cleanString(paper.arxivId || payload.paper?.arxivId || item.paper?.arxivId),
    publishedAt: cleanString(item.paper?.publishedAt || paper.publishedAt),
    verifiedAt: generatedAt,
    generatedAt,
    tier: "deep",
    cardKind: "deep_v2",
    leadJudgment: cleanString(payload.meta?.one_sentence_hook || payload.one_sentence_claim || payload.opening_tension),
    hook: cleanString(payload.meta?.one_sentence_hook || payload.one_sentence_claim || payload.opening_tension),
    lookahead,
    meta: {
      paperType: normalizePaperType(payload.meta?.paper_type),
      venueStatus: "unverified",
      titleResultInstitutionMechanism: cleanString(payload.meta?.title_result_institution_mechanism),
      hfUpvotes: Number(payload.meta?.hf_upvotes ?? item.paper?.upvotes ?? 0),
      fullTextBasis: Boolean(payload.meta?.full_text_basis),
      sourceReliability: {
        discoverySource: "Hugging Face Daily Papers",
        primarySourceVerified: Boolean(payload.meta?.full_text_basis || payload.evidenceTrace?.fullTextRead),
        paperHtmlFetched: payload.evidenceTrace?.fullTextKind === "html",
        pdfFetched: payload.evidenceTrace?.fullTextKind === "pdf",
        repoFetched: false,
        appendixFetched: /appendix/i.test(JSON.stringify(payload.evidenceTrace || {})),
      },
      tags: normalizeStringArray(item.evaluation?.selection?.track || item.paper?.focusTopics || ["papers"]).slice(0, 8),
    },
    originalReading: sections.length ? originalReadingFromParadigmSections(sections) : [{
      heading: "看点先读",
      summary: lookahead.join(" "),
    }],
    analystNotes: analysisMarkdown,
    limitsAndFuture: {
      paperStated: asArray(payload.limitations).map((limit) => cleanString(limit?.limit || limit)).filter(Boolean).join(" "),
      evidenceNotes: cleanString(payload.result_first?.source_anchor || payload.evidenceTrace?.fullTextUrl || "full-paper evidence used by v2 authoring"),
    },
    selection: {
      convergence: ["Hugging Face Daily Papers"],
      track: normalizeStringArray(item.evaluation?.selection?.track || item.paper?.focusTopics || ["papers"]),
      ideaSignal: cleanString(item.evaluation?.selection?.ideaSignal || item.evaluation?.reason || "selected by HF upvotes plus paper signal"),
    },
    selectionAudit: {
      candidateCount: 0,
      selectedCount: 0,
      selectionScore: Number(item.evaluation?.score || 0),
      selectedReason: cleanString(item.evaluation?.reason || "selected by HF Daily top-N"),
      rejectedReasonIfAny: "",
      weightedFactors: {
        venuePrestige: 12,
        citationConvergence: 34,
        novelty: Number(item.evaluation?.score || 0),
        recency: 100,
        evidenceStrength: numericClaims.length ? Math.min(100, 50 + numericClaims.length * 8) : 40,
        reproducibility: /github|code|repo|open[- ]?source/i.test(JSON.stringify(item.paper || {})) ? 70 : 20,
      },
      discoverySource: "Hugging Face Daily Papers",
      primaryEvidenceSource: payload.evidenceTrace?.fullTextUrl || sourceUrl || "paper full text",
    },
    provenance: {
      sourceUrl,
      evidenceKind: "paper-full-text",
    },
    paradigm: {
      schemaVersion: payload.schema_version || PAPER_PARADIGM_SCHEMA_VERSION,
      openingTension: cleanString(payload.opening_tension),
      oneSentenceClaim: cleanString(payload.one_sentence_claim),
      resultFirst: payload.result_first || null,
      lookahead,
      sections,
      meaning: payload.meaning || null,
      limitations: payload.limitations || [],
      closingLine: cleanString(payload.closing_line),
      numericClaims,
      proseMarkdown: analysisMarkdown,
      evidenceTrace: payload.evidenceTrace || null,
      validation: payload.validation || null,
      authoring: payload.authoring || null,
    },
    sourceContext: {
      hfDate,
      hfSourceUrl,
      hfUpvotes: Number(item.paper?.upvotes || 0),
    },
  };
}

function lightArticleFromRankedPaper(item = {}, { generatedAt, hfDate, hfSourceUrl } = {}) {
  const paper = item.paper || {};
  const lookahead = lightLookahead(item);
  return {
    id: `${paperArticleId(paper)}-light`,
    title: cleanString(paper.title),
    authors: authorsString(paper.authors),
    venue: "Hugging Face Daily Papers / arXiv",
    sourceName: "Hugging Face Daily Papers",
    sourceUrl: cleanString(paper.sourceUrl || paper.paperUrl),
    arxivId: cleanString(paper.arxivId),
    publishedAt: cleanString(paper.publishedAt),
    verifiedAt: generatedAt,
    generatedAt,
    tier: "light",
    cardKind: "light_card",
    leadJudgment: cleanString(paper.abstract ? firstSentence(paper.abstract) : item.evaluation?.reason || "HF Daily Papers light card"),
    hook: cleanString(paper.abstract ? firstSentence(paper.abstract) : item.evaluation?.reason || "HF Daily Papers light card"),
    lookahead,
    meta: {
      paperType: normalizePaperType(null),
      venueStatus: "unverified",
      hfUpvotes: Number(paper.upvotes || 0),
      sourceReliability: {
        discoverySource: "Hugging Face Daily Papers",
        primarySourceVerified: false,
        paperHtmlFetched: false,
        pdfFetched: false,
        repoFetched: Boolean(paper.codeUrl),
        appendixFetched: false,
      },
      tags: normalizeStringArray(item.evaluation?.selection?.track || paper.focusTopics || ["papers"]).slice(0, 8),
    },
    selection: {
      convergence: ["Hugging Face Daily Papers"],
      track: normalizeStringArray(item.evaluation?.selection?.track || paper.focusTopics || ["papers"]),
      ideaSignal: cleanString(item.evaluation?.selection?.ideaSignal || item.evaluation?.reason || "HF Daily light card"),
    },
    selectionAudit: {
      candidateCount: 0,
      selectedCount: 0,
      selectionScore: Number(item.evaluation?.score || 0),
      selectedReason: cleanString(item.evaluation?.reason || "kept as light card after top-N deep selection"),
      rejectedReasonIfAny: "",
      weightedFactors: {
        venuePrestige: 12,
        citationConvergence: 34,
        novelty: Number(item.evaluation?.score || 0),
        recency: 100,
        evidenceStrength: "unknown",
        reproducibility: paper.codeUrl ? 60 : "unknown",
      },
      discoverySource: "Hugging Face Daily Papers",
      primaryEvidenceSource: cleanString(paper.paperUrl || paper.sourceUrl || "arXiv metadata"),
    },
    provenance: {
      sourceUrl: cleanString(paper.sourceUrl || paper.paperUrl),
      evidenceKind: "hf-daily-metadata",
    },
    sourceContext: {
      hfDate,
      hfSourceUrl,
      hfUpvotes: Number(paper.upvotes || 0),
    },
  };
}

async function publishArticlesV2({ generatedAt, deepArticles = [], lightArticles = [], options = {} } = {}) {
  const activeLimit = numberOption(options.activeArticlesLimit, DEFAULT_ACTIVE_ARTICLES_LIMIT);
  const newPapers = [...deepArticles, ...lightArticles].map((paper) => ({
    ...paper,
    selectionAudit: {
      ...paper.selectionAudit,
      candidateCount: deepArticles.length + lightArticles.length,
      selectedCount: deepArticles.length,
    },
  }));
  const existingActive = await readJsonIfExists(ARTICLES_FILE, { papers: [] });
  const existingArchive = await readJsonIfExists(ARTICLES_ARCHIVE_FILE, { papers: [] });
  const archivePapers = mergeArticlePapers([
    ...newPapers,
    ...asArray(existingActive?.papers),
    ...asArray(existingArchive?.papers),
  ]);
  const activePapers = archivePapers.slice(0, activeLimit);
  const articles = {
    generatedAt,
    archiveCount: archivePapers.length,
    retention: {
      activeLimit,
      archiveFile: "public/data/articles-archive.json",
      newPaperCount: newPapers.length,
      deepCount: deepArticles.length,
      lightCount: lightArticles.length,
      archiveCount: archivePapers.length,
    },
    papers: activePapers,
  };
  await writeJson(ARTICLES_FILE, articles);
  await writeJson(ARTICLES_ARCHIVE_FILE, {
    generatedAt,
    archiveCount: archivePapers.length,
    retention: {
      policy: "dedupe-by-paper-id-or-source; active feed is bounded, archive accumulates",
      activeLimit,
    },
    papers: archivePapers,
  });
  return {
    articlesFile: ARTICLES_FILE,
    archiveFile: ARTICLES_ARCHIVE_FILE,
    activePaperCount: activePapers.length,
    archiveCount: archivePapers.length,
    deepCount: deepArticles.length,
    lightCount: lightArticles.length,
  };
}

function mergeArticlePapers(papers = []) {
  const byKey = new Map();
  for (const paper of papers) {
    if (!paper || typeof paper !== "object" || Array.isArray(paper)) continue;
    const key = articleDedupeKey(paper);
    if (!key) continue;
    const existing = byKey.get(key);
    if (!existing || articleTime(paper) >= articleTime(existing)) byKey.set(key, paper);
  }
  return [...byKey.values()].sort((left, right) => articleTime(right) - articleTime(left)
    || Number(right.sourceContext?.hfUpvotes || right.meta?.hfUpvotes || 0) - Number(left.sourceContext?.hfUpvotes || left.meta?.hfUpvotes || 0)
    || cleanString(left.title).localeCompare(cleanString(right.title)));
}

function articleDedupeKey(paper = {}) {
  const arxiv = baseArxivId(paper.arxivId || "");
  return cleanString(arxiv ? `${arxiv}:${paper.tier || "paper"}` : "")
    || cleanString(paper.id)
    || cleanString(paper.sourceUrl && paper.title ? `${paper.sourceUrl}::${paper.title}` : "")
    || cleanString(paper.title).toLowerCase();
}

function articleTime(paper = {}) {
  const parsed = Date.parse(paper.verifiedAt || paper.generatedAt || paper.updatedAt || paper.publishedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function sectionKeyResults(section = {}) {
  return asArray(section.evidence).map((item) => ({
    kind: /table/i.test(item?.source_anchor || "") ? "table" : /fig/i.test(item?.source_anchor || "") ? "figure" : "result",
    ref: cleanString(item?.source_anchor || "Result"),
    finding: cleanString([item?.claim, item?.reported_number, item?.opponent_or_baseline].filter(Boolean).join(" / ")),
  })).filter((item) => item.ref && item.finding);
}

function originalReadingFromParadigmSections(sections = []) {
  let budget = 5;
  return asArray(sections).map((section, index) => {
    const keyResults = sectionKeyResults(section).slice(0, budget);
    budget -= keyResults.length;
    return {
      heading: cleanString(section.title || `Section ${index + 1}`),
      summary: cleanString(section.body || section.summary || ""),
      ...(keyResults.length ? { keyResults } : {}),
    };
  }).filter((section) => section.heading && section.summary);
}

function lightLookahead(item = {}) {
  const paper = item.paper || {};
  const tracks = normalizeStringArray(item.evaluation?.selection?.track || paper.focusTopics).slice(0, 2);
  return [
    paper.abstract ? `核心问题：${firstSentence(paper.abstract)}` : "",
    tracks.length ? `看点：${tracks.join(" / ")}` : "",
    Number(paper.upvotes || 0) ? `HF 热度：${Number(paper.upvotes || 0)} upvotes` : "",
  ].map(cleanString).filter(Boolean).slice(0, 3);
}

function normalizePaperType(value) {
  const kind = cleanString(value).toLowerCase();
  if (["survey", "theory", "system", "benchmark", "dataset", "industry_case", "evaluation_audit", "tooling", "position_roadmap"].includes(kind)) return kind;
  if (/bench|eval/.test(kind)) return "benchmark";
  if (/data/.test(kind)) return "dataset";
  if (/survey|review/.test(kind)) return "survey";
  if (/tool/.test(kind)) return "tooling";
  return "system";
}

function paperArticleId(paper = {}) {
  const arxiv = baseArxivId(paper.arxivId || paper.paperUrl || paper.sourceUrl || "");
  return arxiv ? `paper-${arxiv.replace(".", "-")}` : `paper-${slugify(paper.title)}`;
}

function authorsString(value) {
  const authors = asArray(value).map(cleanString).filter(Boolean);
  return authors.length ? authors.join(", ") : "Authors not provided";
}

function normalizeStringArray(value) {
  return asArray(value).map(cleanString).filter(Boolean);
}

function firstSentence(value = "") {
  const text = cleanString(value);
  const match = text.match(/^(.{40,240}?[.!?。！？])\s/);
  return match ? match[1] : text.slice(0, 220);
}

async function readJsonIfExists(file, fallback) {
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function summaryResult(result = {}) {
  const { payload, ...rest } = result;
  return rest;
}

async function fetchText(url, { timeoutMs = 30000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": "ai-brief-papers-codex-deepdive/0.1" },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

function decodeHtmlAttribute(value = "") {
  return String(value)
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function hasSourceAnchor(value) {
  return /\b(?:Table|Figure|Fig\.?|Section|Appendix|Algorithm|Eq\.?)\b|表|图|节|附录|算法|公式/i.test(cleanString(value));
}

function resolveCodexCommand(options = {}) {
  if (options.codexBin && options.codexBin !== "codex") return { command: options.codexBin, argsPrefix: [] };
  if (process.platform !== "win32") return { command: options.codexBin || "codex", argsPrefix: [] };
  const npmRoot = process.env.APPDATA ? path.join(process.env.APPDATA, "npm") : "";
  const codexJs = npmRoot ? path.join(npmRoot, "node_modules", "@openai", "codex", "bin", "codex.js") : "";
  if (codexJs) return { command: process.execPath, argsPrefix: [codexJs] };
  return { command: options.codexBin || "codex", argsPrefix: [] };
}

function valueAfterEquals(arg) {
  return arg.slice(arg.indexOf("=") + 1);
}

function numberOption(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function baseArxivId(value = "") {
  const match = String(value).match(/(\d{4}\.\d{4,5})(v\d+)?/);
  return match ? match[1] : "";
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-") || "paper";
}

function relativeToRoot(value) {
  return path.relative(ROOT, path.resolve(ROOT, value || "")) || ".";
}

function quoteArg(value) {
  const raw = String(value);
  return /^[A-Za-z0-9_./:=\\"-]+$/.test(raw) ? raw : JSON.stringify(raw);
}

function lastLines(value, count) {
  return String(value || "").trim().split(/\r?\n/).slice(-count).join("\n");
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/papers/codex-deepdive.mjs --limit 1

Runs a point-to-point papers deep analysis:
  Hugging Face Daily Papers -> top by upvotes -> full arXiv text -> codex gpt-5.5 high -> logs/papers-paradigm-p2p

Flags:
  --limit N              1 or 2 only. Default: 1.
  --log-root DIR         Output directory. Default: logs/papers-paradigm-p2p
  --model NAME           Default: gpt-5.5
  --reasoning-effort X   Default: high
  --no-codex             Fetch/select/validate with a dry-run payload.
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

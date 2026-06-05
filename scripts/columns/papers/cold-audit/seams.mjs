#!/usr/bin/env node
// Prompt builders + source loader for the cold-audit orchestrator.
//
// These are the seams the README marks "stubbed (PM/codex to wire)":
//   - buildPrompt        → the codex AUTHOR / REVISE prompt (round 1 authors, round >1 revises per fixes)
//   - buildAuditPrompt   → the Claude COLD-AUDIT prompt (two-stage: A blind retell, B open-book diff)
//   - loadSource         → loads the paper's full text (+ repo URL) for Stage B
//
// They are kept OUT of orchestrator.mjs on purpose: orchestrator.mjs owns mechanics
// (loop / gate / hold / files); this file owns paradigm prompt content + I/O for the source.
// All three are PURE STRING/OBJECT builders (no CLI spend) so they're unit-testable and the
// orchestrator's real seams (makeCodexAuthorFn / makeClaudeAuditFn) just embed their output.
//
// 铁律 (cold-audit-prompt.md): author = codex GPT-5.5 high reading the FULL source;
// auditor = Claude in a FRESH context. The audit prompt must FORBID reusing author context,
// gate Stage B behind Stage A, and demand strict JSON matching the diagnosis schema.

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fetchFullPaperText } from "../sources.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");

// The 5 「透彻」criteria, mirrored from orchestrator.CRITERIA (kept local so this file has no
// runtime import cycle with the orchestrator; the orchestrator validates against its own copy).
export const CRITERIA = ["retellable", "faithful", "mechanism", "concrete", "judgment"];

// Gold reference the auditor calibrates against (faithfulness = full marks, verify-before-bless passed).
export const GOLD_SAMPLE_DIR = "content/papers/2606.02060-drift-agent-error-localization";

// ---------------------------------------------------------------------------
// loadSource — full text (+ repo) for Stage B (open-book faithfulness diff)
// ---------------------------------------------------------------------------

/**
 * Load the original source for Stage B: the paper full text (arXiv HTML/PDF) plus the repo URL.
 *
 * Pure I/O: it fetches/reads strings, it does NOT call any LLM/CLI. Mockable via deps.fetchText
 * so tests never hit the network.
 *
 * @param {object} paper   { arxivId, title, sourceUrl, paperUrl, pdfUrl, codeUrl, contentDir }
 * @param {object} [deps]
 * @param {function} [deps.fetchFullText]  (paper, options) => Promise<{ text, url, kind } | null>
 * @param {number}   [deps.maxChars]       cap the full text (token budget). Default 120k.
 * @param {function} [deps.readFileFn]     (path, enc) => Promise<string>, for the on-disk artifact read.
 * @returns {Promise<{ fullText, fullTextUrl, fullTextKind, repoUrl, available, note }>}
 */
export async function loadSource(paper = {}, deps = {}) {
  const {
    fetchFullText = (p, opts) => fetchFullPaperText(p, opts),
    maxChars = 120000,
    options = {},
  } = deps;

  let fetched = null;
  try {
    fetched = await fetchFullText(paper, options);
  } catch (error) {
    fetched = null;
    // Fetch is best-effort; the auditor is told below when the source is missing.
    if (deps.logger?.warn) deps.logger.warn(`[cold-audit] loadSource full-text fetch failed: ${error.message}`);
  }

  const text = String(fetched?.text || "").slice(0, maxChars);
  return {
    fullText: text,
    fullTextUrl: fetched?.url || paper.paperUrl || paper.sourceUrl || "",
    fullTextKind: fetched?.kind || "",
    // Repo source is referenced by URL; cloning is the author's job (codex reads the repo).
    // The auditor diffs the artifact's repo CLAIMS against this URL / any provided repo text.
    repoUrl: paper.codeUrl || "",
    available: Boolean(text),
    note: text
      ? ""
      : "全文未取到(arXiv HTML/PDF 抓取失败)。Stage B 只能基于元数据 + 仓库 URL 做有限对账,缺口处标「数据不足」,不得脑补。",
  };
}

/**
 * Read the on-disk deep-read artifact (paper.mdx + career.mdx + metadata.json) the auditor reads
 * in Stage A. Returns the raw strings; the orchestrator passes this object as the `artifact`.
 */
export async function loadArtifact(contentDir, deps = {}) {
  const readFn = deps.readFileFn || ((p) => readFile(p, "utf8"));
  const dir = path.isAbsolute(contentDir) ? contentDir : path.join(ROOT, contentDir);
  const [paperMdx, careerMdx, metaRaw] = await Promise.all([
    readFn(path.join(dir, "paper.mdx")).catch(() => ""),
    readFn(path.join(dir, "career.mdx")).catch(() => ""),
    readFn(path.join(dir, "metadata.json")).catch(() => "{}"),
  ]);
  let metadata = {};
  try {
    metadata = JSON.parse(metaRaw);
  } catch {
    metadata = {};
  }
  return { contentDir: dir, paperMdx: String(paperMdx), careerMdx: String(careerMdx), metadata };
}

// ---------------------------------------------------------------------------
// buildPrompt — codex AUTHOR / REVISE prompt
// ---------------------------------------------------------------------------

/**
 * Build the codex author prompt.
 *   round 1  → author from the FULL source (full-text + repo), per the daily-deepread paradigm.
 *   round >1 → a TARGETED revise: embed the auditor's `fixes` + the previous artifact, fix only
 *              the flagged major gaps, do NOT rewrite wholesale, do NOT regress passing parts.
 *
 * @param {object} paper                  { arxivId, title, sourceUrl, contentDir, codeUrl, ... }
 * @param {object} ctx                     { round, fixes:[], prevArtifact }
 * @param {object} [opts]                  { goldSampleDir, paradigmSpec }
 * @returns {string} the prompt to pipe to codex on stdin.
 */
export function buildPrompt(paper = {}, ctx = {}, opts = {}) {
  const { round = 1, fixes = [], prevArtifact = null } = ctx;
  const goldSampleDir = opts.goldSampleDir || GOLD_SAMPLE_DIR;
  const paradigmSpec = opts.paradigmSpec || "docs/superpowers/specs/daily-deepread-prompt.md";
  const id = paper.arxivId || paper.arxiv_id || paper.id || "?";
  const contentDir = paper.contentDir || `content/papers/${id}-<slug>`;

  const head = `你是 AI-Brief 的论文深读作者(codex GPT-5.5, effort high)。${
    round === 1 ? "第 1 轮:从全文从头写。" : `第 ${round} 轮:按冷审反馈做定点修订。`
  }

铁律:
- 必须读 FULL 全文(arXiv HTML/PDF)+ 仓库源码(clone ${paper.codeUrl || "代码仓库(若有)"}),不许只看摘要。
- 不编造:数字/结论来自全文;不确定标「以原文表为准」或「数据不足 / 原文未披露」。自报(README/作者自称) vs 实测要分。
- 全中文(代码/数字/专有名词/英文术语保留);术语第一次出现用大白话解释机制。
- 架构图用 Mermaid 围栏;代码围栏配平。
- 范式严格按 ${paradigmSpec};金样参照 ${goldSampleDir}/(忠实满分)。

论文:
- arxiv_id: ${id}
- 标题: ${paper.title || ""}
- HF/源 URL: ${paper.sourceUrl || ""}
- arXiv URL: ${paper.paperUrl || ""}
- 代码仓库: ${paper.codeUrl || "(无 / 未披露)"}
- 产出目录: ${contentDir}/  (paper.mdx + career.mdx + metadata.json + data/autosci/primitives/${id}.yaml)`;

  if (round === 1) {
    return `${head}

产出(完全仿照样板 ${goldSampleDir}/ 的结构与风格):
- paper.mdx —— 一句话/问题/关键术语表/核心方法/架构(Mermaid)/创新点表/实验证据(真实数字)/限制风险/先读什么。
- career.mdx —— 对应用型 AI 工程师/FDE 的价值、该学技能、系统设计心法、作品集角度、可造表、诚实简历句、学习清单。
- metadata.json —— scores 8 维、one_sentence_judgment、human_tabs:["paper","career"]、source_rankings、tags、status:"deep_read"。

只输出写入文件(就地落盘),最后用一行 JSON 汇报 { "arxivId", "contentDir", "wroteFiles": ["paper.mdx", ...] }。`;
  }

  // round > 1: targeted revise.
  const fixList = (Array.isArray(fixes) ? fixes : [])
    .map((f, i) => `  ${i + 1}. ${String(f)}`)
    .join("\n");
  const prevSummary = summarizePrevArtifact(prevArtifact);

  return `${head}

冷审(Claude,跨模型,全新上下文)判定上一版仍有【重大缺口】。只修下面这些,别动已通过的部分,别整篇重写:

需修复(逐条 = [维度] 缺口 → 在哪个文件/小节补什么,引到原文哪处):
${fixList || "  (冷审未给出结构化 fixes;回到全文逐维自查 retellable/faithful/mechanism/concrete/judgment 五条)"}

上一版概要(供定位,不要照抄):
${prevSummary}

修订要求:
- 逐条对照上面 fixes,回到全文/仓库取证后再改;编造一律删,缺口处标「数据不足 / 原文未披露」。
- 不得为过审而注水或软化诚实弱点;保持 ${goldSampleDir}/ 的忠实标准。
- 就地改写文件,最后用一行 JSON 汇报 { "arxivId", "contentDir", "round": ${round}, "appliedFixes": [...] }。`;
}

function summarizePrevArtifact(prevArtifact) {
  if (!prevArtifact) return "  (无上一版可读;按全文重写但保留 round-1 已确认无误的事实)";
  if (typeof prevArtifact === "string") return prevArtifact.slice(0, 1200);
  const paperMdx = String(prevArtifact.paperMdx || "").slice(0, 800);
  const careerMdx = String(prevArtifact.careerMdx || "").slice(0, 400);
  const parts = [];
  if (paperMdx) parts.push(`paper.mdx(节选):\n${paperMdx}`);
  if (careerMdx) parts.push(`career.mdx(节选):\n${careerMdx}`);
  return parts.join("\n\n") || "  (上一版无可读正文)";
}

// ---------------------------------------------------------------------------
// buildAuditPrompt — Claude COLD-AUDIT prompt (two-stage)
// ---------------------------------------------------------------------------

/**
 * Build the two-stage cold-audit prompt for the auditor (Claude, fresh cross-model context).
 *
 * Hard requirements (cold-audit-prompt.md):
 *  (a) FORBID reusing any author/generation context — you are a fresh independent cold auditor.
 *  (b) GATE Stage B behind Stage A: do the BLIND retell first, seeing ONLY the analysis, THEN open
 *      the source. (We can't enforce ordering inside one model call, so we instruct it explicitly
 *      and make Stage A's blind retell a required, separately-reported field so cheating is visible.)
 *  (c) Demand STRICT JSON ONLY matching the diagnosis schema.
 *  (d) Reference the rubric's 5 criteria + the DRIFT gold sample.
 *
 * @param {object} artifact   the deep-read being audited ({ paperMdx, careerMdx, metadata } or string)
 * @param {object} source     from loadSource() ({ fullText, fullTextUrl, repoUrl, available, note })
 * @param {object} ctx        { round, paper }
 * @returns {string}
 */
export function buildAuditPrompt(artifact, source = {}, ctx = {}) {
  const { round = 1, paper = {} } = ctx;
  const id = paper.arxivId || paper.arxiv_id || paper.id || "?";
  const artifactText = renderArtifactForAudit(artifact);
  const sourceText = renderSourceForAudit(source);

  return `你是一个【独立冷审 agent】,跨模型、全新上下文。你**没有**这篇深读的任何生成历史,不许复用作者的任何上下文或假设。
你的唯一职责:按下面的 rubric 审这篇论文深读,判它能不能进 L0 地基。宁可少一篇,不可带病入库。

# 铁律
- 永不替作者补全:原文没披露的,标「数据不足 / 原文未披露」,不脑补。
- 只对【重大】缺口要求返工。重大 = 会误导读者,或读者无法理解/复述某个核心要素。次要(锦上添花)放过,不要正向追完美。
- 自报(README/作者自称)当事实 → 标「自称」,要求走源码核。

# 两段式(顺序不可颠倒)
## Stage A —— 盲读 · 可教性(此刻只看下方【待审深读】,先不要看【原始来源】)
1. 用你自己的话复述:① 解决什么问题 ② 用什么机制 ③ 关键证据。
2. 列出「没懂 / 没解释 / 跟不上」的点。
这是诚实测「学生只拿这篇分析能不能学会」。**Stage A 的复述必须只基于深读本身**;若你提前看了原文,此测作废。把盲读结果写进输出的 stageA 字段。

## Stage B —— 开卷 · 忠实对账(现在放出【原始来源】:全文 + 仓库)
拿 Stage A 的盲读复述去 diff 原文/源码:
- 复述错了/串了 → 教错(清晰度/忠实度差)。
- 复述漏了原文要点 → 覆盖缺口。
- 分析里有原文不支持的话 / 数字对不上 → 忠实度失败(零容忍,永不许「差不多」)。
- README/自报当事实 → 标「自称」,要求走源码核。

# 「透彻」= 这 5 条全部「无重大缺口」(反向定义)
1. retellable(可复述):盲读能正确复述 问题/机制/证据。任一错或跟不上 = 重大。
2. faithful(忠实):无原文不支持的话;自报 vs 实测分清;无编造数字。任一编造 = 重大。
3. mechanism(机制可懂):用具体例子/类比讲到「为什么成立」,非翻译机。核心机制只报名词没解释 = 重大。
4. concrete(具体):真实 config/代码/数字来自原文;原文有而分析停在类目层 = 重大。
5. judgment(对建造者的判断):解锁了什么 + 诚实弱点(成本/评测偏置/成熟度);纯描述零判断 = 重大。

金样参照(忠实满分,已过 verify-before-bless):${GOLD_SAMPLE_DIR}/

# 输出:严格 JSON,只输出 JSON,不要任何解释性散文、不要 markdown 围栏。Schema:
{
  "stageA": { "retell": "盲读复述(问题/机制/证据)", "confusions": ["没懂/跟不上的点", "..."] },
  "stageB": { "faithful": true, "notes": "对账要点(错/漏/编造/自称)" },
  "perCriterion": [
    { "criterion": "retellable|faithful|mechanism|concrete|judgment",
      "severity": "major|minor|none",
      "gap": "具体缺口(没有则空串)",
      "fix": "在哪个文件/小节补什么,引到原文哪处(没有则空串)" }
  ],
  "verdict": "pass|revise|hold"
}
说明:5 个 criterion 都要给一条;有重大缺口 severity=major;裁判以 severity=major 为准(不以 verdict 字段为准)。本轮 round=${round}。

# ====== 待审深读(arxiv ${id}) ======
${artifactText}

# ====== 原始来源(Stage B 才看;全文 + 仓库) ======
${sourceText}`;
}

function renderArtifactForAudit(artifact) {
  if (!artifact) return "(空 — 无深读可审,按重大缺口处理)";
  if (typeof artifact === "string") return artifact.slice(0, 60000);
  const parts = [];
  if (artifact.paperMdx) parts.push(`## paper.mdx\n${String(artifact.paperMdx).slice(0, 40000)}`);
  if (artifact.careerMdx) parts.push(`## career.mdx\n${String(artifact.careerMdx).slice(0, 20000)}`);
  if (artifact.metadata && typeof artifact.metadata === "object") {
    parts.push(`## metadata.json(节选)\n${JSON.stringify({
      one_sentence_judgment: artifact.metadata.one_sentence_judgment,
      scores: artifact.metadata.scores,
      tags: artifact.metadata.tags,
    }, null, 2)}`);
  }
  // Fallback: the codex artifact might be the raw paradigm payload (prose_markdown).
  if (!parts.length && artifact.prose_markdown) parts.push(String(artifact.prose_markdown).slice(0, 60000));
  return parts.join("\n\n") || JSON.stringify(artifact).slice(0, 60000);
}

function renderSourceForAudit(source = {}) {
  const header = [
    source.fullTextUrl ? `全文来源: ${source.fullTextUrl} (${source.fullTextKind || "?"})` : "",
    source.repoUrl ? `仓库: ${source.repoUrl}` : "仓库: (无 / 未披露)",
    source.available ? "" : `⚠ ${source.note || "全文未取到"}`,
  ].filter(Boolean).join("\n");
  const body = source.available ? String(source.fullText) : "(全文未取到 —— Stage B 缺口处一律标「数据不足」,不得脑补)";
  return `${header}\n\n${body}`;
}

export { ROOT as SEAMS_ROOT };

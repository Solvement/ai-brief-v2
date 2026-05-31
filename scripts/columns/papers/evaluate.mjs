import { createDeepSeekClient } from "../../lib/llm.mjs";
import { defaultSelect } from "../../lib/pipeline-kernel.mjs";

const CORE_JOB_RE = /\b(AI|artificial intelligence|machine learning|deep learning|foundation models?|large language models?|LLMs?|transformers?|post[- ]?training|alignment|agentic|agent|harness|observability|trajectory|execution trace|middleware|rollback|self[- ]?improv|tool[- ]?use|function calling|coding agent|SWE[- ]?Bench|Terminal[- ]?Bench|software engineering|debugging|program repair|RAG|retrieval|memory|benchmark|evaluation|eval|security|reliability|workflow|pipeline|infrastructure|production|customer|enterprise|API|endpoint|MCP|deployment|governance|permission|codebase|data schema|data preparation)\b|人工智能|机器学习|深度学习|大模型|大语言模型|基础模型|智能体|多模态/i;
const NARROW_VERTICAL_RE = /\b(gaming|game|interior design|3D room|virtual reality|short-video|short video|bioinformatics|medical|protein|chemistry|robotics vertical)\b/i;

const FOCUS_TOPICS = [
  {
    label: "Broad AI / ML",
    patterns: [/\bAI\b/i, /\bartificial intelligence\b/i, /\bmachine learning\b/i, /\bdeep learning\b/i, /\bfoundation models?\b/i, /\blarge language models?\b/i, /\bLLMs?\b/i, /\btransformers?\b/i, /\bpost[- ]?training\b/i, /\balignment\b/i, /人工智能|机器学习|深度学习|大模型|大语言模型|基础模型|智能体|多模态/],
  },
  {
    label: "AI Application Engineering / FDE",
    patterns: [/\bcustomer\b/i, /\benterprise\b/i, /\bproduction\b/i, /\breal[- ]world\b/i, /\bdeployed\b/i, /\bdeployment\b/i, /\bAPI\b/i, /\bendpoint\b/i, /\bconnector\b/i, /\bMCP\b/i, /\bworkflow\b/i, /\bRAG\b/i, /\bretriev/i, /\bobservability\b/i, /\bgovernance\b/i, /\bpermission(?:s)?\b/i, /\bauth(?:entication|orization)?\b/i, /\bcodebase\b/i, /\bdata schema\b/i, /\bdata pipeline\b/i],
  },
  {
    label: "AI Agents",
    patterns: [/\bagents?\b/i, /\bautonomous\b/i, /\bweb agent\b/i, /\bcomputer use\b/i, /\bmulti-agent\b/i, /\bagentic\b/i],
  },
  {
    label: "Tool Use",
    patterns: [/\btool[- ]?use\b/i, /\bfunction calling\b/i, /\bAPI\b/i, /\btools?\b/i, /\bworkflow\b/i],
  },
  {
    label: "AI Coding / SWE Agents",
    patterns: [/\bSWE[- ]?Bench\b/i, /\bTerminal[- ]?Bench\b/i, /\bcoding agent\b/i, /\bsoftware engineering\b/i, /\bdebugg/i, /\bcode generation\b/i, /\bprogram repair\b/i],
  },
  {
    label: "Agent Harness / Observability",
    patterns: [/\bharness\b/i, /\bharness engineering\b/i, /\bagentic harness\b/i, /\bobservability\b/i, /\btrajectory\b/i, /\bexecution trace\b/i, /\bmiddleware\b/i, /\brollback\b/i, /\bself[- ]?improv/i],
  },
  {
    label: "RAG / Knowledge Systems",
    patterns: [/\bRAG\b/i, /\bretriev/i, /\bknowledge\b/i, /\bmemory\b/i, /\blong[- ]?term\b/i, /\bGraphRAG\b/i],
  },
  {
    label: "AIGC Image/Video/Product Workflows",
    patterns: [/\bimage generation\b/i, /\bvideo generation\b/i, /\bdiffusion\b/i, /\bgenerative media\b/i, /\bcreative workflow\b/i],
  },
  {
    label: "Multimodal UI",
    patterns: [/\bmultimodal\b/i, /\bGUI\b/i, /\buser interface\b/i, /\bUI\b/i, /\bvision-language\b/i, /\bVLM\b/i],
  },
  {
    label: "Evaluation / Benchmarks",
    patterns: [/\beval/i, /\bbenchmark/i, /\bleaderboard\b/i, /\bassessment\b/i, /\breliability\b/i],
  },
  {
    label: "LLM Security / Reliability",
    patterns: [/\bsecurity\b/i, /\bsafety\b/i, /\brobust/i, /\bhallucination\b/i, /\bjailbreak\b/i, /\btrustworthy\b/i],
  },
  {
    label: "Human-AI Interaction",
    patterns: [/\bhuman[- ]?AI\b/i, /\binteraction\b/i, /\buser study\b/i, /\bUX\b/i, /\bcollaboration\b/i],
  },
];

const AHE_STRONG_SIGNALS = [
  { label: "harness engineering", pattern: /\bharness engineering\b/i },
  { label: "agent harness", pattern: /\b(?:agent|agentic) harness(?:es)?\b/i },
  { label: "observability", pattern: /\bobservability\b/i },
  { label: "execution trace", pattern: /\bexecution traces?\b/i },
  { label: "trajectory", pattern: /\btrajector(?:y|ies)\b/i },
  { label: "rollback", pattern: /\brollback|revertible|regression[- ]?free\b/i },
  { label: "Terminal-Bench", pattern: /\bTerminal[- ]?Bench\b/i },
  { label: "self-improving coding agent", pattern: /\bself[- ]?improv(?:ing|ed)? coding agents?\b/i },
];

const FDE_SIGNAL_RULES = [
  { label: "customer/production system", patterns: [/\bcustomer\b/i, /\benterprise\b/i, /\bproduction\b/i, /\breal[- ]world\b/i, /\bdeployed\b/i, /\bdeployment\b/i, /\bservice\b/i] },
  { label: "API/tool/MCP integration", patterns: [/\bAPI\b/i, /\bSDK\b/i, /\bendpoint\b/i, /\bwebhook\b/i, /\bconnector\b/i, /\bintegration\b/i, /\btool[- ]?use\b/i, /\bfunction calling\b/i, /\btool calling\b/i, /\bMCP\b/i] },
  { label: "workflow readiness", patterns: [/\bworkflow\b/i, /\bbusiness process\b/i, /\bhuman[- ]in[- ]the[- ]loop\b/i, /\bhandoff\b/i, /\borchestrat/i] },
  { label: "RAG/knowledge system", patterns: [/\bRAG\b/i, /\bretrieval[- ]augmented\b/i, /\bretriev/i, /\bknowledge base\b/i, /\bmemory\b/i, /\bGraphRAG\b/i] },
  { label: "evaluation/reliability gate", patterns: [/\beval(?:uation)? harness\b/i, /\bregression (?:test|gate)\b/i, /\bfailure modes?\b/i, /\breliability\b/i, /\bbenchmark(?:ing)? framework\b/i] },
  { label: "observability/debugging", patterns: [/\bobservability\b/i, /\bmonitoring\b/i, /\blog(?:ging|s)?\b/i, /\btrace(?:s|ability)?\b/i, /\bexecution trace\b/i, /\bdebugg/i] },
  { label: "deployment/runbook", patterns: [/\bdeploy(?:ment|ed)?\b/i, /\brollout\b/i, /\brollback\b/i, /\brunbook\b/i, /\binfrastructure\b/i, /\blatency\b/i, /\bcost\b/i] },
  { label: "governance/permissions", patterns: [/\bgovernance\b/i, /\bpermission(?:s)?\b/i, /\bauth(?:entication|orization)?\b/i, /\bRBAC\b/i, /\bPII\b/i, /\bprivacy\b/i, /\bsecurity\b/i, /\bcompliance\b/i, /\baudit trail\b/i] },
  { label: "artifact-level diagnosis", patterns: [/\bcodebase\b/i, /\brepositor(?:y|ies)\b/i, /\bwebsite\b/i, /\bsite audit\b/i, /\bcustomer data\b/i, /\bdata schema\b/i, /\bdata pipeline\b/i, /\bdata quality\b/i, /\bdatabase\b/i, /\bwarehouse\b/i, /\bticket(?:s)?\b/i, /\banalytics\b/i, /\bartifact(?:s)?\b/i] },
];

const PURE_ALGORITHM_PATTERNS = [
  /\bscaling law\b/i,
  /\bmodel scaling\b/i,
  /\bpre[- ]?training\b/i,
  /\btraining recipe\b/i,
  /\boptimizer\b/i,
  /\bloss function\b/i,
  /\battention kernel\b/i,
  /\bsparse attention\b/i,
  /\bMoE routing\b/i,
  /\btokenizer\b/i,
  /\bparameter count\b/i,
  /\bleaderboard[- ]only\b/i,
  /\bstate[- ]of[- ]the[- ]art\b/i,
  /\bSOTA\b/i,
];

const TOPIC_ORDER = [
  "AI Application Engineering / FDE",
  "Agent Harness / Observability",
  "AI Coding / SWE Agents",
  "Evaluation / Benchmarks",
  "RAG / Knowledge Systems",
  "AI Agents",
  "Tool Use",
  "Multimodal UI",
  "AIGC Image/Video/Product Workflows",
  "LLM Security / Reliability",
  "Human-AI Interaction",
  "Broad AI / ML",
];

const TRUSTED_SOURCE_RULES = [
  { key: "Best paper award", topOrOfficial: true, priority: "best_paper", pattern: /\b(best[_ -]?paper|best paper award|AI Best Paper Awards|Outstanding Paper|Honou?rable Mention|Best Main Track|最佳论文|杰出论文|优秀论文)\b/i },
  { key: "Datawhale 科鲸", topOrOfficial: false, priority: "curated_platform", pattern: /\bDatawhale\b|科鲸/i },
  { key: "机器之心", topOrOfficial: false, priority: "curated_platform", pattern: /机器之心|\bJiqizhixin\b|\bSynced\b|\bSyncedReview\b/i },
  { key: "OpenReview/top venue", topOrOfficial: true, pattern: /\b(OpenReview|ICLR|ICML|NeurIPS)\b/i },
  { key: "ACL Anthology", topOrOfficial: true, pattern: /\b(ACL Anthology|ACL|EMNLP|NAACL)\b/i },
  { key: "CVF Open Access", topOrOfficial: true, pattern: /\b(CVF|CVPR|ICCV)\b/i },
  { key: "OpenAI", topOrOfficial: true, pattern: /\bOpenAI\b/i },
  { key: "Anthropic", topOrOfficial: true, pattern: /\bAnthropic\b/i },
  { key: "Google DeepMind", topOrOfficial: true, pattern: /\b(Google DeepMind|DeepMind)\b/i },
  { key: "Meta", topOrOfficial: true, pattern: /\bMeta\b/i },
  { key: "Microsoft", topOrOfficial: true, pattern: /\bMicrosoft\b/i },
  { key: "NVIDIA", topOrOfficial: true, pattern: /\bNVIDIA\b/i },
  { key: "Hugging Face Daily Papers", topOrOfficial: false, pattern: /\bHugging Face\b/i },
  { key: "Papers with Code trending", topOrOfficial: false, pattern: /\bPapers with Code\b/i },
  { key: "arXiv", topOrOfficial: false, pattern: /\barXiv\b/i },
];

export async function evaluate(candidate, evidence, ctx = {}) {
  const options = ctx.options || {};
  const paper = normalizePaper(candidate?.raw || candidate || {});
  const baseTriage = deterministicTriage(paper);
  const convergence = trustedConvergence(paper);
  const track = paperTracks(paper);
  const cheapModel = await cheapModelAdjustment([{ ...paper, id: paper.id || candidate?.id, triage: baseTriage }], ctx);
  const model = cheapModel.get(paper.id || candidate?.id);
  const triage = applyModelAdjustment(baseTriage, model);
  const ideaSignal = ideaSignalFor(triage);
  const priority = priorityForConvergence(convergence);
  const selected = shouldSelect({ triage, convergence, track, priority });
  const evaluatedAt = nowIso(options);
  const result = {
    candidateId: candidate?.id || paper.id,
    decision: selected ? "select" : "archive",
    mode: "rank",
    score: triage.total_score,
    reason: reasonForEval({ selected, triage, convergence, track, priority, model }),
    signals: evalSignals({ convergence, track, priority, ideaSignal, fdeSignals: triage.matched_fde_signals }),
    provenance: {
      evaluator: model ? "llm+heuristic-features" : "heuristic-offline",
      source: candidate?.source || paper.source || "papers",
      sourceName: paper.sourceName || "",
      sourceUrl: paper.sourceUrl || paper.paperUrl || "",
      evidenceKind: evidence?.kind || "paper-text",
      radarDecision: triage.decision,
      evaluatedAt,
    },
    selection: {
      convergence: convergence.map((item) => item.key),
      track,
      priority,
      ideaSignal,
    },
    evaluatedAt,
  };

  if (options.db) {
    options.db.upsertEval({
      candidateId: result.candidateId,
      decision: result.decision,
      mode: result.mode,
      score: result.score,
      signals: result.signals,
      reason: result.reason,
      evaluatedAt,
    });
    options.db.insertAnalysis({
      candidateId: result.candidateId,
      tier: "light",
      payload: {
        score: result.score,
        reason: result.reason,
        signals: result.signals,
        selection: result.selection,
        provenance: result.provenance,
        triage,
      },
      model: result.provenance.evaluator,
      generatedAt: evaluatedAt,
    });
  }

  return result;
}

export function select(items, ctx = {}) {
  const selected = defaultSelect(items.filter((item) => item?.eval?.decision === "select"), {
    keepDecisions: ["select"],
    dropDecisions: ["archive", "reject", "drop", "skip", "fail"],
  });
  const cap = numberOption(ctx.options?.cap ?? ctx.options?.papersCap, null);
  return cap === null ? selected : selectDiverseTop(selected, cap);
}

function deterministicTriage(candidate) {
  const scores = deterministicScores(candidate);
  const total = weightedTotal(scores);
  const days = ageDays(candidate);
  const freshnessSignal = days <= 14 ? "new" : days <= 90 ? "recent" : "archive";
  const hotnessSignal = /Hugging Face|Papers with Code|OpenReview|OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA|Datawhale|科鲸|机器之心|Jiqizhixin|Synced|AI Best Paper|best paper|Outstanding Paper|最佳论文/i.test(`${candidate.sourceName} ${candidate.sourceSignals.join(" ")}`) ? "high_signal_source" : "standard_source";
  const matchedTopics = detectTopics(candidate).map((topic) => topic.label);
  const matchedAheSignals = detectAheSignals(candidate);
  const matchedFdeSignals = detectFdeSignals(candidate);
  const pureAlgorithmPenalty = pureAlgorithmPenaltyFor(candidate);
  const deterministicReason = deterministicReasonFor(candidate, scores, total);
  return {
    ...scores,
    total_score: total,
    decision: decisionFor(total, scores),
    matched_topics: matchedTopics,
    matched_ahe_signals: matchedAheSignals,
    matched_fde_signals: matchedFdeSignals,
    pure_algorithm_penalty: pureAlgorithmPenalty,
    source_quality: sourceQuality(candidate),
    freshness_signal: freshnessSignal,
    freshness_days: Math.round(days * 10) / 10,
    freshness_reason: `${freshnessSignal}: updated ${Math.round(days * 10) / 10} days ago`,
    hotness_signal: hotnessSignal,
    hotness_reason: hotnessSignal === "high_signal_source" ? "matched high-signal source or venue" : "standard source without external trend boost",
    deterministic_reason: deterministicReason,
    reason: deterministicReason,
  };
}

function deterministicScores(candidate) {
  const text = `${candidate.title}\n${candidate.abstract}\n${candidate.venue}\n${candidate.tags.join(" ")}`;
  const isCoreJob = CORE_JOB_RE.test(text);
  const isNarrowVertical = NARROW_VERTICAL_RE.test(text);
  const topics = detectTopics(candidate);
  const topicCount = topics.length;
  const sourceBoost = sourceQuality(candidate);
  const recencyBoost = ageDays(candidate) <= 14 ? 12 : ageDays(candidate) <= 60 ? 8 : ageDays(candidate) <= 180 ? 4 : 0;
  const hasAbstract = candidate.abstract.length > 120 ? 8 : 0;
  const hasCode = /code|github|implementation/i.test(`${candidate.abstract} ${candidate.sourceUrl} ${candidate.codeUrl}`) ? 8 : 0;
  const benchmarkHits = countMatches(text, topicPatterns("Evaluation / Benchmarks"));
  const codingHits = countMatches(text, topicPatterns("AI Coding / SWE Agents"));
  const agentHits = countMatches(text, topicPatterns("AI Agents"));
  const harnessHits = countMatches(text, topicPatterns("Agent Harness / Observability"));
  const aheSignalCount = detectAheSignals(candidate).length;
  const fdeSignals = detectFdeSignals(candidate);
  const fdeSignalCount = fdeSignals.length;
  const fdeHits = Object.fromEntries(FDE_SIGNAL_RULES.map((rule) => [rule.label, countMatches(text, rule.patterns)]));
  const pureAlgorithmPenalty = pureAlgorithmPenaltyFor(candidate);
  const ragHits = countMatches(text, topicPatterns("RAG / Knowledge Systems"));
  const multimodalHits = countMatches(text, topicPatterns("Multimodal UI"));
  const securityHits = countMatches(text, topicPatterns("LLM Security / Reliability"));
  const designWords = countMatches(text, [/\barchitecture\b/i, /\bsystem\b/i, /\bpipeline\b/i, /\bframework\b/i, /\binfrastructure\b/i, /\bworkflow\b/i, /\bmemory\b/i, /\btool\b/i, /\bharness\b/i, /\bobservability\b/i, /\btrajectory\b/i, /\bmiddleware\b/i, /\bcomponent\b/i, /\bAPI\b/i, /\bendpoint\b/i, /\bgovernance\b/i]);
  const evalWords = countMatches(text, [/\bbenchmark\b/i, /\bevaluation\b/i, /\bdataset\b/i, /\bmetric\b/i, /\bSWE-Bench\b/i, /\bTerminal-Bench\b/i, /\bpass@1\b/i, /\bablation\b/i, /\btransfer\b/i, /\bfailure modes?\b/i, /\bregression gate\b/i]);
  const productWords = countMatches(text, [/\bdeploy\b/i, /\bproduction\b/i, /\bworkflow\b/i, /\btool\b/i, /\binterface\b/i, /\buser\b/i, /\bopen-source\b/i, /\bgithub\b/i, /\bobservability\b/i, /\brollback\b/i, /\bexecution\b/i, /\bcustomer\b/i, /\benterprise\b/i, /\bendpoint\b/i, /\bpermission\b/i]);
  const noveltyWords = countMatches(text, [/\bnew\b/i, /\bnovel\b/i, /\bfirst\b/i, /\bchallenge\b/i, /\bbenchmark\b/i, /\bframework\b/i, /\bstate-of-the-art\b/i, /\bself[- ]?improv/i, /\bautomatic evolution\b/i, /\bharness engineering\b/i]);

  const coreBoost = isCoreJob ? 8 : -8;
  const verticalPenalty = isNarrowVertical ? 10 : 0;
  const stalePenalty = ageDays(candidate) > 365 ? 18 : ageDays(candidate) > 180 ? 8 : 0;

  return {
    role_relevance: clamp(18 + topicCount * 10 + agentHits * 8 + codingHits * 10 + harnessHits * 12 + aheSignalCount * 9 + fdeSignalCount * 7 + fdeHits["customer/production system"] * 8 + fdeHits["API/tool/MCP integration"] * 7 + ragHits * 7 + multimodalHits * 5 + securityHits * 5 + sourceBoost * 0.2 + coreBoost - verticalPenalty - stalePenalty - pureAlgorithmPenalty),
    architecture_value: clamp(18 + designWords * 10 + agentHits * 8 + harnessHits * 12 + aheSignalCount * 11 + fdeSignalCount * 6 + fdeHits["API/tool/MCP integration"] * 10 + fdeHits["workflow readiness"] * 8 + fdeHits["governance/permissions"] * 8 + fdeHits["artifact-level diagnosis"] * 7 + ragHits * 6 + hasAbstract + sourceBoost * 0.2 + coreBoost - verticalPenalty * 0.5 - stalePenalty - pureAlgorithmPenalty * 0.7),
    practicality: clamp(15 + productWords * 9 + hasCode + codingHits * 8 + harnessHits * 10 + aheSignalCount * 7 + fdeSignalCount * 8 + fdeHits["customer/production system"] * 12 + fdeHits["deployment/runbook"] * 10 + fdeHits["artifact-level diagnosis"] * 8 + recencyBoost + sourceBoost * 0.15 + coreBoost - verticalPenalty - stalePenalty - pureAlgorithmPenalty),
    novelty: clamp(18 + noveltyWords * 8 + harnessHits * 5 + aheSignalCount * 6 + fdeSignalCount * 2 + recencyBoost + sourceBoost * 0.25 - verticalPenalty * 0.4 - stalePenalty - pureAlgorithmPenalty * 0.6),
    evaluation_quality: clamp(12 + evalWords * 12 + benchmarkHits * 10 + harnessHits * 4 + aheSignalCount * 4 + fdeHits["evaluation/reliability gate"] * 10 + fdeHits["observability/debugging"] * 6 + fdeHits["artifact-level diagnosis"] * 4 + sourceBoost * 0.25 + (benchmarkHits ? 4 : 0) - stalePenalty * 0.4 - pureAlgorithmPenalty * 0.35),
    interview_value: clamp(20 + codingHits * 10 + agentHits * 8 + harnessHits * 12 + aheSignalCount * 9 + fdeSignalCount * 7 + fdeHits["workflow readiness"] * 7 + fdeHits["governance/permissions"] * 6 + benchmarkHits * 8 + ragHits * 6 + sourceBoost * 0.25 + coreBoost - verticalPenalty - stalePenalty - pureAlgorithmPenalty),
    build_potential: clamp(15 + productWords * 8 + designWords * 6 + hasCode + agentHits * 7 + codingHits * 8 + harnessHits * 12 + aheSignalCount * 8 + fdeSignalCount * 10 + fdeHits["API/tool/MCP integration"] * 9 + fdeHits["deployment/runbook"] * 9 + fdeHits["artifact-level diagnosis"] * 8 + ragHits * 5 + coreBoost - verticalPenalty - stalePenalty - pureAlgorithmPenalty),
  };
}

function decisionFor(total, scores) {
  if (total >= 84 && scores.architecture_value >= 65 && scores.interview_value >= 70) return "deep_dive";
  if (total >= 74) return "review";
  if (total >= 64) return "read";
  if (total >= 46) return "skim";
  return "ignore";
}

function selectDiverseTop(items, limit) {
  const caps = new Map([
    ["AI Application Engineering / FDE", 6],
    ["Agent Harness / Observability", 6],
    ["AI Coding / SWE Agents", 4],
    ["Evaluation / Benchmarks", 4],
    ["RAG / Knowledge Systems", 3],
    ["AIGC Image/Video/Product Workflows", 2],
  ]);
  const selected = [];
  const deferred = [];
  const counts = new Map();
  for (const item of items) {
    const bucket = primaryTopicBucket(item);
    const cap = caps.get(bucket) || 3;
    const count = counts.get(bucket) || 0;
    if (selected.length < limit && count < cap) {
      selected.push(item);
      counts.set(bucket, count + 1);
    } else {
      deferred.push(item);
    }
  }
  for (const item of deferred) {
    if (selected.length >= limit) break;
    selected.push(item);
  }
  return selected;
}

async function cheapModelAdjustment(candidates, ctx = {}) {
  const options = ctx.options || {};
  if (options.noLlm || options.dryRun || process.env.NO_LLM === "1" || candidates.length === 0) return new Map();
  if (!options.chatJson && !process.env.DEEPSEEK_API_KEY) return new Map();

  const payload = candidates.slice(0, 24).map((item) => ({
    id: item.id,
    title: item.title,
    abstract: item.abstract.slice(0, 900),
    source: item.sourceName,
    venue: item.venue,
    deterministic: item.triage,
  }));
  const system = "You are a cheap triage model for an AI engineer research radar. Score papers conservatively. Return strict JSON only.";
  const user = `For each paper, return {"items":[{"id","model_adjustment":-10..10,"decision_override":null|"ignore"|"skim"|"read"|"review"|"deep_dive","reason":"short"}]}.\nFocus on AI engineer interview and portfolio value: agents, tool use, AI coding/SWE agents, RAG/knowledge systems, AIGC product workflows, multimodal UI, eval/benchmarks, LLM security/reliability, human-AI interaction.\nAlso boost FDE / AI-application engineering signal: real customer/enterprise/production systems, APIs/tools/MCP/workflows/RAG/eval/observability/deployment/governance, and artifact-level diagnosis of code/site/data. De-prioritize pure algorithm, model-scaling, training-recipe, or leaderboard-only papers unless they have concrete systems/application relevance.\n\nPapers:\n${JSON.stringify(payload)}`;

  try {
    const chatJson = options.chatJson || createDeepSeekClient({ apiTimeoutMs: options.apiTimeoutMs, logger: ctx.logger }).chatJson;
    const parsed = await chatJson({
      system,
      user,
      model: options.papersTriageModel || process.env.PAPERS_TRIAGE_MODEL || process.env.DEEPSEEK_MODEL || "deepseek-v4-flash",
      maxTokens: options.paperLightMaxTokens || Number(process.env.PAPERS_LIGHT_MAX_TOKENS) || 2600,
    });
    const map = new Map();
    for (const item of asArray(parsed?.items)) {
      map.set(item.id, {
        model_adjustment: Math.max(-10, Math.min(10, Number(item.model_adjustment) || 0)),
        decision_override: normalizeRadarDecision(item.decision_override),
        reason: cleanString(item.reason).slice(0, 240),
      });
    }
    return map;
  } catch (error) {
    ctx.logger?.warn?.(`[papers:evaluate] cheap model skipped: ${error.message}`);
    return new Map();
  }
}

function applyModelAdjustment(triage, model) {
  if (!model) return triage;
  const total = clamp(triage.total_score + model.model_adjustment);
  return {
    ...triage,
    model_adjustment: model.model_adjustment,
    model_reason: model.reason,
    total_score: total,
    decision: model.decision_override || decisionFor(total, triage),
  };
}

function shouldSelect({ triage, convergence, track, priority }) {
  if (track.length === 0) return false;
  if (priority) return true;
  if (triage.decision === "ignore") return false;
  if (convergence.length >= 2) return true;
  if (convergence.length === 1 && convergence[0].topOrOfficial && triage.total_score >= 60) return true;
  if (convergence.length >= 1 && triage.total_score >= 70) return true;
  if (triage.total_score >= 84) return true;
  return false;
}

function trustedConvergence(paper) {
  const byKey = new Map();
  for (const text of sourceMentionTexts(paper)) {
    if (/^\s*arXiv metadata\s*$/i.test(text)) continue;
    const rule = TRUSTED_SOURCE_RULES.find((item) => item.pattern.test(text));
    if (!rule || byKey.has(rule.key)) continue;
    byKey.set(rule.key, { key: rule.key, topOrOfficial: rule.topOrOfficial, priority: rule.priority || "" });
  }
  return [...byKey.values()];
}

function priorityForConvergence(convergence) {
  if (convergence.some((item) => item.priority === "best_paper")) return "best_paper";
  if (convergence.some((item) => item.priority === "curated_platform")) return "curated_platform";
  return "";
}

function sourceMentionTexts(paper) {
  return unique([
    ...asArray(paper.sourceSignals),
    paper.sourceName,
    paper.source,
    paper.venue,
  ].map(cleanString));
}

function paperTracks(paper) {
  return unique(detectTopics(paper).map((topic) => topic.label));
}

function detectTopics(candidate) {
  if (Array.isArray(candidate.focusTopics) && candidate.focusTopics.length > 0) {
    return unique(candidate.focusTopics.map(cleanString))
      .map((label) => FOCUS_TOPICS.find((topic) => topic.label === label) || { label, patterns: [] })
      .filter((topic) => topic.label);
  }
  const text = `${candidate.title}\n${candidate.abstract}\n${candidate.tags.join(" ")}\n${candidate.venue}`.toLowerCase();
  return FOCUS_TOPICS.filter((topic) => topic.patterns.some((pattern) => pattern.test(text)));
}

function detectAheSignals(candidate) {
  const text = `${candidate.title}\n${candidate.abstract || ""}\n${candidate.tags.join(" ")}\n${candidate.venue || ""}\n${candidate.sourceSignals.join(" ")}`;
  return AHE_STRONG_SIGNALS.filter((signal) => signal.pattern.test(text)).map((signal) => signal.label);
}

function detectFdeSignals(candidate) {
  const text = candidateSignalText(candidate);
  return FDE_SIGNAL_RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => rule.label);
}

function pureAlgorithmPenaltyFor(candidate) {
  const text = candidateSignalText(candidate);
  const pureHits = countMatches(text, PURE_ALGORITHM_PATTERNS);
  if (!pureHits) return 0;
  const fdeSignals = detectFdeSignals(candidate);
  const systemSignals = fdeSignals.filter((signal) => signal !== "evaluation/reliability gate").length;
  const leaderboardOnly = /\b(?:leaderboard[- ]only|leaderboard|state[- ]of[- ]the[- ]art|SOTA)\b/i.test(text)
    && !/\b(?:eval(?:uation)? harness|failure modes?|production|customer|workflow|deployment|observability|API|tool[- ]?use|RAG)\b/i.test(text);
  if (systemSignals >= 2) return Math.min(8, pureHits * 2);
  if (systemSignals === 1) return Math.min(14, pureHits * 4 + (leaderboardOnly ? 4 : 0));
  return Math.min(26, pureHits * 7 + (leaderboardOnly ? 8 : 0));
}

function candidateSignalText(candidate) {
  return `${candidate.title}\n${candidate.abstract || ""}\n${candidate.tags.join(" ")}\n${candidate.venue || ""}\n${candidate.sourceSignals.join(" ")}\n${asArray(candidate.focusTopics).join(" ")}`;
}

function sourceQuality(candidate) {
  const sourceText = `${candidate.source} ${candidate.sourceName} ${candidate.sourceSignals.join(" ")} ${candidate.venue}`;
  let score = 0;
  if (/OpenReview|ICLR|ICML|NeurIPS/i.test(sourceText)) score += 24;
  if (/ACL Anthology|CVF|CVPR|ICCV|EMNLP|NAACL/i.test(sourceText)) score += 18;
  if (/OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA/i.test(sourceText)) score += 22;
  if (/AI Best Paper|best paper|Outstanding Paper|最佳论文/i.test(sourceText)) score += 26;
  if (/Datawhale|科鲸|机器之心|Jiqizhixin|Synced/i.test(sourceText)) score += 20;
  if (/Hugging Face|Papers with Code/i.test(sourceText)) score += 12;
  if (/arXiv/i.test(sourceText)) score += 8;
  return Math.min(score, 35);
}

function weightedTotal(scores) {
  return clamp(
    scores.role_relevance * 0.22 +
    scores.architecture_value * 0.18 +
    scores.practicality * 0.14 +
    scores.novelty * 0.12 +
    scores.evaluation_quality * 0.12 +
    scores.interview_value * 0.14 +
    scores.build_potential * 0.08,
  );
}

function deterministicReasonFor(candidate, scores, total) {
  const topics = detectTopics(candidate).map((topic) => topic.label).slice(0, 3).join(", ") || "weak focus match";
  const strengths = Object.entries(scores).filter(([key, value]) => key !== "source_quality" && value >= 70).map(([key]) => key).slice(0, 3).join(", ");
  const aheSignals = detectAheSignals(candidate).join(", ");
  const fdeSignals = detectFdeSignals(candidate).slice(0, 3).join(", ");
  const purePenalty = pureAlgorithmPenaltyFor(candidate);
  const aheReason = aheSignals ? ` AHE signals: ${aheSignals}.` : "";
  const fdeReason = fdeSignals ? ` FDE signals: ${fdeSignals}.` : "";
  const penaltyReason = purePenalty ? ` Pure-algorithm/scaling penalty: ${purePenalty}.` : "";
  return `${topics}; total ${total}; strongest signals: ${strengths || "none"}.${aheReason}${fdeReason}${penaltyReason}`;
}

function reasonForEval({ selected, triage, convergence, track, priority, model }) {
  const sourceReason = convergence.length >= 2
    ? `${convergence.length} independent trusted source mentions`
    : convergence.length === 1
      ? `single trusted source (${convergence[0].key}${convergence[0].topOrOfficial ? ", top/official" : ", not top/official"})`
      : "no independent trusted source convergence";
  const priorityReason = priority ? `; priority=${priority}` : "";
  const trackReason = track.length ? `tracks: ${track.slice(0, 3).join(", ")}` : "off-track";
  const modelReason = model ? ` model adjustment ${model.model_adjustment}${model.reason ? `: ${model.reason}` : ""}.` : "";
  return `${selected ? "select" : "archive"}: ${sourceReason}${priorityReason}; ${trackReason}; idea=${ideaSignalFor(triage)}; score=${triage.total_score}.${modelReason}`;
}

function evalSignals({ convergence, track, priority, ideaSignal, fdeSignals = [] }) {
  return unique([
    `convergence:${convergence.length}`,
    priority ? `priority:${priority}` : "",
    ...track.map((item) => `track:${item}`),
    ...asArray(fdeSignals).map((item) => `fde:${item}`),
    `idea:${ideaSignal}`,
  ]);
}

function ideaSignalFor(triage) {
  const ahe = triage.matched_ahe_signals?.length ? `+ahe:${triage.matched_ahe_signals[0]}` : "";
  const fde = triage.matched_fde_signals?.length ? `+fde:${triage.matched_fde_signals[0]}` : "";
  return `${triage.decision}:${triage.total_score}${ahe}${fde}`;
}

function primaryTopicBucket(item) {
  const topics = item?.eval?.selection?.track || item?.eval?.triage?.matched_topics || [];
  return TOPIC_ORDER.find((topic) => topics.includes(topic)) || "other";
}

function normalizePaper(input = {}) {
  return {
    ...input,
    id: input.id || "",
    title: cleanString(input.title),
    abstract: cleanString(input.abstract),
    source: cleanString(input.source),
    sourceName: cleanString(input.sourceName || input.source),
    sourceUrl: cleanString(input.sourceUrl || input.paperUrl),
    paperUrl: cleanString(input.paperUrl || input.sourceUrl),
    venue: cleanString(input.venue),
    publishedAt: cleanString(input.publishedAt),
    updatedAt: cleanString(input.updatedAt || input.publishedAt),
    discoveredAt: cleanString(input.discoveredAt),
    codeUrl: cleanString(input.codeUrl),
    tags: asArray(input.tags).map(cleanString).filter(Boolean),
    sourceSignals: asArray(input.sourceSignals).map(cleanString).filter(Boolean),
    focusTopics: Array.isArray(input.focusTopics) ? input.focusTopics.map(cleanString).filter(Boolean) : input.focusTopics,
  };
}

function normalizeRadarDecision(value) {
  const decision = cleanString(value);
  return ["ignore", "skim", "read", "review", "deep_dive"].includes(decision) ? decision : null;
}

function topicPatterns(label) {
  return FOCUS_TOPICS.find((topic) => topic.label === label)?.patterns || [];
}

function ageDays(candidate) {
  const date = Date.parse(candidate.updatedAt || candidate.publishedAt || candidate.discoveredAt);
  if (!Number.isFinite(date)) return 90;
  return Math.max(0, (Date.now() - date) / 86400000);
}

function countMatches(text, patterns) {
  return patterns.reduce((sum, pattern) => sum + (pattern.test(text) ? 1 : 0), 0);
}

function clamp(score) {
  return Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
}

function cleanString(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function numberOption(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

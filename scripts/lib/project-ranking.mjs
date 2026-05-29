export const BOOST_TERMS = [
  "agent", "agents", "rag", "retrieval", "mcp", "a2a",
  "memory", "mem0", "graph rag",
  "llm", "aigc", "generative", "multimodal",
  "ai coding", "coding agent",
  "workflow", "eval", "benchmark",
  "vector", "embedding",
  "tool use", "function calling",
];

export const CAP_TERMS = [
  "finance", "financial", "fintech", "trading",
  "stock", "stocks", "crypto", "defi",
  "invoice", "accounting", "tax", "payment", "payments",
  "skill", "skills", "course", "courses", "curriculum",
  "tutorial", "awesome", "cheatsheet", "cookbook",
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function termPattern(term) {
  return term.split(/\s+/).map(escapeRegex).join("\\s+");
}

function buildTermRegex(terms, flags = "i") {
  return new RegExp(`\\b(${terms.map(termPattern).join("|")})\\b`, flags);
}

const CORE_AI_ENGINEER_RE = buildTermRegex(BOOST_TERMS);
const LOW_PRIORITY_DEEP_RE = buildTermRegex(CAP_TERMS);
const BOOST_TERMS_RE = buildTermRegex(BOOST_TERMS, "gi");
const CAP_TERMS_RE = buildTermRegex(CAP_TERMS, "gi");
const BOOST_TERM_SET = new Set(BOOST_TERMS);
const CAP_TERM_SET = new Set(CAP_TERMS);

export const PROJECT_FOCUS_GUIDANCE = `Current AI Brief focus:
- Raise worthDeepDive for AI engineer learning signals: agents, RAG, MCP, A2A, memory, AIGC systems, AI coding, tool use, evaluation, benchmarks, retrieval, embeddings, workflow automation, multimodal agents.
- Lower worthDeepDive for skills/course/tutorial/awesome-list/cookbook repos unless they contain substantial agent-system engineering.
- Lower worthDeepDive for finance/fintech/trading/crypto/accounting/payment repos; keep them light-read only unless the README clearly teaches reusable AI-agent infrastructure.
- Deep dive should answer what architecture/idea an AI engineer can learn, not only whether the repo is popular.`;

export function projectSignalText(repo, readme, light) {
  return [
    repo.fullName,
    repo.description || "",
    repo.language || "",
    light?.tldr || "",
    light?.light || "",
    ...(Array.isArray(light?.tags) ? light.tags : []),
    readme ? readme.slice(0, 4000) : "",
  ].join("\n");
}

export function adjustWorthForAiEngineerFocus(repo, readme, light) {
  const text = projectSignalText(repo, readme, light);
  const lowPriorityText = projectSignalText(repo, "", light);
  const raw = Math.max(0, Math.min(100, Math.round(Number(light?.worthDeepDive) || 50)));
  const matchedBoostTerms = matchedTerms(text, BOOST_TERMS_RE, BOOST_TERM_SET);
  const matchedCapTerms = matchedTerms(lowPriorityText, CAP_TERMS_RE, CAP_TERM_SET);
  const isLowPriority = LOW_PRIORITY_DEEP_RE.test(lowPriorityText);
  const isCoreAiEngineer = CORE_AI_ENGINEER_RE.test(text);
  let worthDeepDive = raw;
  let decision;
  let explanation;

  if (isLowPriority) {
    worthDeepDive = Math.min(worthDeepDive, 39);
    decision = "cap-low-priority";
    explanation = `命中 cap 关键词 (${matchedCapTerms.join(", ")}), 低优先类目，限 39 分上限`;
  } else if (!isCoreAiEngineer) {
    worthDeepDive = Math.min(worthDeepDive, 58);
    decision = "cap-non-core";
    explanation = "未命中核心 AI engineer 关键词，限 58 分上限";
  } else {
    worthDeepDive = Math.min(100, worthDeepDive + 6);
    decision = "boost";
    explanation = `命中 boost 关键词 (${matchedBoostTerms.join(", ")}), AI engineer 学习价值高，+6 加权`;
  }

  return {
    ...light,
    worthDeepDive,
    rankingReason: {
      decision,
      rawScore: raw,
      finalScore: worthDeepDive,
      matchedBoostTerms,
      matchedCapTerms,
      explanation,
    },
  };
}

function matchedTerms(text, regex, allowedTerms) {
  const out = [];
  const seen = new Set();
  regex.lastIndex = 0;
  for (const match of text.matchAll(regex)) {
    const term = match[0].toLowerCase().replace(/\s+/g, " ");
    if (allowedTerms.has(term) && !seen.has(term)) {
      seen.add(term);
      out.push(term);
    }
  }
  return out;
}

export function selectDeepDiveIndices(repos, lights, { cap, worthThreshold }) {
  const ranked = repos
    .map((repo, index) => ({ repo, index, worth: lights[index]?.worthDeepDive ?? 50 }))
    .sort((left, right) => right.worth - left.worth);
  const selected = new Set();

  for (const item of ranked) {
    if (selected.size >= cap) break;
    if (item.worth >= worthThreshold) selected.add(item.index);
  }

  return selected;
}

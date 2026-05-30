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

const BOOST_TERMS_RE = buildTermRegex(BOOST_TERMS, "gi");
const CAP_TERMS_RE = buildTermRegex(CAP_TERMS, "gi");
const BOOST_TERM_SET = new Set(BOOST_TERMS);
const CAP_TERM_SET = new Set(CAP_TERMS);

export const PROJECT_FOCUS_GUIDANCE = `Current AI Brief focus:
- Raise worthDeepDive for AI engineer learning signals: agents, RAG, MCP, A2A, memory, AIGC systems, AI coding, tool use, evaluation, benchmarks, retrieval, embeddings, workflow automation, multimodal agents.
- Treat finance/trading/course/tutorial/awesome-list/cookbook terms as scoring features, not hard caps.
- A finance repo with reusable agent infrastructure can still deserve a deep dive.
- Deep dive should answer what architecture or idea an AI engineer can learn, not only whether the repo is popular.`;

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
  const raw = clampScore(light?.worthDeepDive ?? 50);
  const matchedBoostTerms = matchedTerms(text, BOOST_TERMS_RE, BOOST_TERM_SET);
  const matchedCapTerms = matchedTerms(lowPriorityText, CAP_TERMS_RE, CAP_TERM_SET);
  const boost = matchedBoostTerms.length ? Math.min(24, 6 + (matchedBoostTerms.length - 1) * 4) : 0;
  const penalty = Math.min(20, matchedCapTerms.length * 4);
  const worthDeepDive = clampScore(raw + boost - penalty);
  const decision = worthDeepDive > raw ? "boost" : "no-change";
  const explanation = [
    `raw=${raw}`,
    `final=${worthDeepDive}`,
    matchedBoostTerms.length ? `boost terms: ${matchedBoostTerms.join(", ")}` : "no boost terms",
    matchedCapTerms.length ? `penalty terms: ${matchedCapTerms.join(", ")}` : "no penalty terms",
  ].join("; ");

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

function buildTermRegex(terms, flags = "i") {
  return new RegExp(`\\b(${terms.map(termPattern).join("|")})\\b`, flags);
}

function termPattern(term) {
  return term.split(/\s+/).map(escapeRegex).join("\\s+");
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function clampScore(value) {
  const number = Math.round(Number(value));
  return Math.max(0, Math.min(100, Number.isFinite(number) ? number : 50));
}

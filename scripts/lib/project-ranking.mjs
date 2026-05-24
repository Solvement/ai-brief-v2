const CORE_AI_ENGINEER_RE = /\b(agent|agents|rag|retrieval|mcp|a2a|memory|mem0|graph\s*rag|llm|aigc|generative|multimodal|ai\s*coding|coding\s*agent|workflow|eval|benchmark|vector|embedding|tool\s*use|function\s*calling)\b/i;
const LOW_PRIORITY_DEEP_RE = /\b(finance|financial|fintech|trading|stock|stocks|crypto|defi|invoice|accounting|tax|payment|payments|skill|skills|course|courses|curriculum|tutorial|awesome|cheatsheet|cookbook)\b/i;

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
  const isLowPriority = LOW_PRIORITY_DEEP_RE.test(lowPriorityText);
  const isCoreAiEngineer = CORE_AI_ENGINEER_RE.test(text);
  let worthDeepDive = raw;

  if (isLowPriority) {
    worthDeepDive = Math.min(worthDeepDive, 39);
  } else if (!isCoreAiEngineer) {
    worthDeepDive = Math.min(worthDeepDive, 58);
  } else {
    worthDeepDive = Math.min(100, worthDeepDive + 6);
  }

  return { ...light, worthDeepDive };
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

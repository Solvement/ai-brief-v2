// Agent-relevance filter (Kevin direction 2026-06-04: papers column = agent-only).
// Deterministic keyword classifier over title/tags/summary. The papers column only
// deep-reads agent-related work; breadth lives in the news column. Self-improving /
// self-evolving agent work is the priority lineage (north star L1 design source).
// Read path stays HF/arXiv; this only gates DISCOVERY/selection. See memory
// agent-focus-direction. Pure functions → unit-testable, no I/O.

// Strong signals: if any matches, it's agent work.
const AGENT_TERMS = [
  "agent", "agentic", "multi-agent", "multiagent", "llm agent", "language agent",
  "tool use", "tool-use", "tool calling", "function calling", "react ",
  "self-evolving", "self-evolve", "self-improving", "self-improve", "self-refine",
  "autonomous", "orchestration", "agent workflow", "agent framework",
  "deep research", "deep-research", "web agent", "browser agent", "gui agent",
  "computer use", "computer-use", "code agent", "coding agent", "swe-agent", "swe agent",
  "embodied agent", "reasoning agent", "planner", "planning agent",
  "agent memory", "agent trajectory", "trajectory", "agent-as-a-judge", "agent as a judge",
  "mcp", "model context protocol", "tool-augmented", "reflexion", "voyager",
  "metagpt", "autogen", "gptswarm", "scaffold", "role-play agent",
];

// Priority lineage: self-improving / self-evolving agent (the L1 we're building).
const PRIORITY_TERMS = [
  "self-evolving", "self-evolve", "self-improving", "self-improve",
  "agent-as-a-judge", "agent as a judge", "self-refine", "self-correct",
  "evolving agent", "lifelong agent", "automatic agent design", "agent optimization",
];

function haystack(item) {
  const parts = [
    item?.title,
    Array.isArray(item?.tags) ? item.tags.join(" ") : item?.tags,
    item?.summary,
    item?.abstract,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function countHits(text, terms) {
  let n = 0;
  for (const t of terms) if (text.includes(t)) n += 1;
  return n;
}

/** True if the paper is agent-related (gate for the agent-only papers column). */
export function isAgentRelevant(item) {
  const text = haystack(item);
  if (!text) return false;
  return countHits(text, AGENT_TERMS) > 0;
}

/** True if it's in the priority self-improving/self-evolving agent lineage. */
export function isPriorityLineage(item) {
  return countHits(haystack(item), PRIORITY_TERMS) > 0;
}

/**
 * Relevance score for surfacing order (higher = more agent-central).
 * priority-lineage hits weigh 3x, general agent hits 1x.
 */
export function agentRelevanceScore(item) {
  const text = haystack(item);
  if (!text) return 0;
  return countHits(text, PRIORITY_TERMS) * 3 + countHits(text, AGENT_TERMS);
}

/** Annotate a candidate with agent flags (non-mutating helper). */
export function tagAgent(item) {
  return {
    ...item,
    agent_relevant: isAgentRelevant(item),
    priority_lineage: isPriorityLineage(item),
    agent_score: agentRelevanceScore(item),
  };
}

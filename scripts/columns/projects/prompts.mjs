export const LIGHT_SYS = `You evaluate GitHub projects for AI Brief.

Audience: Chinese AI engineers and AI research students who want reusable engineering lessons.

Return strict JSON:
{
  "tldr": "30-60 Chinese chars, say what it is and what is special",
  "tags": ["3-5 short tags"],
  "light": "80-160 Chinese chars, one paragraph",
  "worthDeepDive": 0-100,
  "intent": "understanding|teaching|tool",
  "reason": "short selection reason",
  "project_type": "ai_app|agent_framework|devtool_cli|model_infra|frontend_ui|dataset_benchmark|library_sdk|template_boilerplate|non_ai_eng",
  "verdict": "skip|watch|L1|deep_dive|clone_and_run",
  "ratings": {
    "relevance_to_ai_engineer": 1-5,
    "engineering_depth": 1-5,
    "reuse_value": 1-5,
    "maturity": 1-5
  }
}

Scoring focus:
- Judge value to an AI engineer, agent developer, and AI Brief. Do not judge popularity alone.
- Use artifactAudit signals for engineering_depth and maturity: tests, CI, license, release/activity, source tree, docs, examples, packages, archived status.
- Use projectRanking keyword signals as cheap input signals only. They can raise attention, but the final verdict must follow reusable engineering value.
- verdict meaning: skip = not relevant; watch = interesting but too thin/immature; L1 = light read only; deep_dive = worth a written technical analysis; clone_and_run = worth hands-on reproduction or tool adoption.
- Write plain-language Chinese. Explain technical terms when needed. Do not invent missing facts; if audit/README lacks evidence, say so.
- Strong positives: agents, RAG, MCP, A2A, memory, evals, AI coding, tool use, workflows, multimodal AI systems.
- Finance/trading/course/tutorial/awesome-list words are only scoring features. Do not hard-cap a repo when it contains reusable AI-agent infrastructure.
- intent=understanding for concept/architecture/codebase comprehension repos.
- intent=teaching for courses, lessons, tutorials, notebooks, curricula.
- intent=tool for runnable CLIs, SDKs, services, plugins, apps, or frameworks.`;

export function lightUser(repo, evidence, projectRanking = {}) {
  return JSON.stringify({
    repo: publicRepo(repo),
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
    projectRanking,
    evidence: String(evidence?.content || "").slice(0, 9000),
  });
}

export function deepSystem(intent) {
  const common = `You write a grounded Chinese deep-dive for AI Brief.
Use only the README/evidence. If evidence is missing, say the README does not explain it.
Return strict JSON with:
{
  "atGlance": "70-130 Chinese chars",
  "whyItMatters": [{"title": "short", "body": "40-90 Chinese chars"}],
  "keyConcepts": [{"term": "term", "explain": "plain explanation"}],
  "howItWorks": "Markdown with 3-4 ## sections",
  "novelty": "2-3 paragraphs",
  "ecosystem": "1-2 paragraphs",
  "limitations": [{"title": "short", "body": "60-120 Chinese chars"}],
  "tryIt": [{"step": "step", "cmd": "optional command", "note": "optional note"}],
  "score": {"novelty": 0-25, "engineering": 0-25, "reproducibility": 0-25, "timeToValue": 0-25}
}`;

  if (intent === "tool") {
    return `${common}

Intent: tool.
tryIt must be concise and operational: 3-5 steps covering how to use it and one extension idea. Include commands only when the README gives real commands.`;
  }

  if (intent === "teaching") {
    return `${common}

Intent: teaching.
tryIt must NOT contain operational commands. It should explain how to study the material, what to skim, what to practice, and what idea to transfer.`;
  }

  return `${common}

Intent: understanding.
tryIt must NOT contain operational commands. It should explain the internal idea, architecture, concept flow, and how the innovation could be implemented conceptually.`;
}

export function deepUser(repo, evidence, evaluation) {
  return JSON.stringify({
    repo: publicRepo(repo),
    evaluation,
    evidence: String(evidence?.content || "").slice(0, 14000),
  });
}

function publicRepo(repo) {
  return {
    fullName: repo.fullName,
    description: repo.description,
    language: repo.language,
    stars: repo.stars,
    forks: repo.forks,
    starsGained: repo.starsGained,
    sourceTerms: repo.sourceTerms || [],
  };
}

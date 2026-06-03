export const LIGHT_SYS = `You evaluate GitHub projects for AI Brief.

Audience: Chinese AI engineers and AI research students who want reusable engineering lessons.

The deterministic Projects Radar pipeline has already chosen final_depth=light.
Do not upgrade depth. Do not speculate about architecture. Do not turn repo name or description into facts.
Use only README, repo tree, docs/examples/install/demo/config evidence passed in the prompt.

Return strict JSON:
{
  "tldr": "30-60 Chinese chars, say what it is using only evidence",
  "tags": ["3-5 short tags"],
  "light": "150-300 Chinese chars, one paragraph: what it is / why it entered radar / known facts / missing evidence / recommended action",
  "intent": "understanding|teaching|tool",
  "project_type": "ai_app|agent_framework|devtool_cli|model_infra|frontend_ui|dataset_benchmark|library_sdk|template_boilerplate|non_ai_eng"
}

Writing rules:
- Write plain-language Chinese for applied AI builders.
- Keep it factual and conservative.
- If README/tree does not show docs, examples, install, demo, architecture, or tests, say the evidence is missing.
- recommended_action must align with the deterministic depth decision in the prompt.`;

export function lightUser(repo, evidence, triage = {}) {
  return JSON.stringify({
    repo: publicRepo(repo),
    artifactAudit: evidence?.artifactAudit || evidence?.metadata?.artifactAudit || null,
    depth_decision: triage?.depth_decision || triage,
    evidence_signals: evidence?.evidenceSignals || evidence?.evidence_signals || evidence?.metadata?.evidenceSignals || evidence?.metadata?.evidence_signals || null,
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

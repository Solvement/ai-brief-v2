export const LIGHT_SYS = `You evaluate GitHub projects for AI Brief using the canonical Projects paradigm in docs/paradigms/projects.md.

Audience: Chinese AI engineers and AI research students who want reusable engineering lessons.

The deterministic Projects Radar pipeline has already chosen project_tier=1 / final_depth=light.
Do not upgrade depth. Do not speculate about architecture. Do not turn repo name or description into facts.
Use only README, repo tree, docs/examples/install/demo/config evidence passed in the prompt.

Return strict JSON:
{
  "tldr": "one plain Chinese sentence: what the project is and what it is for, using only evidence",
  "tags": ["3-5 short tags"],
  "light": "150-300 Chinese chars, one paragraph: what it is / why it entered radar / known facts / missing evidence / recommended action",
  "tier_template": {
    "one_sentence_positioning": "是什么/给谁用",
    "what_it_does": "1-2句",
    "metadata": {"language": "...", "total_stars": 0, "stars_in_period": 0, "author": "..."},
    "labels": ["agent|推理|工具|数据|infra"]
  },
  "intent": "understanding|teaching|tool",
  "project_type": "ai_app|agent_framework|agent_skill|devtool_cli|model_infra|frontend_ui|dataset_benchmark|library_sdk|template_boilerplate|non_ai_eng"
}

Writing rules:
- Write plain-language Chinese for applied AI builders.
- tldr must be concrete Chinese, not an English placeholder or ranking label. Say project type + purpose.
- Keep it factual and conservative.
- If README/tree does not show docs, examples, install, demo, architecture, or tests, say the evidence is missing.
- Mark missing facts as "数据不足"; do not invent maturity, comparison, backing, install commands, or examples.
- First use of key English technical terms must include a short Chinese explanation.
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
Attribution discipline: README marketing, badges, benchmarks, coverage %, "supports N", and superlatives must be framed as claims, not verified facts. Write "README 自称/声称/称..." instead of bare "覆盖/快/支持 N".
Number discipline: never invent, round up, or infer counts/metrics. Quote the source wording exactly; if README says "10+" and lists 13, write "README 称 10+，列表实际列出 13 个", never another count.
Unknowns constrain the body: anything listed as unknown/missing must not be asserted as fact elsewhere. Say "README 未说明..." or omit it.
Concreteness discipline: every section must carry specific repo details, not category labels or framework sketches. howItWorks must walk a real flow with a real example and actual config/code/command/path when present. Key claims must quote the concrete mechanism, number, config, command, path, or example behind the claim. Preserve the concrete details a raw translation would carry, then organize and judge them. If a section has no concrete example/number/snippet/command/path, add a render_warnings entry; never invent details to satisfy this.
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

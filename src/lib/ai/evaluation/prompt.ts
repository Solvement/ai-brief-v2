import { evaluationRubrics } from "./rubrics";
import { getEnvNumber } from "./env";
import { getEvaluationMetadata, getInputQuality, getSourceDocuments, type EvaluationInput } from "./schema";

/**
 * Bump this when the evaluation system prompt changes in any way that should
 * invalidate cached results. Format must match `/^eval-v\d+$/`. The
 * deterministic fallback uses `"deterministic-v1"` (see `deterministic.ts`).
 */
export const PROMPT_VERSION = "eval-v4" as const;

const systemPrompt = [
  "你是 AI-brief 的资深内容分析员，AI-brief 是面向中文 AI 从业者的「信息 → 判断 → 行动」决策工作台。",
  "你的任务：对一条 AI 内容做结构化分析，输出**一个**严格符合下方 schema 的 JSON 对象，**不要**输出任何 JSON 之外的字符（不要 markdown 代码块、不要解释）。",
  "",
  "你必须严格区分三件事：",
  "1. Source Facts：来源文本明确说了什么。",
  "2. AI-brief Judgment：AI-brief 基于事实做出的判断。",
  "3. Action Recommendations：给用户的行动建议。",
  "",
  "输出 schema 包含以下顶层字段（除 deep_dive 可按深度规则省略、skill_analysis 可为 null 外，其余字段必填，类型严格匹配）：",
  "card, source_facts, ai_brief_judgment, editorial_diagnosis, brief_detail, deep_dive_status, deep_dive(仅 depth_level=deep 且满足质量门槛时输出), action_layer, skill_analysis(可为 null), input_quality, depth_level, image_plan。",
  "",
  "card 字段：summary(80-220 中文字), one_sentence_takeaway(30-80 中文字以中文标点结尾), why_it_matters_short(50-140 中文字), recommended_action, readability_score 0-100, impact_score 0-100, actionability_score 0-100, confidence_score 0-100, difficulty(beginner/intermediate/advanced), target_audience(从 developer/pm/founder/creator/operator/researcher/enterprise 选)。",
  "",
  "source_facts 是数组，每条 {id, claim 必须由来源文本支持, source_ids 必须引用输入 sources id, evidence_text 来源文本短证据不能编造, confidence high/medium/low}。",
  "",
  "ai_brief_judgment 字段：main_judgment, why_it_matters, impact_analysis, based_on_fact_ids 引用 source_facts.id, uncertainty 数组。",
  "",
  "editorial_diagnosis 字段：content_type, depth_level(card_only/brief/standard/deep), core_question, why_this_is_worth_covering, source_facts_preview, recommended_modules[{module,reason}], modules_to_skip[{module,reason}], missing_evidence, playbook_potential(none/weak/strong), suggested_reader_takeaway, depth_reason, learning_value_score 0-100, learning_focus, confidence_score 0-100。",
  "",
  "brief_detail 字段：tldr, beginner_explanation 120-260 字给小白讲，background, core_concepts[{name,explanation,why_it_matters_here}], terminology[{term,plain_explanation,why_it_matters}], mechanism_explanation, what_changed, why_now, innovation_analysis, value_analysis, impact_by_audience[{audience,impact}], limitations_and_risks, open_questions, practical_examples, examples[{scenario,explanation,expected_value}], what_to_look_for, good_signs, watch_outs, adoption_readiness。",
  "",
  "action_layer 字段：recommended_action, action_type 数组(read_only/monitor/deep_read/hands_on_test/defensive_lab/convert_to_playbook/use_now/learning_playbook), next_steps, checklist, validation_methods, playbook_candidate boolean, safety_boundary。",
  "",
  "skill_analysis 当内容是 Skill / Skill Pack / SKILL.md / agent rules 时为对象，否则为 null。包含 install_verdict(install/try/extract/skip/monitor), supported_tools, use_cases, not_for, skill_inventory[{name,purpose,trigger,best_rules,weak_points}], best_rules[{rule,why_it_matters,evidence}], weak_rules, design_takeaways, installation_steps, quick_validation_test{title,estimated_minutes,steps,expected_signals,failure_signals}, install_worthiness_score, trigger_clarity_score, behavior_specificity_score, verification_score, context_cost_score, conflict_risk_score, contains_reusable_engineering_workflow boolean。",
  "",
  "input_quality 取值：raw_full_text/raw_excerpt/multi_source_summary/editorial_seed/mock_fixture/unknown。",
  "depth_level 取值：card_only/brief/standard/deep。",
  "",
  "image_plan 字段：policy(none/logo_only/thumbnail_only/cover/cover_and_diagram/screenshot_required/step_images), reason(30-160 中文字 说明为什么选这个 policy), recommended_types(cover/diagram/screenshot/logo/rule_card 数组), prompt(仅当 policy 是 cover 或 cover_and_diagram 时给出，编辑会粘进 ChatGPT), alt(30-120 中文字 描述图片应展示的内容，不是文章摘要)。",
  "",
  "硬规则：",
  "1. 全部自然语言字段必须用简体中文（除非内容是模型名 / 工具名 / 代码 / URL）。summary、one_sentence_takeaway、why_it_matters、brief_detail、ai_brief_judgment、action_layer 不允许用英文句子回答；即使来源是英文，也要翻译成中文分析。",
  "2. source_facts 只能包含 [真实来源文本] 明确支持的信息。",
  "3. [AI-brief 现有草稿，不可当作事实] 只能作为编辑背景，不能写进 source_facts。",
  "4. ai_brief_judgment 必须引用 source_facts 的 id。",
  "5. action_layer 是建议，不能写成原文事实。",
  "6. 不得把 AI-brief 的目标、建议、处理方式写成原文作者的观点。",
  "7. 如果来源文本没有明确说，不要写「本文指出」。",
  "8. 如果信息不足，必须降低 confidence_score，并写入 open_questions。",
  "9. 如果 input_quality 是 mock_fixture 或 editorial_seed：confidence_score 不得高于 60；recommended_action 不得为 use_now；open_questions 必须说明需要真实来源验证；如果没有真实来源文本，source_facts 只能写：当前输入没有提供可核查来源文本，需要编辑补充真实来源；source_ids 使用 [unknown_source]；confidence 使用 low。",
  "10. 不要使用「具有里程碑意义」「标志着」「开启了」等空套话。判断要具体到数字、版本、名称、做法。",
  "11. 给出真实的 score 分布，不要四个分数都给同一个值。",
  "12. recommended_action 必须和 actionability_score / confidence_score 一致：confidence_score < 45 → 强制 monitor；guide / playbook 且 actionability ≥ 80 → use_now；tool/project/model/integration 且 actionability ≥ 70 → try。",
  "13. deep_dive 不是摘要扩写，要像给聪明小白讲解：解释术语；说明它解决的真实问题、怎么工作、创新点、价值和限制；给至少 2 个具体场景例子；写出读者应该重点看什么信号、什么是好迹象、什么需要警惕；对 tool/project/paper 必须回答：为什么现在值得看、它和同类方案相比可能新在哪里、如何验证它真的有用。",
  "14. 如果 content_type 是 tool/project/integration 且 recommended_action 是 try 且 actionability_score ≥ 70，action_layer.playbook_candidate 必须为 true；但 Skill / Skill Pack 例外，只有当 skill pack 本身包含可复用工程流程时才设为 true。",
  "15. 如果内容是 Skill、Skill Pack、SKILL.md、agent rules 或 rules file，skill_analysis 必须是对象；否则可以为 null。Skill 的第一目标是判断是否值得 install / try / extract / skip / monitor，不要默认写成抽象理论文章。",
  "16. image_plan 是给编辑的「配图判断」，不是去生成图。AI-brief 不自动生成图片。news 快讯类倾向 thumbnail_only 或 none；tool / project / integration 优先 screenshot_required；guide / playbook 必须 step_images；paper / article 深度内容才用 cover_and_diagram，浅层用 thumbnail_only；model 浅层 logo_only，深度才升级到 cover_and_diagram；course 用 logo_only；skill / skill pack 用 thumbnail_only（rule_card / diagram），不要给 hero cover；confidence_score < 45 或 recommended_action = avoid → policy 必须是 none；prompt 只在 policy 是 cover / cover_and_diagram 时给出，描述视觉隐喻而不是文章摘要；alt 必须可读、能让人想象图里有什么。",
].join("\n");

const editorialDiagnosisPrompt = [
  "Additional required output rules:",
  "- Include editorial_diagnosis. It is the editing diagnosis step: decide the core question, why the item is worth covering, selected modules, skipped modules, missing evidence, depth reason, learning value score, and learning focus before writing the body.",
  "- recommended_modules and modules_to_skip must each include a concrete reason. Do not apply a fixed template blindly; choose modules based on the source.",
  "- action_layer must include action_type. Use read_only, monitor, deep_read, hands_on_test, defensive_lab, convert_to_playbook, use_now, or learning_playbook.",
  "- If the content touches security, vulnerabilities, exploits, sandboxing, or harnesses and action_type includes hands_on_test or defensive_lab, safety_boundary must restrict the experiment to owned code, authorized environments, or intentionally vulnerable toy repos.",
  "- missing_evidence must list concrete gaps such as missing real-world test results, missing cross-source confirmation, missing issue/PR health, missing quantified false positive rate, or missing human review cost.",
  "- For Skill / Skill Pack / SKILL.md content, include skill_analysis. Prioritize install_verdict, supported_tools, use_cases, not_for, skill_inventory, best_rules, weak_rules, installation_steps, and quick_validation_test. For install/try, give only lightweight installation and validation actions. Do not force every skill into a large Playbook; set playbook_candidate true only when contains_reusable_engineering_workflow is true.",
  "",
  "Detail-depth override:",
  "- Use depth_level as DetailDepth: card_only, brief, standard, or deep. Do not output 'quick'.",
  "- The lightweight clicked detail is brief_detail, not deep_dive. brief_detail is the default detail-page body for card_only/brief/standard items.",
  "- For raw_full_text tool/project/integration/paper/article/model items with strong learning value, prefer depth_level=deep and generate a full DeepDive. Only choose standard when the source lacks enough evidence for source-grounded explanation.",
  "- Only output deep_dive when depth_level is deep. If depth_level is card_only, brief, or standard, omit deep_dive and set deep_dive_status to not_needed or needed_not_generated.",
  "- deep_dive_status must be one of not_needed, needed_not_generated, generated, needs_human_review.",
  "- A generated DeepDive must include core_question, background, at least 3 core_concepts, mechanism_explanation, what_changed, comparison_or_alternatives, why_it_matters_deep, impact_by_audience, at least 3 risks_and_uncertainties, practical_test_plan, at least 2 validation_methods, at least 3 learning_takeaways, and related_playbook_idea.",
  "- A generated DeepDive must be at least 1500 Chinese characters across its fields. If you cannot meet this threshold with source-grounded analysis, set deep_dive_status to needed_not_generated and keep depth_level standard.",
  "- Include source_confidence, judgment_confidence, and practical_confidence as separate 0-100 scores. source_confidence is about evidence quality, judgment_confidence is about AI-brief inference, practical_confidence is about whether the action can work in a real task.",
  "- Generate Playbook only when editorial_diagnosis.playbook_potential is strong. Do not promote every actionable item to a large Playbook.",
].join("\n");

function formatSources(input: EvaluationInput, maxChars: number): string {
  const sources = getSourceDocuments(input);
  if (sources.length === 0) {
    return [
      "source_id: unknown_source",
      "source_type: unknown",
      "source_name: none",
      "url: unknown",
      "published_at: unknown",
      "text:",
      "当前输入没有提供可核查来源文本，需要编辑补充真实来源。",
    ].join("\n");
  }
  return sources
    .map((source) => {
      const text = source.text.slice(0, Math.max(400, Math.floor(maxChars / Math.max(1, sources.length))));
      return [
        `source_id: ${source.id}`,
        `source_type: ${source.source_type}`,
        `source_name: ${source.source_name ?? "unknown"}`,
        `url: ${source.url ?? "unknown"}`,
        `published_at: ${source.published_at ?? "unknown"}`,
        "text:",
        text,
      ].join("\n");
    })
    .join("\n\n---\n\n");
}

function formatEditorialContext(input: EvaluationInput): string {
  if (!input.editorial_context) return "无。";
  const parts = [
    input.editorial_context.existing_summary ? `existing_summary: ${input.editorial_context.existing_summary}` : "",
    input.editorial_context.existing_why_it_matters ? `existing_why_it_matters: ${input.editorial_context.existing_why_it_matters}` : "",
    input.editorial_context.editor_note ? `editor_note: ${input.editorial_context.editor_note}` : "",
  ].filter(Boolean);
  return parts.length > 0 ? parts.join("\n") : "无。";
}

export function buildEvaluationPrompt(input: EvaluationInput): { system: string; user: string } {
  const rubric = evaluationRubrics[input.content_type];
  const maxChars = Math.max(1200, Math.floor(getEnvNumber("EVALUATOR_MAX_INPUT_TOKENS", 4000) / 2));
  const metadata = getEvaluationMetadata(input);
  const inputQuality = getInputQuality(input);
  const githubStats = input.github_stats
    ? [
        "",
        "[仓库客观数据]",
        `full_name: ${input.github_stats.full_name}`,
        `stars: ${input.github_stats.stars}`,
        `forks: ${input.github_stats.forks}`,
        `watchers: ${input.github_stats.watchers}`,
        `open_issues: ${input.github_stats.open_issues}`,
        `open_prs: ${input.github_stats.open_prs}`,
        `contributors_count: ${input.github_stats.contributors_count}`,
        `license: ${input.github_stats.license ?? "unknown"}`,
        `default_branch: ${input.github_stats.default_branch}`,
        `last_commit_days_ago: ${input.github_stats.last_commit_days_ago}`,
        `releases_last_90d: ${input.github_stats.releases_last_90d}`,
        `primary_language: ${input.github_stats.primary_language ?? "unknown"}`,
        `archived: ${input.github_stats.archived}`,
      ].join("\n")
    : "";

  const userPrompt = [
    `[内容类型] ${input.content_type}`,
    `[评估目标] ${rubric.goal}`,
    `[评估维度] ${rubric.criteria.join("、")}`,
    "",
    "[来源元数据]",
    `source_type: ${metadata.source_type}`,
    `source_count: ${metadata.source_count}`,
    `has_official_source: ${metadata.has_official_source}`,
    `collected_at: ${metadata.collected_at}`,
    "allowed_audience_values: developer, pm, founder, creator, operator, researcher, enterprise",
    "",
    "[输入质量]",
    `input_quality: ${inputQuality}`,
    "input_note: sources 是事实来源；editorial_context 是 AI-brief 既有草稿或编辑备注，不能当作原文事实。",
    "",
    `[标题] ${input.title}`,
    "",
    "[真实来源文本]",
    formatSources(input, maxChars),
    "",
    "[AI-brief 现有草稿，不可当作事实]",
    formatEditorialContext(input),
    githubStats,
    "",
    "请按 system 中的 schema 输出 JSON。",
  ].join("\n");

  return {
    system: `${systemPrompt}\n\n${editorialDiagnosisPrompt}`,
    user: userPrompt,
  };
}

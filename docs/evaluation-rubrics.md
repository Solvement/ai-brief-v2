# Evaluation Rubrics

AI-brief evaluates content as decision support, not as generic summarization.

The evaluator now separates card fields, standard detail, and true deep analysis. Each model-backed evaluation must preserve four layers:

1. `source_facts`: what the source text explicitly supports.
2. `ai_brief_judgment`: AI-brief's judgment, always citing `source_facts` ids.
3. `editorial_diagnosis`: the editor step that decides the core question, selected analysis modules, skipped modules, missing evidence, depth reason, learning value, and learning focus.
4. `action_layer`: recommendations, action type, safety boundary, checklist, and validation methods.

Detail depth is explicit:

- `card_only`: card fields only; not enough evidence for a clicked detail.
- `brief`: lightweight clicked detail.
- `standard`: default detail page depth with facts, judgment, explanation, risks, and validation.
- `deep`: a true long-form deep dive.

The current clicked-detail surface is `brief_detail`, not `deep_dive`. `deep_dive` is reserved for generated long-form analysis only.

`deep_dive_status` must be one of:

- `not_needed`
- `needed_not_generated`
- `generated`
- `needs_human_review`

If an item deserves deeper analysis but does not meet the DeepDive quality bar, set `deep_dive_status = needed_not_generated` and keep the page at `standard`.

The guiding rule is: rules set the floor, AI chooses the emphasis. Rubrics are minimum standards and quality gates, not rigid article templates.

For compatibility with existing cards and seed data, each evaluation also mirrors card-level fields at the top level:

- summary
- one_sentence_takeaway
- why_it_matters
- readability_score
- impact_score
- actionability_score
- confidence_score
- difficulty
- recommended_action
- target_audience
- key_facts
- opportunities
- risks
- next_steps

The canonical structured result also includes:

- card
- source_facts
- ai_brief_judgment
- editorial_diagnosis
- deep_dive
- action_layer
- input_quality
- depth_level
- brief_detail
- deep_dive_status
- deep_dive, only when generated

Confidence is split into three scores:

- `source_confidence`: quality and provenance of evidence.
- `judgment_confidence`: confidence in AI-brief's inference from facts.
- `practical_confidence`: confidence that the recommended action will work in a real task.

Skill-like content also includes `skill_analysis`. This applies to Skill, Skill Pack, `SKILL.md`, agent rules, slash-command packs, and similar rule files even when their `content_type` is still `project`, `tool`, or `integration`.

## Editorial Diagnosis

`editorial_diagnosis` is required before treating an output as publishable. It must include:

- `core_question`: the one question this item most helps the reader answer.
- `why_this_is_worth_covering`: why this belongs in AI-brief.
- `recommended_modules`: selected analysis modules, each with a concrete reason.
- `modules_to_skip`: modules that would add noise, each with a concrete reason.
- `missing_evidence`: evidence gaps that should prevent overclaiming.
- `depth_reason`: why the item is quick, standard, or deep.
- `learning_value_score` and `learning_focus`: what the reader can learn from this item.

For deep project/article analysis, missing evidence should usually mention real-world tests, cross-source confirmation, maintenance or issue health, quantitative rates, or human review cost. This prevents the evaluator from turning a persuasive README or article into overconfident advice.

## Action Layer

`action_layer.action_type` classifies action intensity:

- `read_only`: know or read without hands-on work.
- `monitor`: watch for more evidence.
- `deep_read`: spend time understanding the item.
- `hands_on_test`: run a bounded experiment.
- `defensive_lab`: security learning only in owned or authorized environments.
- `convert_to_playbook`: turn the item into a reusable AI-brief playbook.
- `use_now`: adopt immediately.
- `learning_playbook`: convert into a study workflow rather than a production workflow.

Playbook generation is gated by editorial diagnosis. Only generate a Playbook when `editorial_diagnosis.playbook_potential = strong`; otherwise provide a lightweight action layer or validation test.

## DeepDive Quality Bar

A result may be marked `depth_level = deep` only when all of the following are true:

- `deep_dive_status = generated`.
- DeepDive contains at least 1500 Chinese characters across its fields.
- At least 3 `core_concepts`.
- A non-empty `mechanism_explanation`.
- At least 1 `practical_test_plan`.
- At least 2 `validation_methods`.
- At least 3 `risks_and_uncertainties`.
- `ai_brief_judgment.based_on_fact_ids` cites existing `source_facts`.

If any requirement is missing, the item must not be treated as a generated DeepDive. The UI should show: "值得深挖，当前仅有标准详情".

Security, vulnerability, exploit, sandbox, or harness-related items must include `safety_boundary` before any hands-on action. The boundary should limit work to owned code, authorized environments, or intentionally vulnerable toy repos.

## Skill / Skill Pack Analysis

Skill content is evaluated as an installable behavior package first, not as an abstract theory article.

Priority order:

1. Decide whether the reader should `install`, `try`, `extract`, `skip`, or `monitor`.
2. Break down concrete rules, trigger scenarios, supported tools, use cases, weak points, and validation tests.
3. Extract design takeaways only after the install/use judgment is clear.

Required `skill_analysis` fields:

- `install_verdict`: `install | try | extract | skip | monitor`.
- `supported_tools`: concrete compatible tools when the source states them.
- `use_cases`: where the skill should be used.
- `not_for`: where the skill should not be used.
- `skill_inventory`: individual skills/rules with purpose, trigger, best rules, and weak points.
- `best_rules`: rules that are specific enough to change agent behavior.
- `weak_rules`: vague, high-cost, risky, or hard-to-trigger rules.
- `design_takeaways`: what a better skill design should learn from this item.
- `installation_steps`: required for `install` and `try` verdicts.
- `quick_validation_test`: a lightweight A/B test, not a full playbook by default.

Additional Skill scores:

- `install_worthiness_score`: whether installation is worth the effort.
- `trigger_clarity_score`: how clear the activation conditions are.
- `behavior_specificity_score`: whether the rules describe observable agent behavior.
- `verification_score`: whether success/failure can be tested.
- `context_cost_score`: expected context overhead or prompt bloat risk.
- `conflict_risk_score`: risk of conflicting with existing `AGENTS.md`, system prompts, or tool rules.

Action policy:

- For `install` / `try`, only require installation steps and quick validation.
- Do not force every skill into a large Playbook.
- Set `action_layer.playbook_candidate = true` only when the skill pack itself contains a reusable engineering workflow, such as spec-plan-build-test-review-ship, TDD, verification gates, or similar repeatable delivery process.
- Single-purpose skills can still be useful, but they should usually be `extract`, `try`, or `monitor`, not automatically promoted to Playbook.

## Input Quality

The evaluator distinguishes real source text from editor notes:

- `raw_full_text`: full source text.
- `raw_excerpt`: source excerpt.
- `multi_source_summary`: merged source summary.
- `editorial_seed`: AI-brief draft, not source evidence.
- `mock_fixture`: seed/test fixture, not real evidence.
- `unknown`: insufficient provenance.

If `input_quality` is `mock_fixture`, `editorial_seed`, or `unknown`, confidence must stay low, `recommended_action` must not be `use_now`, and `open_questions` must state that real source validation is required.

## Rubric Families

- news: what changed, why now, affected audience, source confidence, action.
- model: capability, cost, speed, ecosystem, migration value.
- tool/project: use case, setup cost, maturity, maintenance, alternatives.
- skill/skill pack: install verdict, supported tools, trigger clarity, behavior specificity, verification, context cost, conflict risk.
- integration: connection value, permission boundary, compatibility, rollback.
- article/paper: argument, evidence, limitation, reproducibility, conversion value.
- guide: clear outcome, steps, validation, failure handling, fallback.
- course: audience fit, learning outcome, project work, freshness, next path.

## Source Discipline

- `sources[]` are the only factual input.
- `editorial_context` is an AI-brief draft or editor note and must not be attributed to the source.
- `source_facts` must cite `source_ids`.
- `ai_brief_judgment.based_on_fact_ids` must cite existing facts.
- Action recommendations are suggestions, not source claims.

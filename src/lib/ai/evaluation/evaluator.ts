import { deterministicConfidenceScore, evaluateContentDeterministic } from "./deterministic";
import { getEnv, getEnvNumber } from "./env";
import { callLlm, LlmRequestError, LlmTimeoutError } from "./llm-client";
import { buildEvaluationPrompt, PROMPT_VERSION } from "./prompt";
import { normalizeEvaluationResult, validateEvaluationResult, validateRawEvaluationResult, type EvaluationInput, type EvaluationResult } from "./schema";

export interface EvaluatorOptions {
  primaryModel?: string;
  fallbackModel?: string;
  timeoutMs?: number;
}

export class EvaluatorOutputError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(`Evaluator output failed validation: ${issues.join(", ")}`);
    this.name = "EvaluatorOutputError";
    this.issues = issues;
  }
}

function extractJsonObject(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return trimmed.slice(start, end + 1);
  return trimmed;
}

function parseEvaluationJson(text: string): Partial<EvaluationResult> {
  try {
    return JSON.parse(text) as Partial<EvaluationResult>;
  } catch {
    try {
      return JSON.parse(extractJsonObject(text)) as Partial<EvaluationResult>;
    } catch {
      throw new EvaluatorOutputError(["Model output was not parseable JSON."]);
    }
  }
}

async function callModel(input: EvaluationInput, model: string, timeoutMs: number): Promise<EvaluationResult> {
  const prompt = buildEvaluationPrompt(input);
  const response = await callLlm({
    model,
    system: prompt.system,
    user: prompt.user,
    response_format: "json",
    max_tokens: getEnvNumber("EVALUATOR_MAX_OUTPUT_TOKENS", 7200),
    temperature: 0.2,
    timeout_ms: timeoutMs,
  });

  const raw = parseEvaluationJson(response.text);
  const rawIssues = validateRawEvaluationResult(raw, input);
  if (rawIssues.length > 0) throw new EvaluatorOutputError(rawIssues);

  const parsed = normalizeEvaluationResult(raw, input);
  const ruleConfidence = deterministicConfidenceScore(input);
  const withRuleConfidence = normalizeEvaluationResult({
    ...parsed,
    confidence_score: ruleConfidence,
    card: { ...parsed.card, confidence_score: ruleConfidence },
    prompt_version: PROMPT_VERSION,
  }, input);
  const issues = validateEvaluationResult(withRuleConfidence, input);
  if (issues.length > 0) throw new EvaluatorOutputError(issues);
  return withRuleConfidence;
}

export async function evaluateContentWithLLM(input: EvaluationInput, options: EvaluatorOptions = {}): Promise<EvaluationResult> {
  const primaryModel = options.primaryModel ?? getEnv("EVALUATOR_PRIMARY_MODEL") ?? "deepseek-chat";
  const fallbackModel = options.fallbackModel ?? getEnv("EVALUATOR_FALLBACK_MODEL") ?? "claude-haiku-4-5-20251001";
  const timeoutMs = options.timeoutMs ?? getEnvNumber("EVALUATOR_TIMEOUT_MS", 30000);

  try {
    return await callModel(input, primaryModel, timeoutMs);
  } catch (error) {
    if (!(error instanceof LlmTimeoutError || error instanceof LlmRequestError || error instanceof EvaluatorOutputError)) {
      throw error;
    }
    if (!fallbackModel || fallbackModel === primaryModel) throw error;
    return callModel(input, fallbackModel, timeoutMs);
  }
}

export { evaluateContentDeterministic };

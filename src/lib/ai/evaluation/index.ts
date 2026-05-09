import { readCache, writeCache } from "./cache";
import { evaluateContentDeterministic } from "./deterministic";
import { getEnv } from "./env";
import { evaluateContentWithLLM } from "./evaluator";
import { PROMPT_VERSION } from "./prompt";
import { evaluationRubrics } from "./rubrics";
import { getEvaluationSourceText, getInputQuality, normalizeEvaluationResult, validateEvaluationResult, type EvaluationInput, type EvaluationResult } from "./schema";

export type { EvaluationInput, EvaluationResult } from "./schema";
export { evaluateContentDeterministic, evaluationRubrics, normalizeEvaluationResult, validateEvaluationResult };
export { extractSourceFacts, generateBriefDetail, generateCard, generateDeepDive, generatePlaybookGate, runEditorialDiagnosis } from "./pipeline";
export { PROMPT_VERSION } from "./prompt";

const evaluatorCacheVersion = "evaluation-skill-v2";
let migrationWarningShown = false;

export interface EvaluateContentOptions {
  cacheKeyExtra?: string;
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function warnFallback(error: unknown): void {
  if (!getEnv("EVALUATOR_LOG_FALLBACKS")) return;
  const message = error instanceof Error ? error.message : String(error);
  console.warn(`AI evaluation fell back to deterministic mode: ${message}`);
}

function warnCacheMigration(): void {
  if (migrationWarningShown) return;
  migrationWarningShown = true;
  console.warn(
    "Evaluation cache key format includes prompt_version; previous entries (without prompt_version) will be regenerated on first access.",
  );
}

export async function getEvaluationCacheKey(input: EvaluationInput, extra = ""): Promise<string> {
  const model = getEnv("EVALUATOR_PRIMARY_MODEL") ?? "deepseek-chat";
  warnCacheMigration();
  return sha256(
    `${evaluatorCacheVersion}|${input.content_type}|${input.title}|${getEvaluationSourceText(input)}|${getInputQuality(input)}|${model}|${PROMPT_VERSION}|${extra}`,
  );
}

export async function evaluateContent(input: EvaluationInput, options: EvaluateContentOptions = {}): Promise<EvaluationResult> {
  const key = await getEvaluationCacheKey(input, options.cacheKeyExtra);
  const cached = await readCache(key);
  if (cached && !cached.prompt_version.startsWith("deterministic-")) return cached;

  try {
    const result = await evaluateContentWithLLM(input);
    await writeCache(key, result);
    return result;
  } catch (error) {
    warnFallback(error);
    const fallback = evaluateContentDeterministic(input);
    return fallback;
  }
}

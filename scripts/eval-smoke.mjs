import { existsSync, readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

function loadDotEnvLocal() {
  const envPath = resolve(".env.local");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index <= 0) continue;
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function compileForNode() {
  const tsc = join("node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json"], { stdio: "inherit" });
}

loadDotEnvLocal();

if (process.env.EVALUATOR_LIVE === "1" && !process.env.DEEPSEEK_API_KEY) {
  throw new Error("EVALUATOR_LIVE=1 requires DEEPSEEK_API_KEY in the environment or .env.local.");
}

if (process.env.EVALUATOR_LIVE !== "1") {
  process.env.EVALUATOR_MOCK_LLM_JSON = JSON.stringify({
    summary: "这是一条离线 smoke 评估结果，用于验证 AI-brief 的 LLM evaluator、schema 校验、缓存和 deterministic fallback 链路可以在 CI 中运行，不会访问真实外部 API。",
    one_sentence_takeaway: "离线模式可以验证评估链路，但不能代表真实模型质量。",
    why_it_matters: "MVP 需要把真实 API 调用和 CI 测试隔离开，避免每次测试都产生费用，同时保持同一套 schema 和缓存路径可验证。",
    readability_score: 84,
    impact_score: 72,
    actionability_score: 66,
    confidence_score: 99,
    difficulty: "intermediate",
    recommended_action: "read",
    target_audience: ["developer", "pm"],
    key_facts: ["离线 smoke 不访问真实 API。", "输出仍然经过 schema validation。", "confidence 会被规则覆盖。"],
    opportunities: ["可以在 CI 中稳定验证 evaluator。", "可以把 live smoke 留给本地手动执行。"],
    risks: ["离线结果不能代表真实模型判断。", "没有 key 时 live 模式会直接失败。"],
    next_steps: ["运行离线 smoke 验证链路。", "配置 key 后再运行 live smoke。"],
  });
}

compileForNode();

const { contentItems } = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/content/seed.js")).href);
const { evaluateContent } = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/ai/evaluation/index.js")).href);

const fixtures = ["news", "model", "paper"].map((contentType) => {
  const item = contentItems.find((candidate) => candidate.content_type === contentType);
  if (!item) throw new Error(`Missing fixture for ${contentType}`);
  return item;
});

const output = [];
for (const item of fixtures) {
  const result = await evaluateContent(
    {
      content_type: item.content_type,
      title: item.title,
      editorial_context: {
        existing_summary: item.summary,
        existing_why_it_matters: item.why_it_matters,
        editor_note: "Seed fixture smoke only. This is not a real crawled source document. Do not treat this as source fact.",
      },
      metadata: {
        source_type: "unknown",
        source_count: 0,
        has_official_source: false,
        collected_at: item.collected_at,
      },
      input_quality: "mock_fixture",
    },
    { cacheKeyExtra: `smoke-${process.env.EVALUATOR_LIVE === "1" ? "live" : "offline"}` },
  );
  output.push({ title: item.title, content_type: item.content_type, evaluation: result });
}

console.log(JSON.stringify(output, null, 2));

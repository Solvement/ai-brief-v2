import { getEnv } from "./env";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export interface LlmRequest {
  model: string;
  system: string;
  user: string;
  response_format: "json";
  max_tokens: number;
  temperature: number;
  timeout_ms: number;
}

export interface LlmResponse {
  text: string;
  prompt_tokens: number;
  completion_tokens: number;
  prompt_cache_hit_tokens?: number;
  prompt_cache_miss_tokens?: number;
  provider: "deepseek" | "anthropic" | "openai";
}

export class LlmTimeoutError extends Error {
  constructor(message = "LLM request timed out.") {
    super(message);
    this.name = "LlmTimeoutError";
  }
}

export class LlmRequestError extends Error {
  readonly status: number;

  constructor(status: number, body: string) {
    super(`LLM request failed with ${status}: ${body.slice(0, 500)}`);
    this.name = "LlmRequestError";
    this.status = status;
  }
}

function inferProvider(model: string): LlmResponse["provider"] {
  if (model.startsWith("deepseek-")) return "deepseek";
  if (model.startsWith("claude-")) return "anthropic";
  if (model.startsWith("gpt-")) return "openai";
  return "deepseek";
}

function providerConfig(provider: LlmResponse["provider"]): { baseUrl: string; apiKey?: string } {
  if (provider === "anthropic") {
    return { baseUrl: "https://api.anthropic.com", apiKey: getEnv("ANTHROPIC_API_KEY") };
  }
  if (provider === "openai") {
    return { baseUrl: getEnv("OPENAI_BASE_URL") ?? "https://api.openai.com/v1", apiKey: getEnv("OPENAI_API_KEY") ?? getEnv("EMBEDDING_API_KEY") };
  }
  return { baseUrl: getEnv("DEEPSEEK_BASE_URL") ?? "https://api.deepseek.com", apiKey: getEnv("DEEPSEEK_API_KEY") };
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new LlmTimeoutError();
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildRequest(provider: LlmResponse["provider"], req: LlmRequest, apiKey: string): { url: string; init: RequestInit } {
  const { baseUrl } = providerConfig(provider);

  if (provider === "anthropic") {
    return {
      url: `${baseUrl}/v1/messages`,
      init: {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: req.model,
          max_tokens: req.max_tokens,
          temperature: req.temperature,
          system: `${req.system}\n\nYou must respond with a single JSON object and nothing else.`,
          messages: [{ role: "user", content: req.user }],
        }),
      },
    };
  }

  return {
    url: `${baseUrl}/chat/completions`,
    init: {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: req.model,
        messages: [
          { role: "system", content: req.system },
          { role: "user", content: req.user },
        ],
        response_format: { type: "json_object" },
        max_tokens: req.max_tokens,
        temperature: req.temperature,
      }),
    },
  };
}

function parseProviderResponse(provider: LlmResponse["provider"], data: unknown): LlmResponse {
  const value = data as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      input_tokens?: number;
      output_tokens?: number;
      prompt_cache_hit_tokens?: number;
      prompt_cache_miss_tokens?: number;
    };
    content?: Array<{ text?: string }>;
  };

  if (provider === "anthropic") {
    return {
      text: value.content?.map((part) => part.text ?? "").join("") ?? "",
      prompt_tokens: value.usage?.input_tokens ?? 0,
      completion_tokens: value.usage?.output_tokens ?? 0,
      prompt_cache_hit_tokens: 0,
      prompt_cache_miss_tokens: value.usage?.input_tokens ?? 0,
      provider,
    };
  }

  return {
    text: value.choices?.[0]?.message?.content ?? "",
    prompt_tokens: value.usage?.prompt_tokens ?? 0,
    completion_tokens: value.usage?.completion_tokens ?? 0,
    prompt_cache_hit_tokens: value.usage?.prompt_cache_hit_tokens,
    prompt_cache_miss_tokens: value.usage?.prompt_cache_miss_tokens,
    provider,
  };
}

function logUsage(req: LlmRequest, response: LlmResponse): void {
  const usageLogPath = getEnv("EVALUATOR_USAGE_LOG_PATH");
  if (!usageLogPath) return;
  mkdirSync(dirname(usageLogPath), { recursive: true });
  appendFileSync(
    usageLogPath,
    `${JSON.stringify({
      ts: new Date().toISOString(),
      provider: response.provider,
      model: req.model,
      prompt_tokens: response.prompt_tokens,
      completion_tokens: response.completion_tokens,
      prompt_cache_hit_tokens: response.prompt_cache_hit_tokens ?? null,
      prompt_cache_miss_tokens: response.prompt_cache_miss_tokens ?? null,
    })}\n`,
    "utf8",
  );
}

export async function callLlm(req: LlmRequest): Promise<LlmResponse> {
  if (getEnv("EVALUATOR_FAIL_IF_CALLED")) {
    throw new LlmRequestError(599, "LLM call blocked by EVALUATOR_FAIL_IF_CALLED.");
  }

  const mockText = getEnv("EVALUATOR_MOCK_LLM_JSON");
  if (mockText) {
    return { text: mockText, prompt_tokens: 0, completion_tokens: 0, provider: inferProvider(req.model) };
  }

  const provider = inferProvider(req.model);
  const { apiKey } = providerConfig(provider);
  if (!apiKey) throw new LlmRequestError(401, `${provider} API key is not configured.`);

  const request = buildRequest(provider, req, apiKey);
  const retryDelays = [0, 500, 1500];
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retryDelays.length; attempt += 1) {
    if (retryDelays[attempt] > 0) await sleep(retryDelays[attempt]);
    const response = await fetchWithTimeout(request.url, request.init, req.timeout_ms);

    if (response.ok) {
      const parsed = parseProviderResponse(provider, await response.json());
      logUsage(req, parsed);
      return parsed;
    }

    const body = await response.text();
    const shouldRetry = response.status === 429 || response.status >= 500;
    lastError = new LlmRequestError(response.status, body);
    if (!shouldRetry) throw lastError;
  }

  throw lastError ?? new LlmRequestError(500, "Unknown LLM failure.");
}

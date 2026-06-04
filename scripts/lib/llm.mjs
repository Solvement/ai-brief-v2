import { jsonrepair } from "jsonrepair";

export function deepseekBaseUrl(env = process.env) {
  return env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
}

export function projectLightModel(env = process.env) {
  return env.PROJECT_LIGHT_MODEL || env.DEEPSEEK_MODEL || "deepseek-v4-flash";
}

export function projectDeepModel(env = process.env) {
  return env.PROJECT_DEEP_MODEL || env.DEEPSEEK_PRO_MODEL || env.DEEPSEEK_MODEL || "deepseek-v4-pro";
}

export function parseJson(raw) {
  const s = stripMarkdownFences(String(raw || ""));
  const balanced = extractBalancedJsonObject(s);
  const candidates = uniqueCandidates([s, balanced]);
  let lastError;
  for (const candidate of candidates) {
    for (const normalized of jsonSyntaxCandidates(candidate)) {
      try {
        return JSON.parse(normalized);
      } catch (error) {
        lastError = error;
      }
    }
  }

  for (const candidate of uniqueCandidates([balanced])) {
    for (const normalized of jsonSyntaxCandidates(candidate)) {
      try {
        return JSON.parse(jsonrepair(normalized));
      } catch (error) {
        lastError = error;
      }
    }
  }
  throw lastError || new SyntaxError("No JSON content to parse");
}

export function createDeepSeekClient({
  apiTimeoutMs = Number(process.env.DEEPSEEK_TIMEOUT_MS) || 180000,
  env = process.env,
  fetchImpl = globalThis.fetch,
  logger = console,
} = {}) {
  async function chat({ system, user, model, jsonMode = false, retries = 2, maxTokens = 800 }) {
    if (!env.DEEPSEEK_API_KEY) throw new Error("缺少 DEEPSEEK_API_KEY");
    const selectedModel = model || env.DEEPSEEK_MODEL || "deepseek-v4-flash";
    const body = {
      model: selectedModel,
      messages: [{ role: "system", content: system }, { role: "user", content: user }],
      temperature: jsonMode ? 0.3 : 0.5,
      max_tokens: maxTokens,
    };
    if (jsonMode) body.response_format = { type: "json_object" };
    let lastErr;
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), apiTimeoutMs);
      try {
        const r = await fetchImpl(`${deepseekBaseUrl(env)}/chat/completions`, {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${env.DEEPSEEK_API_KEY}` },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!r.ok) {
          const e = await r.text().catch(() => "");
          throw new Error(`DeepSeek ${r.status}: ${e.slice(0, 200)}`);
        }
        const d = await r.json();
        const choice = d?.choices?.[0];
        const finishReason = choice?.finish_reason;
        const c = choice?.message?.content;
        if (!c) throw new Error("empty content");
        if (finishReason === "length") {
          logger?.warn?.(`DeepSeek finish_reason=length; output may be truncated (model=${selectedModel}, max_tokens=${body.max_tokens})`);
        }
        return c;
      } catch (e) {
        lastErr = e;
        if (i < retries) {
          await new Promise((rr) => setTimeout(rr, 1500 * (i + 1)));
          logger.warn(`  retry: ${e.message}`);
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastErr;
  }

  async function chatJson({ system, user, model, maxTokens }) {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      const strictSystem = attempt === 0
        ? system
        : `${system}\n\n上一轮输出不是合法 JSON。现在只重新输出一个完整 JSON object：不要 markdown，不要注释，不要尾随逗号，字符串内部的英文双引号必须转义。`;
      const strictUser = attempt === 0
        ? user
        : `${user}\n\n上一次 JSON 解析错误：${lastError?.message || "unknown"}。请重新生成完整、可被 JSON.parse 直接解析的 JSON。`;
      const raw = await chat({ system: strictSystem, user: strictUser, model, jsonMode: true, maxTokens });
      try {
        return parseJson(raw);
      } catch (error) {
        lastError = error;
        logger.warn(`  JSON parse retry ${attempt + 1}/2: ${error.message}`);
      }
    }
    throw lastError;
  }

  return { chat, chatJson };
}

function stripMarkdownFences(value) {
  const trimmed = String(value || "").trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

function extractBalancedJsonObject(value) {
  const start = value.indexOf("{");
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return value.slice(start, index + 1);
    }
  }

  return null;
}

function removeTrailingCommas(value) {
  let out = "";
  let inString = false;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      out += char;
      continue;
    }

    if (char === ",") {
      let next = index + 1;
      while (/\s/.test(value[next] || "")) next += 1;
      if (value[next] === "}" || value[next] === "]") continue;
    }
    out += char;
  }

  return out;
}

function removeMismatchedClosingBrackets(value) {
  let out = "";
  let inString = false;
  let escaped = false;
  let removed = false;
  const stack = [];

  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    if (inString) {
      out += char;
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
      out += char;
      continue;
    }

    if (char === "{" || char === "[") {
      stack.push(char);
      out += char;
      continue;
    }

    if (char === "}" || char === "]") {
      const expected = char === "}" ? "{" : "[";
      if (stack.at(-1) === expected) {
        stack.pop();
        out += char;
      } else {
        removed = true;
      }
      continue;
    }

    out += char;
  }

  return removed ? out : value;
}

function jsonSyntaxCandidates(candidate) {
  const withoutTrailingCommas = removeTrailingCommas(candidate);
  const withoutMismatchedClosers = removeMismatchedClosingBrackets(candidate);
  return uniqueCandidates([
    candidate,
    withoutTrailingCommas,
    withoutMismatchedClosers,
    removeTrailingCommas(withoutMismatchedClosers),
  ]);
}

function uniqueCandidates(candidates) {
  return [...new Set(candidates.filter((candidate) => typeof candidate === "string" && candidate.trim()))];
}

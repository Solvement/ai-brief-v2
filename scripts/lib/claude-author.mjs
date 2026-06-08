import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { parseJson } from "./llm.mjs";

export function claudeAuthorModel(env = process.env) {
  return env.CLAUDE_AUTHOR_MODEL || env.MODEL_CLAUDE_AUTHOR_MODEL || "claude-opus-4-8";
}

export function createClaudeAuthorClient({
  binPath,
  model,
  timeoutMs = Number(process.env.CLAUDE_AUTHOR_TIMEOUT_MS) || 600000,
  logger = console,
  env = process.env,
  spawnImpl = spawn,
  cwd = process.cwd(),
} = {}) {
  const selectedModel = model || claudeAuthorModel(env);

  async function chatJson({ system, user, model: requestModel, maxTokens } = {}) {
    const cliModel = requestModel || selectedModel;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const strictSystem = attempt === 0
        ? system
        : `${system || ""}\n\nThe previous response was not valid JSON. Return exactly one complete JSON object. No markdown, no comments, no trailing commas.`;
      const strictUser = attempt === 0
        ? user
        : `${user || ""}\n\nPrevious JSON parse error: ${lastError?.message || "unknown"}. Regenerate a complete JSON object that JSON.parse can parse directly.`;
      const raw = await runClaudePrint({
        prompt: `${strictSystem || ""}\n\n${strictUser || ""}`,
        model: cliModel,
        binPath,
        timeoutMs,
        spawnImpl,
        cwd,
      });
      try {
        return parseJson(extractClaudeResultText(raw));
      } catch (error) {
        lastError = error;
        logger?.warn?.(`  Claude JSON parse retry ${attempt + 1}/2: ${error.message}`);
      }
    }
    throw lastError;
  }

  return { chatJson };
}

export function resolveClaudeCommand({ binPath } = {}) {
  if (binPath && binPath !== "claude") return { command: binPath, argsPrefix: [] };
  if (process.platform !== "win32") return { command: binPath || "claude", argsPrefix: [] };

  const npmRoot = process.env.APPDATA ? path.join(process.env.APPDATA, "npm") : "";
  const candidates = npmRoot ? [
    path.join(npmRoot, "node_modules", "@anthropic-ai", "claude-code", "cli.js"),
    path.join(npmRoot, "node_modules", "@anthropic-ai", "claude-code", "bin", "claude.js"),
  ] : [];
  const claudeJs = candidates.find((candidate) => existsSync(candidate));
  if (claudeJs) return { command: process.execPath, argsPrefix: [claudeJs] };
  return { command: binPath || "claude", argsPrefix: [] };
}

export function extractClaudeResultText(stdout) {
  const text = String(stdout || "").trim();
  let outer;
  try {
    outer = JSON.parse(text);
  } catch {
    return text;
  }

  if (outer?.is_error) {
    throw new Error(`Claude CLI returned error: ${outer.result || outer.error || "unknown"}`);
  }
  if (typeof outer?.result === "string") return outer.result;
  if (typeof outer?.content === "string") return outer.content;
  if (Array.isArray(outer?.content)) return textFromContentArray(outer.content);
  if (Array.isArray(outer?.messages)) {
    const assistantMessages = outer.messages.filter((message) => message?.role === "assistant");
    const last = assistantMessages.at(-1) || outer.messages.at(-1);
    if (typeof last?.content === "string") return last.content;
    if (Array.isArray(last?.content)) return textFromContentArray(last.content);
  }
  return text;
}

function runClaudePrint({
  prompt,
  model,
  binPath,
  timeoutMs,
  spawnImpl,
  cwd,
}) {
  const resolved = resolveClaudeCommand({ binPath });
  const claudeArgs = ["-p", "--output-format", "json", "--tools", ""];
  if (model && model !== "default") claudeArgs.push("--model", model);
  const args = [...resolved.argsPrefix, ...claudeArgs];

  return new Promise((resolve, reject) => {
    const child = spawnImpl(resolved.command, args, {
      cwd,
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGTERM");
    }, timeoutMs);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        reject(new Error(`claude -p timed out after ${timeoutMs}ms`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`claude -p exited ${code}: ${lastLines(stderr || stdout, 8)}`));
        return;
      }
      resolve(stdout);
    });
    child.stdin.end(prompt);
  });
}

function textFromContentArray(content) {
  return content
    .map((part) => (typeof part === "string" ? part : part?.text))
    .filter(Boolean)
    .join("\n");
}

function lastLines(value, count) {
  return String(value || "").split(/\r?\n/).filter(Boolean).slice(-count).join("\n");
}

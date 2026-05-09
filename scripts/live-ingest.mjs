import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const liveBuildDir = join(".tmp", "live-build");
let buildLiveEvaluationInputForScript;
let isAiRepositoryCandidateForScript = () => true;
let parseGitHubTrendingRepositoriesForScript;
let buildGitHubTrendingRowsForScript;
let buildHuggingFaceProjectRowsForScript;
let columnSourcePolicyForScript;
let buildReadablePageTextFromHtmlForScript;
let selectDiverseRowsForEvaluationForScript;

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

function parseArgs() {
  const args = new Map();
  for (const arg of process.argv.slice(2)) {
    const [key, rawValue] = arg.replace(/^--/, "").split("=");
    args.set(key, rawValue ?? "true");
  }
  return {
    columns: args.get("columns")
      ? args
          .get("columns")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined,
    tiers: args.get("tiers")
      ? args
          .get("tiers")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined,
    feeds: Number(args.get("feeds") ?? 8),
    github: Number(args.get("github") ?? 6),
    trendDaily: Number(args.get("trend-daily") ?? 3),
    trendWeekly: Number(args.get("trend-weekly") ?? 3),
    trendMonthly: Number(args.get("trend-monthly") ?? 3),
    hf: Number(args.get("hf") ?? 4),
    courses: Number(args.get("courses") ?? 2),
    papers: Number(args.get("papers") ?? 4),
    hn: Number(args.get("hn") ?? 2),
    days: Number(args.get("days") ?? 14),
    limit: Number(args.get("limit") ?? 0),
    requestTimeoutMs: Number(args.get("request-timeout-ms") ?? 15000),
    evalConcurrency: Math.max(1, Number(args.get("eval-concurrency") ?? 3)),
    evaluationMultiplier: Math.max(1, Number(args.get("evaluation-multiplier") ?? 1)),
    dryRun: args.get("dry-run") === "true",
    strictSourceHealth: args.get("strict-source-health") === "true",
  };
}

function compileForNode() {
  const tsc = join("node_modules", "typescript", "bin", "tsc");
  execFileSync(process.execPath, [tsc, "-p", "tsconfig.test.json", "--outDir", liveBuildDir], { stdio: "inherit" });
}

function decodeXml(value = "") {
  return value
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripHtml(value = "") {
  return decodeXml(
    value
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " "),
  );
}

function extractTag(xml, tag) {
  return decodeXml(xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"))?.[1] ?? "");
}

function normalizeDate(value = "") {
  if (!value) return "";
  const time = Date.parse(decodeXml(value));
  return Number.isFinite(time) ? new Date(time).toISOString() : "";
}

function extractFeedSourceInfo(xml) {
  const sourceMatch = xml.match(/<source\b([^>]*)>([\s\S]*?)<\/source>/i);
  if (!sourceMatch) return {};
  const attrs = sourceMatch[1] ?? "";
  const url = attrs.match(/\burl=["']([^"']+)["']/i)?.[1];
  const name = decodeXml(sourceMatch[2] ?? "");
  return {
    ...(name ? { source_name: name } : {}),
    ...(url ? { source_home_url: decodeXml(url) } : {}),
  };
}

function extractAtomLink(xml) {
  const href = xml.match(/<link[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1];
  return href ? decodeXml(href) : "";
}

function extractFeedImage(xml) {
  const mediaUrl =
    xml.match(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1] ??
    xml.match(/<media:thumbnail[^>]+url=["']([^"']+)["'][^>]*>/i)?.[1] ??
    xml.match(/<enclosure[^>]+url=["']([^"']+)["'][^>]*(?:type=["']image\/[^"']+["'])?[^>]*>/i)?.[1] ??
    xml.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)?.[1];
  return mediaUrl ? decodeXml(mediaUrl) : "";
}

function absoluteUrl(baseUrl, href = "") {
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return href;
  }
}

function filterRowsForSource(source, rows) {
  if (!columnSourcePolicyForScript?.shouldKeepCandidateForColumn || !source.column) {
    return rows.filter((row) => isEditorialTitle(row.title)).slice(0, source.selected_limit ?? rows.length);
  }
  return rows
    .filter((row) => isEditorialTitle(row.title))
    .filter((row) => {
      const text = columnSourcePolicyForScript.buildCandidateFilterText(source.name, row);
      return columnSourcePolicyForScript.shouldKeepCandidateForColumn(source.column, text);
    })
    .slice(0, source.selected_limit ?? rows.length);
}

function textBlob(value) {
  return [
    value?.title,
    value?.summary,
    value?.one_sentence_takeaway,
    value?.why_it_matters,
    value?.source_name,
    value?.source_url,
    ...(value?.tags ?? []),
    ...(value?.key_facts ?? []),
    ...(value?.opportunities ?? []),
    ...(value?.risks ?? []),
    ...(value?.next_steps ?? []),
    JSON.stringify(value?.brief_detail ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function contentOnlyTextBlob(value) {
  return [
    value?.title,
    value?.summary,
    value?.one_sentence_takeaway,
    value?.why_it_matters,
    ...(value?.tags ?? []),
    ...(value?.key_facts ?? []),
    ...(value?.opportunities ?? []),
    ...(value?.risks ?? []),
    ...(value?.next_steps ?? []),
    JSON.stringify(value?.brief_detail ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ");
}

function hasPublicBoilerplate(value = "") {
  return [
    /需要编辑补充/i,
    /可以转成更清晰的事实-判断-行动链路/i,
    /可以沉淀为后续 Brief/i,
    /核查来源文本/i,
    /确认事实和判断是否分离/i,
    /是否有清晰\s*README\s*和可运行\s*demo/i,
    /README\s*说得多但无法快速跑通/i,
    /选一个低风险真实任务/i,
    /选择一个小范围真实任务验证判断是否成立/i,
    /热度高但缺少\s*benchmark/i,
    /来源事实明确/i,
    /有安装步骤和验证方法/i,
    /Small validation example/i,
    /Use this as a learning signal/i,
    /Source did not publish complete pricing/i,
    /Source did not publish full latency data/i,
    /需要基于来源文本补成中文摘要/i,
    /来源文本不足以形成可发布摘要/i,
    /当前只能作为待复核线索/i,
    /发布前需要补齐来源事实/i,
    /待复核线索/i,
  ].some((pattern) => pattern.test(value));
}

function hasAiNewsSignal(value = "") {
  return /\b(AI|LLM|OpenAI|Anthropic|Claude|Gemini|DeepMind|DeepSeek|Qwen|Nvidia|GPU|chip|compute|model|agent|chatbot|Copilot|Codex)\b|人工智能|大模型|模型|智能体|算力|芯片/i.test(value);
}

function hasModelSignal(value = "") {
  return /\b(GPT|Claude|Gemini|DeepSeek|Qwen|Llama|Mistral|SAM|Sora|Veo|model|benchmark|leaderboard|pricing|latency|context window|tool use|reasoning|multimodal|OpenRouter|LMArena|Artificial Analysis)\b|模型|基准|榜单|上下文|推理|多模态|延迟|价格/i.test(value);
}

function hasModelJunkSignal(value = "") {
  return /opting into usage tracking|usage tracking|request headers|response headers|documentation|docs page|running codex safely|testing ads|advertising|customer story|chatgpt enterprise|software development with codex|uses openai|frontier firms|pulling ahead|helps bankers|ai transformation|partnership with/i.test(value);
}

function publicReleaseIssues(item) {
  const text = textBlob(item);
  const contentText = contentOnlyTextBlob(item);
  const issues = [];
  if (hasPublicBoilerplate(text)) issues.push("contains public boilerplate/fallback detail text");
  if (item.source_column === "news" && !hasAiNewsSignal(contentText)) issues.push("news item lacks explicit AI relevance signal");
  if (item.source_column === "models" && (!hasModelSignal(contentText) || hasModelJunkSignal(contentText))) issues.push("model item lacks model-update signal or looks like docs/settings content");
  if ((item.brief_detail?.examples?.length ?? 0) === 0 && ["project", "tool", "integration", "paper", "article"].includes(item.content_type)) {
    issues.push("analysis item lacks concrete examples");
  }
  if ((item.opportunities?.length ?? 0) === 0 || (item.risks?.length ?? 0) === 0 || (item.next_steps?.length ?? 0) === 0) {
    issues.push("item lacks opportunity/risk/action layer");
  }
  return issues;
}

function isEditorialTitle(title = "") {
  const text = String(title).replace(/\s+/g, " ").trim();
  if (text.length < 8 || text.length > 180) return false;
  const uiJunkPatterns = [
    /\brole=checkbox\b/i,
    /\baria-[a-z-]+=/i,
    /\bdata-testid\b/i,
    /\bclass(Name)?=/i,
    /\bstyle=/i,
    /<[^>]+>/,
    /\b(function|const|let|var)\s+[a-z0-9_$]*\s*[=(]/i,
    /\b(window|document)\./i,
    /\{[^}]{20,}\}/,
    /;\s*(color|font|display|background|transform|position)\s*:/i,
  ];
  return !uiJunkPatterns.some((pattern) => pattern.test(text));
}

function isRelevantSkillSignalFile(source, item, fileText) {
  const text = [item?.path, item?.repository?.full_name, fileText].filter(Boolean).join("\n").toLowerCase();
  if (fileText.trim().length < 120) return false;

  const sharedSignals = [
    /\bagent\b/,
    /\bworkflow\b/,
    /\bskill\b/,
    /\bmcp\b/,
    /\bclaude\b/,
    /\bcursor\b/,
    /\bcodex\b/,
    /\bprompt\b/,
    /\brules?\b/,
    /\btool calls?\b/,
    /\bvalidation\b/,
    /\bapproval\b/,
    /\bhooks?\b/,
  ];
  const signalCount = sharedSignals.filter((signal) => signal.test(text)).length;

  if (source.id === "github-cursor-rules") {
    return /(\.cursorrules|\.cursor\/rules)/.test(text) && signalCount >= 2;
  }
  if (source.id === "github-skill-md") {
    return /skill\.md/.test(text) && signalCount >= 2;
  }
  if (source.id === "github-claude-md") {
    return /claude\.md/.test(text) && signalCount >= 2;
  }
  return signalCount >= 2;
}

function contentTagList(values) {
  const allowed = new Set(["Agent", "AI Coding", "MCP", "Workflow", "Prompt", "RAG", "Multimodal", "Local AI", "Business", "Research", "Safety", "China", "Open Source"]);
  return [...new Set(values.filter((value) => allowed.has(value)))];
}

function inferRepoType(repo) {
  const text = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  if (/\bmcp\b|connector|integration|hook|skill/.test(text)) return "integration";
  if (/tool|app|assistant|agent|cli|tui|ide|workflow/.test(text)) return "tool";
  return "project";
}

function inferRepoTags(repo) {
  const text = `${repo.name} ${repo.description ?? ""} ${(repo.topics ?? []).join(" ")}`.toLowerCase();
  return contentTagList([
    "Open Source",
    /agent|assistant|autonomous/.test(text) ? "Agent" : "",
    /coding|code|developer|ide|cli|tui/.test(text) ? "AI Coding" : "",
    /\bmcp\b|connector|hook|skill/.test(text) ? "MCP" : "",
    /rag|retrieval|vector/.test(text) ? "RAG" : "",
    /workflow|automation/.test(text) ? "Workflow" : "",
    /local|ollama|llama.cpp|vllm/.test(text) ? "Local AI" : "",
  ]);
}

function inferFeedContentType(source, title, summary) {
  if (source.default_content_type) return source.default_content_type;
  const text = `${source.name} ${title} ${summary}`.toLowerCase();
  if (/model|gpt|claude|gemini|llama|qwen|deepseek|mistral|benchmark|reasoning|token|api|image generation|video generation/.test(text)) {
    return "model";
  }
  if (/paper|research|study|arxiv|benchmark|method|dataset|evaluation/.test(text) && source.source_type !== "official") {
    return "article";
  }
  return source.default_content_type ?? "news";
}

function inferFeedTags(source, title, summary) {
  const text = `${source.name} ${title} ${summary}`.toLowerCase();
  return contentTagList([
    ...(source.default_tags ?? []),
    /agent|assistant|autonomous/.test(text) ? "Agent" : "",
    /coding|code|developer|ide|cli|tui/.test(text) ? "AI Coding" : "",
    /\bmcp\b|connector|hook|skill/.test(text) ? "MCP" : "",
    /rag|retrieval|vector|embedding/.test(text) ? "RAG" : "",
    /workflow|automation/.test(text) ? "Workflow" : "",
    /image|video|audio|multimodal|vision/.test(text) ? "Multimodal" : "",
    /safety|security|risk|policy|regulation/.test(text) ? "Safety" : "",
    source.language === "zh" ? "China" : "",
  ]);
}

async function fetchJson(url, headers = {}) {
  const response = await fetchWithTimeout(url, { headers: { "user-agent": "AI-brief live ingestion", ...headers } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchText(url, headers = {}) {
  const response = await fetchWithTimeout(url, { headers: { "user-agent": "AI-brief live ingestion", ...headers } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.text();
}

async function fetchWithTimeout(url, init = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.requestTimeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(`Timeout after ${options.requestTimeoutMs}ms: ${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchGitHubReadme(fullName, headers) {
  if (!fullName || !fullName.includes("/")) return "";
  try {
    const data = await fetchJson(`https://api.github.com/repos/${fullName}/readme`, headers);
    if (typeof data?.content !== "string") return "";
    return Buffer.from(data.content.replace(/\s/g, ""), "base64").toString("utf8").slice(0, 12000);
  } catch (error) {
    console.warn(`[live-ingest] README fetch failed for ${fullName}: ${error instanceof Error ? error.message : String(error)}`);
    return "";
  }
}

async function fetchReadablePageText(url) {
  if (!url) return "";
  try {
    if (/^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(url)) {
      const [, owner, repo] = url.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)\/?$/) ?? [];
      const headers = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
      return fetchGitHubReadme(`${owner}/${repo}`, headers);
    }
    const html = await fetchText(url);
    return (buildReadablePageTextFromHtmlForScript ? buildReadablePageTextFromHtmlForScript(html, 10000) : stripHtml(html).slice(0, 10000)).slice(0, 12000);
  } catch (error) {
    console.warn(`[live-ingest] Page text fetch failed for ${url}: ${error instanceof Error ? error.message : String(error)}`);
    return "";
  }
}

function parseFeedEntries(source, xml, limit) {
  const rssItems = [...xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)].map((match) => {
    const entry = match[1];
    const title = extractTag(entry, "title");
    const url = extractTag(entry, "link") || extractAtomLink(entry);
    const summary = extractTag(entry, "description") || extractTag(entry, "content:encoded") || "RSS item imported for review.";
    const imageUrl = extractFeedImage(entry);
    const publishedAt = normalizeDate(extractTag(entry, "pubDate") || extractTag(entry, "dc:date") || extractTag(entry, "published") || extractTag(entry, "updated"));
    const sourceInfo = extractFeedSourceInfo(entry);
    return { title, url, summary, imageUrl, publishedAt, sourceInfo };
  });
  const atomItems = [...xml.matchAll(/<entry[^>]*>([\s\S]*?)<\/entry>/gi)].map((match) => {
    const entry = match[1];
    const title = extractTag(entry, "title");
    const url = extractAtomLink(entry) || extractTag(entry, "id");
    const summary = extractTag(entry, "summary") || extractTag(entry, "content") || "Atom item imported for review.";
    const imageUrl = extractFeedImage(entry);
    const publishedAt = normalizeDate(extractTag(entry, "published") || extractTag(entry, "updated"));
    const sourceInfo = extractFeedSourceInfo(entry);
    return { title, url, summary, imageUrl, publishedAt, sourceInfo };
  });
  return [...rssItems, ...atomItems]
    .filter((row) => row.title && row.url)
    .slice(0, limit)
    .map((row) => ({
      title: row.title,
      url: row.url,
      canonical_url: source.id === "google-news-ai" && row.sourceInfo?.source_home_url ? row.sourceInfo.source_home_url : row.url,
      source_name: source.id === "google-news-ai" && row.sourceInfo?.source_name ? row.sourceInfo.source_name : source.name,
      ...(row.publishedAt ? { published_at: row.publishedAt } : {}),
      summary: row.summary,
      content_type: inferFeedContentType(source, row.title, row.summary),
      tags: inferFeedTags(source, row.title, row.summary),
      ...(row.imageUrl ? { image_url: row.imageUrl, image_alt: row.title, image_credit: source.name } : {}),
      source_text: [`Feed source: ${source.name}`, `Title: ${row.title}`, `Summary:\n${row.summary}`].join("\n\n"),
    }));
}

async function fetchFeedRows(source, limit) {
  if (limit <= 0 || !source.enabled) return [];
  try {
    const xml = await fetchText(source.url);
    const rows = parseFeedEntries(source, xml, Math.min(limit, source.max_items ?? limit));
    const shouldFetchLinkedPages = source.id !== "openai-models";
    return rows.reduce(async (promise, row) => {
      const collected = await promise;
      const pageText = shouldFetchLinkedPages ? await fetchReadablePageText(row.url) : "";
      collected.push({
        ...row,
        source_text: [row.source_text, pageText ? `Linked source text:\n${pageText}` : ""].filter(Boolean).join("\n\n"),
      });
      return collected;
    }, Promise.resolve([]));
  } catch (error) {
    console.warn(`[live-ingest] Feed fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchWebIndexRows(source, limit) {
  if (limit <= 0 || !source.enabled) return [];
  try {
    const html = await fetchText(source.url);
    const pageTitle = decodeXml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? source.name);
    const anchorRows = [...html.matchAll(/<a\b[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
      .map((match) => {
        const href = absoluteUrl(source.url, match[1]);
        const label = decodeXml(match[2]);
        return { href, label };
      })
      .filter((row) => row.href.startsWith("http") && row.label.length >= 24)
      .filter((row, index, rows) => rows.findIndex((candidate) => candidate.href === row.href) === index)
      .slice(0, Math.max(limit * 3, limit));
    const rows = [];
    for (const anchor of anchorRows) {
      if (rows.length >= limit) break;
      const summary = anchor.label;
      const candidateText = columnSourcePolicyForScript.buildCandidateFilterText(source.name, {
        title: anchor.label,
        summary: anchor.href,
        source_text: `Story link text: ${anchor.label}`,
      });
      if (source.column && !columnSourcePolicyForScript.shouldKeepCandidateForColumn(source.column, candidateText)) continue;
      const pageText = await fetchReadablePageText(anchor.href);
      rows.push({
        title: anchor.label,
        url: anchor.href,
        published_at: new Date().toISOString(),
        summary,
        content_type: source.default_content_type,
        tags: contentTagList(source.default_tags ?? []),
        source_text: [
          `Web index source: ${source.name}`,
          `Index title: ${pageTitle}`,
          `Story link text: ${anchor.label}`,
          pageText ? `Linked source text:\n${pageText}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      });
    }
    return rows;
  } catch (error) {
    console.warn(`[live-ingest] Web index fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchGitHubRows(limit, days, source) {
  if (limit <= 0) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const headers = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  const queries = source?.query
    ? source.query
        .split(" OR ")
        .map((query) => `${query.trim()} pushed:>=${since}`)
        .filter(Boolean)
    : [`topic:ai pushed:>=${since} stars:>50`, `llm agent pushed:>=${since} stars:>20`, `artificial-intelligence pushed:>=${since} stars:>20`];
  const repos = [];
  for (const query of queries) {
    const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=${Math.min(limit * 2, 20)}`;
    try {
      const data = await fetchJson(url, headers);
      repos.push(...(data.items ?? []));
    } catch (error) {
      console.warn(`[live-ingest] GitHub query failed: ${error instanceof Error ? error.message : String(error)}`);
    }
    if (repos.length >= limit) break;
  }
  const seen = new Set();
  return repos
    .filter((repo) => {
      if (!repo?.html_url || seen.has(repo.html_url)) return false;
      seen.add(repo.html_url);
      return isAiRepositoryCandidateForScript(repo);
    })
    .slice(0, limit)
    .reduce(async (promise, repo) => {
      const rows = await promise;
      const readme = await fetchGitHubReadme(repo.full_name, headers);
      rows.push({
        title: repo.full_name,
        url: repo.html_url,
        published_at: repo.pushed_at ?? repo.updated_at ?? repo.created_at,
        summary: `${repo.description ?? "GitHub AI repository."} Stars: ${repo.stargazers_count}. Language: ${repo.language ?? "unknown"}. Updated: ${repo.updated_at}.`,
        content_type: source?.default_content_type ?? inferRepoType(repo),
        tags: contentTagList([...(source?.default_tags ?? []), ...inferRepoTags(repo)]),
        source_text: [
          source?.name ? `Source: ${source.name}` : "",
          `Repository: ${repo.full_name}`,
          `Description: ${repo.description ?? "No description"}`,
          `Topics: ${(repo.topics ?? []).join(", ") || "none"}`,
          `Stars: ${repo.stargazers_count}. Forks: ${repo.forks_count}. Language: ${repo.language ?? "unknown"}. Updated: ${repo.updated_at}.`,
          readme ? `README:\n${readme}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      });
      return rows;
    }, Promise.resolve([]));
}

async function fetchGitHubCodeRows(source, limit) {
  if (limit <= 0 || !source.enabled || !source.query) return [];
  const headers = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
  try {
    const url = `https://api.github.com/search/code?q=${encodeURIComponent(source.query)}&per_page=${Math.min(limit, 20)}`;
    const data = await fetchJson(url, headers);
    const rows = [];
    for (const item of (data.items ?? []).slice(0, limit)) {
      let fileText = "";
      try {
        const detail = await fetchJson(item.url, headers);
        if (typeof detail?.content === "string") {
          fileText = Buffer.from(detail.content.replace(/\s/g, ""), "base64").toString("utf8").slice(0, 12000);
        }
      } catch (error) {
        console.warn(`[live-ingest] GitHub code file fetch failed for ${item.html_url}: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (!isRelevantSkillSignalFile(source, item, fileText)) {
        continue;
      }
      rows.push({
        title: `${item.repository?.full_name ?? "GitHub repository"} / ${item.path ?? "skill file"}`,
        url: item.html_url,
        published_at: item.repository?.pushed_at ?? item.repository?.updated_at,
        summary: `Potential agent skill/rules file discovered via ${source.name}. Path: ${item.path ?? "unknown"}.`,
        content_type: source.default_content_type,
        tags: contentTagList(source.default_tags ?? []),
        source_text: [
          `Code search source: ${source.name}`,
          `Repository: ${item.repository?.full_name ?? "unknown"}`,
          `Path: ${item.path ?? "unknown"}`,
          `URL: ${item.html_url}`,
          fileText ? `File content:\n${fileText}` : "",
        ]
          .filter(Boolean)
          .join("\n\n"),
      });
    }
    return rows;
  } catch (error) {
    console.warn(`[live-ingest] GitHub code search failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchGitHubTrendingRows(source, limit) {
  if (limit <= 0 || !source.enabled || !source.period) return [];
  try {
    const html = await fetchText(source.url);
    const repositories = parseGitHubTrendingRepositoriesForScript(html, source.period).slice(0, limit);
    const rows = buildGitHubTrendingRowsForScript(repositories);
    return rows.reduce(async (promise, row) => {
      const collected = await promise;
      const repoFullName = row.title;
      const headers = process.env.GITHUB_TOKEN ? { authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
      const readme = await fetchGitHubReadme(repoFullName, headers);
      collected.push({
        ...row,
        source_text: [row.source_text, readme ? `README:\n${readme}` : ""].filter(Boolean).join("\n\n"),
      });
      return collected;
    }, Promise.resolve([]));
  } catch (error) {
    console.warn(`[live-ingest] GitHub Trending fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchHuggingFaceProjectRows(source, limit) {
  if (limit <= 0 || !source.enabled) return [];
  try {
    const models = await fetchJson(`${source.url}&limit=${limit}`);
    const rows = buildHuggingFaceProjectRowsForScript(Array.isArray(models) ? models : []).slice(0, limit);
    return rows.reduce(async (promise, row) => {
      const collected = await promise;
      const modelId = row.title;
      let readme = "";
      try {
        readme = await fetchText(`https://huggingface.co/${modelId}/raw/main/README.md`);
      } catch {
        readme = "";
      }
      collected.push({
        ...row,
        source_text: [row.source_text, readme ? `Model card:\n${readme.slice(0, 12000)}` : ""].filter(Boolean).join("\n\n"),
      });
      return collected;
    }, Promise.resolve([]));
  } catch (error) {
    console.warn(`[live-ingest] Hugging Face project fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchHuggingFaceSpaceRows(source, limit) {
  if (limit <= 0 || !source.enabled) return [];
  try {
    const spaces = await fetchJson(`${source.url}&limit=${limit}`);
    return (Array.isArray(spaces) ? spaces : []).slice(0, limit).map((space) => {
      const id = space.id ?? space.name ?? "unknown-space";
      const tags = Array.isArray(space.tags) ? space.tags.join(", ") : "none";
      return {
        title: id,
        url: `https://huggingface.co/spaces/${id}`,
        published_at: space.lastModified,
        summary: `Hugging Face Space. Likes: ${space.likes ?? "unknown"}. SDK: ${space.sdk ?? "unknown"}.`,
        content_type: source.default_content_type,
        tags: contentTagList([...(source.default_tags ?? []), "Open Source"]),
        source_text: [
          `Hugging Face Space: ${id}`,
          `sdk: ${space.sdk ?? "unknown"}`,
          `likes: ${space.likes ?? "unknown"}`,
          `tags: ${tags}`,
          `lastModified: ${space.lastModified ?? "unknown"}`,
        ].join("\n"),
      };
    });
  } catch (error) {
    console.warn(`[live-ingest] Hugging Face Spaces fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchProductHuntRows(source, limit) {
  if (limit <= 0 || !source.enabled) return [];
  const text = await fetchReadablePageText(source.url);
  if (!text) return [];
  return [
    {
      title: source.name,
      url: source.url,
      published_at: new Date().toISOString(),
      summary: "Product Hunt AI category discovery signal. Use only to find products worth source verification.",
      content_type: source.default_content_type,
      tags: contentTagList(source.default_tags ?? []),
      source_text: [`Product discovery source: ${source.name}`, text.slice(0, 10000)].join("\n\n"),
    },
  ];
}

function isConcreteCourseUrl(url = "") {
  return [
    /\/learn\/[^/?#]+/i,
    /\/training\/(?:modules|paths|courses)\/[^/?#]+/i,
    /\/short-courses\/[^/?#]+/i,
    /course\.fast\.ai\/?$/i,
  ].some((pattern) => pattern.test(url));
}

async function fetchCourseRows(source, limit) {
  if (limit <= 0 || !source.enabled) return [];
  if (!isConcreteCourseUrl(source.url)) {
    console.warn(`[live-ingest] Course source skipped because it is not a concrete course/module URL: ${source.name}`);
    return [];
  }
  try {
    const html = await fetchText(source.url);
    const title = decodeXml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? source.name);
    const summary =
      decodeXml(html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["'][^>]*>/i)?.[1] ?? "") ||
      stripHtml(html).slice(0, 900);
    return [
      {
        title: title || source.name,
        url: source.url,
        published_at: new Date().toISOString(),
        summary: summary || `${source.name} trusted AI learning source.`,
        content_type: "course",
        tags: contentTagList(source.default_tags ?? ["Research"]),
        source_text: [`Course source: ${source.name}`, `Title: ${title || source.name}`, `Page summary:\n${summary}`, `Page text:\n${stripHtml(html).slice(0, 10000)}`].join("\n\n"),
      },
    ];
  } catch (error) {
    console.warn(`[live-ingest] Course fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

async function fetchPaperRows(source, limit) {
  if (limit <= 0) return [];
  if (source.id === "huggingface-papers") {
    try {
      const data = await fetchJson(source.url);
      return (Array.isArray(data) ? data : data.papers ?? []).slice(0, limit).map((paper) => {
        const title = paper.title ?? paper.paper?.title ?? "Hugging Face paper";
        const id = paper.id ?? paper.paper?.id ?? "";
        const url = id ? `https://huggingface.co/papers/${id}` : source.url;
        const summary = paper.summary ?? paper.paper?.summary ?? paper.abstract ?? "Hugging Face daily paper candidate.";
        return {
          title,
          url,
          published_at: paper.publishedAt ?? paper.paper?.publishedAt ?? paper.published_at ?? paper.paper?.published_at,
          summary,
          content_type: source.default_content_type,
          tags: contentTagList(source.default_tags ?? ["Research"]),
          source_text: [`Paper source: ${source.name}`, `Title: ${title}`, `Summary:\n${summary}`].join("\n\n"),
        };
      });
    } catch (error) {
      console.warn(`[live-ingest] HF Papers fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }
  if (source.id !== "filtered-arxiv-ai") {
    return fetchWebIndexRows(source, limit);
  }
  const query = (source.query ?? "cat:cs.AI OR cat:cs.CL OR cat:cs.LG").replace(/\s+OR\s+/g, "+OR+").replace(/\s+/g, "+");
  const xml = await fetchText(`https://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=${limit}&sortBy=submittedDate&sortOrder=descending`);
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].slice(0, limit).map((match) => {
    const entry = match[1];
    const title = extractTag(entry, "title");
    const summary = extractTag(entry, "summary");
    return {
      title,
      url: extractAtomLink(entry),
      published_at: normalizeDate(extractTag(entry, "published") || extractTag(entry, "updated")),
      summary,
      content_type: source.default_content_type,
      tags: contentTagList(source.default_tags ?? ["Research"]),
      source_text: [`Paper source: ${source.name}`, `Title: ${title}`, `Abstract:\n${summary}`].join("\n\n"),
    };
  });
}

async function fetchHnRows(limit, source = sourceFor("community")) {
  if (limit <= 0) return [];
  const query = source.query ?? "AI";
  const data = await fetchJson(`https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(query)}&tags=story&hitsPerPage=${limit}`);
  const rows = [];
  for (const hit of (data.hits ?? []).slice(0, limit)) {
    const url = hit.url ?? `https://news.ycombinator.com/item?id=${hit.objectID}`;
    const pageText = await fetchReadablePageText(url);
    rows.push({
      title: hit.title ?? hit.story_title,
      url,
      published_at: hit.created_at,
      summary: `Hacker News discussion about AI. Points: ${hit.points ?? "unknown"}. Comments: ${hit.num_comments ?? "unknown"}.`,
      content_type: source.default_content_type ?? "article",
      tags: contentTagList(source.default_tags ?? ["Business", "Research"]),
      source_text: [
        `Discovery source: ${source.name}`,
        `Hacker News title: ${hit.title ?? hit.story_title}`,
        `Points: ${hit.points ?? "unknown"}. Comments: ${hit.num_comments ?? "unknown"}.`,
        pageText ? `Linked source text:\n${pageText}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    });
  }
  return rows;
}

function sourceFor(kind) {
  if (kind === "github") {
    return { id: "github-live", name: "GitHub Live Search", url: "https://api.github.com/search/repositories", source_type: "github", language: "en", reliability_level: 4, enabled: true };
  }
  if (kind === "paper") {
    return { id: "arxiv-live", name: "arXiv Latest AI", url: "https://export.arxiv.org/api/query", source_type: "paper", language: "en", reliability_level: 4, enabled: true };
  }
  return { id: "hn-live", name: "Hacker News Live", url: "https://hn.algolia.com", source_type: "community", language: "en", reliability_level: 3, enabled: true };
}

function writeLiveModule(items) {
  const target = resolve("src/lib/content/live.generated.ts");
  const serialized = JSON.stringify(items, null, 2);
  writeFileSync(
    target,
    `import type { AnyContentItem } from "./types";\n\n// Generated by scripts/live-ingest.mjs. Do not edit by hand.\nexport const liveContentItems: AnyContentItem[] = ${serialized};\n`,
    "utf8",
  );
}

function printSummary(items) {
  console.log(`[live-ingest] Evaluated ${items.length} live item(s).`);
  for (const item of items.slice(0, 12)) {
    console.log(`- [${item.content_type}] ${item.title} :: ${item.recommended_action} :: ${item.one_sentence_takeaway}`);
  }
}

loadDotEnvLocal();
if (!process.env.EVALUATOR_LOG_FALLBACKS) process.env.EVALUATOR_LOG_FALLBACKS = "1";
const options = parseArgs();
compileForNode();

const compiledRoot = resolve(liveBuildDir, "src/lib");
const { importManualJsonWithEnrichment } = await import(pathToFileURL(join(compiledRoot, "ingestion/index.js")).href);
const { evaluateContent } = await import(pathToFileURL(join(compiledRoot, "ai/evaluation/index.js")).href);
const { evaluationToPublishedContentItem } = await import(pathToFileURL(join(compiledRoot, "ingestion/live.js")).href);
const { bulkUpsertContent } = await import(pathToFileURL(join(compiledRoot, "storage/repositories/content.js")).href);
const liveSources = await import(pathToFileURL(join(compiledRoot, "ingestion/live-sources.js")).href);
const projectSources = await import(pathToFileURL(join(compiledRoot, "ingestion/project-sources.js")).href);
const htmlExtract = await import(pathToFileURL(join(compiledRoot, "ingestion/html-extract.js")).href);
const candidateSelection = await import(pathToFileURL(join(compiledRoot, "ingestion/candidate-selection.js")).href);
columnSourcePolicyForScript = await import(pathToFileURL(join(compiledRoot, "ingestion/column-source-policy.js")).href);
buildLiveEvaluationInputForScript = liveSources.buildLiveEvaluationInput;
isAiRepositoryCandidateForScript = liveSources.isAiRepositoryCandidate;
parseGitHubTrendingRepositoriesForScript = projectSources.parseGitHubTrendingRepositories;
buildGitHubTrendingRowsForScript = projectSources.buildGitHubTrendingRows;
buildHuggingFaceProjectRowsForScript = projectSources.buildHuggingFaceProjectRows;
buildReadablePageTextFromHtmlForScript = htmlExtract.buildReadablePageTextFromHtml;
selectDiverseRowsForEvaluationForScript = candidateSelection.selectDiverseRowsForEvaluation;
const { isLiveEvaluationPublishable } = liveSources;

const sourcePlan = columnSourcePolicyForScript.createColumnSourcePlan(options.columns, options.tiers);
console.log(`[live-ingest] Source columns: ${sourcePlan.columns.join(", ") || "none"}`);
if (options.tiers?.length) console.log(`[live-ingest] Source tiers: ${options.tiers.join(", ")}`);
console.log(`[live-ingest] Evaluation concurrency: ${options.evalConcurrency}; candidate multiplier: ${options.evaluationMultiplier}`);

async function fetchRowsForConfiguredSource(source) {
  const policyLimit = columnSourcePolicyForScript.columnIngestionPolicies[source.column].selected_limit;
  const requestedColumnLimit = options.limit > 0 ? Math.min(policyLimit, options.limit) : policyLimit;
  const limit = columnSourcePolicyForScript.getCandidateFetchLimitForSource(source, requestedColumnLimit);
  switch (source.adapter) {
    case "rss_feed":
      return fetchFeedRows(source, limit);
    case "web_index":
      return fetchWebIndexRows(source, limit);
    case "github_trending":
      return fetchGitHubTrendingRows(source, limit);
    case "github_search":
      return fetchGitHubRows(limit, options.days, source);
    case "github_code_search":
      return fetchGitHubCodeRows(source, limit);
    case "huggingface_models":
      return fetchHuggingFaceProjectRows(source, limit);
    case "huggingface_spaces":
      return fetchHuggingFaceSpaceRows(source, limit);
    case "product_hunt":
      return fetchProductHuntRows(source, limit);
    case "hn_discovery":
      return fetchHnRows(limit, source);
    case "paper_index":
      return fetchPaperRows(source, limit);
    case "course_page":
      return fetchCourseRows(source, limit);
    default:
      console.warn(`[live-ingest] Unsupported adapter for ${source.name}: ${source.adapter}`);
      return [];
  }
}

const batches = [];
const sourceHealth = [];
for (const source of sourcePlan.sources) {
  const policyLimit = columnSourcePolicyForScript.columnIngestionPolicies[source.column].selected_limit;
  const requestedColumnLimit = options.limit > 0 ? Math.min(policyLimit, options.limit) : policyLimit;
  let fetchedRows = [];
  try {
    fetchedRows = await fetchRowsForConfiguredSource(source);
  } catch (error) {
    console.warn(`[live-ingest] Source fetch failed for ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
  }
  const rows = filterRowsForSource(source, fetchedRows).slice(0, source.selected_limit ?? requestedColumnLimit);
  sourceHealth.push({
    source_id: source.id,
    source_name: source.name,
    column: source.column,
    source_tier: source.source_tier,
    adapter: source.adapter,
    fetched_count: fetchedRows.length,
    selected_count: rows.length,
  });
  batches.push({ sourceType: source.source_type, source, column: source.column, source_id: source.id, rows });
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = [];
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(workers);
  return results;
}

const liveItems = [];
const columnEvaluationLimits = Object.fromEntries(
  sourcePlan.columns.map((column) => {
    const policyLimit = columnSourcePolicyForScript.columnIngestionPolicies[column].selected_limit;
    return [column, options.limit > 0 ? Math.min(policyLimit, options.limit) : policyLimit];
  }),
);
const selectedBatches = selectDiverseRowsForEvaluationForScript(batches, columnEvaluationLimits, options.evaluationMultiplier);
const evaluationJobs = [];
for (const { sourceType, source, rows } of selectedBatches) {
  if (rows.length === 0) {
    console.warn(`[live-ingest] No rows fetched for ${source.name}.`);
    continue;
  }
  const sourceTextByUrl = new Map(rows.map((row) => [row.url, row.source_text ?? row.summary]));
  const imported = await importManualJsonWithEnrichment(source, rows);
  for (const log of imported.logs) {
    const level = log.level === "error" ? "warn" : "log";
    console[level](`[live-ingest] ${source.name}: ${log.message}`);
  }
  for (const draft of imported.items) {
    evaluationJobs.push({
      draft,
      sourceType,
      sourceText: sourceTextByUrl.get(draft.source_url),
      sourceColumn: source.column,
      sourceId: source.id,
      sourceTier: source.source_tier,
    });
  }
}

console.log(`[live-ingest] Evaluating ${evaluationJobs.length} candidate(s) with LLM/schema pipeline.`);
const skippedItems = [];
const evaluatedJobs = await runWithConcurrency(evaluationJobs, options.evalConcurrency, async ({ draft, sourceType, sourceText, sourceColumn, sourceId, sourceTier }, index) => {
  const evaluation = await evaluateContent(buildLiveEvaluationInputForScript(draft, sourceType, sourceText), {
    cacheKeyExtra: `live-v8:${draft.canonical_url ?? draft.source_url}:${process.env.EVALUATOR_CACHE_BUST ?? ""}`,
  });
  console.log(`[live-ingest] Evaluated ${index + 1}/${evaluationJobs.length}: ${draft.title}`);
  return { draft, evaluation, sourceColumn, sourceId, sourceTier };
});

for (const job of evaluatedJobs) {
  if (!job) continue;
  const { draft, evaluation, sourceColumn, sourceId, sourceTier } = job;
    if (!isLiveEvaluationPublishable(evaluation)) {
      console.warn(`[live-ingest] Skipped ${draft.title}: evaluator used deterministic fallback; needs human/LLM review before publishing.`);
      skippedItems.push({ title: draft.title, source_column: sourceColumn, source_id: sourceId, reason: "deterministic_fallback" });
      continue;
    }
    const publishedItem = {
      ...evaluationToPublishedContentItem(draft, evaluation),
      source_column: sourceColumn,
      source_id: sourceId,
      source_tier: sourceTier,
    };
    const qualityIssues = publicReleaseIssues(publishedItem);
    if (qualityIssues.length > 0) {
      console.warn(`[live-ingest] Skipped ${draft.title}: ${qualityIssues.join("; ")}`);
      skippedItems.push({ title: draft.title, source_column: sourceColumn, source_id: sourceId, reason: "public_quality_gate", issues: qualityIssues });
      continue;
    }
    liveItems.push(publishedItem);
}

const byCanonical = new Map();
const identityKeys = new Set();
for (const item of [...liveItems].sort((a, b) => b.confidence_score + b.impact_score - (a.confidence_score + a.impact_score))) {
  const keys = [
    item.canonical_url,
    item.source_url,
    item.slug,
    item.title?.toLowerCase().replace(/\s+/g, " ").trim(),
  ].filter(Boolean);
  if (keys.some((key) => identityKeys.has(key))) continue;
  for (const key of keys) identityKeys.add(key);
  byCanonical.set(item.canonical_url ?? item.source_url ?? item.slug ?? item.id, item);
}
function itemColumn(item) {
  if (item.source_column && sourcePlan.columns.includes(item.source_column)) return item.source_column;
  if (item.content_type === "news") return "news";
  if (item.content_type === "model") return "models";
  if (item.content_type === "course") return "courses";
  if (item.content_type === "article" || item.content_type === "paper") return "articles";
  if (item.content_type === "integration") return "skills";
  return "projects";
}

const selectedCounts = new Map(sourcePlan.columns.map((column) => [column, 0]));
const deduped = [...byCanonical.values()]
  .sort((a, b) => b.impact_score - a.impact_score)
  .filter((item) => {
    const column = itemColumn(item);
    if (!sourcePlan.columns.includes(column)) return true;
    const limit = columnSourcePolicyForScript.columnIngestionPolicies[column].selected_limit;
    const count = selectedCounts.get(column) ?? 0;
    if (count >= limit) return false;
    selectedCounts.set(column, count + 1);
    return true;
  });

const publishedByColumn = new Map(sourcePlan.columns.map((column) => [column, 0]));
const sourceDiversityByColumn = new Map(sourcePlan.columns.map((column) => [column, new Set()]));
for (const item of deduped) {
  const column = itemColumn(item);
  if (!publishedByColumn.has(column)) continue;
  publishedByColumn.set(column, (publishedByColumn.get(column) ?? 0) + 1);
  sourceDiversityByColumn.get(column)?.add(item.source_name);
}

const sourceHealthWarnings = sourcePlan.columns.flatMap((column) => {
  const configured = sourceHealth.filter((source) => source.column === column);
  const activeSources = configured.filter((source) => source.selected_count > 0);
  const published = publishedByColumn.get(column) ?? 0;
  const sourceDiversity = sourceDiversityByColumn.get(column)?.size ?? 0;
  const policy = columnSourcePolicyForScript.columnIngestionPolicies[column];
  const warnings = [];
  if (configured.length > 0 && activeSources.length === 0) {
    warnings.push(`${column}: no configured source produced selected rows`);
  }
  if (configured.length > 0 && published === 0) {
    warnings.push(`${column}: no evaluated item passed publication gates`);
  }
  if (configured.length > 0 && published < policy.minimum_published) {
    warnings.push(`${column}: published ${published}, needs at least ${policy.minimum_published} for public snapshot quality`);
  }
  if (configured.length > 0 && sourceDiversity < policy.minimum_source_diversity) {
    warnings.push(`${column}: source diversity ${sourceDiversity}, needs at least ${policy.minimum_source_diversity}`);
  }
  return warnings;
});

const ingestReport = {
  generated_at: new Date().toISOString(),
  dry_run: options.dryRun,
  columns: sourcePlan.columns,
  source_health: sourceHealth,
  evaluated_count: evaluationJobs.length,
  published_count: deduped.length,
  skipped_count: skippedItems.length,
  skipped_items: skippedItems,
  published_by_column: Object.fromEntries(publishedByColumn),
  source_diversity_by_column: Object.fromEntries(
    [...sourceDiversityByColumn.entries()].map(([column, sourceSet]) => [column, [...sourceSet]]),
  ),
  warnings: sourceHealthWarnings,
};

mkdirSync(resolve(".tmp"), { recursive: true });
writeFileSync(resolve(".tmp", "ingest-report.json"), JSON.stringify(ingestReport, null, 2), "utf8");

if (sourceHealthWarnings.length > 0) {
  for (const warning of sourceHealthWarnings) console.warn(`[live-ingest] Source health warning: ${warning}`);
  if (!options.dryRun || options.strictSourceHealth) {
    throw new Error(`Source health gate failed: ${sourceHealthWarnings.join("; ")}`);
  }
}

if (!options.dryRun) {
  bulkUpsertContent(deduped);
  writeLiveModule(deduped);
  console.log("[live-ingest] Wrote SQLite content_items and src/lib/content/live.generated.ts.");
}

printSummary(deduped);

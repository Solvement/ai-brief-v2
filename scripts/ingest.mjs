#!/usr/bin/env node
/**
 * GitHub Trending → DeepSeek → public/data/trending.json
 * Flags: --dry-run/--no-llm  --no-readme  --no-cache  --limit=N  --cap=N  --worth=N
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "analyses.json");
const SCHEMA_VERSION = 3;
const CACHE_TTL_DAYS = 7;
const STARS_DRIFT_THRESHOLD = 0.30;

async function loadEnv() {
  const f = path.join(ROOT, ".env.local");
  if (!existsSync(f)) return;
  const raw = await readFile(f, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (!m || m[1].startsWith("#")) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (!process.env[m[1]] && v) process.env[m[1]] = v;
  }
}

const argv = process.argv.slice(2);
const NO_LLM = argv.includes("--dry-run") || argv.includes("--no-llm");
const NO_README = argv.includes("--no-readme");
const NO_CACHE = argv.includes("--no-cache");
function numFlag(n, d) { const a = argv.find((x) => x.startsWith(`--${n}=`)); if (!a) return d; const v = Number(a.split("=")[1]); return Number.isFinite(v) ? v : d; }
const LIMIT = numFlag("limit", 15);
const CAP = numFlag("cap", 6);
const WORTH_THRESHOLD = numFlag("worth", 60);
const UA = "Mozilla/5.0 gh-trending-deepdive/0.5";

async function fetchHtml(url) { const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html" } }); if (!r.ok) throw new Error(`GET ${url} -> ${r.status}`); return r.text(); }
function decodeEntities(s) { return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " "); }
const stripTags = (s) => decodeEntities(s.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim();

function parseTrendingHtml(html) {
  const repos = [];
  const re = /<article\b[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  let m;
  while ((m = re.exec(html))) {
    const b = m[1];
    const hr = b.match(/<h2[^>]*class="[^"]*lh-condensed[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/([^"/]+)\/([^"/?#]+)"/);
    if (!hr) continue;
    const owner = decodeEntities(hr[1]); const name = decodeEntities(hr[2]);
    if (!owner || !name) continue;
    let description = null; const dm = b.match(/<p\b[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (dm) description = stripTags(dm[1]) || null;
    let language = null; const lm = b.match(/<span\b[^>]*itemprop="programmingLanguage"[^>]*>\s*([^<]+)<\/span>/);
    if (lm) language = decodeEntities(lm[1].trim()) || null;
    let languageColor = null; const cm = b.match(/<span\b[^>]*class="[^"]*repo-language-color[^"]*"[^>]*style="background-color:\s*([^"]+)"/);
    if (cm) languageColor = cm[1].trim();
    let stars = 0, forks = 0;
    for (const t of b.matchAll(/<a\b[^>]*href="\/[^"/]+\/[^"/?#]+\/(stargazers|forks)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const n = parseInt(stripTags(t[2]).replace(/[,\s]/g, ""), 10);
      if (Number.isFinite(n)) { if (t[1] === "stargazers") stars = n; if (t[1] === "forks") forks = n; }
    }
    let starsGained = 0;
    const gm = b.match(/<span\b[^>]*?class="[^"]*float-sm-right[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    if (gm) { const txt = stripTags(gm[1]); const nm = txt.match(/([\d,]+)\s+stars?\s+(?:today|this\s+week|this\s+month)/i); if (nm) starsGained = parseInt(nm[1].replace(/,/g, ""), 10) || 0; }
    repos.push({
      fullName: `${owner}/${name}`, owner, name,
      url: `https://github.com/${owner}/${name}`,
      ownerAvatarUrl: `https://github.com/${owner}.png?size=80`,
      description, language, languageColor, stars, forks, starsGained,
    });
  }
  return repos;
}
async function scrapeBoard(window) { return parseTrendingHtml(await fetchHtml(`https://github.com/trending?since=${window}`)).slice(0, LIMIT); }
async function fetchReadme(owner, name) {
  const h = { accept: "application/vnd.github.raw", "user-agent": UA };
  if (process.env.GITHUB_TOKEN) h.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, { headers: h });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`README ${owner}/${name} -> ${r.status}`);
  return (await r.text()).slice(0, 14000);
}

const DEEPSEEK_BASE = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

async function chat({ system, user, jsonMode = false, retries = 2, maxTokens = 800 }) {
  if (!process.env.DEEPSEEK_API_KEY) throw new Error("缺少 DEEPSEEK_API_KEY");
  const body = { model: DEEPSEEK_MODEL, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: jsonMode ? 0.3 : 0.5, max_tokens: maxTokens };
  if (jsonMode) body.response_format = { type: "json_object" };
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const r = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
        body: JSON.stringify(body),
      });
      if (!r.ok) { const e = await r.text().catch(() => ""); throw new Error(`DeepSeek ${r.status}: ${e.slice(0, 200)}`); }
      const d = await r.json(); const c = d?.choices?.[0]?.message?.content;
      if (!c) throw new Error("empty content");
      return c;
    } catch (e) {
      lastErr = e;
      if (i < retries) { await new Promise((rr) => setTimeout(rr, 1500 * (i + 1))); console.warn(`  retry: ${e.message}`); }
    }
  }
  throw lastErr;
}

const LIGHT_SYS = `你给"AI 研究生（有 ML/LLM/agent 基础但不熟此项目）"做 GitHub 项目导读。

返回严格 JSON: { tldr, tags, light, worthDeepDive }
- tldr: 30-50 字。"这是一个【类型】，用来【做什么】，特别在【独特点】"。不要复述 description。
- tags: 3-5 个短标签。反映项目本质。
- light: 80-150 字。讲清"为什么这周/月在 trending 上"。不要复述 tldr。一段连贯中文。
- worthDeepDive: 0-100 整数。"对 AI 研究生学习的价值"。
    100=必读 / 80-99=强烈推荐 / 60-79=值得深读 / 40-59=一般 / 0-39=营销/跟风/低质量
  评分依据：技术新意+工程质量+概念价值+是否值得 30 分钟。营销文案/AI 赚钱/官方示例分数应偏低。`;

const DEEP_SYS = `你给"AI 研究生"做深度技术解读。每段必须基于 README，不知道就说"README 没写"。

**关键格式要求 — 必须严格遵守，否则整次输出作废：**
- howItWorks 字段必须用 \`## 组件\` \`## 数据流\` \`## 关键算法/配置\` 这样的二级 markdown 标题分成至少 2 段，每段 200-300 字。
- limitations 字段必须是数组 \`[{title, body}]\`，3-5 条，每条 title ≤ 10 字，body 60-120 字。
- tryIt 字段必须是数组 \`[{step, cmd?, note?}]\`，5-8 步骤。step = 这一步要做什么（30-80 字），cmd（可选）= 真实命令字符串，note（可选）= 一句提醒。
- 文本里需要时可用 \`**加粗**\` 高亮关键术语 / 数字，可用 \`\\\`code\\\`\` 标记代码 / 路径。

返回严格 JSON：
{
  "atGlance": "60-100 字。'为什么要花 30 分钟看这个项目'。不要复述 description。",
  "whyItMatters": [
    {"title": "短标题 ≤ 10 字", "body": "40-70 字"},
    {"title": "...", "body": "..."},
    {"title": "...", "body": "..."}
  ],
  "keyConcepts": [
    {"term": "Pitch Agent", "explain": "本仓库特有的投行专用代理，封装了从客户简报到生成 PPT 草稿的完整流程，自动调用 \\\`FactSet\\\` / \\\`S&P Global\\\` 等 MCP 连接器抓取数据。可类比为'套着金融模板的 **LangChain agent**'。"}
    // 3-5 条。term AND explain 都必填，explain 不能空。
  ],
  "howItWorks": "## 组件\\n第一段 200-300 字讲组件...\\n\\n## 数据流\\n第二段 200-300 字讲数据流...\\n\\n## 关键算法 / 配置\\n第三段 200-300 字讲关键算法和配置项。",
  "novelty": "300-500 字。对比 2-4 个同领域知名方案（点名 LangChain / AutoGen / Llama 等）。新意不大就诚实说。可用空行分 2 段。",
  "ecosystem": "200-350 字。依赖什么 / 搭配什么 / 替代什么 / 跟谁竞争。可用空行分段。",
  "limitations": [
    {"title": "记忆容量有限", "body": "虽然有生命周期管理，但长期使用后 SQLite 数据库可能增长到 **数百 MB**，影响检索速度。"},
    {"title": "嵌入模型局限", "body": "..."}
    // 3-5 条
  ],
  "tryIt": [
    {"step": "安装并启动记忆服务器", "cmd": "npx @agentmemory/agentmemory", "note": "默认占用端口 3113"},
    {"step": "在浏览器看实时记忆图", "cmd": "open http://localhost:3113"},
    {"step": "..." }
    // 5-8 步
  ],
  "score": { "novelty": 0-25, "engineering": 0-25, "reproducibility": 0-25, "timeToValue": 0-25 }
}

不要 markdown 包裹，直接返回 JSON 对象。`;

function lightUser(r, md) {
  const d = r.description ? `\n描述：${r.description}` : "";
  const l = r.language ? `\n主语言：${r.language}` : "";
  return `仓库：${r.fullName}${d}${l}\n\nREADME:\n"""\n${md || "(没拿到 README)"}\n"""`;
}
function deepUser(r, md) {
  const d = r.description ? `\n描述：${r.description}` : "";
  const l = r.language ? `\n主语言：${r.language}` : "";
  const s = `\nstars: ${r.stars}，本榜窗口新增 ${r.starsGained}`;
  return `仓库：${r.fullName}${d}${l}${s}\n\nREADME:\n"""\n${md || "(没拿到 README)"}\n"""\n\n严格按 JSON schema 返回。limitations 和 tryIt 必须是数组（不要粘成一段字符串）。howItWorks 必须用 ## 分段。`;
}
function parseJson(raw) { let s = raw.trim(); if (s.startsWith("```")) s = s.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim(); return JSON.parse(s); }

function offlineLight(r) {
  const k = r.language ? `一个 ${r.language} 项目` : "一个开源项目";
  const w = r.description || "（仓库未提供描述）";
  return {
    tldr: `${k}：${w.slice(0, 36)}${w.length > 36 ? "…" : ""}`,
    tags: [r.language, "trending"].filter(Boolean),
    light: `${w} ${r.starsGained > 0 ? `本榜窗口新增 ${r.starsGained.toLocaleString()} ★。` : ""}\n\n[占位] 配置 DEEPSEEK_API_KEY 后跑 npm run ingest 替换为真实解读。`,
    worthDeepDive: 50,
  };
}
function offlineDeep(r) {
  return {
    atGlance: `${r.fullName}（${r.language || "?"}，${r.stars.toLocaleString()} ★）登上 trending。真实 atGlance 需 DeepSeek。`,
    whyItMatters: [
      { title: "占位 · 影响", body: "[占位]" }, { title: "占位 · 工程", body: "[占位]" }, { title: "占位 · 研究", body: "[占位]" },
    ],
    keyConcepts: [{ term: "占位术语", explain: "[占位]" }],
    howItWorks: "## 占位\n[占位] 真实分析将基于 README 讲架构。",
    novelty: "[占位] 真实分析将对比同类项目。",
    ecosystem: "[占位] 真实分析将讲生态位置。",
    limitations: [{ title: "占位", body: "[占位]" }],
    tryIt: [{ step: "[占位] 真实分析将给上手步骤", cmd: "" }],
    score: { novelty: 0, engineering: 0, reproducibility: 0, timeToValue: 0 },
  };
}

async function pMap(items, limit, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      try { out[idx] = await fn(items[idx], idx); } catch (e) { out[idx] = { __error: e.message }; }
    }
  }));
  return out;
}

function normalizeKeyConcepts(arr, name) {
  return (Array.isArray(arr) ? arr : []).slice(0, 5).map((k) => {
    const term = String(k?.term || "").trim();
    let explain = String(k?.explain || "").trim();
    if (term && !explain) {
      console.warn(`  ⚠ ${name} keyConcept "${term}" 缺 explain，用 fallback`);
      explain = `README 中提到 "${term}" 但没有独立定义。建议直接搜索 README 中该词的上下文。`;
    }
    return { term, explain };
  }).filter((k) => k.term);
}

function normalizeLimitations(v, name) {
  if (Array.isArray(v)) {
    return v.slice(0, 8).map((x) => ({
      title: String(x?.title || "").trim() || "未命名条目",
      body: String(x?.body || "").trim() || "(README 未详细说明)",
    })).filter((x) => x.body && x.body !== "(README 未详细说明)" || x.title !== "未命名条目");
  }
  if (typeof v === "string" && v) {
    console.warn(`  ⚠ ${name} limitations 不是数组，尝试拆分字符串`);
    const parts = v.split(/(?=，[^，。]{2,15}[：:])/).map((p) => p.replace(/^，/, "").trim()).filter(Boolean);
    return parts.map((p) => {
      const m = p.match(/^([^：:]{2,18})[：:](.+)/);
      return m ? { title: m[1].trim(), body: m[2].trim() } : { title: "条目", body: p };
    });
  }
  return [];
}

function normalizeTryIt(v, name) {
  if (Array.isArray(v)) {
    return v.slice(0, 10).map((x) => ({
      step: String(x?.step || "").trim(),
      cmd: x?.cmd ? String(x.cmd).trim() : undefined,
      note: x?.note ? String(x.note).trim() : undefined,
    })).filter((x) => x.step);
  }
  if (typeof v === "string" && v) {
    console.warn(`  ⚠ ${name} tryIt 不是数组，尝试按数字编号拆分`);
    const parts = v.split(/(?=\b\d+\.\s)/).map((p) => p.replace(/^\d+\.\s*/, "").trim()).filter(Boolean);
    return parts.map((p) => ({ step: p }));
  }
  return [];
}

// ── Cache ─────────────────────────────────────────────────────────
async function loadCache() {
  if (NO_CACHE) return {};
  if (!existsSync(CACHE_FILE)) return {};
  try {
    const obj = JSON.parse(await readFile(CACHE_FILE, "utf8"));
    if (obj.__schema !== SCHEMA_VERSION) { console.log(`(cache schema ${obj.__schema} != ${SCHEMA_VERSION}, ignoring)`); return {}; }
    return obj.entries || {};
  } catch (e) { console.warn(`cache read failed: ${e.message}`); return {}; }
}
async function saveCache(entries) {
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(CACHE_FILE, JSON.stringify({ __schema: SCHEMA_VERSION, savedAt: new Date().toISOString(), entries }, null, 2), "utf8");
}
function cacheHit(entry, repo) {
  if (!entry) return false;
  const age = (Date.now() - new Date(entry.analyzedAt).getTime()) / 86400000;
  if (age > CACHE_TTL_DAYS) return false;
  const drift = entry.starsAt > 0 ? Math.abs(repo.stars - entry.starsAt) / entry.starsAt : 1;
  return drift <= STARS_DRIFT_THRESHOLD;
}

async function processBoard(window, all, cache) {
  console.log(`\n=== ${window} === (${all.length} repos)`);
  const readmes = NO_README ? all.map(() => null) : await pMap(all, 5, async (r) => {
    const e = cache[r.fullName];
    if (e?.readmeCached && cacheHit(e, r)) return e.readmeCached;
    try { return await fetchReadme(r.owner, r.name); }
    catch (err) { console.warn(`  README failed ${r.fullName}: ${err.message}`); return null; }
  });

  console.log("→ light…");
  const lights = await pMap(all, 3, async (r, i) => {
    const e = cache[r.fullName];
    if (e?.light && cacheHit(e, r)) { console.log(`  ⟲ cache HIT light ${r.fullName}`); return e.light; }
    if (NO_LLM) return offlineLight(r);
    try {
      const raw = await chat({ system: LIGHT_SYS, user: lightUser(r, readmes[i]), jsonMode: true, maxTokens: 700 });
      const p = parseJson(raw);
      return {
        tldr: String(p.tldr || "").trim() || offlineLight(r).tldr,
        tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 5) : offlineLight(r).tags,
        light: String(p.light || "").trim(),
        worthDeepDive: Math.max(0, Math.min(100, Math.round(Number(p.worthDeepDive) || 50))),
      };
    } catch (e2) { console.warn(`  light failed ${r.fullName}: ${e2.message}`); return offlineLight(r); }
  });

  const rankedByWorth = all.map((r, i) => ({ r, i, w: lights[i]?.worthDeepDive ?? 50 })).sort((a, b) => b.w - a.w);
  const deepIdxSet = new Set();
  for (const x of rankedByWorth) { if (deepIdxSet.size >= CAP) break; if (x.w >= WORTH_THRESHOLD) deepIdxSet.add(x.i); }
  console.log(`→ deep dive: ${deepIdxSet.size} repos (worth >= ${WORTH_THRESHOLD}, cap ${CAP})`);

  const deeps = new Array(all.length).fill(null);
  for (const idx of [...deepIdxSet].sort((a, b) => a - b)) {
    const r = all[idx];
    console.log(`  · #${idx + 1} ${r.fullName} (worth ${lights[idx].worthDeepDive})`);
    const e = cache[r.fullName];
    if (e?.deep && cacheHit(e, r)) { console.log(`    ⟲ cache HIT deep`); deeps[idx] = e.deep; continue; }
    if (NO_LLM) { deeps[idx] = offlineDeep(r); continue; }
    try {
      const raw = await chat({ system: DEEP_SYS, user: deepUser(r, readmes[idx]), jsonMode: true, maxTokens: 4500 });
      const p = parseJson(raw);
      const safe = (a) => Array.isArray(a) ? a : [];
      const sc = p.score || {};
      deeps[idx] = {
        atGlance: String(p.atGlance || "").trim(),
        whyItMatters: safe(p.whyItMatters).slice(0, 3).map((w) => ({ title: String(w?.title || "").trim(), body: String(w?.body || "").trim() })),
        keyConcepts: normalizeKeyConcepts(p.keyConcepts, r.fullName),
        howItWorks: String(p.howItWorks || "").trim(),
        novelty: String(p.novelty || "").trim(),
        ecosystem: String(p.ecosystem || "").trim(),
        limitations: normalizeLimitations(p.limitations, r.fullName),
        tryIt: normalizeTryIt(p.tryIt, r.fullName),
        score: {
          novelty: Math.max(0, Math.min(25, Number(sc.novelty) || 0)),
          engineering: Math.max(0, Math.min(25, Number(sc.engineering) || 0)),
          reproducibility: Math.max(0, Math.min(25, Number(sc.reproducibility) || 0)),
          timeToValue: Math.max(0, Math.min(25, Number(sc.timeToValue) || 0)),
        },
      };
    } catch (e2) { console.warn(`  deep failed ${r.fullName}: ${e2.message}`); deeps[idx] = offlineDeep(r); }
  }

  for (let i = 0; i < all.length; i++) {
    const r = all[i];
    cache[r.fullName] = {
      starsAt: r.stars,
      analyzedAt: new Date().toISOString(),
      readmeCached: readmes[i] && typeof readmes[i] === "string" ? readmes[i] : null,
      light: lights[i], deep: deeps[i],
    };
  }

  return {
    window, generatedAt: new Date().toISOString(),
    repos: all.map((r, i) => ({
      ...r, rank: i + 1,
      tldr: lights[i]?.tldr || "",
      tags: lights[i]?.tags || [],
      light: lights[i]?.light || "",
      worthDeepDive: lights[i]?.worthDeepDive ?? 0,
      ...(deeps[i] ? { deep: deeps[i] } : {}),
    })),
  };
}

async function main() {
  await loadEnv();
  console.log("Mode:", NO_LLM ? "OFFLINE" : "DeepSeek", "/ cache:", NO_CACHE ? "OFF" : "ON",
    "/ limit:", LIMIT, "/ cap:", CAP, "/ worth>=", WORTH_THRESHOLD);
  const cache = await loadCache();
  const before = Object.keys(cache).length;
  console.log(`cache: ${before} entries loaded`);
  const windows = ["daily", "weekly", "monthly"];
  const boards = {};
  for (const w of windows) {
    console.log(`抓榜：${w}…`);
    boards[w] = await processBoard(w, await scrapeBoard(w), cache);
  }
  await saveCache(cache);
  console.log(`cache: ${Object.keys(cache).length} entries saved (was ${before})`);
  const out = { generatedAt: new Date().toISOString(), daily: boards.daily, weekly: boards.weekly, monthly: boards.monthly };
  await mkdir(path.join(ROOT, "public", "data"), { recursive: true });
  const p = path.join(ROOT, "public", "data", "trending.json");
  await writeFile(p, JSON.stringify(out, null, 2), "utf8");
  const n = windows.reduce((a, w) => a + boards[w].repos.length, 0);
  const d = windows.reduce((a, w) => a + boards[w].repos.filter((r) => r.deep).length, 0);
  console.log(`\n✓ 写入 ${p}\n  共 ${n} 仓库，${d} 份 deep dive。`);
}
main().catch((e) => { console.error(e); process.exit(1); });

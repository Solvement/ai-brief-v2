#!/usr/bin/env node
/**
 * GitHub Trending → DeepSeek → public/data/trending.json
 * Flags: --dry-run/--no-llm  --no-readme  --no-cache  --limit=N  --cap=N  --worth=N
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildAgentFlow,
  createQualityGate,
  gateCheck,
  gateWarning,
  rememberPipelineRun,
  summarizeSelection,
} from "./lib/agentic-pipeline.mjs";
import { fetchGitHubReadme, scrapeTrendingBoard } from "./lib/github-trending.mjs";
import {
  PROJECT_FOCUS_GUIDANCE,
  adjustWorthForAiEngineerFocus,
  selectDeepDiveIndices,
} from "./lib/project-ranking.mjs";
import { DEEP_SYS, LIGHT_SYS, deepUser, lightUser } from "./lib/project-prompts.mjs";
import { createDeepSeekClient, projectDeepModel, projectLightModel } from "./lib/llm.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CACHE_DIR = path.join(ROOT, ".cache");
const CACHE_FILE = path.join(CACHE_DIR, "analyses.json");
const SCHEMA_VERSION = 4;
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
const API_TIMEOUT_MS = numFlag("api-timeout-ms", Number(process.env.DEEPSEEK_TIMEOUT_MS) || 180000);
const LIGHT_MAX_TOKENS = numFlag("light-max-tokens", Number(process.env.PROJECT_LIGHT_MAX_TOKENS) || 1200);
const DEEP_MAX_TOKENS = numFlag("deep-max-tokens", Number(process.env.PROJECT_DEEP_MAX_TOKENS) || 8000);
const { chatJson } = createDeepSeekClient({ apiTimeoutMs: API_TIMEOUT_MS });

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
    try { return await fetchGitHubReadme(r.owner, r.name); }
    catch (err) { console.warn(`  README failed ${r.fullName}: ${err.message}`); return null; }
  });

  console.log("→ light…");
  const lights = await pMap(all, 3, async (r, i) => {
    const e = cache[r.fullName];
    if (e?.light && cacheHit(e, r)) { console.log(`  ⟲ cache HIT light ${r.fullName}`); return adjustWorthForAiEngineerFocus(r, readmes[i], e.light); }
    if (NO_LLM) return adjustWorthForAiEngineerFocus(r, readmes[i], offlineLight(r));
    try {
      const p = await chatJson({ system: `${LIGHT_SYS}\n\n${PROJECT_FOCUS_GUIDANCE}`, user: lightUser(r, readmes[i]), model: projectLightModel(), maxTokens: LIGHT_MAX_TOKENS });
      const parsedLight = {
        tldr: String(p.tldr || "").trim() || offlineLight(r).tldr,
        tags: Array.isArray(p.tags) ? p.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 5) : offlineLight(r).tags,
        light: String(p.light || "").trim(),
        worthDeepDive: Math.max(0, Math.min(100, Math.round(Number(p.worthDeepDive) || 50))),
      };
      return adjustWorthForAiEngineerFocus(r, readmes[i], parsedLight);
    } catch (e2) { console.warn(`  light failed ${r.fullName}: ${e2.message}`); return adjustWorthForAiEngineerFocus(r, readmes[i], offlineLight(r)); }
  });

  const deepIdxSet = selectDeepDiveIndices(all, lights, { cap: CAP, worthThreshold: WORTH_THRESHOLD });
  console.log(`→ deep dive: ${deepIdxSet.size} repos (worth >= ${WORTH_THRESHOLD}, cap ${CAP})`);

  const deeps = new Array(all.length).fill(null);
  for (const idx of [...deepIdxSet].sort((a, b) => a - b)) {
    const r = all[idx];
    console.log(`  · #${idx + 1} ${r.fullName} (worth ${lights[idx].worthDeepDive})`);
    const e = cache[r.fullName];
    if (e?.deep && cacheHit(e, r)) { console.log(`    ⟲ cache HIT deep`); deeps[idx] = e.deep; continue; }
    if (NO_LLM) { deeps[idx] = offlineDeep(r); continue; }
    try {
      const p = await chatJson({ system: DEEP_SYS, user: deepUser(r, readmes[idx]), model: projectDeepModel(), maxTokens: DEEP_MAX_TOKENS });
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
      ...(lights[i]?.rankingReason ? { rankingReason: lights[i].rankingReason } : {}),
      ...(deeps[i] ? { deep: deeps[i] } : {}),
    })),
  };
}

async function main() {
  await loadEnv();
  console.log("Mode:", NO_LLM ? "OFFLINE" : "DeepSeek", "/ cache:", NO_CACHE ? "OFF" : "ON",
    "/ limit:", LIMIT, "/ cap:", CAP, "/ worth>=", WORTH_THRESHOLD);
  console.log("Models:", `project light=${projectLightModel()}`, `/ project deep=${projectDeepModel()}`);
  const cache = await loadCache();
  const before = Object.keys(cache).length;
  console.log(`cache: ${before} entries loaded`);
  const windows = ["daily", "weekly", "monthly"];
  const boards = {};
  for (const w of windows) {
    console.log(`抓榜：${w}…`);
    boards[w] = await processBoard(w, await scrapeTrendingBoard(w, { limit: LIMIT }), cache);
  }
  await saveCache(cache);
  console.log(`cache: ${Object.keys(cache).length} entries saved (was ${before})`);
  const allRepos = windows.flatMap((w) => boards[w].repos);
  const deepRepos = allRepos.filter((repo) => repo.deep);
  const deepRepoIds = new Set(deepRepos.map((repo) => repo.fullName));
  const agentFlow = buildAgentFlow("projects", {
    discover: `${allRepos.length} repos from GitHub Trending daily/weekly/monthly`,
    evidence: `${allRepos.length} README fetch attempts, cache entries ${Object.keys(cache).length}`,
    rank: `worthDeepDive threshold ${WORTH_THRESHOLD}, cap ${CAP}`,
    review: `${deepRepos.length} project deep dives, ${allRepos.length - deepRepos.length} light reads`,
    verify: "validate-trending + text encoding gate",
    publish: "public/data/trending.json",
    archive: ".cache/analyses.json + data/agent-memory/projects.json",
  });
  const qualityGate = createQualityGate({
    surface: "projects",
    checks: [
      gateCheck("boards-present", "daily / weekly / monthly boards exist", windows.every((w) => boards[w]?.repos?.length > 0), `windows=${windows.join(",")}`),
      gateCheck("cards-have-tldr", "every project card has a TL;DR", allRepos.every((repo) => repo.tldr && repo.light), `${allRepos.length} repos checked`),
      gateCheck("worth-scores", "every project has a numeric worthDeepDive score", allRepos.every((repo) => Number.isFinite(repo.worthDeepDive)), `${allRepos.length} repos checked`),
      gateWarning("deep-dive-coverage", "at least one high-value project gets a deep dive", deepRepos.length > 0, `${deepRepos.length} deep dives selected`),
    ],
  });
  const pipelineMemory = await rememberPipelineRun({
    surface: "projects",
    date: new Date().toISOString().slice(0, 10),
    sourceFiles: {
      public: "public/data/trending.json",
      cache: ".cache/analyses.json",
    },
    agentFlow,
    qualityGate,
    selectedItems: summarizeSelection(deepRepos, (repo) => ({
      id: repo.fullName,
      title: repo.fullName,
      score: repo.worthDeepDive,
      reason: repo.tldr,
    })),
    archivedItems: summarizeSelection(allRepos.filter((repo) => !repo.deep && !deepRepoIds.has(repo.fullName)).slice(0, 12), (repo) => ({
      id: repo.fullName,
      title: repo.fullName,
      score: repo.worthDeepDive,
      reason: "light read or below deep-dive threshold",
    })),
    highlights: [
      `Projects refreshed ${allRepos.length} repos from GitHub Trending.`,
      `${deepRepos.length} repos passed the deep-dive threshold.`,
    ],
    nextActions: [
      "Open Projects page and verify cards are not blank.",
      "Run npm run validate before treating the refresh as published.",
    ],
    reusablePatterns: deepRepos.slice(0, 5).map((repo) => ({
      text: `${repo.fullName}: ${repo.tldr}`,
      source: "projects",
    })),
  });
  const out = {
    generatedAt: new Date().toISOString(),
    analysisModels: {
      projectLight: projectLightModel(),
      projectDeep: projectDeepModel(),
    },
    pipelineRun: {
      id: pipelineMemory.run.id,
      memoryFile: "data/agent-memory/projects.json",
      statusFile: "public/data/pipeline-status.json",
    },
    agentFlow,
    qualityGate,
    daily: boards.daily,
    weekly: boards.weekly,
    monthly: boards.monthly,
  };
  await mkdir(path.join(ROOT, "public", "data"), { recursive: true });
  const p = path.join(ROOT, "public", "data", "trending.json");
  await writeFile(p, JSON.stringify(out, null, 2), "utf8");
  const n = windows.reduce((a, w) => a + boards[w].repos.length, 0);
  const d = windows.reduce((a, w) => a + boards[w].repos.filter((r) => r.deep).length, 0);
  console.log(`\n✓ 写入 ${p}\n  共 ${n} 仓库，${d} 份 deep dive。`);
}
main().catch((e) => { console.error(e); process.exit(1); });

#!/usr/bin/env node

// scripts/columns/podcasts/daily.mjs
// Deterministic daily podcast pipeline.
//
// For each source in data/podcasts/sources.json:
//   1. SCAN (deterministic, no agent): get the LATEST video id+title via yt-dlp
//      `--flat-playlist --playlist-end 1`. This is the project red line — the daily
//      scan must be a fixed script, never an open-ended agent.
//   2. If the latest video id is already in data/podcasts/ledger.json → skip ("无新一期").
//   3. If NEW → transcribe via the Hermes CLI with a LOCKED faithful-dialogue prompt
//      (Kevin-approved, do NOT change), derive metadata.json matching the existing
//      content/podcasts/<slug>/ schema, append the id to the ledger.
//   4. After all sources, rebuild public/data/podcasts.json via build-index.mjs.
//
// Only step 3 calls an agent (Hermes), and only with a fixed prompt. The scan/skip
// decision is pure deterministic code.
//
// --dry-run: scan + print latest-per-source + which are new. NO Hermes, NO writes.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..", "..");
const SOURCES_FILE = path.join(ROOT, "data", "podcasts", "sources.json");
const LEDGER_FILE = path.join(ROOT, "data", "podcasts", "ledger.json");
const CONTENT_DIR = path.join(ROOT, "content", "podcasts");
const BUILD_INDEX = path.join(__dirname, "build-index.mjs");

// LOCKED faithful-dialogue prompt (Kevin-approved). {{URL}} and {{OUT}} are filled per episode.
// Do NOT change the wording of this template.
const HERMES_PROMPT_TEMPLATE =
  "转录这个 YouTube 视频: {{URL}} 。整理成一份忠实对照原对话的中文笔记。" +
  "目标:让读者读到嘉宾实际说了什么,而不是替他总结或下结论。" +
  "结构:(1)一句中性概述:这期主要谈了哪些话题(只罗列,不评价);" +
  "(2)按对话脉络逐段(按时间顺序拆成实际讨论的话题段),每段写:" +
  "a.这段在谈什么/主持人问了什么;b.嘉宾的回答——忠实翻译并转述原话与论证,带时间戳,英文源给中英对照;" +
  "c.例子或论据原样呈现,不升华。" +
  "硬性要求:不要写『对你意味着什么』,不做判断/总结/结论,不给『值不值得听』评价。你是忠实转述者。" +
  "(3)关键原话+时间戳。全部用中文。把笔记保存为文件:{{OUT}}";

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printUsage();
    return null;
  }

  const today = options.today || new Date().toISOString().slice(0, 10);
  const sources = await readSources();
  const ledger = await readLedger();
  const ingested = new Set(ledger.ingested || []);

  const ytdlp = resolveYtDlp();
  console.log(`[podcasts] scan via: ${ytdlp.label}`);

  const scanned = [];
  let newCount = 0;
  let transcribed = 0;

  for (const source of sources) {
    const latest = scanLatest(ytdlp, source.channel_url);
    if (!latest) {
      console.warn(`[podcasts] ${source.name}: 扫描失败 (无法解析最新一期) — 跳过`);
      scanned.push({ source: source.name, status: "scan-failed", videoId: "", title: "" });
      continue;
    }

    const isNew = !ingested.has(latest.id);
    if (!isNew) {
      console.log(`[podcasts] ${source.name}: 无新一期 (最新 ${latest.id} 已在账本) — ${latest.title}`);
      scanned.push({ source: source.name, status: "skip", videoId: latest.id, title: latest.title });
      continue;
    }

    newCount += 1;
    const slug = `${source.slug_prefix}-${latest.id}`;
    const url = `https://www.youtube.com/watch?v=${latest.id}`;

    if (options.dryRun) {
      console.log(`[podcasts] ${source.name}: 发现新一期 ${latest.id} — ${latest.title} → would transcribe (slug ${slug})`);
      scanned.push({ source: source.name, status: "would-transcribe", videoId: latest.id, title: latest.title, slug });
      continue;
    }

    console.log(`[podcasts] ${source.name}: 发现新一期 ${latest.id} — ${latest.title} → 转录中 (slug ${slug})`);
    const result = await transcribeAndWrite({ source, latest, slug, url, today });
    if (result.ok) {
      transcribed += 1;
      ingested.add(latest.id);
      scanned.push({ source: source.name, status: "transcribed", videoId: latest.id, title: latest.title, slug });
    } else {
      console.warn(`[podcasts] ${source.name}: 转录失败 ${latest.id} — ${result.error}`);
      scanned.push({ source: source.name, status: "transcribe-failed", videoId: latest.id, title: latest.title, slug });
    }
  }

  if (!options.dryRun && transcribed > 0) {
    await writeLedger({ ...ledger, ingested: [...ingested] });
    runBuildIndex();
  } else if (options.dryRun) {
    console.log(`[podcasts] dry-run: 不调用 Hermes、不写文件、不重建索引`);
  } else {
    console.log(`[podcasts] 无新一期 — 不重建索引`);
  }

  printSummary({ scanned, newCount, transcribed, dryRun: options.dryRun });
  return { column: "podcasts", today, scanned, newCount, transcribed, dryRun: options.dryRun };
}

export function parseArgs(argv = []) {
  const options = { dryRun: false, help: false, today: "" };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--today") {
      if (index + 1 >= argv.length) throw new Error("Missing value for --today");
      options.today = argv[++index];
    } else if (arg.startsWith("--today=")) {
      options.today = arg.slice(arg.indexOf("=") + 1);
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }
  return options;
}

// ---- deterministic scan ----------------------------------------------------

function resolveYtDlp() {
  // Prefer a standalone yt-dlp on PATH; fall back to `python -m yt_dlp`.
  const probe = spawnSync("yt-dlp", ["--version"], { encoding: "utf8" });
  if (!probe.error && probe.status === 0) {
    return { cmd: "yt-dlp", baseArgs: [], label: "yt-dlp (PATH)" };
  }
  const py = process.env.PYTHON || "python";
  return { cmd: py, baseArgs: ["-m", "yt_dlp"], label: `${py} -m yt_dlp` };
}

function bufToUtf8(value) {
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return String(value || "");
}

function scanLatest(ytdlp, channelUrl) {
  // Deterministic: newest item only. \t-separated id+title.
  const args = [
    ...ytdlp.baseArgs,
    "--flat-playlist",
    "--playlist-end", "1",
    "--print", "%(id)s\t%(title)s",
    channelUrl,
  ];
  // Capture as buffers + force UTF-8 from yt-dlp. On Windows, Python defaults stdout
  // to the console codepage, which mangles non-ASCII titles (Chinese, curly quotes).
  const out = spawnSync(ytdlp.cmd, args, {
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
    env: { ...process.env, PYTHONIOENCODING: "utf-8" },
  });
  if (out.error || out.status !== 0) {
    const detail = bufToUtf8(out.stderr || out.error?.message || "").trim().split(/\r?\n/).slice(-1)[0] || "";
    console.warn(`[podcasts] yt-dlp scan failed for ${channelUrl}: ${detail}`);
    return null;
  }
  const line = bufToUtf8(out.stdout).split(/\r?\n/).find((l) => l.trim());
  if (!line) return null;
  const tab = line.indexOf("\t");
  const id = (tab === -1 ? line : line.slice(0, tab)).trim();
  const title = (tab === -1 ? "" : line.slice(tab + 1)).trim();
  if (!id) return null;
  return { id, title };
}

// ---- transcribe (Hermes, fixed prompt) + derive metadata -------------------

async function transcribeAndWrite({ source, latest, slug, url, today }) {
  const dir = path.join(CONTENT_DIR, slug);
  const digestPath = path.join(dir, "digest.md");
  const metaPath = path.join(dir, "metadata.json");
  await mkdir(dir, { recursive: true });

  const prompt = HERMES_PROMPT_TEMPLATE
    .replace("{{URL}}", url)
    .replace("{{OUT}}", digestPath);

  const run = spawnSync("hermes", ["-z", prompt, "--yolo"], {
    encoding: "utf8",
    stdio: ["ignore", "inherit", "inherit"],
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
  });
  if (run.error || run.status !== 0) {
    return { ok: false, error: run.error?.message || `hermes exit ${run.status}` };
  }
  if (!existsSync(digestPath)) {
    return { ok: false, error: `Hermes ran but ${digestPath} was not written` };
  }

  const digest = await readFile(digestPath, "utf8");
  const tldr = parseNeutralOverview(digest);

  const meta = {
    slug,
    title: latest.title || "",
    guest: "",
    source: source.name,
    lang: source.lang || "",
    topic: "",
    url,
    duration: "",
    ingested: today,
    tldr,
    verdict: "",
    format: "faithful-dialogue",
    tags: [],
    pipeline: "hermes -z（忠实对照原对话逐段转述,不做判断结论）",
    confidence: "medium（基于 Hermes 自动转录;个别产品名/人名可能为音译,时间戳为转录后近似,待人工确认）",
  };
  await writeFile(metaPath, JSON.stringify(meta, null, 2) + "\n", "utf8");
  console.log(`[podcasts] ${source.name}: 写入 ${digestPath} + metadata.json`);
  return { ok: true };
}

// Pull the "一句中性概述" paragraph text out of the digest so metadata.tldr is
// the neutral topic list, matching the existing seeded episodes' tldr field.
export function parseNeutralOverview(markdown) {
  const lines = String(markdown || "").split(/\r?\n/);
  let inSection = false;
  const collected = [];
  for (const raw of lines) {
    const line = raw.trim();
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    if (heading) {
      if (inSection) break; // next heading ends the section
      if (heading[1].includes("一句中性概述") || heading[1].includes("中性概述")) {
        inSection = true;
      }
      continue;
    }
    if (!inSection) continue;
    if (line === "") {
      if (collected.length) break; // blank after content ends the paragraph
      continue;
    }
    collected.push(line);
  }
  return collected
    .join("")
    .replace(/\*\*/g, "")
    .trim();
}

// ---- index rebuild ---------------------------------------------------------

function runBuildIndex() {
  const run = spawnSync(process.execPath, [BUILD_INDEX], {
    encoding: "utf8",
    stdio: "inherit",
    windowsHide: true,
  });
  if (run.error || run.status !== 0) {
    console.warn(`[podcasts] build-index failed: ${run.error?.message || `exit ${run.status}`}`);
  }
}

// ---- io --------------------------------------------------------------------

async function readSources() {
  const raw = await readFile(SOURCES_FILE, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) throw new Error(`${SOURCES_FILE} must be a JSON array`);
  return parsed;
}

async function readLedger() {
  try {
    const parsed = JSON.parse(await readFile(LEDGER_FILE, "utf8"));
    if (!Array.isArray(parsed.ingested)) parsed.ingested = [];
    return parsed;
  } catch {
    return { ingested: [] };
  }
}

async function writeLedger(ledger) {
  await mkdir(path.dirname(LEDGER_FILE), { recursive: true });
  await writeFile(LEDGER_FILE, JSON.stringify(ledger, null, 2) + "\n", "utf8");
}

// ---- reporting -------------------------------------------------------------

function printSummary({ scanned, newCount, transcribed, dryRun }) {
  console.log("");
  console.log(`podcasts daily: ${scanned.length} sources scanned, ${newCount} new, ${dryRun ? "0 transcribed (dry-run)" : `${transcribed} transcribed`}`);
  for (const row of scanned) {
    console.log(`podcasts source: ${row.source} [${row.status}] ${row.videoId || "-"} ${row.title ? `| ${row.title}` : ""}`);
  }
}

function printUsage() {
  console.log(`Usage:
  node scripts/columns/podcasts/daily.mjs [--dry-run]

Deterministic daily podcast pipeline:
  scan latest per source (yt-dlp) -> skip if in ledger -> else Hermes transcribe -> rebuild index

Flags:
  --dry-run     Scan + print latest-per-source + which are new. No Hermes, no writes.
  --today YYYY-MM-DD  Override the ingested date stamp (default: today, UTC).
`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

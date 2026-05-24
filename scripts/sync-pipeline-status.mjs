#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  buildAgentFlow,
  createQualityGate,
  gateCheck,
  gateWarning,
  rememberPipelineRun,
  summarizeSelection,
} from "./lib/agentic-pipeline.mjs";

const ROOT = path.resolve(".");
const PUBLIC_DATA = path.join(ROOT, "public", "data");

async function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, "utf8"));
}

async function syncProjects() {
  const data = await readJsonIfExists(path.join(PUBLIC_DATA, "trending.json"));
  if (!data) return;
  const windows = ["daily", "weekly", "monthly"];
  const repos = windows.flatMap((windowName) => data[windowName]?.repos || []);
  const deepRepos = repos.filter((repo) => repo.deep);
  const deepRepoIds = new Set(deepRepos.map((repo) => repo.fullName));
  const agentFlow = data.agentFlow || buildAgentFlow("projects", {
    discover: `${repos.length} repos already present in public trending data`,
    evidence: "GitHub Trending metadata, README cache, light/deep analysis",
    rank: "worthDeepDive scores from current trending data",
    review: `${deepRepos.length} deep dives, ${repos.length - deepRepos.length} light reads`,
    verify: "validate-trending + validate-text-encoding",
    publish: "public/data/trending.json",
    archive: ".cache/analyses.json + data/agent-memory/projects.json",
  });
  const qualityGate = data.qualityGate || createQualityGate({
    surface: "projects",
    checks: [
      gateCheck("boards-present", "daily / weekly / monthly boards exist", windows.every((windowName) => data[windowName]?.repos?.length > 0), `${repos.length} repos present`),
      gateCheck("cards-have-tldr", "every project card has a TL;DR", repos.every((repo) => repo.tldr && repo.light), `${repos.length} repos checked`),
      gateWarning("deep-dive-coverage", "at least one high-value project gets a deep dive", deepRepos.length > 0, `${deepRepos.length} deep dives selected`),
    ],
  });
  await rememberPipelineRun({
    surface: "projects",
    date: String(data.generatedAt || new Date().toISOString()).slice(0, 10),
    sourceFiles: { public: "public/data/trending.json" },
    agentFlow,
    qualityGate,
    selectedItems: summarizeSelection(deepRepos, (repo) => ({ id: repo.fullName, title: repo.fullName, score: repo.worthDeepDive || 0, reason: repo.tldr || "" })),
    archivedItems: summarizeSelection(repos.filter((repo) => !repo.deep && !deepRepoIds.has(repo.fullName)).slice(0, 12), (repo) => ({ id: repo.fullName, title: repo.fullName, score: repo.worthDeepDive || 0, reason: "light read in current public data" })),
    highlights: [`Projects currently expose ${repos.length} repos and ${deepRepos.length} deep dives.`],
    nextActions: ["Use Projects refresh to update this memory from a live GitHub Trending run."],
    reusablePatterns: deepRepos.slice(0, 5).map((repo) => ({ text: `${repo.fullName}: ${repo.tldr}`, source: "projects" })),
  });
}

async function syncArticles() {
  const data = await readJsonIfExists(path.join(PUBLIC_DATA, "articles.json"));
  if (!data) return;
  const papers = data.papers || [];
  const agentFlow = data.agentFlow || buildAgentFlow("articles", {
    discover: `${papers.length} active papers already present`,
    evidence: "sources, architecture walkthroughs, experiment readings, verification tasks",
    rank: `quality-first active feed, archive count ${data.archiveCount || 0}`,
    review: `${papers.length} full deep dives`,
    verify: "validate-articles + validate-text-encoding",
    publish: "public/data/articles.json",
    archive: "public/data/articles-archive.json + data/agent-memory/articles.json",
  });
  const qualityGate = data.qualityGate || createQualityGate({
    surface: "articles",
    checks: [
      gateCheck("active-count", "active feed exists and respects daily limit", papers.length > 0 && papers.length <= (data.dailyLimit || 5), `${papers.length}/${data.dailyLimit || 5} active papers`),
      gateCheck("quality-decisions", "every active paper has qualityDecision", papers.every((paper) => paper.qualityDecision?.selectedForDaily), `${papers.length} papers checked`),
      gateCheck("verification", "every active paper has verification tasks", papers.every((paper) => paper.verificationTasks?.length), `${papers.length} papers checked`),
    ],
  });
  await rememberPipelineRun({
    surface: "articles",
    date: String(data.generatedAt || new Date().toISOString()).slice(0, 10),
    sourceFiles: { active: "public/data/articles.json", archive: "public/data/articles-archive.json" },
    agentFlow,
    qualityGate,
    selectedItems: summarizeSelection(papers, (paper) => ({ id: paper.id, title: paper.title, score: paper.qualityDecision?.qualityScore || 0, reason: paper.qualityDecision?.selectionReason || paper.oneSentenceTakeaway })),
    archivedItems: [],
    highlights: [`Articles currently expose ${papers.length} full deep dives.`],
    nextActions: ["Use Articles refresh to regenerate the curated active feed."],
    reusablePatterns: papers.map((paper) => ({ text: `${paper.shortTitle}: ${paper.ideaArchitecture?.centralQuestion || paper.oneSentenceTakeaway}`, source: "articles" })),
  });
}

async function syncPaperRadar() {
  const data = await readJsonIfExists(path.join(PUBLIC_DATA, "paper-radar.json"));
  if (!data) return;
  const selected = [data.mustRead, ...(data.skim || [])].filter(Boolean);
  const agentFlow = data.agentFlow || buildAgentFlow("paper_radar");
  const qualityGate = data.qualityGate || createQualityGate({
    surface: "paper_radar",
    checks: [
      gateCheck("must-read", "paper radar has one must-read paper", Boolean(data.mustRead), data.mustRead?.title || "missing"),
      gateCheck("skim-count", "paper radar has at most three skim papers", (data.skim || []).length <= 3, `${(data.skim || []).length} skim papers`),
      gateCheck("selection-trace", "selection trace is present", (data.selectionTrace || []).length > 0, `${(data.selectionTrace || []).length} trace rows`),
    ],
  });
  await rememberPipelineRun({
    surface: "paper_radar",
    date: data.date || String(data.generatedAt || new Date().toISOString()).slice(0, 10),
    sourceFiles: data.sourceFiles || { public: "public/data/paper-radar.json" },
    agentFlow,
    qualityGate,
    trace: data.runTrace || null,
    reflection: data.reflection || null,
    selectedItems: summarizeSelection(selected, (paper) => ({ id: paper.id, title: paper.title, score: paper.total_score || 0, reason: paper.reason || "" })),
    archivedItems: [],
    highlights: [data.mustRead ? `Paper Radar must-read: ${data.mustRead.title}` : "Paper Radar waiting for must-read."],
    nextActions: ["Use Radar refresh to rerun discover, triage, and daily publishing."],
    reusablePatterns: selected.map((paper) => ({ text: `${paper.title}: ${paper.reason || "paper radar pick"}`, source: "paper_radar" })),
  });
}

await syncProjects();
await syncArticles();
await syncPaperRadar();
console.log("pipeline status synced from current public data");

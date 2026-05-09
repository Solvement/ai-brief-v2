import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
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

function makeItem(base, overrides) {
  return {
    ...base,
    slug: overrides.id,
    summary: overrides.title,
    one_sentence_takeaway: overrides.title,
    why_it_matters: "Cluster smoke fixture for AI-brief event grouping.",
    source_url: `https://example.com/${overrides.id}`,
    canonical_url: `https://example.com/${overrides.id}`,
    status: "published",
    ...overrides,
  };
}

loadDotEnvLocal();
compileForNode();

const { contentItems } = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/content/seed.js")).href);
const { clusterByEvent } = await import(pathToFileURL(resolve(".tmp/test-build/src/lib/ingestion/cluster.js")).href);
const base = contentItems[0];

const sources = ["Official", "机器之心", "Hacker News", "QbitAI", "GitHub"];
const eventTemplates = [
  {
    id: "gpt5",
    type: "news",
    titles: [
      "OpenAI 发布 GPT-5，代码和多模态能力升级",
      "GPT-5 发布后开发者开始测试代码 Agent",
      "社区讨论 GPT-5 的上下文窗口和工具调用表现",
      "GPT-5 新模型带来工具调用能力变化",
      "OpenAI GPT-5 发布引发产品团队迁移评估",
      "GPT-5 release focuses on coding agents and multimodal workflows",
      "GPT-5 上线后 API 成本和速度成为关注点",
    ],
  },
  {
    id: "claude-code",
    type: "tool",
    titles: [
      "Claude Code 新版本增强 repo 级任务处理",
      "开发者测试 Claude Code 的长任务修复能力",
      "Claude Code workflow adds better terminal automation",
      "Claude Code 工具链更新引发 AI Coding 团队评估",
      "Claude Code 插件生态开始支持更多 IDE 场景",
      "Claude Code release improves code review workflows",
    ],
  },
  {
    id: "mcp-risk",
    type: "integration",
    titles: [
      "MCP 权限边界成为企业接入 AI Agent 的核心风险",
      "企业团队开始审查 MCP server 的读写权限",
      "MCP connector 安全配置需要最小权限策略",
      "Agent workflow 中 MCP 写权限需要回滚方案",
      "MCP 集成审核要求记录工具调用和数据边界",
      "MCP permission model becomes a practical enterprise checklist",
      "MCP server deployment needs validation before production use",
    ],
  },
];

let index = 0;
const items = eventTemplates.flatMap((template, eventIndex) =>
  template.titles.map((title, titleIndex) => {
    index += 1;
    return makeItem(base, {
      id: `${template.id}-${titleIndex + 1}`,
      title,
      content_type: template.type,
      source_name: sources[titleIndex % sources.length],
      collected_at: new Date(Date.UTC(2026, 4, 7, 8 + eventIndex, titleIndex * 5)).toISOString(),
      confidence_score: 55 + ((index * 7) % 40),
    });
  }),
);

const clusters = await clusterByEvent(items, { similarityThreshold: process.env.EMBEDDING_LIVE === "1" ? 0.62 : 0.42, timeWindowHours: 48 });
console.log(
  JSON.stringify(
    clusters.map((cluster) => ({
      id: cluster.id,
      content_type: cluster.content_type,
      member_count: cluster.member_ids.length,
      source_diversity: cluster.source_diversity,
      representative_id: cluster.representative_id,
      centroid_keywords: cluster.centroid_keywords,
      source_names: cluster.source_names,
    })),
    null,
    2,
  ),
);

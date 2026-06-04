import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import {
  projectDeepDiveFaithfulnessWarnings,
  writeProjectBriefWikiEntities,
} from "../columns/projects/brief-writer.mjs";

test("project deep-dive faithfulness guard warns on bare marketing metrics and unknown assertions", () => {
  const warnings = projectDeepDiveFaithfulnessWarnings({
    unknowns: [
      "未在 README/artifact 说明：四个特权环沙箱的具体权限模型和实现细节。",
      "互动 Agent 的浏览器插件技术实现（如 DOM 操作、反检测）未公开。",
    ],
    body: `## 大白话定位

覆盖 10/10 OWASP Agentic Top 10 风险（来源：README 徽章）。

### 执行沙箱

提供四个特权环沙箱，限制代理对系统资源的访问（来源：README Packages）。

### 互动模块

通过浏览器插件实现自动点赞、收藏和关注，具体实现细节未公开（来源：README Engage）。`,
  });

  assert.ok(
    warnings.some((warning) => warning.includes("faithfulness.high_risk_claim_attribution")),
    `expected high-risk attribution warning, got ${warnings.join("\n")}`,
  );
  assert.ok(
    warnings.some((warning) => warning.includes("faithfulness.unknown_assertion") && warning.includes("四个特权环沙箱")),
    `expected unknown assertion warning for sandbox, got ${warnings.join("\n")}`,
  );
  assert.ok(
    warnings.some((warning) => warning.includes("faithfulness.unknown_assertion") && warning.includes("浏览器插件")),
    `expected unknown assertion warning for browser plugin, got ${warnings.join("\n")}`,
  );
});

test("project deep-dive faithfulness guard catches privilege-ring assertions from unknowns", () => {
  const warnings = projectDeepDiveFaithfulnessWarnings({
    unknowns: ["沙箱四个特权环的具体能力与隔离机制未在 README 中说明"],
    body: `## 技术拆解

**Agent Runtime** 包提供执行沙箱，拥有四个特权环（来源：README Packages - Agent Runtime）。README 未详细解释四个环的含义。`,
  });

  assert.ok(
    warnings.some((warning) => warning.includes("faithfulness.unknown_assertion") && warning.includes("特权环")),
    `expected unknown assertion warning for privilege rings, got ${warnings.join("\n")}`,
  );
});

test("project deep-dive faithfulness guard accepts attributed claims and hedged unknown terms", () => {
  const warnings = projectDeepDiveFaithfulnessWarnings({
    unknowns: ["未在 README/artifact 说明：四个特权环沙箱的具体权限模型和实现细节。"],
    body: `## 大白话定位

README 自称覆盖 10/10 OWASP Agentic Top 10 风险（来源：README 徽章）。

### 执行沙箱

README 未说明四个特权环沙箱的具体实现，不能确认其隔离强度（来源：README/artifact 未说明）。`,
  });

  assert.deepEqual(warnings, []);
});

test("project deep-dive writer renders builder reuse, platform risk, and unknowns", async () => {
  const wikiRoot = await mkdtemp(path.join(os.tmpdir(), "project-deepdive-writer-"));
  const candidate = {
    id: "project:owner/repo",
    source: "github-trending:daily",
    discoveredAt: "2026-06-03T12:00:00.000Z",
    raw: {
      fullName: "owner/repo",
      owner: "owner",
      name: "repo",
      url: "https://github.com/owner/repo",
      description: "Agent tool server for tests",
      language: "TypeScript",
    },
  };
  const evidence = {
    content: "README documents an MCP server, tests, and GitHub API integration.",
    artifactAudit: {
      repo_url: "https://github.com/owner/repo",
      repo_full_name: "owner/repo",
      has_src: true,
      has_tests: true,
      has_docs: false,
      has_examples: false,
      license_spdx_id: "MIT",
    },
  };
  const triage = {
    project_type: "agent_framework",
    final_depth: "deep",
    verdict: "clone_and_run",
    reason: "deep candidate",
    ratings: {
      relevance_to_ai_engineer: 5,
      engineering_depth: 4,
      reuse_value: 4,
      maturity: 3,
    },
  };
  const deepDive = {
    one_line_positioning: "这是一个把工具暴露给 agent 的项目（来源：README）",
    one_line_punchline: "工具边界先行。",
    why_hot: [{ title: "工具服务", body: "README 写到 MCP server（来源：README）" }],
    artifact_audit_rows: [{ item: "tests", status: "available", evidence: "artifactAudit.has_tests" }],
    tech_breakdown_md: "### 工具边界\n- README 只说明 MCP server 和测试存在（来源：README; artifactAudit.has_tests）。",
    value_to_us: {
      learn: "学习 tool-server 边界（来源：README）",
      to_aibrief: "可迁移到工具注册（来源：README）",
      to_briefmem: "可迁移到 evidence pack（来源：artifactAudit）",
      resume: "讲清楚工具边界（来源：README）",
    },
    builder_reuse: {
      pattern: "MCP tool-server pattern（来源：README）",
      copy: "复制工具入口和测试边界（来源：README; artifactAudit.has_tests）",
      skip: "不要复制 README 未说明的 planner/state（来源：README 未说明）",
      why_it_matters: "让 AI 应用把外部动作封装为可审计工具（来源：README）",
    },
    dependency_platform_risk: {
      dependency: "GitHub API（来源：README）",
      what_if_change: "若 GitHub API 权限变化,工具调用会失败（来源：README GitHub API integration）",
      exposure: "medium",
      mitigation_or_unknown: "README 未说明降级方案（来源：README 未说明）",
    },
    unknowns: ["README 未说明 planner/state/sandbox 的内部实现（来源：README 未说明）"],
    risks: ["README 未说明运行命令（来源：README 未说明）"],
    next_actions: ["clone-and-run", "extract-pattern(MCP tool-server pattern)"],
    memory_card: {
      problem_pattern: "agent 需要稳定工具边界（来源：README）",
      architecture_pattern: "MCP server 暴露工具（来源：README）",
      reusable_pattern: "MCP tool-server pattern（来源：README）",
      risk_pattern: "外部 API 权限变化会影响调用（来源：README）",
      similar_projects: "未在 README/artifact 说明",
    },
    reasoning_trace: {
      paper_type_decision: "agent_framework because README says MCP server",
      central_contribution: "MCP tool server",
      inspected: ["README", "artifactAudit"],
      top_claims: ["README documents MCP server"],
      evidence_needed: ["README", "artifactAudit"],
      main_threats: ["GitHub API dependency"],
      transfer_decision: "copy tool boundary; skip undocumented internals",
    },
    project_verdict: {
      verdict: "clone_and_run",
      relevance_to_ai_engineer: 5,
      engineering_depth: 4,
      reuse_value: 4,
      maturity: 3,
      main_risk: "README 未说明运行命令（来源：README 未说明）",
    },
    claim_ledger: [{
      claim: "项目暴露 MCP tool-server 边界。",
      plain_english: "它把外部动作包装成 agent 可调用的工具。",
      source: "README",
      evidence_strength: "medium",
      supports: "README mentions MCP server.",
      does_not_support: "planner/state/sandbox internals.",
      threat: "GitHub API dependency.",
    }],
    concepts: [{
      slug: "mcp-tool-server-pattern",
      name: "MCP tool-server pattern",
      explanation: "把外部动作封装为 agent 可调用工具。",
      tags: ["mcp", "agent-framework"],
      maturity: "active",
      examples: ["owner/repo README"],
      common_misunderstandings: ["不是 planner 实现"],
      open_questions: ["state 是否存在"],
    }],
    artifact: {
      slug: "repo-artifact",
      artifact_type: "repo",
      url: "https://github.com/owner/repo",
      official_or_third_party: "official",
      status: "available",
      license: "MIT",
      runnable: "unknown",
      missing_parts: ["README 未说明运行命令"],
      last_checked: "2026-06-03",
      summary: "README and artifactAudit are available.",
    },
  };

  const result = await writeProjectBriefWikiEntities({
    candidate,
    evidence,
    triage,
    deepDive,
    options: { wikiRoot, checkedDate: "2026-06-03" },
  });
  const deepDivePath = Object.entries(result.paths).find(([key]) => key.startsWith("deep-dives/"))?.[1];
  const markdown = await readFile(deepDivePath, "utf8");

  assert.match(markdown, /## 如果我要造类似的东西/);
  assert.match(markdown, /MCP tool-server pattern/);
  assert.match(markdown, /## 依赖\/平台风险场景/);
  assert.match(markdown, /GitHub API/);
  assert.match(markdown, /## 未知与待确认/);
  assert.match(markdown, /planner\/state\/sandbox/);
});

test("project deep-dive writer renders light-spine schema and claim attribution", async () => {
  const wikiRoot = await mkdtemp(path.join(os.tmpdir(), "project-light-spine-writer-"));
  const candidate = {
    id: "project:owner/spine",
    source: "github-trending:daily",
    discoveredAt: "2026-06-03T12:00:00.000Z",
    raw: {
      fullName: "owner/spine",
      owner: "owner",
      name: "spine",
      url: "https://github.com/owner/spine",
      description: "Agent policy tool",
      language: "TypeScript",
    },
  };
  const evidence = {
    content: "README says policy hooks and package.json scripts are present.",
    artifactAudit: {
      repo_url: "https://github.com/owner/spine",
      repo_full_name: "owner/spine",
      has_src: true,
      has_tests: true,
      license_spdx_id: "MIT",
    },
  };
  const triage = {
    project_type: "agent_framework",
    final_depth: "deep",
    verdict: "clone_and_run",
    ratings: {
      relevance_to_ai_engineer: 5,
      engineering_depth: 4,
      reuse_value: 4,
      maturity: 3,
    },
  };
  const deepDive = {
    schema_version: "project-light-spine/v1",
    project_type: "agent_framework",
    light_spine: {
      one_sentence: {
        summary: "spine 把 agent 动作放进 policy hook 审查（来源：README Overview）",
        body_md: "README 自称提供 policy hook；package.json scripts 已核实存在测试入口（来源：README Overview；package.json scripts）。",
      },
      why_worth_attention: {
        body_md: "它值得看是因为 policy hook 是可复用边界（来源：README Overview）。",
      },
      key_claims_evidence: {
        items: [
          {
            claim: "README 自称提供 policy hook。",
            plain_english: "它说自己能在 agent 动作前做规则检查。",
            source: "README Overview",
            attribution: "自称",
            evidence_strength: "medium",
          },
          {
            claim: "package.json scripts 中有测试入口。",
            plain_english: "仓库文件里能看到测试脚本。",
            source: "package.json scripts",
            attribution: "已核实",
            evidence_strength: "high",
          },
        ],
      },
      how_it_works: {
        body_md: "工作方式是把工具调用先交给 policy hook，再决定是否继续；内部隔离强度未在 README/docs/tree 说明（来源：README Overview；README/docs/tree 未说明）。",
      },
      reusable_abstractions: {
        body_md: "可复用抽象是 policy-interception hook：复制拦截点和审计记录，跳过未说明的隔离实现（来源：README Overview；README/docs/tree 未说明）。",
      },
      dependency_platform_risk: {
        body_md: "若宿主 agent 工具调用接口变化，hook 接入点会失效；降级方案未在 README/docs/tree 说明（来源：README Overview；README/docs/tree 未说明）。",
      },
      unknowns_to_confirm: {
        body_md: "未知：隔离强度、运行命令、生产部署边界未在 README/docs/tree 说明（来源：README/docs/tree 未说明）。",
        items: ["隔离强度未在 README/docs/tree 说明（来源：README/docs/tree 未说明）"],
      },
      judgment: {
        action: "clone-and-run",
        ratings: { "相关度": 5, "工程深度": 4, "复用价值": 4, "成熟度": 3 },
        body_md: "判断是先 clone-and-run 验证 hook 边界，再抽取 policy-interception hook（来源：README Overview）。",
      },
    },
    concepts: [{
      slug: "policy-interception-hook",
      name: "policy-interception hook",
      explanation: "在 agent 动作进入工具前做规则审查。",
      tags: ["agent-framework"],
      maturity: "active",
      examples: ["owner/spine README"],
      common_misunderstandings: ["不是完整 sandbox"],
      open_questions: ["隔离强度"],
    }],
    artifact: {
      artifact_type: "repo",
      url: "https://github.com/owner/spine",
      official_or_third_party: "official",
      status: "available",
      license: "MIT",
      runnable: "unknown",
      missing_parts: ["运行命令未说明"],
      last_checked: "2026-06-03",
      summary: "repo and package files available.",
    },
  };

  const result = await writeProjectBriefWikiEntities({
    candidate,
    evidence,
    triage,
    deepDive,
    options: { wikiRoot, checkedDate: "2026-06-03" },
  });
  const deepDivePath = Object.entries(result.paths).find(([key]) => key.startsWith("deep-dives/"))?.[1];
  const markdown = await readFile(deepDivePath, "utf8");

  assert.match(markdown, /schema_version: "project-light-spine\/v1"/);
  assert.match(markdown, /light_spine:/);
  assert.match(markdown, /## 一句话/);
  assert.match(markdown, /## 关键主张与证据/);
  assert.match(markdown, /自称/);
  assert.match(markdown, /已核实/);
  assert.match(markdown, /## 复用什么抽象/);
  assert.match(markdown, /## 判断/);
});

import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { parse as parseYaml } from "yaml";

import { emitProjectAutoSciPrimitive } from "../columns/projects/autosci-primitives.mjs";

function architectureCandidate() {
  return {
    id: "project:acme/finance-agent",
    column: "projects",
    source: "github-trending:monthly",
    raw: {
      fullName: "acme/finance-agent",
      owner: "acme",
      name: "finance-agent",
      url: "https://github.com/acme/finance-agent",
      description: "Finance agent runtime with MCP tool server and audit workflow",
      language: "TypeScript",
      stars: 12000,
      forks: 400,
      starsGained: 4200,
      windows: ["monthly"],
    },
  };
}

function sqliteEvidenceRow() {
  const readme = "Finance agent runtime with MCP tools, typed memory, audit logs, tests, and install docs. ".repeat(40);
  return {
    candidateId: "project:acme/finance-agent",
    kind: "readme",
    content: readme,
    metadata: {
      evidenceSignals: {
        owner: "acme",
        repo: "finance-agent",
        url: "https://github.com/acme/finance-agent",
        trend_sources: ["github-trending:monthly"],
        appears_in_tabs: ["monthly"],
        stars: 12000,
        stars_in_period: 4200,
        language: "TypeScript",
        description: "Finance agent runtime with MCP tool server and audit workflow",
        raw_readme: readme,
        readme_found: true,
        readme_length: readme.length,
        top_level_dirs: ["src", "packages", "docs"],
        key_files: ["README.md", "package.json"],
        has_docs: true,
        has_examples: true,
        has_tests: true,
        has_install: true,
        has_cli: true,
        has_agents: true,
        has_mcp: true,
        has_models: true,
        package_files: { package_json: true },
      },
    },
    fetchedAt: "2026-06-08T00:00:00.000Z",
  };
}

function legacyDeepDiveShape() {
  return {
    project_type: "agent_framework",
    builder_reuse: {
      pattern: "MCP tool boundary plus audit trail",
      copy: "Copy the typed tool boundary, trace log, and approval checkpoint.",
      skip: "Skip product-specific finance account integrations.",
      why_it_matters: "It keeps domain-agent actions inspectable before execution.",
    },
    memory_card: {
      architecture_pattern: "planner -> MCP tools -> audit log -> approval gate",
      reusable_pattern: "typed tool boundary with inspectable audit state",
    },
    tech_breakdown_md: "The architecture routes planner decisions through typed MCP tools, records every call, then requires an approval gate before money-moving actions.",
    dependency_platform_risk: {
      dependency: "broker API",
      what_if_change: "If broker API scopes change, the tool boundary must fail closed.",
      mitigation_or_unknown: "Keep a deny-by-default approval checkpoint.",
    },
    risks: ["broker API drift"],
    reasoning_trace: {
      transfer_decision: "Transfer the tool boundary and audit state; do not transfer broker-specific adapters.",
    },
  };
}

test("project AutoSci primitives extract at least one architecture primitive with design principles", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "project-autosci-arch-"));
  const result = await emitProjectAutoSciPrimitive({
    candidate: architectureCandidate(),
    evidence: sqliteEvidenceRow(),
    triage: {
      project_type: "agent_framework",
      final_depth: "tier3",
      intent: "tool",
    },
    deepDive: legacyDeepDiveShape(),
    finalDepth: "tier3",
    options: {
      autosciPrimitiveDir: outDir,
      now: () => "2026-06-08T00:00:00.000Z",
    },
  });

  assert.ok(result);
  assert.match(path.basename(result.paths.yaml), /^proj-.*\.yaml$/);

  const primitive = parseYaml(await readFile(result.paths.yaml, "utf8"));
  assert.equal(primitive.primitive_id, "proj-acme-finance-agent");
  assert.match(primitive.core_pattern, /MCP tool boundary/);
  assert.ok(Array.isArray(primitive.design_principles));
  assert.ok(primitive.design_principles.length >= 1);
  assert.ok(primitive.design_principles[0].principle);
});

test("project AutoSci primitives skip teaching projects", async () => {
  const outDir = await mkdtemp(path.join(os.tmpdir(), "project-autosci-teaching-"));
  const result = await emitProjectAutoSciPrimitive({
    candidate: {
      ...architectureCandidate(),
      raw: {
        ...architectureCandidate().raw,
        fullName: "acme/agent-course",
        name: "agent-course",
        description: "Hands-on tutorial course for building finance agents",
      },
    },
    evidence: sqliteEvidenceRow(),
    triage: {
      project_type: "agent_framework",
      final_depth: "deep",
      intent: "teaching",
    },
    deepDive: legacyDeepDiveShape(),
    finalDepth: "deep",
    options: { autosciPrimitiveDir: outDir },
  });

  assert.equal(result, null);
});

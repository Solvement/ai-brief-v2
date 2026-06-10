# codex 任务 — KG-2 pilot 后端门（validator v2 + concept-vocab + paper 节点集成）

先读 `docs/plans/KG-2-association-layer.md` §3.1（schema v2 定稿）和 `data/knowledge-graph/facets/agemem.yaml`（金样）。只做以下三件，不扩大范围：

## 1. `scripts/kg/concept-vocab.mjs`（新建）
- 扫 `data/knowledge-graph/facets/*.yaml` 聚合所有 `core_concepts[].name` → 写 `data/knowledge-graph/concept-vocab.json`：`[{name, count, nodes:[slug...]}]`。
- 近重名告警（lowercase/去空格后 levenshtein ≤2 或互为子串）打印 warning，不阻断。
- 挂进 npm script `kg:vocab`，并让 `kg:build` 链在 integrate 后跑它。

## 2. `scripts/kg/validate-mind-palace.mjs` 扩展（v2 字段门）
向后兼容：现有 9 个 facet（无 v2 字段）必须照常 PASS（grandfather）。新增校验：
- `core_concepts` 若存在：数组、每项 `{name:非空, role:∈[primary,supporting,mentioned], evidence:非空}`、长度 3-5（少于 3 warning，>5 error）。
- `discovery_trace` 若存在且非"数据不足"：必须有 `source_span` 非空，否则 **error reject**（防散文幻觉，Phase 0 审计硬门）。
- 边 `type` 枚举扩为：`improves_on, extends, contradicts, composes_with, implements, applies, tool_for`（`same_problem`/`same_use_case` 出现即 error）。
- **新边**（facet yaml 里 `schema: v2` 标记的文件中的边）必须带：`evidence`(非空)、`negative_rationale`(非空)、`confidence`。跨类型边（implements/applies/tool_for）还必须带 `concept` 字段且：concept ∈ 两端 facet 的 `core_concepts[].name`，role 满足 implements=双端 primary；applies/tool_for=paper 侧 primary + project 侧 ≥supporting。两端任一缺 core_concepts → error（不许绕门）。
- 旧 8 条 verified 边不带新字段照常 PASS。

## 3. `scripts/kg/integrate-kg.mjs` — paper facet 节点接入
- 即将出现新 facet：`tropd.yaml / metagpt.yaml / self-evolving-agents-survey.yaml`（kind: paper, source 指向 content/papers/{dir}）。确保 integrate 能把它们合到图节点：若图里已有对应 content/papers 节点按 slug/arxiv_id 匹配合并；没有则新建节点（kind=paper, 链接到 /articles 对应页）。不破坏现有 facetedNodes:9。
- `embed.mjs` 的 embedText 不用改字段，但确认新 facet 会被嵌入。

## 验收（你自己跑绿再交）
- `node scripts/kg/validate-mind-palace.mjs` 对现有 9 facet 全 PASS。
- 自造一个临时 bad fixture（discovery_trace 无 source_span / same_problem 边 / implements 概念不在两端）验证 3 类都 reject，验完删 fixture。
- `npm run kg:build` 全链绿。
- 输出改动文件清单 + 跑的命令 + 结果。

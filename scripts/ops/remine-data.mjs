import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const NOW = new Date().toISOString();

const json = async (rel) => JSON.parse(await readFile(path.join(ROOT, rel), "utf8"));
const writeJson = async (rel, data) => writeFile(path.join(ROOT, rel), `${JSON.stringify(data, null, 2)}\n`, "utf8");
const text = async (rel) => readFile(path.join(ROOT, rel), "utf8");

function clean(value, max = 900) {
  const out = String(value || "").replace(/```[\s\S]*?```/g, "").replace(/\s+/g, " ").trim();
  return out.length > max ? `${out.slice(0, max - 1)}…` : out;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    || "item";
}

function repoKey(repo) {
  return slugify(repo.fullName || `${repo.owner || ""}/${repo.name || ""}`);
}

function deepDiveSlugFromBriefSlug(briefSlug) {
  const s = String(briefSlug || "").trim();
  return s.endsWith("-deep-dive") ? s : `${s}-deep-dive`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function spineSectionText(section) {
  if (!section) return "";
  if (typeof section === "string") return section;
  return clean([
    section.summary,
    section.body_md,
    ...asArray(section.bullets),
    ...asArray(section.items).map((item) => item?.plain_english || item?.claim || item?.name || item?.summary || ""),
  ].filter(Boolean).join(" "));
}

function makeLightSpineFromRepo(repo) {
  const name = repo.fullName || `${repo.owner || ""}/${repo.name || ""}`;
  const desc = clean(repo.description || repo.tldr || repo.light || "官方说明不足。", 260);
  const source = `GitHub metadata / trending evidence for ${name}`;
  const hasReadme = repo.evidence_summary?.readme_found === true;
  const evidenceBoundary = hasReadme ? "README 已抓取，但本轮未重新执行项目。" : "README 或源码证据不足，本轮只按榜单元数据保守生成。";
  return {
    schema_version: "project-tier-template/v1",
    one_sentence: {
      summary: `${name} 是一个 ${repo.language || "未披露主语言"} 项目：${desc}`,
      body_md: `它进入深读队列的直接原因是项目热度和结构信号同时出现；本轮依据 ${source}，没有把 README 自称当成实测。`,
    },
    why_worth_attention: {
      summary: "",
      body_md: `${name} 值得作为项目案例看，是因为它在当前窗口获得明显关注，并且描述指向 ${clean(asArray(repo.tags).join("、") || repo.project_bucket || "项目实践", 160)}。${evidenceBoundary}`,
      bullets: [
        `榜单事实：${repo.stars || 0} stars，本窗口新增 ${repo.starsGained || 0} stars。`,
        `项目描述：${desc}`,
        evidenceBoundary,
      ],
    },
    key_claims_evidence: {
      summary: "",
      body_md: "以下只记录可由榜单元数据或已有抓取摘要支撑的保守 claim；能力细节未实测时不写成确定事实。",
      items: [
        {
          claim: "项目获得当前窗口显著关注。",
          plain_english: `${name} 在榜单窗口中新增 ${repo.starsGained || 0} stars。`,
          source,
          attribution: "已核实",
          evidence_strength: "medium",
          supports: `trending.json 记录 stars=${repo.stars || 0}, starsGained=${repo.starsGained || 0}。`,
          does_not_support: "不证明项目真实可用、性能达标或长期维护可靠。",
          threat: "GitHub 热度可能来自社交传播或短期事件，不等同于工程成熟。",
        },
        {
          claim: "项目说明指向一个 AI/agent 相关使用场景。",
          plain_english: desc,
          source,
          attribution: "自报",
          evidence_strength: hasReadme ? "medium" : "low",
          supports: desc,
          does_not_support: "未在本轮逐文件复核实现细节。",
          threat: "README/描述可能夸大能力或遗漏依赖边界。",
        },
      ],
    },
    how_it_works: {
      summary: "",
      body_md: `数据不足：当前聚合数据没有足够源码级证据把 ${name} 的内部机制拆成可复述链条。可确认的是它围绕「${desc}」组织能力；下一轮应 clone 后读 README、入口文件和核心模块再补机制图。`,
    },
    reusable_abstractions: {
      summary: "",
      body_md: `可迁移部分先保守记为候选：如果源码复核成立，它可能为 AI-Brief 提供 ${clean(asArray(repo.tags).join("、") || "项目实践", 120)} 方向的案例；当前不能直接复用为实现。`,
      items: [
        { name: "热度筛选案例", value: "用作榜单项目从 light 升 deep 的复核样本。" },
        { name: "源码复核候选", value: "需要下一轮读取 README/关键代码后再判断可复用模块。" },
      ],
    },
    dependency_platform_risk: {
      summary: "",
      body_md: "主要风险是证据不足：榜单热度与 README 自称不能替代运行、测试、API 依赖和维护状况复核。",
      items: [
        { risk: "证据不足", mitigation: "标注数据不足，不写实测结论。" },
        { risk: "热度短期化", mitigation: "后续结合 commit、release、issue 和源码结构复核。" },
      ],
    },
    unknowns_to_confirm: [
      "官方 README 中的核心能力是否有源码路径支撑。",
      "是否有测试、示例、release 和真实用户反馈。",
      "关键外部服务/API 是否会形成平台依赖。",
    ],
    judgment: {
      action: "read_source_before_reuse",
      ratings: {
        attention: Math.min(5, Math.max(3, Math.round((repo.worthDeepDive || 60) / 20))),
        evidence: hasReadme ? 3 : 2,
        reuse: 2,
        risk: 3,
      },
      overall: "先收进深读与 Mind Palace 待复核区，不把榜单热度误写成工程成熟。",
    },
  };
}

function makeLightSpineFromMeta(item) {
  const meta = item.meta || {};
  const title = meta.title || item.title || item.slug;
  const claims = asArray(meta.claim_ledger).slice(0, 5);
  const audit = meta.artifact_audit || {};
  const inspected = asArray(meta.reasoning_trace?.inspected).join("；") || audit.official_repo || "现有聚合内容";
  const central = meta.reasoning_trace?.central_contribution || meta.reasoning_trace?.paper_type_decision || item.excerpt || title;
  const threats = [
    ...asArray(meta.reasoning_trace?.main_threats),
    ...asArray(meta.unknowns),
    ...asArray(meta.dependency_platform_risk?.items).map((x) => x?.risk || x),
  ].filter(Boolean);

  return {
    schema_version: "project-tier-template/v1",
    one_sentence: {
      summary: `${title} 的核心判断：${clean(central, 260)}`,
      body_md: `本条由旧深读聚合内容重整为 RuView light_spine；证据边界来自 ${clean(inspected, 240)}。没有源码级证据的地方保留“数据不足”。`,
    },
    why_worth_attention: {
      summary: "",
      body_md: clean(meta.reasoning_trace?.transfer_decision || meta.project_verdict?.main_risk || central, 700),
      bullets: claims.length
        ? claims.map((c) => `${c.attribution || "自报"}：${clean(c.claim || c.plain_english, 180)}`)
        : ["旧深读没有足够 claim ledger，本轮只保守迁移已有摘要。"],
    },
    key_claims_evidence: {
      summary: "",
      body_md: "把旧深读 claim ledger 改成可渲染证据项；未实测的 claim 只标自报或中低证据。",
      items: (claims.length ? claims : [{ claim: central, source: inspected, evidence_strength: "low" }]).slice(0, 5).map((c) => ({
        claim: clean(c.claim || c.plain_english || title, 180),
        plain_english: clean(c.plain_english || c.supports || c.claim || central, 260),
        source: clean(c.source || inspected || "旧深读聚合内容", 220),
        attribution: c.attribution || (String(c.source || "").match(/README|自称|self/i) ? "自报" : "自报"),
        evidence_strength: c.evidence_strength || "low",
        supports: clean(c.supports || c.plain_english || "现有材料支持有限。", 260),
        does_not_support: clean(c.does_not_support || "不证明真实运行效果或长期维护质量。", 260),
        threat: clean(c.threat || "需要源码/运行复核。", 260),
      })),
    },
    how_it_works: {
      summary: "",
      body_md: clean(meta.reasoning_trace?.central_contribution || meta.builder_reuse || "数据不足：旧深读没有留下足够源码级机制链。", 700),
    },
    reusable_abstractions: {
      summary: "",
      body_md: clean(meta.reasoning_trace?.transfer_decision || meta.builder_reuse || "可复用抽象数据不足；仅作为后续源码复核候选。", 700),
      items: asArray(meta.next_actions).slice(0, 4).map((x) => ({ name: String(x), value: "作为后续行动候选，不等于已采纳。" })),
    },
    dependency_platform_risk: {
      summary: "",
      body_md: threats.length ? clean(threats.join("；"), 700) : "数据不足：旧深读没有系统记录依赖和平台风险。",
      items: threats.slice(0, 5).map((risk) => ({ risk: clean(risk, 160), mitigation: "保守标注，复用前读源码或官方说明。" })),
    },
    unknowns_to_confirm: asArray(meta.reasoning_trace?.evidence_needed).concat(asArray(meta.unknowns)).slice(0, 6),
    judgment: {
      action: meta.project_verdict?.verdict || "read_source_before_reuse",
      ratings: {
        attention: Number(meta.project_verdict?.relevance_to_ai_engineer) || 3,
        evidence: 2,
        reuse: Number(meta.project_verdict?.reuse_value) || 2,
        risk: 3,
      },
      overall: clean(meta.reasoning_trace?.transfer_decision || "保守迁移为新 spine；事实强度不足处仍需复核。", 300),
    },
  };
}

function bodyFromSpine(spine, title) {
  return [
    `# ${title}`,
    "",
    "## 一句话判断",
    spineSectionText(spine.one_sentence),
    "",
    "## 为什么值得看",
    spineSectionText(spine.why_worth_attention),
    "",
    "## 关键证据",
    spineSectionText(spine.key_claims_evidence),
    "",
    "## 它怎么工作",
    spineSectionText(spine.how_it_works),
    "",
    "## 可复用抽象",
    spineSectionText(spine.reusable_abstractions),
    "",
    "## 风险与未知",
    [spineSectionText(spine.dependency_platform_risk), ...asArray(spine.unknowns_to_confirm)].filter(Boolean).join(" "),
    "",
    "## 判断",
    spine.judgment?.overall || "",
  ].join("\n");
}

function projectFacetFromDeepDive(item) {
  const meta = item.meta || {};
  const spine = meta.light_spine;
  if (!spine || meta.project_type === undefined && meta.paper_type !== undefined) return null;
  const baseSlug = String(item.slug || "").replace(/-deep-dive$/, "");
  const key = baseSlug.startsWith("project-") ? baseSlug.replace(/^project-/, "") : baseSlug;
  const title = meta.title || item.title || key;
  const claimEvidence = asArray(spine.key_claims_evidence?.items).map((x) => x?.claim || x?.plain_english).filter(Boolean);
  const fallbackEvidence = clean(spineSectionText(spine.one_sentence) || title, 120);
  const concepts = [
    { name: "项目问题定义", role: "primary", evidence: clean(spineSectionText(spine.one_sentence), 120) || fallbackEvidence },
    { name: "机制链路", role: "primary", evidence: clean(spineSectionText(spine.how_it_works), 120) || fallbackEvidence },
    { name: "可复用抽象", role: "supporting", evidence: clean(spineSectionText(spine.reusable_abstractions), 120) || fallbackEvidence },
    { name: "风险边界", role: "supporting", evidence: clean(spineSectionText(spine.dependency_platform_risk), 120) || fallbackEvidence },
    ...(claimEvidence[0] ? [{ name: "证据账本", role: "mentioned", evidence: clean(claimEvidence[0], 120) }] : []),
  ].slice(0, 5);
  return {
    schema: "v2",
    node_id: `content/${key}`,
    slug: key,
    kind: "project",
    title,
    source: `public/data/brief/deep-dives.json:${item.slug}`,
    facets: {
      problem_solved: clean(spineSectionText(spine.one_sentence) || title, 900),
      method: clean(spineSectionText(spine.how_it_works) || spineSectionText(spine.key_claims_evidence) || "数据不足", 1000),
      result: clean(spineSectionText(spine.key_claims_evidence) || spine.judgment?.overall || "数据不足", 900),
      innovation: clean(spineSectionText(spine.reusable_abstractions) || "数据不足", 900),
      weakness: clean(spineSectionText(spine.dependency_platform_risk) || "数据不足", 900),
      transfer: clean(spineSectionText(spine.reusable_abstractions) || spine.judgment?.overall || "数据不足", 900),
    },
    self_evo_use: `记忆：把 ${title} 的问题、机制、证据边界和风险作为项目案例入图。理解：用它校准我们对 ${meta.project_type || "项目"} 的判断，不把 README 自称等同于实测。自进化：复用前必须先过源码/验证门；当前只把可复用抽象作为候选。`,
    core_concepts: concepts,
    discovery_trace: "数据不足",
    edges: [],
    status: "extracted",
  };
}

function facetFromPrimitive(file, primitive, metadata = {}) {
  const arxiv = primitive.source_paper || metadata.arxiv_id || file.replace(/\.ya?ml$/, "");
  const slug = metadata.slug || slugify(metadata.title || primitive.title || arxiv).replace(/^\d{4}-\d{4,5}-?/, "");
  const title = metadata.title || primitive.title || primitive.primitive_id || arxiv;
  const concepts = asArray(primitive.core_concepts).slice(0, 5);
  while (concepts.length < 3) {
    concepts.push({
      name: ["问题域", "方法原语", "迁移边界"][concepts.length],
      role: concepts.length === 0 ? "primary" : "supporting",
      evidence: clean(primitive.problem_class || primitive.core_pattern || title, 120),
    });
  }
  return {
    schema: "v2",
    node_id: `paper:${arxiv}`,
    slug,
    kind: "paper",
    title,
    arxiv_id: arxiv,
    source: `content/papers/${metadata.dir || ""} + data/autosci/primitives/${file}`,
    facets: {
      problem_solved: clean(primitive.problem_class || primitive.core_pattern || title, 900),
      method: clean(primitive.core_pattern || primitive.implementation_idea || title, 1200),
      result: clean(primitive.source_notes?.evidence_boundary || primitive.small_experiment || "结果证据以原文/作者自报为准；本 facet 未重新复现实验。", 900),
      innovation: clean(asArray(primitive.design_principles).map((x) => x.statement || x.principle || x.name).join("；") || primitive.core_pattern || "数据不足", 900),
      weakness: clean(asArray(primitive.risks).join("；") || "数据不足", 900),
      transfer: clean(primitive.implementation_idea || primitive.source_notes?.synthesis || primitive.core_pattern || "数据不足", 900),
    },
    self_evo_use: `记忆：保留 ${title} 的问题、方法、概念和证据边界。理解：用它补齐 ${primitive.problem_class || "相关问题域"} 的方法坐标。自进化：${clean(primitive.source_notes?.evolution_actions || primitive.implementation_idea || "作为后续 AutoSci/评测/记忆原语候选。", 500)}`,
    core_concepts: concepts.map((c, index) => ({
      name: clean(c.name || c, 80),
      role: ["primary", "supporting", "mentioned"].includes(c.role) ? c.role : (index < 2 ? "primary" : "supporting"),
      evidence: clean(c.evidence || primitive.core_pattern || title, 160),
    })),
    discovery_trace: primitive.discovery_trace || "数据不足",
    edges: [],
    status: "extracted",
  };
}

function rewriteLight(repo) {
  const name = repo.fullName || `${repo.owner || ""}/${repo.name || ""}`;
  const desc = clean(repo.description || repo.tldr || "暂无足够描述。", 220);
  const depth = repo.final_depth || repo.depth_band || repo.analysis_depth || "light";
  const score = Number(repo.worthDeepDive || 0);
  const hasBrief = Boolean(repo.briefSlug);
  const aiUseful = asArray(repo.tags).some((tag) => /agent|skill|model|rag|memory|ai/i.test(tag)) || /agent|ai|model|rag|memory|skill/i.test(`${repo.description || ""} ${repo.tldr || ""}`);
  if (hasBrief && (depth === "deep" || depth === "analysis" || depth === "standard")) {
    return `${name} 是一个值得进入深读的项目：${desc}。当前判断是先读深读页，因为它不只是在榜单上热，还可能提供可迁移的工程结构或使用方法；具体结论以 deep-dive 里的证据账本为准。`;
  }
  if (score >= 60 || depth === "deep") {
    return `${name} 看起来有深挖价值：${desc}。本轮已补深读入口；如果后续源码证据不足，应降级为观察而不是硬讲成熟度。`;
  }
  if (aiUseful) {
    return `${name} 是一个可快速扫一眼的 AI/agent 相关项目：${desc}。它目前不建议投入深读，主要原因是现有信号还不足以证明有可迁移架构；保留 light 卡即可。`;
  }
  return `${name} 进入榜单主要是因为实用性或短期热度：${desc}。它对 Kevin 可能有工具/学习参考价值，但不属于本轮 Mind Palace 深挖对象。`;
}

function rewriteHighlight(repo) {
  const name = repo.fullName || `${repo.owner || ""}/${repo.name || ""}`;
  const desc = clean(repo.description || repo.tldr || "", 120);
  if (repo.starsGained) return `${name} 的火点是本窗口新增 ${repo.starsGained} star，描述聚焦：${desc || "数据不足"}。`;
  return `${name} 的火点是榜单持续出现；核心看点：${desc || "数据不足"}。`;
}

async function main() {
  const deep = await json("public/data/brief/deep-dives.json");
  const trending = await json("public/data/trending.json");
  const summary = {
    removedDeepDives: [],
    addedDeepDives: [],
    generatedSpines: [],
    rewrittenLights: 0,
    projectFacetsWritten: 0,
    paperFacetsWritten: 0,
  };

  const duplicatePairs = [
    ["9router-deep-dive", "decolua-9router-deep-dive"],
    ["academic-research-skills-deep-dive", "imbad0202-academic-research-skills-deep-dive"],
    ["agent-reach-deep-dive", "panniantong-agent-reach-deep-dive"],
    ["ai-engineering-from-scratch-deep-dive", "rohitg00-ai-engineering-from-scratch-deep-dive"],
    ["funasr-deep-dive", "modelscope-funasr-deep-dive"],
    ["moneyprinterturbo-deep-dive", "harry0703-moneyprinterturbo-deep-dive"],
    ["production-agentic-rag-course-deep-dive", "jamwithai-production-agentic-rag-course-deep-dive"],
    ["taste-skill-deep-dive", "leonxlnx-taste-skill-deep-dive"],
    ["ui-tars-desktop-deep-dive", "bytedance-ui-tars-desktop-deep-dive"],
    ["vimax-deep-dive", "hkuds-vimax-deep-dive"],
    ["project-can1357-oh-my-pi-deep-dive", "can1357-oh-my-pi-deep-dive"],
    ["project-chopratejas-headroom-deep-dive", "chopratejas-headroom-deep-dive"],
    ["project-colbymchenry-codegraph-deep-dive", "colbymchenry-codegraph-deep-dive"],
    ["project-microsoft-markitdown-deep-dive", "microsoft-markitdown-deep-dive"],
  ];
  const slugs = new Set(deep.items.map((item) => item.slug));
  const remove = new Set();
  for (const [oldSlug, newSlug] of duplicatePairs) {
    if (slugs.has(oldSlug) && slugs.has(newSlug)) {
      remove.add(oldSlug);
      summary.removedDeepDives.push({ oldSlug, keptSlug: newSlug });
    }
  }
  deep.items = deep.items.filter((item) => !remove.has(item.slug));

  const allRepos = [];
  for (const windowName of ["radar", "daily", "weekly", "monthly"]) {
    for (const repo of asArray(trending[windowName]?.repos)) allRepos.push(repo);
  }
  const deepBySlug = new Map(deep.items.map((item) => [item.slug, item]));
  for (const repo of allRepos) {
    repo.light = rewriteLight(repo);
    repo.highlight = rewriteHighlight(repo);
    summary.rewrittenLights += 1;
    const score = Number(repo.worthDeepDive || 0);
    const depth = repo.final_depth || repo.depth_band || repo.analysis_depth;
    if (!repo.briefSlug && score >= 60) {
      repo.briefSlug = repoKey(repo);
    }
    if (repo.briefSlug) {
      const ddSlug = deepDiveSlugFromBriefSlug(repo.briefSlug);
      if (!deepBySlug.has(ddSlug)) {
        const spine = makeLightSpineFromRepo(repo);
        const title = `${repo.name || repo.fullName} — 深度拆解`;
        const item = {
          id: `deep-dive/${ddSlug}`,
          type: "deep-dive",
          slug: ddSlug,
          title,
          file: `deep-dives/${ddSlug}.md`,
          directory: "deep-dives",
          meta: {
            content: repo.briefSlug,
            kind: "deep-dive",
            schema_version: "project-tier-template/v1",
            shape: "project",
            project_type: repo.project_type || "project",
            title,
            tier_template: repo.tier_template,
            light_spine: spine,
            authoring: { generated_by: "scripts/ops/remine-data.mjs", generated_at: NOW, evidence_boundary: "trending metadata; source reread still required" },
          },
          body: bodyFromSpine(spine, title),
          excerpt: spine.one_sentence.summary,
          links: [],
          headings: [],
        };
        deep.items.push(item);
        deepBySlug.set(ddSlug, item);
        summary.addedDeepDives.push(ddSlug);
      }
    }
  }

  for (const item of deep.items) {
    if (!item.meta) item.meta = {};
    if (!item.meta.light_spine) {
      item.meta.schema_version = item.meta.schema_version || "project-tier-template/v1";
      item.meta.light_spine = makeLightSpineFromMeta(item);
      item.body = bodyFromSpine(item.meta.light_spine, item.title || item.slug);
      item.excerpt = item.meta.light_spine.one_sentence.summary;
      summary.generatedSpines.push(item.slug);
    }
  }
  deep.count = deep.items.length;
  deep.generatedAt = NOW;

  await mkdir(path.join(ROOT, "data/knowledge-graph/facets"), { recursive: true });
  const existingFacetNodeIds = new Set();
  for (const file of (await readdir(path.join(ROOT, "data/knowledge-graph/facets"))).filter((name) => /\.ya?ml$/.test(name))) {
    try {
      const facet = YAML.parse(await readFile(path.join(ROOT, "data/knowledge-graph/facets", file), "utf8"));
      if (facet?.node_id) existingFacetNodeIds.add(facet.node_id);
    } catch {
      // ignore malformed existing facets; validators handle them later
    }
  }
  for (const item of deep.items) {
    const facet = projectFacetFromDeepDive(item);
    if (!facet) continue;
    const outPath = path.join(ROOT, "data/knowledge-graph/facets", `${facet.slug}.yaml`);
    try {
      await readFile(outPath, "utf8");
      continue;
    } catch {
      // fill only missing project facets; curated existing facets win.
    }
    await writeFile(outPath, YAML.stringify(facet), "utf8");
    summary.projectFacetsWritten += 1;
  }

  const paperDirs = await readdir(path.join(ROOT, "content/papers"), { withFileTypes: true });
  const paperMetaByArxiv = new Map();
  for (const dirent of paperDirs.filter((d) => d.isDirectory())) {
    try {
      const meta = JSON.parse(await readFile(path.join(ROOT, "content/papers", dirent.name, "metadata.json"), "utf8"));
      const arxiv = meta.arxiv_id || meta.arxivId || /^(\d{4}\.\d{4,5})/.exec(dirent.name)?.[1];
      if (arxiv) paperMetaByArxiv.set(arxiv, { ...meta, dir: dirent.name, slug: dirent.name });
    } catch {
      // ignore malformed metadata here; validators will catch it later
    }
  }
  const primitiveFiles = (await readdir(path.join(ROOT, "data/autosci/primitives"))).filter((file) => /^\d{4}\.\d{4,5}\.ya?ml$/.test(file)).sort();
  for (const file of primitiveFiles) {
    const primitive = YAML.parse(await text(path.join("data/autosci/primitives", file)));
    const arxiv = primitive.source_paper || file.replace(/\.ya?ml$/, "");
    const facet = facetFromPrimitive(file, primitive, paperMetaByArxiv.get(arxiv) || {});
    if (existingFacetNodeIds.has(facet.node_id)) continue;
    const outPath = path.join(ROOT, "data/knowledge-graph/facets", `${arxiv}.yaml`);
    try {
      await readFile(outPath, "utf8");
      continue;
    } catch {
      // fill only missing paper facets; curated existing facets win.
    }
    await writeFile(outPath, YAML.stringify(facet), "utf8");
    summary.paperFacetsWritten += 1;
  }

  await writeJson("public/data/brief/deep-dives.json", deep);
  await writeJson("public/data/trending.json", trending);
  await mkdir(path.join(ROOT, "logs"), { recursive: true });
  await writeJson("logs/remine-transform-report.json", summary);
  console.log(JSON.stringify(summary, null, 2));
}

await main();

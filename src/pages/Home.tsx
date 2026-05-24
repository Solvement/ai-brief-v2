import { useEffect, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";
import { loadPipelineStatus } from "../lib/data";
import type { PipelineStatusData } from "../types";

const HOME_SECTIONS = [
  {
    title: "News",
    href: "#/news",
    label: "AI 新闻与动态",
    body: "跟踪发布、融资、产品变化和重要行业事件。",
    state: "规划中",
  },
  {
    title: "Models",
    href: "#/models",
    label: "模型档案",
    body: "按公司和版本理解模型架构、benchmark、训练路线和产品化变化。",
    state: "已接入",
  },
  {
    title: "Projects",
    href: "#/projects",
    label: "GitHub 项目",
    body: "项目榜单、AI 评分、深度解读和可执行上手路径。",
    state: "已接入",
  },
  {
    title: "Skills",
    href: "#/skills",
    label: "能力专题",
    body: "把 prompt、workflow、MCP、RAG、AI Coding 等能力整理成学习路径。",
    state: "规划中",
  },
  {
    title: "Articles",
    href: "#/articles",
    label: "学术文章深读",
    body: "用小白能懂的语言拆论文问题、思路、架构、方法流程、实验证据、局限和教授视角；版本线作为补充线索。",
    state: "已接入",
  },
];

export function Home() {
  const [pipelineStatus, setPipelineStatus] = useState<PipelineStatusData | null>(null);

  useEffect(() => {
    loadPipelineStatus().then(setPipelineStatus).catch(() => setPipelineStatus(null));
  }, []);

  return (
    <>
      <SiteHeader active="home" />
      <main className="page home-hub">
        <section className="home-hero-panel">
          <div>
            <div className="eyebrow">AI Brief</div>
            <h1>
              <span>Information -&gt;</span>{" "}
              <span>Judgment -&gt; Action</span>
            </h1>
            <p>
              中文优先的 AI 情报工作台。Home 只保留栏目入口，具体内容分别进入 News、Models、Projects、Skills、Articles。
            </p>
          </div>
          <div className="home-principle-grid">
            <div><span>1</span><b>What happened</b></div>
            <div><span>2</span><b>Why it matters</b></div>
            <div><span>3</span><b>What to do next</b></div>
          </div>
        </section>

        <section className="home-section-grid" aria-label="AI Brief sections">
          {HOME_SECTIONS.map((item) => (
            <a className="home-section-card" href={item.href} key={item.title}>
              <div className="home-section-head">
                <div>
                  <span>{item.title}</span>
                  <h2>{item.label}</h2>
                </div>
                <b className={item.state === "已接入" ? "ready" : ""}>{item.state}</b>
              </div>
              <p>{item.body}</p>
            </a>
          ))}
        </section>

        <PipelineStatusPanel data={pipelineStatus} />
      </main>
    </>
  );
}

function PipelineStatusPanel({ data }: { data: PipelineStatusData | null }) {
  if (!data) {
    return (
      <section className="home-pipeline-panel">
        <div className="section-kicker">Agentic Pipeline</div>
        <h2>还没有公开的流水线状态</h2>
        <p>运行 Projects、Articles 或 Paper Radar 的刷新后，这里会显示 Orchestrator、质量门槛和长期记忆的最新状态。</p>
      </section>
    );
  }

  return (
    <section className="home-pipeline-panel">
      <div className="home-pipeline-head">
        <div>
          <div className="section-kicker">Agentic Pipeline</div>
          <h2>从图片路线落地出来的系统骨架</h2>
          <p>{data.principle}</p>
        </div>
        <span>{new Date(data.generatedAt).toLocaleString()}</span>
      </div>
      <div className="home-pipeline-grid">
        {data.surfaces.map((surface) => (
          <article key={surface.surface}>
            <div className="pipeline-surface-head">
              <b>{surfaceLabel(surface.surface)}</b>
              <span className={`pipeline-status ${surface.latestRun?.qualityStatus || "unknown"}`}>
                {surface.latestRun?.qualityStatus || "unknown"}
              </span>
            </div>
            <p>{surface.latestRun?.highlights?.[0] || "等待下一次刷新。"}</p>
            <small>
              selected {surface.latestRun?.selectedCount || 0} / archived {surface.latestRun?.archivedCount || 0} · memory runs {surface.runCount}
            </small>
          </article>
        ))}
      </div>
    </section>
  );
}

function surfaceLabel(surface: string): string {
  if (surface === "paper_radar") return "Paper Radar";
  if (surface === "articles") return "Articles";
  if (surface === "projects") return "Projects";
  return surface;
}

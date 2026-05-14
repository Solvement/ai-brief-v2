import { SiteHeader } from "../components/SiteHeader";

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
    label: "文章解读",
    body: "把长文、观点和技术分析压缩成判断和行动清单。",
    state: "规划中",
  },
  {
    title: "Courses",
    href: "#/courses",
    label: "课程资源",
    body: "筛选值得系统学习的课程，并标记难度、收益和验证方式。",
    state: "规划中",
  },
];

export function Home() {
  return (
    <>
      <SiteHeader active="home" />
      <main className="page home-hub">
        <section className="home-hero-panel">
          <div>
            <div className="eyebrow">AI Brief</div>
            <h1>Information -&gt; Judgment -&gt; Action</h1>
            <p>
              中文优先的 AI 情报工作台。Home 只保留栏目入口，具体内容分别进入 News、Models、Projects、Skills、Articles、Courses。
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
      </main>
    </>
  );
}

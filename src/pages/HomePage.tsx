import { ContentCard, ContentCardEmpty } from "../components/content/ContentCard";
import { SectionTitle } from "../components/SectionTitle";
import { getContentByColumn, getHomeBrief } from "../lib/content/queries";
import type { AnyContentItem } from "../lib/content/types";

function CardRow({ items, hrefFor = (item) => `/content/${item.slug}` }: { items: AnyContentItem[]; hrefFor?: (item: AnyContentItem) => string }) {
  if (items.length === 0) {
    return <ContentCardEmpty title="暂无真实内容" description="运行 ingest:live 后这里会显示真实内容。" />;
  }
  return (
    <div className="home-card-grid">
      {items.map((item) => (
        <ContentCard item={item} href={hrefFor(item)} key={item.id} />
      ))}
    </div>
  );
}

export function HomePage() {
  const brief = getHomeBrief();
  const news = getContentByColumn("news").slice(0, 3);
  const models = getContentByColumn("models").slice(0, 3);
  const projects = getContentByColumn("projects").slice(0, 3);
  const skills = getContentByColumn("skills").slice(0, 3);
  const articles = getContentByColumn("articles").slice(0, 3);
  const courses = getContentByColumn("courses").slice(0, 3);

  return (
    <div className="page-stack">
      <section className="media-hero">
        <div>
          <span className="eyebrow">中文 AI 情报</span>
          <h1>
            <span>每天 5 分钟，</span>
            <span>从真实来源看懂 AI，</span>
            <span>再决定要不要行动。</span>
          </h1>
          <p>
            Home 是每日总览：汇总 News、Models、Projects、Skills、Articles 和 Courses，不再拆出单独 Brief 栏目。
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="/news">
              看最新 News
            </a>
            <a className="secondary-button" href="/projects">
              看热度 Projects
            </a>
          </div>
        </div>
        <article className="featured-brief">
          <span>Today</span>
          <h2>{brief.dailyTakeaway}</h2>
          <ol>
            {brief.mustRead.slice(0, 5).map((item) => (
              <li key={item.id}>{item.title}</li>
            ))}
          </ol>
        </article>
      </section>

      <section>
        <SectionTitle icon={<span>LD</span>} title="Today" kicker="今天最值得先看的真实内容。" />
        <CardRow items={brief.mustRead} />
      </section>

      <section>
        <SectionTitle icon={<span>NW</span>} title="News" kicker="AI 相关新闻和资讯，不在新闻流里显示评分。" />
        <CardRow items={news} />
      </section>

      <section>
        <SectionTitle icon={<span>MD</span>} title="Models" kicker="模型更新、测评和使用判断。" />
        <CardRow items={models} />
      </section>

      <section>
        <SectionTitle icon={<span>PR</span>} title="Projects" kicker="GitHub Trending 为主，Hugging Face 项目为辅。" />
        <CardRow items={projects} hrefFor={(item) => `/projects/${item.slug}`} />
      </section>

      <section>
        <SectionTitle icon={<span>SK</span>} title="Skills" kicker="SKILL.md、CLAUDE.md、MCP server、Cursor rules 和 hooks。" />
        <CardRow items={skills} hrefFor={(item) => `/skills/${item.slug}`} />
      </section>

      <section>
        <SectionTitle icon={<span>AR</span>} title="Articles" kicker="大厂文章、研究论文和高质量技术分析。" />
        <CardRow items={articles} />
      </section>

      <section>
        <SectionTitle icon={<span>CS</span>} title="Courses" kicker="可信课程源有新课时更新。" />
        <CardRow items={courses} />
      </section>
    </div>
  );
}

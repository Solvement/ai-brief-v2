import { ContentCard } from "../components/content/ContentCard";
import { SectionTitle } from "../components/SectionTitle";
import { getHomeBrief } from "../lib/content/queries";

export function BriefIssuePage() {
  const brief = getHomeBrief();

  return (
    <article className="issue-page">
      <header className="page-hero">
        <span className="eyebrow">AI Brief / 2026-05-07</span>
        <h1>In today's AI brief</h1>
        <p>{brief.dailyTakeaway}</p>
      </header>
      <section className="issue-opening">
        <h2>Opening</h2>
        <p>今天最值得关注的不是单条新闻，而是模型、工具和视觉资产都要回到可验证的行动。</p>
      </section>
      <section>
        <h2>Latest Developments</h2>
        <div className="development-list">
          {[...brief.mustRead, ...brief.tryToday].slice(0, 5).map((item) => (
            <div className="development-block" key={item.id}>
              <ContentCard item={item} href={`/content/${item.slug}`} />
              <div className="brief-analysis">
                <h3>Details</h3>
                <ul>
                  {item.key_facts.slice(0, 3).map((fact) => (
                    <li key={fact}>{fact}</li>
                  ))}
                </ul>
                <h3>Why it matters</h3>
                <p>{item.why_it_matters}</p>
                <h3>What to do</h3>
                <p>{item.next_steps[0]}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle icon={<span>RP</span>} title="Related Playbooks" kicker="把今日信息转成行动" />
        {brief.playbookOfTheDay && <ContentCard item={brief.playbookOfTheDay} href={`/playbooks/${brief.playbookOfTheDay.slug}`} />}
      </section>
    </article>
  );
}

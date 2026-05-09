import { ContentCard } from "../components/content/ContentCard";
import { SectionTitle } from "../components/SectionTitle";
import { getHomeBrief } from "../lib/content/queries";

export function BriefsPage() {
  const brief = getHomeBrief();

  return (
    <div className="page-stack">
      <section className="page-hero">
        <span className="eyebrow">AI Briefs</span>
        <h1>每日 AI Brief 档案</h1>
        <p>每一期都按 opening、today's brief、latest developments、why it matters 和 what to do 组织。</p>
      </section>
      <SectionTitle icon={<span>05</span>} title="2026-05-07" kicker={brief.dailyTakeaway} />
      <div className="content-grid">
        {brief.mustRead.map((item) => (
          <ContentCard item={item} href="/briefs/2026-05-07" key={item.id} />
        ))}
      </div>
    </div>
  );
}

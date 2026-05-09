import { Article, Compass, Gauge, TerminalWindow, TrendUp, Wrench } from "@phosphor-icons/react";
import { getContentByType } from "../lib/content/queries";
import { ContentCard, ContentCardEmpty } from "./content/ContentCard";
import { SectionTitle } from "./SectionTitle";

const lanes = [
  { icon: <TrendUp size={22} />, title: "必看 3 条", text: "影响大、可靠、值得知道。" },
  { icon: <Wrench size={22} />, title: "可试工具", text: "能马上打开、安装、测试。" },
  { icon: <TerminalWindow size={22} />, title: "Workflow", text: "直接复制到真实任务。" },
  { icon: <Article size={22} />, title: "深读 1 篇", text: "观点、论文、行业报告。" },
  { icon: <Gauge size={22} />, title: "关注雷达", text: "Agent、MCP、AI Coding、视频。" },
];

const latestNews = getContentByType("news").slice(0, 3);

export function TodayBrief() {
  return (
    <section className="content-panel" id="home">
      <SectionTitle
        icon={<Compass size={20} />}
        title="Home / 今日 AI Brief"
        kicker="不是推荐流，是编辑过的每日决策页"
      />
      <div className="five-lane">
        {lanes.map((lane) => (
          <div className="brief-lane" key={lane.title}>
            {lane.icon}
            <h3>{lane.title}</h3>
            <p>{lane.text}</p>
          </div>
        ))}
      </div>
      <div className="news-list" id="news">
        {latestNews.length === 0 ? (
          <ContentCardEmpty title="暂无已验证内容" description="连接来源后会显示 News、Models、Tools 和 Playbooks。" />
        ) : (
          latestNews.map((item) => (
            <ContentCard item={item} href={`/content/${item.slug}`} compact key={item.id} />
          ))
        )}
      </div>
    </section>
  );
}

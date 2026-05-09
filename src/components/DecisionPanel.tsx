import type { CSSProperties } from "react";
import { decisionBriefs } from "../lib/content/views";

export function DecisionPanel() {
  return (
    <aside className="decision-panel" aria-label="今日决策摘要">
      <div className="panel-topline">
        <span>Today</span>
        <b>May 7, 2026</b>
      </div>
      <div className="brief-score">
        <span>推荐分</span>
        <strong>88</strong>
        <small>影响力 x 相关性 x 新鲜度 x 可信度 x 可执行性 / 阅读成本</small>
      </div>
      <div className="decision-stack">
        {decisionBriefs.map((brief, index) => (
          <article className="decision-card" style={{ "--i": index } as CSSProperties} key={brief.card.id}>
            <div>
              <span>{brief.label}</span>
              <h3>{brief.card.title}</h3>
              <p>{brief.card.one_sentence_takeaway}</p>
            </div>
            <div className="mini-meter">
              <b>{brief.card.impact_score}</b>
              <small>{brief.card.action_label}</small>
            </div>
          </article>
        ))}
      </div>
      <div className="state-strip" aria-label="内容采集状态">
        <span className="state-ready">官方源已确认</span>
        <span className="state-loading">社区信号采集中</span>
        <span className="state-error">价格源需复核</span>
      </div>
    </aside>
  );
}

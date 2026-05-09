import { ArrowRight, MagnifyingGlass, Sparkle } from "@phosphor-icons/react";
import { DecisionPanel } from "./DecisionPanel";

export function Hero() {
  return (
    <section className="hero-section">
      <div className="hero-copy">
        <div className="eyebrow">
          <Sparkle size={16} weight="fill" />
          中文 AI 实践者的每日决策工作台
        </div>
        <h1>
          <span>用 5-15 分钟</span>
          <span>判断什么值得看，</span>
          <span>为什么重要，</span>
          <span>怎么落地。</span>
        </h1>
        <p>
          AI-brief 按 News、Models、Tools、Playbooks 和 Learn 重组信息流，把普通资讯变成判断、验证和执行。
        </p>
        <div className="hero-actions">
          <button className="primary-button">
            查看今日 Brief
            <ArrowRight size={18} weight="bold" />
          </button>
          <button className="secondary-button">
            <MagnifyingGlass size={18} />
            搜索模型与工具
          </button>
        </div>
      </div>
      <DecisionPanel />
    </section>
  );
}

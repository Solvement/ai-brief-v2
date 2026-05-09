import { Brain } from "@phosphor-icons/react";
import { modelRows } from "../lib/content/views";
import { SectionTitle } from "./SectionTitle";

export function ModelsRadar() {
  return (
    <section className="content-panel" id="models">
      <SectionTitle icon={<Brain size={20} />} title="Models / Benchmarks" kicker="模型雷达独立于普通新闻" />
      <div className="model-table">
        <div className="table-head">
          <span>场景</span>
          <span>主指标</span>
          <span>成本</span>
          <span>价值</span>
          <span>下一步</span>
        </div>
        {modelRows.map((row) => (
          <div className="table-row" key={row.scenario}>
            <span>{row.scenario}</span>
            <span>{row.primaryMetric}</span>
            <span>{row.costLevel}</span>
            <span>{row.valueLevel}</span>
            <span>{row.nextStep}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

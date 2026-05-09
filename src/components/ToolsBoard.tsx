import { Database } from "@phosphor-icons/react";
import { toolAssessments } from "../lib/content/views";
import { SectionTitle } from "./SectionTitle";

export function ToolsBoard() {
  return (
    <section className="content-panel" id="tools">
      <SectionTitle
        icon={<Database size={20} />}
        title="Tools"
        kicker="项目、工具、MCP、Hooks、Workflow 都归入可用性评估"
      />
      <div className="tool-grid">
        {toolAssessments.map((tool) => (
          <article className="tool-card" key={tool.name}>
            <span>{tool.label}</span>
            <h3>{tool.name}</h3>
            <dl>
              <div>
                <dt>成熟度</dt>
                <dd>{tool.maturity}</dd>
              </div>
              <div>
                <dt>成本</dt>
                <dd>{tool.cost}</dd>
              </div>
              <div>
                <dt>风险</dt>
                <dd>{tool.risk}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

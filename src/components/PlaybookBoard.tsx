import { CheckCircle, FileText } from "@phosphor-icons/react";
import { playbooks } from "../lib/content/views";
import { SectionTitle } from "./SectionTitle";

export function PlaybookBoard() {
  return (
    <section className="content-panel playbooks" id="playbooks">
      <SectionTitle icon={<FileText size={20} />} title="Playbooks" kicker="AI-brief 的王牌栏目：信息转行动" />
      <div className="playbook-list">
        {playbooks.map((playbook, index) => (
          <article className="playbook-row" key={playbook.title}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <div>
              <h3>{playbook.title}</h3>
              <p>{playbook.output}</p>
            </div>
            <b>{playbook.time}</b>
            <CheckCircle size={22} weight="fill" />
          </article>
        ))}
      </div>
    </section>
  );
}

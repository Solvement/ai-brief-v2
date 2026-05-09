import { BookOpen, Code, ImageSquare, Lightning, ShieldCheck } from "@phosphor-icons/react";
import { learnPaths } from "../lib/content/views";
import { SectionTitle } from "./SectionTitle";

const pathIcons = [<Lightning size={18} />, <Code size={18} />, <ImageSquare size={18} />, <ShieldCheck size={18} />];

export function LearnPaths() {
  return (
    <section className="learn-panel" id="learn">
      <SectionTitle icon={<BookOpen size={20} />} title="Learn" kicker="不是课程黄页，是能力路径" />
      <div className="path-map">
        {learnPaths.map((path, index) => (
          <article className="path-step" key={path.title}>
            {pathIcons[index]}
            <div>
              <h3>{path.title}</h3>
              <p>{path.text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

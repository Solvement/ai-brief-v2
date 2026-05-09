import type { ReactNode } from "react";

interface SectionTitleProps {
  icon: ReactNode;
  title: string;
  kicker: string;
}

export function SectionTitle({ icon, title, kicker }: SectionTitleProps) {
  return (
    <div className="section-title">
      <div className="title-icon">{icon}</div>
      <div>
        <h2>{title}</h2>
        <p>{kicker}</p>
      </div>
    </div>
  );
}

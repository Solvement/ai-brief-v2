import { Clock } from "@phosphor-icons/react";
import { navItems } from "../lib/content/views";

export function Header() {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">AB</div>
        <div>
          <strong>AI-brief</strong>
          <span>Decision OS</span>
        </div>
      </div>
      <nav aria-label="Primary navigation">
        {navItems.map((item) => (
          <a href={`#${item.toLowerCase()}`} key={item}>
            {item}
          </a>
        ))}
      </nav>
      <button className="ghost-button">
        <Clock size={18} />
        5 min mode
      </button>
    </header>
  );
}

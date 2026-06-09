import type { ReactNode } from "react";
import Link from "next/link";

export type NavKey = "home" | "models" | "projects" | "articles" | "podcast" | "news" | "mind-palace";

interface Props {
  active: NavKey;
  meta?: ReactNode;
}

const NAV_ITEMS: { key: NavKey; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "news", label: "News", href: "/news" },
  { key: "articles", label: "Articles", href: "/articles" },
  { key: "models", label: "Models", href: "/models" },
  { key: "projects", label: "Projects", href: "/projects" },
  { key: "mind-palace", label: "Mind Palace", href: "/mind-palace" },
  { key: "podcast", label: "Podcast", href: "/podcast" },
];

export function SiteHeader({ active, meta }: Props) {
  return (
    <header className="site-top">
      <div className="site-top-inner">
        <Link href="/" className="brand" style={{ color: "inherit" }}>
          <span className="brand-mark">AI</span>
          <span className="brand-text">
            AI Brief
            <span className="muted">Information -&gt; Judgment -&gt; Action</span>
          </span>
        </Link>
        <nav className="top-nav" aria-label="AI Brief navigation">
          {NAV_ITEMS.map((item) => (
            <Link key={item.key} className={`top-nav-link${active === item.key ? " active" : ""}`} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        {meta && <div className="site-meta">{meta}</div>}
      </div>
    </header>
  );
}

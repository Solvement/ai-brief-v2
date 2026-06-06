import type { ReactNode } from "react";
import Link from "next/link";

// v3-style AppShell: a fixed 240px left sidebar + a full-width (1fr) content area.
// Applied to Home + News for now; other columns still use SiteHeader (top nav).
// All colors are hardcoded hex (no --radar-* vars — they resolve to nothing outside
// their scoped page containers, which previously caused white-on-white).

export type ShellNavKey = "home" | "news" | "articles" | "conference" | "models" | "projects" | "graph" | "podcast";

const NAV: { key: ShellNavKey; label: string; href: string; icon: string }[] = [
  { key: "home", label: "Home", href: "/", icon: "home" },
  { key: "news", label: "News", href: "/news", icon: "news" },
  { key: "articles", label: "HF 论文", href: "/articles", icon: "articles" },
  { key: "conference", label: "顶会最佳", href: "/conference", icon: "conference" },
  { key: "models", label: "Models", href: "/models", icon: "models" },
  { key: "projects", label: "Projects", href: "/projects", icon: "projects" },
  { key: "graph", label: "Graph", href: "/graph", icon: "graph" },
  { key: "podcast", label: "Podcast", href: "/podcast", icon: "podcast" },
];

export function AppShell({ children, active }: { children: ReactNode; active?: ShellNavKey }) {
  return (
    <div className="ash-root">
      <div className="ash-grid">
        {/* desktop sidebar */}
        <aside className="ash-sidebar">
          <Link className="ash-brand" href="/">
            <span className="ash-brand-mark">AI</span>
            <span className="ash-brand-text">
              <strong>AI Brief</strong>
              <small>Curate. Interpret. Learn.</small>
            </span>
          </Link>
          <nav className="ash-nav" aria-label="AI Brief 导航">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={`ash-nav-link${active === item.key ? " ash-nav-active" : ""}`}
              >
                <NavIcon name={item.icon} />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="ash-daily-brief">
            <p className="ash-daily-brief-title">Daily Brief</p>
            <p className="ash-daily-brief-body">每天只看被筛过的一版，候选继续留在库里。</p>
          </div>
        </aside>

        {/* mobile top bar */}
        <div className="ash-mobile-bar">
          <Link className="ash-brand" href="/">
            <span className="ash-brand-mark">AI</span>
            <span className="ash-brand-text">
              <strong>AI Brief</strong>
              <small>Kevin&apos;s daily AI brief</small>
            </span>
          </Link>
        </div>

        {/* mobile horizontal nav strip */}
        <nav className="ash-mobile-strip" aria-label="AI Brief 导航">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={active === item.key ? "ash-mobile-active" : ""}
            >
              <NavIcon name={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </div>
  );
}

function NavIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    home: "M4 11.5 12 5l8 6.5V20a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-8.5Z",
    news: "M5 5h14v14H5z M8 8h8 M8 12h8 M8 16h5",
    models: "M12 3 20 7.5v9L12 21l-8-4.5v-9L12 3Z M12 12l8-4.5 M12 12v9 M12 12 4 7.5",
    projects: "M4 7h16M7 7v13M17 7v13M6 4h12a2 2 0 0 1 2 2v14H4V6a2 2 0 0 1 2-2Z",
    articles: "M6 4h9l3 3v13H6z M9 11h6 M9 15h6 M9 7h3",
    conference: "M8 4h8v3a4 4 0 0 1-8 0V4Z M8 5H5v2a3 3 0 0 0 3 3 M16 5h3v2a3 3 0 0 1-3 3 M12 11v4 M9 19h6 M10 19l.5-4h3l.5 4",
    podcast: "M6 13a6 6 0 0 1 12 0v5a2 2 0 0 1-2 2h-1v-7h3M6 13v7h3v-7H6M9 13a3 3 0 0 1 6 0",
    graph: "M12 4v16M4 12h16M7 7l10 10M17 7 7 17",
  };
  return (
    <svg
      aria-hidden="true"
      className="ash-nav-icon"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      <path d={paths[name] ?? paths.home} />
    </svg>
  );
}

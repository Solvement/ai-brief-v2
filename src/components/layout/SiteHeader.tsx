import type { JSX } from "react";
import { navigationItems, type NavigationItem } from "../../lib/content/types";

const navHref: Record<NavigationItem, string> = {
  Home: "/",
  News: "/news",
  Models: "/models",
  Projects: "/projects",
  Skills: "/skills",
  Articles: "/articles",
  Courses: "/courses",
};

const navLabel: Record<NavigationItem, string> = {
  Home: "首页",
  News: "新闻",
  Models: "模型",
  Projects: "项目",
  Skills: "技能",
  Articles: "文章",
  Courses: "课程",
};

const navIcon: Record<NavigationItem, JSX.Element> = {
  Home: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V20a2 2 0 0 1-2 2h-3v-7H8v7H5a2 2 0 0 1-2-2V9.5Z" /></svg>,
  News: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm0 0v14M8 8h7M8 12h7M8 16h5" /></svg>,
  Models: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3 21 8v8l-9 5-9-5V8l9-5Z" /><path d="M12 12 21 8M12 12 3 8M12 12v9" /></svg>,
  Projects: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7h8M7 12h10M9 17h6" /><rect x="3" y="4" width="18" height="16" rx="3" /></svg>,
  Skills: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M7 4v6M17 4v6M6 14h12M9 11v6M15 11v6M4 20h16" /></svg>,
  Articles: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M14 4v4h5M8 12h8M8 16h6" /></svg>,
  Courses: <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10 12 5 2 10l10 5 10-5Z" /><path d="M6 12v5c3 2 9 2 12 0v-5" /></svg>,
};

export function SiteHeader() {
  const currentPath = typeof globalThis.location === "object" ? globalThis.location.pathname : "/";

  function isActive(item: NavigationItem): boolean {
    const href = navHref[item];
    if (href === "/") return currentPath === "/";
    return currentPath === href || currentPath.startsWith(`${href}/`);
  }

  return (
    <>
      <aside className="site-sidebar" aria-label="Primary navigation">
        <a className="site-sidebar__brand" href="/">
          <BrandMark />
          <div className="site-sidebar__brand-text">
            <span className="site-sidebar__brand-name">AI Brief</span>
            <span className="site-sidebar__brand-tagline">筛选 · 判断 · 行动</span>
          </div>
        </a>

        <nav className="site-sidebar__nav" aria-label="Main">
          {navigationItems.map((item) => (
            <a
              key={item}
              className="site-sidebar__nav-link"
              href={navHref[item]}
              aria-current={isActive(item) ? "page" : undefined}
            >
              <span className="site-sidebar__nav-icon" aria-hidden="true">{navIcon[item]}</span>
              <span>{navLabel[item]}</span>
            </a>
          ))}
        </nav>

        <div className="site-sidebar__footer">
          <span>真实数据 MVP</span>
          <span>v0.1</span>
        </div>
      </aside>

      <header className="mobile-topbar" aria-label="Mobile navigation">
        <a className="mobile-topbar__brand" href="/">
          <BrandMark />
          <span>AI Brief</span>
        </a>
        <nav className="mobile-topbar__nav" aria-label="Mobile main">
          {navigationItems.map((item) => (
            <a key={item} href={navHref[item]} aria-current={isActive(item) ? "page" : undefined}>
              {navLabel[item]}
            </a>
          ))}
        </nav>
      </header>
    </>
  );
}

function BrandMark() {
  return (
    <div className="site-sidebar__brand-mark" aria-hidden="true">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2.5 14.8 9.2 21.5 12 14.8 14.8 12 21.5 9.2 14.8 2.5 12 9.2 9.2 12 2.5Z" fill="currentColor" />
      </svg>
    </div>
  );
}

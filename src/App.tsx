import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Detail } from "./pages/Detail";
import { Models } from "./pages/Models";
import { Projects } from "./pages/Projects";
import { SiteHeader, type NavKey } from "./components/SiteHeader";

/**
 * Tiny hash-based router. No external dependency.
 * Routes:
 *   #/                       -> Home
 *   #/projects               -> Projects (GitHub Trending boards)
 *   #/models                 -> Models index
 *   #/models/<companyId>     -> Model company detail
 *   #/repo/<owner>/<name>    -> Project detail
 */
type RouteState =
  | { route: "home" }
  | { route: "detail"; owner: string; name: string }
  | { route: "models"; companyId?: string }
  | { route: "projects" }
  | { route: "section"; section: Exclude<NavKey, "home" | "models" | "projects"> };

function parseHash(): RouteState {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const m = raw.match(/^\/repo\/([^/]+)\/([^/]+)\/?$/);
  if (m) return { route: "detail", owner: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]) };
  const models = raw.match(/^\/models(?:\/([^/]+))?\/?$/);
  if (models) return { route: "models", companyId: models[1] ? decodeURIComponent(models[1]) : undefined };
  if (/^\/projects\/?$/.test(raw)) return { route: "projects" };
  const section = raw.match(/^\/(news|skills|articles|courses)\/?$/);
  if (section) return { route: "section", section: section[1] as Exclude<NavKey, "home" | "models" | "projects"> };
  return { route: "home" };
}

export function App() {
  const [state, setState] = useState(parseHash);

  useEffect(() => {
    const onChange = () => {
      setState(parseHash());
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  if (state.route === "detail" && state.owner && state.name) {
    return <Detail owner={state.owner} name={state.name} />;
  }
  if (state.route === "models") {
    return <Models companyId={state.companyId} />;
  }
  if (state.route === "projects") {
    return <Projects />;
  }
  if (state.route === "section") {
    return <ComingSoon section={state.section} />;
  }
  return <Home />;
}

function ComingSoon({ section }: { section: Exclude<NavKey, "home" | "models" | "projects"> }) {
  return (
    <>
      <SiteHeader active={section} />
      <main className="page">
        <div className="notice">
          {section} 栏目还没有接入数据。当前可用栏目是 Models 和 Projects。
        </div>
      </main>
    </>
  );
}

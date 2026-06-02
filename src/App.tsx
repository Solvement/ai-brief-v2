import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Detail } from "./pages/Detail";
import { Models } from "./pages/Models";
import { Projects } from "./pages/Projects";
import { Articles } from "./pages/Articles";
import { Podcast } from "./pages/Podcast";
import { BriefDeepDive } from "./pages/BriefDeepDive";

/**
 * Tiny hash-based router. No external dependency.
 * Routes:
 *   #/                       -> Home (novelty radar landing)
 *   #/projects               -> Projects (GitHub Trending boards)
 *   #/models                 -> Models index
 *   #/models/<companyId>     -> Model company detail
 *   #/articles               -> Academic radar + deep reading
 *   #/articles/<paperId>     -> Article detail
 *   #/podcast                -> Podcast (future column placeholder)
 *   #/repo/<owner>/<name>    -> Project detail
 */
type RouteState =
  | { route: "home" }
  | { route: "detail"; owner: string; name: string }
  | { route: "models"; companyId?: string }
  | { route: "projects" }
  | { route: "articles"; paperId?: string }
  | { route: "brief"; slug?: string }
  | { route: "podcast" };

function parseHash(): RouteState {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const m = raw.match(/^\/repo\/([^/]+)\/([^/]+)\/?$/);
  if (m) return { route: "detail", owner: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]) };
  const models = raw.match(/^\/models(?:\/([^/]+))?\/?$/);
  if (models) return { route: "models", companyId: models[1] ? decodeURIComponent(models[1]) : undefined };
  const articles = raw.match(/^\/articles(?:\/([^/]+))?\/?$/);
  if (articles) return { route: "articles", paperId: articles[1] ? decodeURIComponent(articles[1]) : undefined };
  const brief = raw.match(/^\/brief(?:\/([^/]+))?\/?$/);
  if (brief) return { route: "brief", slug: brief[1] ? decodeURIComponent(brief[1]) : undefined };
  if (/^\/projects\/?$/.test(raw)) return { route: "projects" };
  if (/^\/podcast\/?$/.test(raw)) return { route: "podcast" };
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
  if (state.route === "models") return <Models companyId={state.companyId} />;
  if (state.route === "projects") return <Projects />;
  if (state.route === "articles") return <Articles paperId={state.paperId} />;
  if (state.route === "brief") return <BriefDeepDive slug={state.slug} />;
  if (state.route === "podcast") return <Podcast />;
  return <Home />;
}

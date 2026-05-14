import { useEffect, useState } from "react";
import { Home } from "./pages/Home";
import { Detail } from "./pages/Detail";

/**
 * Tiny hash-based router. No external dependency.
 * Routes:
 *   #/                       -> Home (3 boards)
 *   #/repo/<owner>/<name>    -> Detail (deep dive)
 */
function parseHash(): { route: "home" | "detail"; owner?: string; name?: string } {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const m = raw.match(/^\/repo\/([^/]+)\/([^/]+)\/?$/);
  if (m) return { route: "detail", owner: decodeURIComponent(m[1]), name: decodeURIComponent(m[2]) };
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
  return <Home />;
}

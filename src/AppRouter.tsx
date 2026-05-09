import { SiteHeader } from "./components/layout/SiteHeader";
import { SiteFooter } from "./components/layout/SiteFooter";
import { AdminContentPage } from "./pages/AdminContentPage";
import { AdminMediaPage } from "./pages/AdminMediaPage";
import { BriefIssuePage } from "./pages/BriefIssuePage";
import {
  ArticlesPage,
  CoursesPage,
  GenericContentPage,
  ModelsPage,
  NewsPage,
  NotFoundPanel,
  PlaybookDetailPage,
  ProjectDetailPage,
  ProjectsPage,
  SkillDetailPage,
  SkillsPage,
  ToolDetailPage,
} from "./pages/DirectoryPages";
import { HomePage } from "./pages/HomePage";
import { parseContentFilters, type ContentFilters } from "./lib/content/filters";

export type Route =
  | { type: "home" }
  | { type: "news"; filters: ContentFilters }
  | { type: "models"; filters: ContentFilters }
  | { type: "projects"; filters: ContentFilters }
  | { type: "skills"; filters: ContentFilters }
  | { type: "skillDetail"; slug: string }
  | { type: "projectDetail"; slug: string }
  | { type: "articles"; filters: ContentFilters }
  | { type: "articleDetail"; slug: string }
  | { type: "courses"; filters: ContentFilters }
  | { type: "courseDetail"; slug: string }
  | { type: "briefIssue"; slug: string }
  | { type: "toolDetail"; slug: string }
  | { type: "playbookDetail"; slug: string }
  | { type: "adminMedia" }
  | { type: "adminContent" }
  | { type: "contentDetail"; slug: string }
  | { type: "notFound" };

export function resolveRoute(path: string): Route {
  const url = new URL(path, "http://ai-brief.local");
  const segments = url.pathname.split("/").filter(Boolean);
  const filters = parseContentFilters(url.search);

  if (segments.length === 0) return { type: "home" };

  // Legacy redirects: /briefs (no slug), /tools, /playbooks, /learn → new homes
  if (segments[0] === "briefs" && segments.length === 1) return { type: "home" };
  if (segments[0] === "briefs" && segments[1]) return { type: "briefIssue", slug: segments[1] };

  if (segments[0] === "news" && segments.length === 1) return { type: "news", filters };
  if (segments[0] === "news" && segments[1]) return { type: "contentDetail", slug: segments[1] };
  if (segments[0] === "models" && segments.length === 1) return { type: "models", filters };
  if (segments[0] === "models" && segments[1]) return { type: "contentDetail", slug: segments[1] };

  if (segments[0] === "projects" && segments.length === 1) return { type: "projects", filters };
  if (segments[0] === "projects" && segments[1]) return { type: "projectDetail", slug: segments[1] };
  if (segments[0] === "skills" && segments.length === 1) return { type: "skills", filters };
  if (segments[0] === "skills" && segments[1]) return { type: "skillDetail", slug: segments[1] };

  if (segments[0] === "articles" && segments.length === 1) return { type: "articles", filters };
  if (segments[0] === "articles" && segments[1]) return { type: "articleDetail", slug: segments[1] };

  if (segments[0] === "courses" && segments.length === 1) return { type: "courses", filters };
  if (segments[0] === "courses" && segments[1]) return { type: "courseDetail", slug: segments[1] };

  // Legacy aliases: /tools, /playbooks, /learn
  if (segments[0] === "tools" && segments.length === 1) return { type: "projects", filters };
  if (segments[0] === "tools" && segments[1]) return { type: "toolDetail", slug: segments[1] };
  if (segments[0] === "playbooks" && segments.length === 1) return { type: "projects", filters };
  if (segments[0] === "playbooks" && segments[1]) return { type: "playbookDetail", slug: segments[1] };
  if (segments[0] === "learn") return { type: "courses", filters };

  if (segments[0] === "admin" && segments[1] === "media") return { type: "adminMedia" };
  if (segments[0] === "admin" && segments[1] === "content") return { type: "adminContent" };
  if (segments[0] === "content" && segments[1]) return { type: "contentDetail", slug: segments[1] };

  return { type: "notFound" };
}

export function AppRouter({ path }: { path?: string }) {
  const browserPath =
    typeof globalThis.location === "object" ? `${globalThis.location.pathname}${globalThis.location.search}` : "/";
  const route = resolveRoute(path ?? browserPath);

  return (
    <main className="app-shell">
      <SiteHeader />
      <div className="page-shell">
        {renderRoute(route)}
        <SiteFooter />
      </div>
    </main>
  );
}

function renderRoute(route: Route) {
  switch (route.type) {
    case "home":
      return <HomePage />;
    case "news":
      return <NewsPage filters={route.filters} />;
    case "models":
      return <ModelsPage filters={route.filters} />;
    case "projects":
      return <ProjectsPage filters={route.filters} />;
    case "skills":
      return <SkillsPage filters={route.filters} />;
    case "skillDetail":
      return <SkillDetailPage slug={route.slug} />;
    case "projectDetail":
      return <ProjectDetailPage slug={route.slug} />;
    case "articles":
      return <ArticlesPage filters={route.filters} />;
    case "articleDetail":
      return <GenericContentPage slug={route.slug} />;
    case "courses":
      return <CoursesPage filters={route.filters} />;
    case "courseDetail":
      return <GenericContentPage slug={route.slug} />;
    case "briefIssue":
      return <BriefIssuePage />;
    case "toolDetail":
      return <ToolDetailPage slug={route.slug} />;
    case "playbookDetail":
      return <PlaybookDetailPage slug={route.slug} />;
    case "adminMedia":
      return <AdminMediaPage />;
    case "adminContent":
      return <AdminContentPage />;
    case "contentDetail":
      return <GenericContentPage slug={route.slug} />;
    case "notFound":
    default:
      return <NotFoundPanel />;
  }
}

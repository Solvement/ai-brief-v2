import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouter, resolveRoute } from "../src/AppRouter";
import { liveContentItems } from "../src/lib/content/live.generated";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const routes = [
  ["/", "Today"],
  ["/news", "News"],
  ["/models", "Models"],
  ["/projects", "Projects"],
  ["/skills", "Skills"],
  ["/articles", "Articles"],
  ["/courses", "Courses"],
  ["/admin/media", "admin-media"],
] as const;

for (const [path, expectedText] of routes) {
  const markup = renderToStaticMarkup(<AppRouter path={path} />);
  assert(markup.includes(expectedText), `${path} should render ${expectedText}`);
}

const newsMarkup = renderToStaticMarkup(<AppRouter path="/news" />);
for (const href of ['href="/"', 'href="/news"', 'href="/models"', 'href="/projects"', 'href="/skills"', 'href="/articles"', 'href="/courses"']) {
  assert(newsMarkup.includes(href), `primary navigation should include ${href}`);
}
assert(!newsMarkup.includes(">Briefs<"), "primary navigation should not split Briefs from Home");
assert(!newsMarkup.includes(">Tools<"), "primary navigation should use Projects, not Tools");
assert(!newsMarkup.includes(">Playbooks<"), "primary navigation should not expose Playbooks as a primary column");
assert(!newsMarkup.includes(">Learn<"), "primary navigation should use Courses, not Learn");
assert(!newsMarkup.includes("content-card__score-meter"), "News page should not render score meters");
assert(!newsMarkup.includes("content-card__action-badge"), "News page should not render action badges");

const liveProject = liveContentItems.find((item) => ["tool", "project"].includes(item.content_type));
if (liveProject) {
  const projectMarkup = renderToStaticMarkup(<AppRouter path={`/projects/${liveProject.slug}`} />);
  assert(projectMarkup.includes(liveProject.title), "live project detail route should render a live item");
}

const liveSkill = liveContentItems.find((item) => item.content_type === "integration");
if (liveSkill) {
  const skillMarkup = renderToStaticMarkup(<AppRouter path={`/skills/${liveSkill.slug}`} />);
  assert(skillMarkup.includes(liveSkill.title), "live skill detail route should render a live item");
  assert(skillMarkup.includes('href="/skills"'), "skill detail should breadcrumb back to Skills");
}

const liveArticle = liveContentItems.find((item) => ["article", "paper"].includes(item.content_type));
if (liveArticle) {
  const articleMarkup = renderToStaticMarkup(<AppRouter path={`/articles/${liveArticle.slug}`} />);
  assert(articleMarkup.includes(liveArticle.title), "live article detail route should render a live item");
}

const liveCourse = liveContentItems.find((item) => item.content_type === "course");
if (liveCourse) {
  const courseMarkup = renderToStaticMarkup(<AppRouter path={`/courses/${liveCourse.slug}`} />);
  assert(courseMarkup.includes(liveCourse.title), "live course detail route should render a live item");
}

assert(resolveRoute("/projects/ai-coding-suite").type === "projectDetail", "project detail route should resolve");
assert(resolveRoute("/skills/agent-skill-pack").type === "skillDetail", "skill detail route should resolve");
assert(resolveRoute("/articles/ai-agent-research").type === "articleDetail", "article detail route should resolve");
assert(resolveRoute("/courses/ai-product-path").type === "courseDetail", "course detail route should resolve");
assert(resolveRoute("/briefs").type === "home", "legacy Briefs route should resolve to Home");
assert(resolveRoute("/tools").type === "projects", "legacy Tools route should resolve to Projects");
assert(resolveRoute("/playbooks").type === "projects", "legacy Playbooks route should resolve to Projects");
assert(resolveRoute("/learn").type === "courses", "legacy Learn route should resolve to Courses");
assert(resolveRoute("/missing").type === "notFound", "unknown route should resolve notFound");

console.log("pages smoke tests passed");

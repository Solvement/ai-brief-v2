import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouter } from "../src/AppRouter";
import { liveContentItems } from "../src/lib/content/live.generated";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const homeMarkup = renderToStaticMarkup(<AppRouter path="/" />);
for (const requiredSection of ["Today", "News", "Models", "Projects", "Skills", "Articles", "Courses"]) {
  assert(homeMarkup.includes(requiredSection), `Home should summarize the ${requiredSection} column`);
}
assert(!homeMarkup.includes("/briefs/"), "Home should not link to a separate Brief issue route");
assert(!/class="[^"]*subscribe|href="[^"]*login|>Login<|>Upgrade/i.test(homeMarkup), "Home should not render subscription, login, or upgrade UI");

const liveProject = liveContentItems.find((item) => (item.source_column === "projects" || ["tool", "project"].includes(item.content_type)) && item.tags.length > 0);
assert(liveProject, "Live generated content should include at least one project/tool/integration item");
const selectedTag = liveProject.tags[0];
const filteredProjectsMarkup = renderToStaticMarkup(<AppRouter path={`/projects?tag=${encodeURIComponent(selectedTag)}`} />);
assert(filteredProjectsMarkup.includes("已启用筛选"), "Section pages should expose active filters");
assert(filteredProjectsMarkup.includes(selectedTag), "Filtered section should show selected tag");
assert(filteredProjectsMarkup.includes(liveProject.title), "Filtered projects should include matching live project content");

const emptyMarkup = renderToStaticMarkup(<AppRouter path="/news?tag=RAG&action=avoid" />);
assert(emptyMarkup.includes("暂无匹配内容"), "Section filters should render an empty state");

const detailItem = liveContentItems[0];
assert(detailItem, "Live generated content should include at least one detail item");
const detailMarkup = renderToStaticMarkup(<AppRouter path={`/content/${detailItem.slug}`} />);
for (const requiredBlock of [
  "标准详情",
  "TL;DR",
  "背景",
  "来源明确说了什么",
  "为什么重要",
  "影响人群",
  "机会",
  "风险",
  "怎么用",
  "清单 / Prompt / 工作流",
  "相关内容",
  "给小白的解释",
  "核心概念",
  "机制解释",
  "例子",
]) {
  assert(detailMarkup.includes(requiredBlock), `Detail page should render ${requiredBlock}`);
}

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ContentCard, ContentCardEmpty, ContentCardError, ContentCardLoading } from "../src/components/content/ContentCard";
import { contentItems } from "../src/lib/content/seed";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const item = contentItems.find((candidate) => candidate.content_type !== "news") ?? contentItems[0];
const cardMarkup = renderToStaticMarkup(<ContentCard item={item} href={`/content/${item.slug}`} />);
const audienceLabel = {
  developer: "开发者",
  pm: "产品",
  founder: "创业者",
  creator: "创作者",
  operator: "运营",
  researcher: "研究者",
  enterprise: "企业",
}[item.target_audience[0]];

assert(cardMarkup.includes(item.title), "ContentCard should render title");
assert(cardMarkup.includes(item.one_sentence_takeaway), "ContentCard should render takeaway");
assert(cardMarkup.includes(item.why_it_matters), "ContentCard should render why_it_matters");
assert(cardMarkup.includes(audienceLabel), "ContentCard should render localized audience");
assert(cardMarkup.includes(`${item.reading_time_minutes} 分钟`), "ContentCard should render reading time");
assert(cardMarkup.includes(String(item.impact_score)), "ContentCard should render impact score");
assert(cardMarkup.includes(String(item.confidence_score)), "ContentCard should render confidence score");
assert(cardMarkup.includes(item.source_name), "ContentCard should render source name");
assert(cardMarkup.includes(item.published_at ?? item.collected_at), "ContentCard should render date");
assert(cardMarkup.includes(`/content/${item.slug}`), "ContentCard should render link href");
assert(cardMarkup.includes("content-card__visual"), "ContentCard should render a media visual frame");
assert(cardMarkup.includes("content-card__kicker"), "ContentCard should render a source/type kicker");
assert(cardMarkup.includes("content-card__action-badge"), "ContentCard should render a visible action badge");
assert(cardMarkup.includes("content-card__score-meter"), "ContentCard should render score meters instead of plain score text only");
assert(cardMarkup.includes("content-card__source-strip"), "ContentCard should render source/date metadata as a strip");

assert(cardMarkup.includes("content-card__visual--placeholder"), "ContentCard should render a CSS placeholder when no approved media exists");
assert(cardMarkup.includes("content-card__placeholder-label"), "Placeholder must expose a category label");
assert(!cardMarkup.includes("data:image/svg+xml"), "Placeholder must NOT embed an auto-generated SVG (image generation was removed)");

const newsItem = contentItems.find((candidate) => candidate.content_type === "news");
if (newsItem) {
  const newsMarkup = renderToStaticMarkup(<ContentCard item={newsItem} href={`/news/${newsItem.slug}`} />);
  assert(newsMarkup.includes("content-card__story-badge"), "News cards should render a story badge");
  assert(!newsMarkup.includes("content-card__action-badge"), "News cards should not render action badges");
  assert(!newsMarkup.includes("content-card__score-meter"), "News cards should not render score meters");
}

const loadingMarkup = renderToStaticMarkup(<ContentCardLoading />);
assert(loadingMarkup.includes("content-card--loading"), "ContentCardLoading should expose loading class");
assert(loadingMarkup.includes("aria-busy=\"true\""), "ContentCardLoading should mark busy state");

const emptyMarkup = renderToStaticMarkup(<ContentCardEmpty title="暂无内容" description="稍后会显示已审核内容。" />);
assert(emptyMarkup.includes("暂无内容"), "ContentCardEmpty should render title");
assert(emptyMarkup.includes("稍后会显示已审核内容。"), "ContentCardEmpty should render description");

const errorMarkup = renderToStaticMarkup(<ContentCardError message="内容加载失败" />);
assert(errorMarkup.includes("内容加载失败"), "ContentCardError should render message");
assert(errorMarkup.includes("role=\"alert\""), "ContentCardError should render alert role");

console.log("content-card tests passed");

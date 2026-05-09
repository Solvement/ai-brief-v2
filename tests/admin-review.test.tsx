import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AppRouter } from "../src/AppRouter";
import { getQualityWarnings, publishContent, archiveContent, getReviewQueue } from "../src/lib/admin/review";
import { contentItems } from "../src/lib/content/seed";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const lowQuality = {
  ...contentItems[0],
  id: "draft-low-confidence",
  slug: "draft-low-confidence",
  status: "needs_review" as const,
  confidence_score: 42,
  key_facts: [],
  source_url: "",
  actionability_score: 88,
  next_steps: [],
};

const warnings = getQualityWarnings(lowQuality);
assert(warnings.some((warning) => warning.code === "low_confidence"), "low confidence content should warn");
assert(warnings.some((warning) => warning.code === "missing_source_url"), "missing source should warn");
assert(warnings.some((warning) => warning.code === "missing_key_facts"), "missing facts should warn");
assert(warnings.some((warning) => warning.code === "action_without_next_steps" || warning.code === "use_now_low_confidence"), "actionability mismatch should warn");

const queue = getReviewQueue([contentItems[0], lowQuality]);
assert(queue.length === 1 && queue[0].id === lowQuality.id, "review queue should show draft or needs_review items");
assert(publishContent(lowQuality).status === "needs_review", "low quality content should not publish");
assert(publishContent({ ...lowQuality, confidence_score: 80, source_url: "https://example.com", key_facts: ["fact"], actionability_score: 50 }).status === "published", "clean content can publish");
assert(archiveContent(lowQuality).status === "archived", "archive should set archived status");

const adminMarkup = renderToStaticMarkup(<AppRouter path="/admin/content" />);
assert(adminMarkup.includes("Content Review"), "admin content review page should render");
assert(adminMarkup.includes("live-only"), "admin content review page should not fabricate demo review rows");

import { liveCourseSources, liveFeedSources, liveProjectSources } from "../src/lib/ingestion/source-catalog";
import { columnSourceConfigs } from "../src/lib/ingestion/column-source-policy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const enabled = liveFeedSources.filter((source) => source.enabled);
const ids = new Set(enabled.map((source) => source.id));

for (const required of ["openai-models", "google-deepmind-models", "techcrunch-ai", "the-verge-ai", "wired-ai", "qbitai-news"]) {
  assert(ids.has(required), `live source catalog must include ${required}`);
}
for (const required of ["anthropic-models", "mistral-models", "meta-ai-models"]) {
  assert(
    columnSourceConfigs.some((source) => source.id === required && source.enabled && source.adapter === "web_index"),
    `official HTML index source catalog must include enabled ${required}`,
  );
}

assert(
  enabled.some((source) => source.source_type === "official" && source.reliability_level >= 4),
  "live source catalog must include high-reliability official sources",
);
assert(
  enabled.some((source) => source.language === "zh"),
  "live source catalog must include at least one Chinese source",
);
assert(
  enabled.every((source) => source.default_content_type === "news" || source.default_content_type === "model" || source.default_content_type === "article"),
  "feed sources should map only to news/model/article rows before LLM evaluation",
);

const projectIds = new Set(liveProjectSources.filter((source) => source.enabled).map((source) => source.id));
for (const required of ["github-trending-daily", "github-trending-weekly", "github-trending-monthly", "huggingface-trending-models", "huggingface-spaces"]) {
  assert(projectIds.has(required), `project source catalog must include ${required}`);
}
assert(
  liveProjectSources.some((source) => source.source_type === "github" && source.period === "daily"),
  "project sources must include GitHub Trending daily",
);
assert(
  liveProjectSources.some((source) => source.source_type === "github" && source.period === "weekly"),
  "project sources must include GitHub Trending weekly",
);
assert(
  liveProjectSources.some((source) => source.source_type === "github" && source.period === "monthly"),
  "project sources must include GitHub Trending monthly",
);
assert(
  liveProjectSources.some((source) => source.source_type === "community" && source.platform === "huggingface"),
  "project sources must include Hugging Face as a secondary project source",
);

const courseIds = new Set(liveCourseSources.filter((source) => source.enabled).map((source) => source.id));
for (const required of ["huggingface-llm-course", "microsoft-generative-ai-fundamentals"]) {
  assert(courseIds.has(required), `course source catalog must include ${required}`);
}
assert(
  !courseIds.has("deeplearning-ai-courses") && !courseIds.has("openai-academy") && !courseIds.has("fast-ai"),
  "course catalog homepages should stay disabled until concrete course parsing exists",
);
assert(
  liveCourseSources
    .filter((source) => source.enabled)
    .every((source) => /\/learn\/[^/?#]+|\/training\/(modules|paths|courses)\/[^/?#]+|\/short-courses\/[^/?#]+|course\.fast\.ai\/?$/i.test(source.url)),
  "enabled course sources must point at concrete course/module URLs",
);
assert(
  liveCourseSources.every((source) => source.source_type === "course"),
  "course sources should be explicitly marked as course sources",
);

console.log("live source catalog tests passed");

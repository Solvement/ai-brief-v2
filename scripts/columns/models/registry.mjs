export const MODEL_REGISTRY = Object.freeze([
  {
    id: "deepseek-v4",
    name: "DeepSeek-V4",
    vendor: "DeepSeek",
    country: "中国",
    kind: "open",
    hfId: "deepseek-ai/DeepSeek-V4-Pro",
    familySearch: "DeepSeek-V4",
    evalThirdPartyPending: ["LMArena", "OpenLLM Leaderboard"],
  },
  {
    id: "qwen",
    name: "Qwen3.6",
    vendor: "Alibaba",
    country: "中国",
    kind: "open",
    hfId: "Qwen/Qwen3.6-27B",
    familySearch: "Qwen3.6",
    evalThirdPartyPending: ["LMArena", "OpenLLM Leaderboard"],
  },
  // Llama / Mistral removed 2026-06-10 (Kevin): 模型栏只保留主流五家
  // (DeepSeek / Qwen / Google / Claude / GPT)。需要恢复时从 git 历史取回条目即可。
  {
    id: "openai-gpt",
    name: "OpenAI GPT",
    vendor: "OpenAI",
    country: "美国",
    kind: "closed",
    changelogUrl: "https://platform.openai.com/docs/changelog",
    // 2026-06-09 (same lesson as Anthropic/Fable 5): a single docs changelog lags — OpenAI flagship
    // launches land on openai.com/news FIRST. Multi-source union (highest version wins) closes the gap.
    // openai.com/news verified reachable + carries the newest GPT name (GPT-5.5) on 2026-06-09.
    releaseUrls: [
      "https://platform.openai.com/docs/changelog",
      "https://openai.com/news/",
    ],
    // 2026-06-09 regex hardening: the old "o[0-9][A-Za-z0-9.-]*" matched MINIFIED JS asset filenames
    // on openai.com (e.g. "O5jmM3eTioFPvNvL6Bx", "o9z4drghg2r.css") as if they were model versions.
    // Now the o-series arm is anchored: lowercase "o" + 1-2 digits + an OPTIONAL clean suffix
    // (-mini/-pro/-preview or a dotted version), and must NOT be followed by another letter/digit —
    // so real names (o1, o3-mini, o4) match but camelCase/hash junk does not. GPT arm restricts the
    // tail to a leading digit so brand words ("GPT-OSS") still need a version to register.
    // 2026-06-10 tightening: version = single-digit major + optional .minor (+optional letter, GPT-4o).
    // "[0-9][0-9A-Za-z.]*" let date/year digits ("GPT 2026") register as versions — same disease as
    // "Gemini 29" (a date fragment outranking the real flagship via numeric sort).
    releaseNamePattern: "\\bGPT[-\\s]?[0-9](?:\\.[0-9]+)?[a-z]?(?![A-Za-z0-9])|\\bo[0-9]{1,2}(?:[-\\s](?:mini|pro|preview))?(?:\\.[0-9]+)?\\b(?![A-Za-z0-9])",
    changelogTodo: "TODO(PM): verify this is the official model release-notes URL before wiring P3.",
  },
  {
    id: "anthropic-claude",
    name: "Claude",
    vendor: "Anthropic",
    country: "美国",
    kind: "closed",
    changelogUrl: "https://docs.claude.com/en/release-notes/overview",
    // 2026-06-09 lesson (Fable 5 missed on release day): flagship releases land on anthropic.com/news
    // FIRST — docs release-notes lagged. Check BOTH (multi-source union, highest version wins).
    releaseUrls: [
      "https://docs.claude.com/en/release-notes/overview",
      "https://www.anthropic.com/news",
    ],
    // 2026-06-09 lesson #2: old pattern hardcoded yesterday's family names (Opus|Sonnet|Haiku) —
    // "Fable 5" (new brand, no Claude prefix) and "Claude Mythos 5" (new family word) were invisible.
    // Now: "Claude <anyWord>? <ver>" + standalone brand-word list (extend list on new brands).
    // 2026-06-10 tightening: "[0-9][0-9.]*" matched year/date digits ("Claude 2026"). Claude versions
    // have single-digit majors (4.8, 5) — restrict to that; revisit if a two-digit major ever ships.
    releaseNamePattern: "\\bClaude\\s+(?:[A-Za-z]+\\s+)?[0-9](?:\\.[0-9]+)?(?![0-9])|\\b(?:Opus|Sonnet|Haiku|Fable|Mythos)\\s+[0-9](?:\\.[0-9]+)?(?![0-9])",
    changelogTodo: "TODO(PM): verify this is the official model release-notes URL before wiring P3.",
  },
  {
    id: "google-gemini",
    name: "Gemini",
    vendor: "Google DeepMind",
    country: "美国",
    kind: "closed",
    changelogUrl: "https://ai.google.dev/gemini-api/docs/changelog",
    // 2026-06-09 (same lesson as Anthropic/Fable 5): the API docs changelog lags the model launch page.
    // Multi-source union, highest version wins. Verified 2026-06-09: deepmind.google/models/gemini
    // carried "Gemini 3.5 Flash" (a variant) while the api changelog's newest was just "Gemini 3.5";
    // blog.google/products/gemini also confirms 3.5. All three reachable, union covers launch-day lag.
    releaseUrls: [
      "https://ai.google.dev/gemini-api/docs/changelog",
      "https://deepmind.google/models/gemini/",
      "https://blog.google/products/gemini/",
    ],
    // Variant words extended (Ultra/Nano) so a new tier word can't make the flagship invisible the way
    // a missing brand word hid Fable 5. Hyphen/space tolerant between number and tier.
    // 2026-06-10 tightening: "[0-9][0-9.]*" matched "Gemini 29" out of changelog date text
    // ("Gemini · 29 May ...") and the numeric sort crowned it (29 > 3.5). Gemini versions have
    // single-digit majors (1.5/2.0/3.5) — restrict to that; revisit if a two-digit major ever ships.
    releaseNamePattern: "\\bGemini[\\s-]*[0-9](?:\\.[0-9]+)?(?:[\\s-]*(?:Pro|Flash-Lite|Flash|Ultra|Nano))?(?![0-9])",
    changelogTodo: "TODO(PM): verify this is the official model release-notes URL before wiring P3.",
  },
]);

export function listModelConfigs({ kind } = {}) {
  return MODEL_REGISTRY.filter((model) => !kind || model.kind === kind);
}

export function getModelConfig(id) {
  return MODEL_REGISTRY.find((model) => model.id === id) || null;
}

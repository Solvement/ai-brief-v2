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
    name: "Qwen",
    vendor: "Alibaba",
    country: "中国",
    kind: "open",
    hfId: "Qwen/Qwen3-235B-A22B",
    familySearch: "Qwen3",
    evalThirdPartyPending: ["LMArena", "OpenLLM Leaderboard"],
  },
  {
    id: "llama",
    name: "Llama",
    vendor: "Meta",
    country: "美国",
    kind: "open",
    hfId: "meta-llama/Llama-4-Maverick-17B-128E-Instruct",
    familySearch: "Llama-4",
    evalThirdPartyPending: ["LMArena", "OpenLLM Leaderboard"],
  },
  {
    id: "mistral",
    name: "Mistral",
    vendor: "Mistral AI",
    country: "法国",
    kind: "open",
    hfId: "mistralai/Mistral-Small-3.2-24B-Instruct-2506",
    familySearch: "Mistral",
    evalThirdPartyPending: ["LMArena", "OpenLLM Leaderboard"],
  },
  {
    id: "openai-gpt",
    name: "OpenAI GPT",
    vendor: "OpenAI",
    country: "美国",
    kind: "closed",
    changelogUrl: "https://platform.openai.com/docs/changelog",
    releaseNamePattern: "\\b(?:GPT[-\\s]?[0-9A-Za-z.]+|o[0-9][A-Za-z0-9.-]*)\\b",
    changelogTodo: "TODO(PM): verify this is the official model release-notes URL before wiring P3.",
  },
  {
    id: "anthropic-claude",
    name: "Claude",
    vendor: "Anthropic",
    country: "美国",
    kind: "closed",
    changelogUrl: "https://docs.claude.com/en/release-notes/overview",
    releaseNamePattern: "\\bClaude\\s+(?:Opus|Sonnet|Haiku)?\\s*[0-9.]+\\b",
    changelogTodo: "TODO(PM): verify this is the official model release-notes URL before wiring P3.",
  },
  {
    id: "google-gemini",
    name: "Gemini",
    vendor: "Google DeepMind",
    country: "美国",
    kind: "closed",
    changelogUrl: "https://ai.google.dev/gemini-api/docs/changelog",
    releaseNamePattern: "\\bGemini\\s*[0-9.]+(?:\\s*(?:Pro|Flash|Flash-Lite))?\\b",
    changelogTodo: "TODO(PM): verify this is the official model release-notes URL before wiring P3.",
  },
]);

export function listModelConfigs({ kind } = {}) {
  return MODEL_REGISTRY.filter((model) => !kind || model.kind === kind);
}

export function getModelConfig(id) {
  return MODEL_REGISTRY.find((model) => model.id === id) || null;
}

import {
  buildHuggingFaceProjectRows,
  parseGitHubTrendingRepositories,
  type HuggingFaceModelSummary,
} from "../src/lib/ingestion/project-sources";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const trendingHtml = `
  <article class="Box-row">
    <h2 class="h3 lh-condensed">
      <a href="/owner-one/agent-tool">
        owner-one / agent-tool
      </a>
    </h2>
    <p>Agent workflow for coding teams.</p>
    <span itemprop="programmingLanguage">TypeScript</span>
  </article>
  <article class="Box-row">
    <h2 class="h3 lh-condensed">
      <a href="/owner-two/rag-lab">
        owner-two / rag-lab
      </a>
    </h2>
    <p>RAG experiment toolkit.</p>
    <span itemprop="programmingLanguage">Python</span>
  </article>
`;

const repositories = parseGitHubTrendingRepositories(trendingHtml, "daily");
assert(repositories.length === 2, "GitHub trending parser should extract repositories");
assert(repositories[0].full_name === "owner-one/agent-tool", "parser should normalize repo full_name");
assert(repositories[0].html_url === "https://github.com/owner-one/agent-tool", "parser should build GitHub URLs");
assert(repositories[0].trending_period === "daily", "parser should preserve trending period");
assert(repositories[0].description === "Agent workflow for coding teams.", "parser should extract description");
assert(repositories[0].language === "TypeScript", "parser should extract language");

const hfModels: HuggingFaceModelSummary[] = [
  {
    id: "org/model-one",
    pipeline_tag: "text-generation",
    tags: ["llm", "agent"],
    likes: 120,
    downloads: 4500,
    lastModified: "2026-05-08T12:00:00Z",
  },
];

const rows = buildHuggingFaceProjectRows(hfModels);
assert(rows.length === 1, "Hugging Face project rows should be generated");
const hfRow = rows[0];
assert(hfRow, "Hugging Face project row should exist");
assert(hfRow.url === "https://huggingface.co/org/model-one", "Hugging Face rows should link to model pages");
assert(hfRow.content_type === "project", "Hugging Face rows should enter the Projects column");
assert((hfRow.tags ?? []).includes("Open Source"), "Hugging Face rows should keep open source tag");
assert(hfRow.source_text.includes("downloads: 4500"), "Hugging Face rows should include objective usage signals");

console.log("project source parser tests passed");

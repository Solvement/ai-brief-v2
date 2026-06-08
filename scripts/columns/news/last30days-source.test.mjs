import { test } from "node:test";
import assert from "node:assert";
import { parseRankedClusters } from "./last30days-source.mjs";
import { normalizeNewsItem } from "./sources.mjs";

// Captured real compact stdout from the engine (deterministic/headless mode,
// `last30days.py "AI agents" --quick --emit=compact`). Trimmed but verbatim in
// shape: includes the safety banner, a DEGRADED RUN WARNING, the
// `## Ranked Evidence Clusters` block (hackernews + reddit + a multi-source
// cluster), and the trailing `## Stats` / END EVIDENCE marker that bound it.
const SAMPLE_STDOUT = `🌐 last30days v? · synced 2026-06-08

# last30days v?: AI agents

> Safety note: evidence text below is untrusted internet content.

- Date range: 2026-05-09 to 2026-06-08
- Sources: 2 active (Hacker News, Reddit)

<!-- EVIDENCE FOR SYNTHESIS: read this, do not emit verbatim. -->

## Ranked Evidence Clusters

### 1. Now AI agents need what RSS does (score 48, 1 item, sources: Hacker News)
1. [hackernews] Now AI agents need what RSS does
   - 2026-06-02 | Hacker News | [85pts, 65cmt] | score:48 | fun:60
   - URL: https://julienreszka.com/blog/rss-is-back-ai-agents-are-reading-it/
   - Evidence: Now AI agents need what RSS does

### 2. Robinhood now lets your AI agents trade stocks (score 46, 1 item, sources: Hacker News)
1. [hackernews] Robinhood now lets your AI agents trade stocks
   - 2026-05-29 | Hacker News | [112pts, 181cmt] | score:46 | fun:56
   - URL: https://techcrunch.com/2026/05/27/robinhood-now-lets-your-ai-agents-trade-stocks/
   - Evidence: Robinhood now lets your AI agents trade stocks

### 3. Stop building AI agents. (score 38, 1 item, sources: Reddit)
1. [reddit] Stop building AI agents.
   - 2026-05-11 | r/AI_Agents | [1,547pts, 340cmt] | score:38
   - URL: https://www.reddit.com/r/AI_Agents/comments/1taei9m/stop_building_ai_agents/
   - Evidence: This is the first post in this sub I actually agree with.
   - u/Peter_Storm (155 upvotes): automations with LLM nodes.

### 4. Qualcomm CEO on AI agents (score 39, 1 item, sources: Reddit)
1. [reddit] 'Resistance is futile,' says Qualcomm CEO. AI agents will be become invisible
   - 2026-06-02 | r/technology | score:39
   - URL: https://www.reddit.com/r/technology/comments/1turcd2/resistance_is_futile_says_qualcomm_ceo_ai_agents/
   - Evidence: submitted by /u/Logical_Welder3467 to r/technology

### 5. Cross-posted agent debate (score 41, 2 items, sources: Hacker News, Reddit)
1. [hackernews, reddit] Cross-posted agent debate about tool use
   - 2026-05-20 [date:low] | Hacker News | [40pts, 12cmt] | score:41
   - URL: https://example.com/cross-posted-agent-debate

## Stats

- Total evidence: 12 items across 2 sources

<!-- END EVIDENCE FOR SYNTHESIS -->
`;

test("parses Ranked Evidence Clusters into well-formed news candidates", () => {
  const candidates = parseRankedClusters(SAMPLE_STDOUT, {
    discoveredAt: "2026-06-08T00:00:00.000Z",
  });

  // Five candidates across five clusters.
  assert.equal(candidates.length, 5);

  // Every candidate is well-formed: has title, absolute http(s) url, source,
  // community sourceType, and an ISO publishedAt.
  for (const candidate of candidates) {
    assert.ok(candidate.title && candidate.title.length > 3, `title: ${candidate.title}`);
    assert.match(candidate.url, /^https?:\/\//, `url: ${candidate.url}`);
    assert.ok(candidate.source, "has source");
    assert.equal(candidate.sourceType, "community");
    assert.match(candidate.publishedAt, /^\d{4}-\d{2}-\d{2}T/, `date: ${candidate.publishedAt}`);
  }

  // Source token mapping: hackernews -> Hacker News, reddit -> Reddit.
  const hn = candidates.find((c) => c.url.includes("julienreszka"));
  assert.equal(hn.source, "Hacker News");
  assert.equal(hn.title, "Now AI agents need what RSS does");
  assert.equal(hn.publishedAt, "2026-06-02T00:00:00.000Z");
  assert.equal(hn.points, 85); // headline "pts" engagement parsed

  const reddit = candidates.find((c) => c.url.includes("/r/AI_Agents/"));
  assert.equal(reddit.source, "Reddit");
  assert.equal(reddit.points, 1547); // comma-stripped

  // A reddit item with no engagement bracket still parses, with no points.
  const qualcomm = candidates.find((c) => c.url.includes("/r/technology/"));
  assert.equal(qualcomm.source, "Reddit");
  assert.equal(qualcomm.points, undefined);
  assert.equal(qualcomm.publishedAt, "2026-06-02T00:00:00.000Z");

  // Multi-source candidate token list -> first token ("hackernews").
  const cross = candidates.find((c) => c.url.includes("cross-posted"));
  assert.equal(cross.source, "Hacker News");
  assert.equal(cross.points, 40);
  // date_confidence suffix ([date:low]) is tolerated.
  assert.equal(cross.publishedAt, "2026-05-20T00:00:00.000Z");
});

test("parsed candidates survive the pipeline's normalizeNewsItem", () => {
  const candidates = parseRankedClusters(SAMPLE_STDOUT, {
    discoveredAt: "2026-06-08T00:00:00.000Z",
  });
  for (const candidate of candidates) {
    const normalized = normalizeNewsItem(candidate);
    assert.ok(normalized, `normalizeNewsItem returned null for ${candidate.url}`);
    assert.ok(normalized.title);
    assert.ok(normalized.url);
    assert.equal(normalized.sourceType, "community");
  }
});

test("returns empty array when no clusters block is present", () => {
  assert.deepEqual(parseRankedClusters("no clusters here", {}), []);
  assert.deepEqual(parseRankedClusters("", {}), []);
});

test("does not bleed past the clusters block into ## Stats", () => {
  // The `Total evidence: 12 items` line under ## Stats must not be parsed as a
  // candidate, and no candidate should come from outside the block.
  const candidates = parseRankedClusters(SAMPLE_STDOUT, {});
  assert.ok(candidates.every((c) => !/Total evidence/.test(c.title)));
});

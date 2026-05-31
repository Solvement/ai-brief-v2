import crypto from "node:crypto";

const UA = "ai-brief-papers-column/0.1 (kernel papers discovery)";
const DEFAULT_DISCOVER_LIMIT = 140;
const DEFAULT_EVIDENCE_MAX_CHARS = 18000;

const SOURCE_CONFIG = {
  huggingfaceDaily: { url: "https://huggingface.co/papers", limit: 45 },
  papersWithCodeTrending: { url: "https://paperswithcode.com/trending", limit: 45 },
  arxivMaxPerQuery: 18,
  openReviewVenues: [
    "ICLR.cc/2026/Conference",
    "ICML.cc/2026/Conference",
    "NeurIPS.cc/2025/Conference",
    "ICLR.cc/2025/Conference",
  ],
  aclEvents: [
    "https://aclanthology.org/events/acl-2025/",
    "https://aclanthology.org/events/emnlp-2025/",
    "https://aclanthology.org/events/naacl-2025/",
  ],
  cvfEvents: [
    "https://openaccess.thecvf.com/CVPR2025?day=all",
    "https://openaccess.thecvf.com/ICCV2025?day=all",
  ],
  companyResearchPages: [
    { source: "openai_research", company: "OpenAI", url: "https://openai.com/newsroom/research/", fallbackUrls: ["https://openai.com/sitemap.xml"] },
    { source: "anthropic_research", company: "Anthropic", url: "https://www.anthropic.com/research" },
    { source: "google_deepmind_blog", company: "Google DeepMind", url: "https://deepmind.google/discover/blog/" },
    { source: "meta_ai_blog", company: "Meta", url: "https://ai.meta.com/blog/" },
    { source: "microsoft_research_ai", company: "Microsoft", url: "https://www.microsoft.com/en-us/research/research-area/artificial-intelligence/" },
    { source: "nvidia_research", company: "NVIDIA", url: "https://research.nvidia.com/publications" },
  ],
};

const ARXIV_QUERIES = [
  {
    label: "agent harness engineering",
    maxResults: 80,
    query: 'all:"Agentic Harness Engineering" OR all:"AI Harness Engineering" OR all:"harness engineering" OR all:"agent harness" OR all:"agentic harness" OR all:"coding-agent harness" OR all:"harness safety" OR all:"HarnessAudit"',
  },
  {
    label: "terminal agents observability",
    maxResults: 45,
    query: 'all:"Terminal-Bench" OR all:"trajectory observability" OR all:"execution trace" OR all:"execution traces" OR all:"trace-based evaluation" OR all:"rollback" OR all:"self-improving coding agent" OR all:"agent skills"',
  },
  {
    label: "coding agents and SWE evals",
    maxResults: 35,
    query: 'all:"coding agent" OR all:"SWE-Bench" OR all:"Terminal-Bench" OR all:"software engineering agent" OR all:"debugging agent" OR all:"program repair agent"',
  },
  {
    label: "agents and tool use",
    maxResults: 24,
    query: 'all:"AI agent" OR all:"agentic" OR all:"tool use" OR all:"multi-agent"',
  },
  {
    label: "agent memory and RAG",
    maxResults: 24,
    query: 'all:"retrieval augmented generation" OR all:"RAG" OR all:"agent memory" OR all:"long-term memory"',
  },
  {
    label: "multimodal UI agents",
    maxResults: 18,
    query: 'all:"multimodal" AND (all:"GUI" OR all:"user interface" OR all:"vision language")',
  },
  {
    label: "eval reliability security",
    maxResults: 24,
    query: 'all:"LLM evaluation" OR all:"benchmark" OR all:"reliability" OR all:"LLM security"',
  },
  {
    label: "AIGC workflows",
    maxResults: 18,
    query: 'all:"video generation" OR all:"image generation" OR all:"AIGC workflow"',
  },
];

const FOCUS_TOPICS = [
  {
    label: "AI Agents",
    patterns: [/\bagents?\b/i, /\bautonomous\b/i, /\bweb agent\b/i, /\bcomputer use\b/i, /\bmulti-agent\b/i, /\bagentic\b/i],
  },
  {
    label: "Tool Use",
    patterns: [/\btool[- ]?use\b/i, /\bfunction calling\b/i, /\bAPI\b/i, /\btools?\b/i, /\bworkflow\b/i],
  },
  {
    label: "AI Coding / SWE Agents",
    patterns: [/\bSWE[- ]?Bench\b/i, /\bTerminal[- ]?Bench\b/i, /\bcoding agent\b/i, /\bsoftware engineering\b/i, /\bdebugg/i, /\bcode generation\b/i, /\bprogram repair\b/i],
  },
  {
    label: "Agent Harness / Observability",
    patterns: [/\bharness\b/i, /\bharness engineering\b/i, /\bagentic harness\b/i, /\bobservability\b/i, /\btrajectory\b/i, /\bexecution trace\b/i, /\bmiddleware\b/i, /\brollback\b/i, /\bself[- ]?improv/i],
  },
  {
    label: "RAG / Knowledge Systems",
    patterns: [/\bRAG\b/i, /\bretriev/i, /\bknowledge\b/i, /\bmemory\b/i, /\blong[- ]?term\b/i, /\bGraphRAG\b/i],
  },
  {
    label: "AIGC Image/Video/Product Workflows",
    patterns: [/\bimage generation\b/i, /\bvideo generation\b/i, /\bdiffusion\b/i, /\bgenerative media\b/i, /\bcreative workflow\b/i],
  },
  {
    label: "Multimodal UI",
    patterns: [/\bmultimodal\b/i, /\bGUI\b/i, /\buser interface\b/i, /\bUI\b/i, /\bvision-language\b/i, /\bVLM\b/i],
  },
  {
    label: "Evaluation / Benchmarks",
    patterns: [/\beval/i, /\bbenchmark/i, /\bleaderboard\b/i, /\bassessment\b/i, /\breliability\b/i],
  },
  {
    label: "LLM Security / Reliability",
    patterns: [/\bsecurity\b/i, /\bsafety\b/i, /\brobust/i, /\bhallucination\b/i, /\bjailbreak\b/i, /\btrustworthy\b/i],
  },
  {
    label: "Human-AI Interaction",
    patterns: [/\bhuman[- ]?AI\b/i, /\binteraction\b/i, /\buser study\b/i, /\bUX\b/i, /\bcollaboration\b/i],
  },
];

const CORE_JOB_RE = /\b(agentic|agent|harness|observability|trajectory|execution trace|middleware|rollback|self[- ]?improv|tool[- ]?use|function calling|coding agent|SWE[- ]?Bench|Terminal[- ]?Bench|software engineering|debugging|program repair|RAG|retrieval|memory|benchmark|evaluation|eval|security|reliability|workflow|pipeline|infrastructure|production|data preparation)\b/i;
const GENERIC_COMPANY_PAGE_RE = /\b(security and compliance|inside claude security|claude security|experimental tools|human-computer interaction|search & information retrieval|programming languages & software engineering|microsoft security|safety & eco|trust center)\b/i;
const AHE_STRONG_SIGNALS = [
  { label: "harness engineering", pattern: /\bharness engineering\b/i },
  { label: "agent harness", pattern: /\b(?:agent|agentic) harness(?:es)?\b/i },
  { label: "observability", pattern: /\bobservability\b/i },
  { label: "execution trace", pattern: /\bexecution traces?\b/i },
  { label: "trajectory", pattern: /\btrajector(?:y|ies)\b/i },
  { label: "rollback", pattern: /\brollback|revertible|regression[- ]?free\b/i },
  { label: "Terminal-Bench", pattern: /\bTerminal[- ]?Bench\b/i },
  { label: "self-improving coding agent", pattern: /\bself[- ]?improv(?:ing|ed)? coding agents?\b/i },
];

export async function discover(ctx = {}) {
  const options = ctx.options || {};
  const limit = numberOption(options.limit, DEFAULT_DISCOVER_LIMIT);
  const discoveredAt = nowIso(options);

  if (isOffline(options)) {
    return options.noCache ? [] : cachedCandidates(options.db, { limit });
  }

  const discoveryTrace = [];
  const batches = [];
  const adapters = [
    {
      name: "Hugging Face Daily Papers",
      run: () => runDiscoveryTrace(discoveryTrace, {
        source: "huggingface_daily",
        sourceName: "Hugging Face Daily Papers",
        queryLabel: "daily papers",
        query: SOURCE_CONFIG.huggingfaceDaily.url,
        requestedLimit: SOURCE_CONFIG.huggingfaceDaily.limit,
        sourceSignals: ["Hugging Face Daily Papers"],
      }, () => discoverHuggingFaceDaily(options), ctx.logger),
    },
    {
      name: "Papers with Code trending",
      run: () => runDiscoveryTrace(discoveryTrace, {
        source: "papers_with_code_trending",
        sourceName: "Papers with Code trending",
        queryLabel: "trending",
        query: SOURCE_CONFIG.papersWithCodeTrending.url,
        requestedLimit: SOURCE_CONFIG.papersWithCodeTrending.limit,
        sourceSignals: ["Papers with Code trending"],
      }, () => discoverPapersWithCodeTrending(options), ctx.logger),
    },
    { name: "arXiv filtered search", run: () => discoverArxivFiltered(discoveryTrace, options, ctx.logger) },
    { name: "OpenReview selected venues", run: () => discoverOpenReview(discoveryTrace, options, ctx.logger) },
    { name: "ACL Anthology", run: () => discoverAclAnthology(discoveryTrace, options, ctx.logger) },
    { name: "CVF Open Access", run: () => discoverCvfOpenAccess(discoveryTrace, options, ctx.logger) },
    { name: "company research blogs", run: () => discoverCompanyResearchBlogs(discoveryTrace, options, ctx.logger) },
  ];

  for (const adapter of adapters) {
    const items = await adapter.run();
    batches.push(...items);
    ctx.logger?.log?.(`[papers:discover] ${adapter.name}: ${items.length}`);
  }

  const enriched = await enrichArxivCandidates(mergeCandidates(batches), { options, logger: ctx.logger });
  const papers = mergeCandidates(enriched)
    .filter(focusMatches)
    .sort((left, right) => discoveryPriorityScore(right) - discoveryPriorityScore(left) || dateValue(right.updatedAt || right.publishedAt) - dateValue(left.updatedAt || left.publishedAt))
    .slice(0, limit);

  const candidates = papers.map((paper) => toKernelCandidate(paper, { discoveredAt }));
  if (ctx.state && typeof ctx.state === "object") ctx.state.paperDiscoveryTrace = discoveryTrace;
  if (options.db) {
    for (const candidate of candidates) options.db.upsertCandidate(candidate);
  }
  return candidates;
}

export async function collectEvidence(candidate, ctx = {}) {
  const options = ctx.options || {};
  const offline = isOffline(options);
  const cached = cachedEvidence(options.db, candidate?.id);
  if (offline && cached) return cached;

  let paper = finalizeCandidate(candidate?.raw || candidate || {});
  if (!offline && paper.arxivId) {
    try {
      const [enriched] = await enrichArxivCandidates([paper], { options, logger: ctx.logger });
      paper = enriched || paper;
    } catch (error) {
      ctx.logger?.warn?.(`arXiv evidence failed ${paper.arxivId}: ${error.message}`);
    }
  }

  let sourceText = "";
  if (!offline && shouldFetchSourcePage(paper)) {
    try {
      sourceText = await fetchSourcePageText(paper.sourceUrl || paper.paperUrl, options);
    } catch (error) {
      ctx.logger?.warn?.(`paper source fetch failed ${paper.sourceUrl || paper.paperUrl}: ${error.message}`);
    }
  }

  const evidence = paperEvidence(candidate?.id || kernelPaperId(paper), paper, {
    sourceText,
    fetchedAt: nowIso(options),
    maxChars: numberOption(options.paperTextMaxChars, DEFAULT_EVIDENCE_MAX_CHARS),
  });

  if (!evidence.content && cached) return cached;
  if (options.db) options.db.upsertEvidence(evidence);
  return evidence;
}

export function isOffline(options = {}, env = process.env) {
  return Boolean(
    options.dryRun ||
    options.noLlm ||
    env.NO_LLM === "1" ||
    env.AI_BRIEF_OFFLINE === "1",
  );
}

async function discoverHuggingFaceDaily(options) {
  const html = await fetchText(SOURCE_CONFIG.huggingfaceDaily.url, { retries: 1, options });
  return parseHfStylePapers(html, "huggingface_daily", "Hugging Face Daily Papers", SOURCE_CONFIG.huggingfaceDaily.url, SOURCE_CONFIG.huggingfaceDaily.limit);
}

async function discoverPapersWithCodeTrending(options) {
  const html = await fetchText(SOURCE_CONFIG.papersWithCodeTrending.url, { retries: 1, options });
  return parseHfStylePapers(html, "papers_with_code_trending", "Papers with Code trending", SOURCE_CONFIG.papersWithCodeTrending.url, SOURCE_CONFIG.papersWithCodeTrending.limit);
}

async function discoverArxivFiltered(trace = [], options = {}, logger = console) {
  const all = [];
  for (const item of ARXIV_QUERIES) {
    const query = typeof item === "string" ? item : item.query;
    const label = typeof item === "string" ? "filtered search" : item.label;
    const maxResults = typeof item === "string" ? SOURCE_CONFIG.arxivMaxPerQuery : (item.maxResults || SOURCE_CONFIG.arxivMaxPerQuery);
    all.push(...await runDiscoveryTrace(trace, {
      source: "arxiv_filtered",
      sourceName: "arXiv filtered search",
      queryLabel: label,
      query,
      requestedLimit: maxResults,
      sourceSignals: ["arXiv", `arXiv query:${label}`],
    }, () => fetchArxivQuery(query, maxResults, label, options), logger));
    await sleep(numberOption(options.arxivDelayMs, 1300));
  }
  return all;
}

async function fetchArxivQuery(query, maxResults, label, options = {}) {
  const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(query)}&sortBy=submittedDate&sortOrder=descending&start=0&max_results=${maxResults}`;
  const xml = await fetchText(url, { retries: 2, timeoutMs: numberOption(options.arxivTimeoutMs, 30000), options });
  const parsed = parseAtomEntries(xml, "arxiv_filtered", `arXiv ${label}`).map((candidate) => finalizeCandidate({
    ...candidate,
    sourceSignals: unique([...(candidate.sourceSignals || []), `arXiv query:${label}`]),
  }));
  return {
    rawCandidateCount: parsed.length,
    items: parsed.filter(focusMatches),
  };
}

async function enrichArxivCandidates(candidates, { options = {}, logger = console } = {}) {
  const ids = unique(candidates.map((item) => baseArxivId(item.arxivId)).filter(Boolean));
  const byId = new Map();
  for (let i = 0; i < ids.length; i += 35) {
    const chunk = ids.slice(i, i + 35);
    if (chunk.length === 0) continue;
    try {
      const url = `https://export.arxiv.org/api/query?id_list=${chunk.join(",")}`;
      const xml = await fetchText(url, { retries: 2, timeoutMs: numberOption(options.arxivTimeoutMs, 30000), options });
      for (const item of parseAtomEntries(xml, "arxiv_metadata", "arXiv metadata")) {
        byId.set(baseArxivId(item.arxivId), item);
      }
      await sleep(numberOption(options.arxivDelayMs, 1300));
    } catch (error) {
      logger?.warn?.(`[papers:discover] arXiv metadata failed: ${error.message}`);
    }
  }

  return candidates.map((candidate) => {
    const arxivId = baseArxivId(candidate.arxivId);
    const meta = arxivId ? byId.get(arxivId) : null;
    if (!meta) return candidate;
    return finalizeCandidate({
      ...candidate,
      authors: candidate.authors?.length ? candidate.authors : meta.authors,
      abstract: candidate.abstract || meta.abstract,
      publishedAt: candidate.publishedAt || meta.publishedAt,
      updatedAt: candidate.updatedAt || meta.updatedAt,
      pdfUrl: candidate.pdfUrl || meta.pdfUrl,
      tags: unique([...(candidate.tags || []), ...(meta.tags || [])]),
      sourceSignals: unique([...(candidate.sourceSignals || []), "arXiv metadata"]),
    });
  });
}

async function discoverOpenReview(trace = [], options = {}, logger = console) {
  const all = [];
  for (const venue of SOURCE_CONFIG.openReviewVenues) {
    const url = `https://api2.openreview.net/notes?content.venueid=${encodeURIComponent(venue)}&limit=50`;
    const items = await runDiscoveryTrace(trace, {
      source: "openreview_selected_venues",
      sourceName: "OpenReview selected venues",
      queryLabel: venue,
      query: venue,
      requestedLimit: 50,
      sourceSignals: ["OpenReview", venue],
    }, async () => {
      const json = JSON.parse(await fetchText(url, { retries: 1, options }));
      const venueCandidates = [];
      for (const note of json.notes || []) {
        const content = note.content || {};
        const title = cleanTitle(openReviewValue(content.title) || "");
        if (!title) continue;
        const abstract = stripTags(openReviewValue(content.abstract) || "");
        const authors = openReviewValue(content.authors) || [];
        const venueText = openReviewValue(content.venue) || venue;
        const candidate = finalizeCandidate({
          title,
          authors: Array.isArray(authors) ? authors : [],
          abstract,
          source: "openreview_selected_venues",
          sourceName: "OpenReview selected venues",
          sourceUrl: `https://openreview.net/forum?id=${note.id || note.forum}`,
          venue: venueText,
          publishedAt: note.cdate ? new Date(note.cdate).toISOString() : "",
          updatedAt: note.mdate ? new Date(note.mdate).toISOString() : "",
          version: note.id || note.forum || "",
          sourceSignals: ["OpenReview", venue],
        });
        if (focusMatches(candidate)) venueCandidates.push(candidate);
      }
      return { rawCandidateCount: Array.isArray(json.notes) ? json.notes.length : venueCandidates.length, items: venueCandidates };
    }, logger);
    all.push(...items);
  }
  return all;
}

async function discoverAclAnthology(trace = [], options = {}, logger = console) {
  const all = [];
  const paperRe = /href=(\/20\d{2}\.[^/\s>]+?\.\d+\/)[^>]*>([^<]{12,260})<\/a>/g;
  for (const url of SOURCE_CONFIG.aclEvents) {
    const items = await runDiscoveryTrace(trace, {
      source: "acl_anthology",
      sourceName: "ACL Anthology",
      queryLabel: url.split("/").filter(Boolean).pop() || "acl-event",
      query: url,
      requestedLimit: 60,
      sourceSignals: ["ACL Anthology"],
    }, async () => {
      const html = await fetchText(url, { timeoutMs: 30000, retries: 1, options });
      let match;
      let rawCandidateCount = 0;
      const eventCandidates = [];
      while ((match = paperRe.exec(html))) {
        const title = cleanTitle(match[2]);
        if (!title || /^Proceedings of/i.test(title)) continue;
        rawCandidateCount += 1;
        const candidate = finalizeCandidate({
          title,
          source: "acl_anthology",
          sourceName: "ACL Anthology",
          sourceUrl: absoluteUrl(url, match[1]),
          paperUrl: absoluteUrl(url, match[1]),
          venue: "ACL Anthology",
          sourceSignals: ["ACL Anthology"],
        });
        if (focusMatches(candidate)) eventCandidates.push(candidate);
      }
      return { rawCandidateCount, items: eventCandidates };
    }, logger);
    all.push(...items);
  }
  return all.slice(0, 60);
}

async function discoverCvfOpenAccess(trace = [], options = {}, logger = console) {
  const all = [];
  const paperRe = /<dt class="ptitle">([\s\S]*?)<\/dt>/g;
  const linkRe = /<a href="([^"]+)">([\s\S]*?)<\/a>/i;
  for (const url of SOURCE_CONFIG.cvfEvents) {
    const items = await runDiscoveryTrace(trace, {
      source: "cvf_open_access",
      sourceName: "CVF Open Access",
      queryLabel: url.includes("ICCV") ? "ICCV 2025" : "CVPR 2025",
      query: url,
      requestedLimit: 60,
      sourceSignals: ["CVF Open Access"],
    }, async () => {
      const html = await fetchText(url, { timeoutMs: 30000, retries: 1, options });
      let match;
      let rawCandidateCount = 0;
      const eventCandidates = [];
      while ((match = paperRe.exec(html))) {
        const link = match[1].match(linkRe);
        if (!link) continue;
        const title = cleanTitle(link[2]);
        rawCandidateCount += 1;
        const candidate = finalizeCandidate({
          title,
          source: "cvf_open_access",
          sourceName: "CVF Open Access",
          sourceUrl: absoluteUrl(url, link[1]),
          paperUrl: absoluteUrl(url, link[1]),
          venue: url.includes("ICCV") ? "ICCV 2025" : "CVPR 2025",
          sourceSignals: ["CVF Open Access"],
        });
        if (focusMatches(candidate)) eventCandidates.push(candidate);
      }
      return { rawCandidateCount, items: eventCandidates };
    }, logger);
    all.push(...items);
  }
  return all.slice(0, 60);
}

async function discoverCompanyResearchBlogs(trace = [], options = {}, logger = console) {
  const all = [];
  for (const page of SOURCE_CONFIG.companyResearchPages) {
    const items = await runDiscoveryTrace(trace, {
      source: page.source,
      sourceName: `${page.company} research blog`,
      queryLabel: page.company,
      query: page.url,
      requestedLimit: 35,
      sourceSignals: [page.company, "company research blog"],
    }, async () => {
      const html = await fetchText(page.url, { retries: 1, options });
      const items = extractGenericLinks(html, page.url, page.source, `${page.company} research blog`, page.company);
      return { rawCandidateCount: items.length, items };
    }, logger);
    all.push(...items);

    for (const fallbackUrl of page.fallbackUrls || []) {
      const fallbackItems = await runDiscoveryTrace(trace, {
        source: page.source,
        sourceName: `${page.company} research sitemap fallback`,
        queryLabel: `${page.company} sitemap fallback`,
        query: fallbackUrl,
        requestedLimit: 35,
        sourceSignals: [page.company, "company research blog", "sitemap fallback"],
      }, async () => {
        const xml = await fetchText(fallbackUrl, { retries: 1, options });
        const items = extractSitemapResearchLinks(xml, page.source, `${page.company} research sitemap fallback`, page.company);
        return { rawCandidateCount: items.length, items };
      }, logger);
      all.push(...fallbackItems);
    }
  }
  return all;
}

function mergeCandidates(candidates) {
  const map = new Map();
  for (const item of candidates) {
    const candidate = finalizeCandidate(item);
    if (!candidate.title) continue;
    const existing = map.get(candidate.key);
    if (!existing) {
      map.set(candidate.key, candidate);
      continue;
    }
    map.set(candidate.key, finalizeCandidate({
      ...existing,
      authors: existing.authors?.length ? existing.authors : candidate.authors,
      abstract: existing.abstract && existing.abstract.length >= candidate.abstract.length ? existing.abstract : candidate.abstract,
      source: existing.source,
      sourceName: existing.sourceName,
      sourceUrl: existing.sourceUrl,
      paperUrl: existing.paperUrl || candidate.paperUrl,
      pdfUrl: existing.pdfUrl || candidate.pdfUrl,
      arxivId: existing.arxivId || candidate.arxivId,
      venue: existing.venue || candidate.venue,
      publishedAt: earliestDate(existing.publishedAt, candidate.publishedAt),
      updatedAt: latestDate(existing.updatedAt, candidate.updatedAt),
      version: latestDate(existing.updatedAt, candidate.updatedAt) || existing.version || candidate.version,
      codeUrl: existing.codeUrl || candidate.codeUrl,
      tags: unique([...(existing.tags || []), ...(candidate.tags || [])]),
      sourceSignals: unique([...(existing.sourceSignals || []), ...(candidate.sourceSignals || []), candidate.sourceName]),
    }));
  }
  return [...map.values()];
}

function parseHfStylePapers(html, source, sourceName, baseUrl, limit) {
  const out = [];
  const seen = new Set();
  const anchorRe = /href="(\/papers\/([^"?#]+))"[^>]*>([\s\S]{0,500}?)<\/a>/g;
  let match;
  while ((match = anchorRe.exec(html)) && out.length < limit) {
    const arxivId = normalizeArxivId(match[2]);
    const title = cleanTitle(match[3]);
    if (!arxivId || title.length < 8 || title.toLowerCase() === "view paper") continue;
    const key = `${arxivId}:${title.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(finalizeCandidate({
      title,
      arxivId,
      source,
      sourceName,
      sourceUrl: absoluteUrl(baseUrl, match[1]),
      paperUrl: `https://arxiv.org/abs/${baseArxivId(arxivId)}`,
      sourceSignals: [sourceName],
    }));
  }
  return out;
}

function parseAtomEntries(xml, source, sourceName) {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((match) => match[1]);
  return entries.map((entry) => {
    const id = getTag(entry, "id");
    const title = cleanTitle(getTag(entry, "title"));
    const abstract = stripTags(getTag(entry, "summary"));
    const authors = [...entry.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>\s*<\/author>/g)].map((match) => decodeEntities(match[1]).trim()).filter(Boolean);
    const publishedAt = getTag(entry, "published");
    const updatedAt = getTag(entry, "updated");
    const arxivId = normalizeArxivId(id);
    const pdfMatch = entry.match(/<link[^>]+title="pdf"[^>]+href="([^"]+)"/i);
    const categories = [...entry.matchAll(/<category[^>]+term="([^"]+)"/g)].map((match) => match[1]);
    return finalizeCandidate({
      title,
      authors,
      abstract,
      arxivId,
      source,
      sourceName,
      sourceUrl: arxivId ? `https://arxiv.org/abs/${baseArxivId(arxivId)}` : id,
      paperUrl: arxivId ? `https://arxiv.org/abs/${baseArxivId(arxivId)}` : id,
      pdfUrl: pdfMatch ? pdfMatch[1] : "",
      publishedAt,
      updatedAt,
      tags: categories,
      sourceSignals: [sourceName],
    });
  }).filter((candidate) => candidate.title);
}

function extractGenericLinks(html, baseUrl, source, sourceName, company) {
  const out = [];
  const seen = new Set();
  const linkRe = /<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]{0,500}?)<\/a>/gi;
  let match;
  while ((match = linkRe.exec(html)) && out.length < 35) {
    const href = match[1];
    const title = cleanTitle(match[2]);
    if (!title || title.length < 12 || title.length > 180) continue;
    const url = absoluteUrl(baseUrl, href);
    if (GENERIC_COMPANY_PAGE_RE.test(title)) continue;
    if (!isAllowedCompanyResearchUrl(company, url)) continue;
    if (!CORE_JOB_RE.test(title)) continue;
    const key = `${title.toLowerCase()}:${url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const candidate = finalizeCandidate({
      title,
      source,
      sourceName,
      sourceUrl: url,
      paperUrl: url,
      venue: `${company} research blog`,
      sourceSignals: [company, "company research blog"],
    });
    if (focusMatches(candidate)) out.push(candidate);
  }
  return out;
}

function extractSitemapResearchLinks(xml, source, sourceName, company) {
  const out = [];
  const seen = new Set();
  const locRe = /<loc>([\s\S]*?)<\/loc>/gi;
  let match;
  while ((match = locRe.exec(xml)) && out.length < 35) {
    const url = decodeEntities(match[1]).trim();
    if (!url || seen.has(url)) continue;
    if (!isAllowedCompanyResearchUrl(company, url)) continue;
    const title = titleFromResearchUrl(url, company);
    if (!CORE_JOB_RE.test(`${title} ${url}`)) continue;
    seen.add(url);
    const candidate = finalizeCandidate({
      title,
      source,
      sourceName,
      sourceUrl: url,
      paperUrl: url,
      venue: `${company} research blog`,
      sourceSignals: [company, "company research blog", "sitemap fallback"],
    });
    if (focusMatches(candidate)) out.push(candidate);
  }
  return out;
}

function titleFromResearchUrl(url, company) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const slug = parts[parts.length - 1] || parts[parts.length - 2] || company;
    return decodeEntities(slug)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .replace(/\s+/g, " ")
      .trim();
  } catch {
    return company;
  }
}

function openReviewValue(value) {
  if (value && typeof value === "object" && "value" in value) return value.value;
  return value;
}

function toKernelCandidate(paper, { discoveredAt }) {
  const raw = finalizeCandidate({ ...paper, discoveredAt: paper.discoveredAt || discoveredAt });
  return {
    id: kernelPaperId(raw),
    column: "papers",
    source: raw.source || "papers",
    raw,
    dedupeKey: raw.key || paperKey(raw),
    discoveredAt: raw.discoveredAt || discoveredAt,
  };
}

function kernelPaperId(paper) {
  const id = paper?.id || candidateId(paper || {});
  return id.startsWith("paper:") ? id : `paper:${id}`;
}

function makeCandidate(input = {}) {
  const title = cleanTitle(input.title);
  const arxivId = normalizeArxivId(input.arxivId || input.paperUrl || input.sourceUrl || "");
  const sourceUrl = input.sourceUrl || input.paperUrl || "";
  return {
    ...input,
    id: input.id || "",
    key: input.key || "",
    title,
    authors: normalizeStringArray(input.authors),
    abstract: input.abstract || "",
    source: input.source || "",
    sourceName: input.sourceName || input.source || "",
    sourceUrl,
    paperUrl: input.paperUrl || (arxivId ? `https://arxiv.org/abs/${baseArxivId(arxivId)}` : sourceUrl),
    pdfUrl: input.pdfUrl || "",
    arxivId: arxivId || "",
    venue: input.venue || "",
    publishedAt: input.publishedAt || "",
    updatedAt: input.updatedAt || input.publishedAt || "",
    discoveredAt: input.discoveredAt || new Date().toISOString(),
    version: input.version || arxivId || input.updatedAt || input.publishedAt || "unknown",
    codeUrl: input.codeUrl || "",
    tags: normalizeStringArray(input.tags),
    sourceSignals: normalizeStringArray(input.sourceSignals),
  };
}

function finalizeCandidate(input = {}) {
  const candidate = makeCandidate(input);
  candidate.key = paperKey(candidate);
  candidate.id = candidate.id || candidateId(candidate);
  candidate.focusTopics = detectTopics(candidate).map((topic) => topic.label);
  return candidate;
}

function paperEvidence(candidateId, paper, { sourceText, fetchedAt, maxChars }) {
  const sections = [];
  const lines = [];

  appendSection(lines, sections, "Metadata", [
    `Title: ${paper.title}`,
    paper.authors?.length ? `Authors: ${paper.authors.join(", ")}` : "",
    paper.venue ? `Venue: ${paper.venue}` : "",
    paper.arxivId ? `arXiv: ${baseArxivId(paper.arxivId)}` : "",
    paper.publishedAt ? `Published: ${paper.publishedAt}` : "",
    paper.sourceName ? `Source: ${paper.sourceName}` : "",
    paper.sourceUrl ? `Source URL: ${paper.sourceUrl}` : "",
    paper.paperUrl && paper.paperUrl !== paper.sourceUrl ? `Paper URL: ${paper.paperUrl}` : "",
    paper.pdfUrl ? `PDF URL: ${paper.pdfUrl}` : "",
    paper.sourceSignals?.length ? `Source signals: ${paper.sourceSignals.join(", ")}` : "",
    paper.focusTopics?.length ? `Focus topics: ${paper.focusTopics.join(", ")}` : "",
  ].filter(Boolean).join("\n"));

  if (paper.abstract) appendSection(lines, sections, "Abstract", paper.abstract);
  if (sourceText) appendSection(lines, sections, "Source page text", sourceText);

  const content = lines.join("\n\n").slice(0, maxChars);
  return {
    candidateId,
    kind: "paper-text",
    content,
    sections,
    fetchedAt,
  };
}

function appendSection(lines, sections, heading, content) {
  const text = String(content || "").trim();
  if (!text) return;
  sections.push(heading);
  lines.push(`## ${heading}\n${text}`);
}

async function fetchSourcePageText(url, options = {}) {
  if (!url || /\.pdf(?:[?#]|$)/i.test(url)) return "";
  const html = await fetchText(url, {
    timeoutMs: numberOption(options.sourcePageTimeoutMs, 20000),
    retries: 1,
    options,
  });
  if (html.startsWith("%PDF")) return "";
  return stripTags(html).slice(0, numberOption(options.sourcePageMaxChars, 12000));
}

function shouldFetchSourcePage(paper) {
  const url = paper.sourceUrl || paper.paperUrl || "";
  if (!url || /\.pdf(?:[?#]|$)/i.test(url)) return false;
  if (/export\.arxiv\.org|arxiv\.org\/abs\//i.test(url) && paper.abstract) return false;
  return true;
}

function cachedCandidates(db, { limit }) {
  if (!db?.listCandidates) return [];
  try {
    return db.listCandidates({ column: "papers", limit });
  } catch {
    return [];
  }
}

function cachedEvidence(db, candidateId) {
  if (!db?.getEvidence || !candidateId) return null;
  try {
    return db.getEvidence(candidateId, "paper-text");
  } catch {
    return null;
  }
}

async function runDiscoveryTrace(trace, meta, fn, logger = console) {
  const startedAt = new Date().toISOString();
  const startedMs = Date.now();
  try {
    const result = await fn();
    const items = Array.isArray(result) ? result : result.items || [];
    pushDiscoveryTrace(trace, {
      ...meta,
      status: "ok",
      rawCandidateCount: result.rawCandidateCount === undefined ? items.length : result.rawCandidateCount,
      candidateCount: items.length,
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
    });
    return items;
  } catch (error) {
    pushDiscoveryTrace(trace, {
      ...meta,
      status: "failed",
      rawCandidateCount: 0,
      candidateCount: 0,
      failureReason: error.message || String(error),
      startedAt,
      finishedAt: new Date().toISOString(),
      durationMs: Date.now() - startedMs,
    });
    logger?.warn?.(`[papers:discover] ${meta.sourceName} failed${meta.queryLabel ? ` (${meta.queryLabel})` : ""}: ${error.message}`);
    return [];
  }
}

function pushDiscoveryTrace(trace, input) {
  if (!Array.isArray(trace)) return;
  const sourceSignals = unique(input.sourceSignals || [input.sourceName]);
  const entry = {
    source: input.source,
    sourceName: input.sourceName,
    queryLabel: input.queryLabel || input.sourceName,
    status: input.status,
    rawCandidateCount: Number(input.rawCandidateCount || 0),
    candidateCount: Number(input.candidateCount || 0),
    requestedLimit: Number(input.requestedLimit || 0),
    sourceSignals,
    failureReason: input.failureReason || "",
    startedAt: input.startedAt || "",
    finishedAt: input.finishedAt || new Date().toISOString(),
    durationMs: Number(input.durationMs || 0),
  };
  if (input.query) entry.query = input.query;
  trace.push(entry);
}

async function fetchText(url, { timeoutMs = 20000, retries = 1, options = {} } = {}) {
  const fetchImpl = options.fetch || fetch;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetchImpl(url, {
        headers: {
          "user-agent": options.userAgent || UA,
          accept: "text/html,application/atom+xml,application/json;q=0.9,*/*;q=0.8",
        },
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    } catch (error) {
      lastError = error;
      if (attempt < retries) await sleep(700 * (attempt + 1));
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError;
}

function getTag(text, tag) {
  const match = text.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeEntities(match[1].replace(/<!\[CDATA\[|\]\]>/g, "")).trim() : "";
}

function decodeEntities(text = "") {
  return String(text)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(text = "") {
  return decodeEntities(String(text).replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(base, href) {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

function cleanTitle(title) {
  return stripTags(title).replace(/\s+/g, " ").trim();
}

function normalizeArxivId(value = "") {
  const match = String(value).match(/(\d{4}\.\d{4,5})(v\d+)?/);
  return match ? `${match[1]}${match[2] || ""}` : null;
}

function baseArxivId(value = "") {
  const id = normalizeArxivId(value);
  return id ? id.replace(/v\d+$/, "") : null;
}

function paperKey(candidate) {
  const arxivId = baseArxivId(candidate.arxivId || candidate.paperUrl || candidate.sourceUrl || "");
  if (arxivId) return `arxiv:${arxivId}`;
  if (candidate.doi) return `doi:${String(candidate.doi).toLowerCase()}`;
  if (candidate.sourceUrl) return `url:${candidate.sourceUrl.toLowerCase().replace(/[?#].*$/, "")}`;
  return `title:${cleanTitle(candidate.title).toLowerCase()}`;
}

function candidateId(candidate) {
  const key = paperKey(candidate);
  return key.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase().slice(0, 80) || `paper-${hash(candidate.title)}`;
}

function hash(value) {
  return crypto.createHash("sha1").update(String(value || "")).digest("hex").slice(0, 12);
}

function detectTopics(candidate) {
  const text = `${candidate.title}\n${candidate.abstract}\n${candidate.tags.join(" ")}\n${candidate.venue}`.toLowerCase();
  return FOCUS_TOPICS.filter((topic) => topic.patterns.some((pattern) => pattern.test(text)));
}

function detectAheSignals(candidate) {
  const text = `${candidate.title}\n${candidate.abstract || ""}\n${candidate.tags?.join(" ") || ""}\n${candidate.venue || ""}\n${candidate.sourceSignals?.join(" ") || ""}`;
  return AHE_STRONG_SIGNALS.filter((signal) => signal.pattern.test(text)).map((signal) => signal.label);
}

function focusMatches(candidate) {
  return detectTopics(candidate).length > 0;
}

function discoveryPriorityScore(candidate) {
  const text = `${candidate.title}\n${candidate.abstract || ""}\n${candidate.venue || ""}\n${candidate.tags?.join(" ") || ""}`;
  const topicBoost = detectTopics(candidate).length * 10;
  const aheBoost = detectAheSignals(candidate).length * 12;
  const sourceBoost = sourceQuality(candidate);
  const recencyBoost = ageDays(candidate) <= 14 ? 12 : ageDays(candidate) <= 60 ? 8 : ageDays(candidate) <= 180 ? 4 : 0;
  const abstractBoost = candidate.abstract?.length > 120 ? 8 : 0;
  const coreBoost = CORE_JOB_RE.test(text) ? 8 : -8;
  return topicBoost + aheBoost + sourceBoost + recencyBoost + abstractBoost + coreBoost;
}

function sourceQuality(candidate) {
  const sourceText = `${candidate.source} ${candidate.sourceName} ${candidate.sourceSignals.join(" ")} ${candidate.venue}`;
  let score = 0;
  if (/OpenReview|ICLR|ICML|NeurIPS/i.test(sourceText)) score += 24;
  if (/ACL Anthology|CVF|CVPR|ICCV|EMNLP|NAACL/i.test(sourceText)) score += 18;
  if (/OpenAI|Anthropic|DeepMind|Meta|Microsoft|NVIDIA/i.test(sourceText)) score += 22;
  if (/Hugging Face|Papers with Code/i.test(sourceText)) score += 12;
  if (/arXiv/i.test(sourceText)) score += 8;
  return Math.min(score, 35);
}

function isAllowedCompanyResearchUrl(company, url) {
  if (company === "Microsoft") return /\/research\/publication\//i.test(url);
  if (company === "NVIDIA") return /\/publication\/20\d{2}/i.test(url);
  if (company === "Anthropic") return /anthropic\.com\/research\/[^/?#]+/i.test(url);
  if (company === "Google DeepMind") return /deepmind\.google\/discover\/blog\/[^/?#]+/i.test(url);
  if (company === "Meta") return /ai\.meta\.com\/blog\/[^/?#]+/i.test(url);
  if (company === "OpenAI") return /openai\.com\/(index|newsroom\/research)\//i.test(url);
  return /\/research\/publication\/|\/research\/[^/?#]+|\/blog\/[^/?#]+|\/publications?\/[^/?#]+/i.test(url);
}

function normalizeStringArray(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim()).filter(Boolean);
  if (value == null || value === "") return [];
  return [String(value).trim()].filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function earliestDate(a, b) {
  if (!a) return b || "";
  if (!b) return a || "";
  return Date.parse(a) <= Date.parse(b) ? a : b;
}

function latestDate(a, b) {
  if (!a) return b || "";
  if (!b) return a || "";
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

function ageDays(candidate) {
  const date = Date.parse(candidate.updatedAt || candidate.publishedAt || candidate.discoveredAt);
  if (!Number.isFinite(date)) return 90;
  return Math.max(0, (Date.now() - date) / 86400000);
}

function dateValue(value) {
  const parsed = Date.parse(value || "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function nowIso(options = {}) {
  return options.now?.() || new Date().toISOString();
}

function numberOption(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

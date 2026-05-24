const DEFAULT_USER_AGENT = "Mozilla/5.0 gh-trending-deepdive/0.5";

export async function fetchHtml(url, { userAgent = DEFAULT_USER_AGENT } = {}) {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html",
    },
  });
  if (!response.ok) throw new Error(`GET ${url} -> ${response.status}`);
  return response.text();
}

export function decodeEntities(value) {
  return String(value || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

export function stripTags(value) {
  return decodeEntities(String(value || "").replace(/<[^>]+>/g, ""))
    .replace(/\s+/g, " ")
    .trim();
}

export function parseTrendingHtml(html) {
  const repos = [];
  const rowPattern = /<article\b[^>]*class="[^"]*Box-row[^"]*"[^>]*>([\s\S]*?)<\/article>/g;
  let match;

  while ((match = rowPattern.exec(html))) {
    const block = match[1];
    const heading = block.match(/<h2[^>]*class="[^"]*lh-condensed[^"]*"[^>]*>[\s\S]*?<a[^>]*href="\/([^"/]+)\/([^"/?#]+)"/);
    if (!heading) continue;

    const owner = decodeEntities(heading[1]);
    const name = decodeEntities(heading[2]);
    if (!owner || !name) continue;

    let description = null;
    const descriptionMatch = block.match(/<p\b[^>]*class="[^"]*col-9[^"]*"[^>]*>([\s\S]*?)<\/p>/);
    if (descriptionMatch) description = stripTags(descriptionMatch[1]) || null;

    let language = null;
    const languageMatch = block.match(/<span\b[^>]*itemprop="programmingLanguage"[^>]*>\s*([^<]+)<\/span>/);
    if (languageMatch) language = decodeEntities(languageMatch[1].trim()) || null;

    let languageColor = null;
    const colorMatch = block.match(/<span\b[^>]*class="[^"]*repo-language-color[^"]*"[^>]*style="background-color:\s*([^"]+)"/);
    if (colorMatch) languageColor = colorMatch[1].trim();

    let stars = 0;
    let forks = 0;
    for (const token of block.matchAll(/<a\b[^>]*href="\/[^"/]+\/[^"/?#]+\/(stargazers|forks)"[^>]*>([\s\S]*?)<\/a>/g)) {
      const count = parseInt(stripTags(token[2]).replace(/[,\s]/g, ""), 10);
      if (Number.isFinite(count)) {
        if (token[1] === "stargazers") stars = count;
        if (token[1] === "forks") forks = count;
      }
    }

    let starsGained = 0;
    const gainedMatch = block.match(/<span\b[^>]*?class="[^"]*float-sm-right[^"]*"[^>]*>([\s\S]*?)<\/span>/);
    if (gainedMatch) {
      const text = stripTags(gainedMatch[1]);
      const numberMatch = text.match(/([\d,]+)\s+stars?\s+(?:today|this\s+week|this\s+month)/i);
      if (numberMatch) starsGained = parseInt(numberMatch[1].replace(/,/g, ""), 10) || 0;
    }

    repos.push({
      fullName: `${owner}/${name}`,
      owner,
      name,
      url: `https://github.com/${owner}/${name}`,
      ownerAvatarUrl: `https://github.com/${owner}.png?size=80`,
      description,
      language,
      languageColor,
      stars,
      forks,
      starsGained,
    });
  }

  return repos;
}

export async function scrapeTrendingBoard(window, { limit = 15, userAgent = DEFAULT_USER_AGENT } = {}) {
  const html = await fetchHtml(`https://github.com/trending?since=${window}`, { userAgent });
  return parseTrendingHtml(html).slice(0, limit);
}

export async function fetchGitHubReadme(owner, name, {
  githubToken = process.env.GITHUB_TOKEN,
  userAgent = DEFAULT_USER_AGENT,
  maxChars = 14000,
} = {}) {
  const headers = {
    accept: "application/vnd.github.raw",
    "user-agent": userAgent,
  };
  if (githubToken) headers.authorization = `Bearer ${githubToken}`;

  const response = await fetch(`https://api.github.com/repos/${owner}/${name}/readme`, { headers });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`README ${owner}/${name} -> ${response.status}`);
  return (await response.text()).slice(0, maxChars);
}

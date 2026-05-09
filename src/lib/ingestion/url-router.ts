export interface GitHubRepoRef {
  owner: string;
  repo: string;
}

export function parseGitHubRepoUrl(url: string): GitHubRepoRef | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== "github.com" && parsed.hostname !== "www.github.com") return null;
    const [owner, repo] = parsed.pathname.split("/").filter(Boolean);
    if (!owner || !repo) return null;
    return { owner, repo: repo.replace(/\.git$/i, "") };
  } catch {
    return null;
  }
}

import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const errors = [];
const suspiciousPatterns = [
  { label: "unicode replacement character", regex: /\uFFFD/g },
  // `??` is the JS/TS nullish-coalescing operator — legit in code (skip .ts/.tsx).
  // In data files a run of "?" is mojibake only when "?" stood in for a lost
  // non-ASCII glyph — detectable because CJK text sits right beside the run. A pure
  // ASCII headline like "...Gemma 4 model confirmed??" is rhetorical punctuation,
  // not encoding loss, so don't false-positive on it. Runs of 4+ "?" are flagged
  // regardless (natural language never stacks that many question marks).
  {
    label: "double question marks",
    regex: /\?{2,}/g,
    skipExtensions: [".ts", ".tsx"],
    isMojibake: (raw, index, match) => {
      if (match.length >= 4) return true;
      const around = raw.slice(Math.max(0, index - 16), index + match.length + 16);
      return /[　-鿿豈-﫿가-힯]/.test(around);
    },
  },
  { label: "common UTF-8 mojibake sequence (Ã)", regex: /Ã[A-Za-z0-9]/g },
  { label: "common UTF-8 mojibake sequence (â)", regex: /â[€œ\`\“]/g },
  { label: "common UTF-8 mojibake sequence (Â)", regex: /Â(?:\u00a0|[A-Za-z])/g },
  { label: "surrogate/zero-width/BOM marker", regex: /\uFEFF/g },
  { label: "replacement run", regex: /�{2,}/g },
];

const scanRoots = [
  { dir: path.resolve("public/data"), extensions: [".json"] },
  { dir: path.resolve("data/papers"), extensions: [".json"] },
  { dir: path.resolve("data/agent-memory"), extensions: [".json"] },
  { dir: path.resolve("src"), extensions: [".ts", ".tsx"] },
];

async function collectFiles(dir, extensions) {
  const out = [];
  let entries = [];
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return out;
    throw error;
  }
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...await collectFiles(file, extensions));
    else if (extensions.includes(path.extname(entry.name))) out.push(file);
  }
  return out;
}

const files = [];
for (const root of scanRoots) {
  files.push(...await collectFiles(root.dir, root.extensions));
}

for (const filePath of files) {
  const raw = await readFile(filePath, "utf8");

  const ext = path.extname(filePath);
  for (const entry of suspiciousPatterns) {
    if (entry.skipExtensions?.includes(ext)) continue;
    let matches = [...raw.matchAll(entry.regex)];
    if (entry.isMojibake) matches = matches.filter((m) => entry.isMojibake(raw, m.index, m[0]));
    if (matches.length === 0) continue;
    for (const match of matches.slice(0, 10)) {
      const start = Math.max(0, match.index - 40);
      const end = Math.min(raw.length, match.index + 80);
      const excerpt = raw.slice(start, end).replace(/\s+/g, " ");
      errors.push(`${filePath}: ${entry.label} near offset ${match.index}: ${excerpt}`);
    }
    if (matches.length > 10) {
      errors.push(`${filePath}: ${matches.length - 10} more ${entry.label} occurrences`);
    }
  }
}

if (errors.length > 0) {
  throw new Error(`text encoding validation failed:\n${errors.join("\n")}`);
}

console.log("text encoding validation passed");

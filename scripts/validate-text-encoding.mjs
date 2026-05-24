import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const errors = [];
const suspiciousPatterns = [
  { label: "unicode replacement character", regex: /\uFFFD/g },
  { label: "double question marks", regex: /\?{2,}/g },
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

  for (const entry of suspiciousPatterns) {
    const matches = [...raw.matchAll(entry.regex)];
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

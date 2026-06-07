import { readdir, readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const sourceRoots = [
  fileURLToPath(new URL("../app", import.meta.url)),
  fileURLToPath(new URL("../src", import.meta.url)),
];
const violations = [];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(path);
      continue;
    }
    if (![".ts", ".tsx"].includes(extname(entry.name))) {
      continue;
    }
    const text = await readFile(path, "utf8");
    if (text.includes("console.log")) {
      violations.push(`${path}: console.log is not allowed in source files`);
    }
    if (path.includes(`${join("src", "components")}`) && text.includes("const mock")) {
      violations.push(`${path}: mock data belongs in fixtures or generated data files, not UI components`);
    }
  }
}

for (const sourceRoot of sourceRoots) {
  await walk(sourceRoot);
}

if (violations.length > 0) {
  throw new Error(violations.join("\n"));
}

console.log("lint validation passed");

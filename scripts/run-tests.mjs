import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const testsDir = ".tmp/test-build/tests";
const files = (await readdir(testsDir)).filter((file) => file.endsWith(".test.js")).sort();

for (const file of files) {
  const testModule = await import(pathToFileURL(join(process.cwd(), testsDir, file)).href);
  if (testModule.default && typeof testModule.default.then === "function") {
    await testModule.default;
  }
}

console.log(`ran ${files.length} test files`);

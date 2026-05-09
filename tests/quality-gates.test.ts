// Use Node's built-in `node:fs` for clarity instead of relying on globals.
import { existsSync, readFileSync } from "node:fs";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };

for (const script of ["typecheck", "lint", "test", "validate", "validate:content", "validate:evaluation", "validate:playbook"]) {
  assert(packageJson.scripts[script], `package.json should define ${script}`);
}

assert(existsSync(".github/workflows/quality.yml"), "quality GitHub Actions workflow should exist");
const workflow = readFileSync(".github/workflows/quality.yml", "utf8");
for (const command of ["npm run typecheck", "npm run lint", "npm test", "npm run validate"]) {
  assert(workflow.includes(command), `CI should run ${command}`);
}

assert(existsSync("docs/quality-gates.md"), "docs/quality-gates.md should exist");
const docs = readFileSync("docs/quality-gates.md", "utf8");
assert(docs.includes("validate:evaluation"), "quality docs should mention evaluation validation");
assert(docs.includes("validate:playbook"), "quality docs should mention playbook validation");

console.log("quality-gates tests passed");

import { readFile } from "node:fs/promises";

const page = await readFile(new URL("../src/pages/Models.tsx", import.meta.url), "utf8");
const styles = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");

const checks = [
  ["ModelWorkbench component", /function ModelWorkbench\(/],
  ["ModelMap component", /function ModelMap\(/],
  ["ModelFocusPanel component", /function ModelFocusPanel\(/],
  ["ReleaseSwitcher component", /function ReleaseSwitcher\(/],
  ["Visual relation panel", /function VisualRelationPanel\(/],
  ["Workbench shell class", /className="model-workbench"/],
  ["Release tab buttons", /className=\{`release-tab/],
  ["Capability map styles", /\.capability-map/],
  ["Model profile grid styles", /\.model-profile-grid/],
  ["Relation visual styles", /\.relation-visual/],
];

const missing = checks.filter(([, pattern]) => !pattern.test(page) && !pattern.test(styles));

if (missing.length > 0) {
  throw new Error(`model workbench validation failed:\n${missing.map(([name]) => `- ${name}`).join("\n")}`);
}

console.log("model workbench validation passed");

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { decodeEntities, parseTrendingHtml, stripTags } from "../lib/github-trending.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.join(__dirname, "fixtures", "github-trending-sample.html");
const snapshotPath = path.join(__dirname, "snapshots", "github-trending-parsed.json");

const fixtureHtml = fs.readFileSync(fixturePath, "utf8");
const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));

test("decodeEntities handles common HTML entities", () => {
  assert.equal(decodeEntities("&amp; &lt; &gt; &quot; &#39; &nbsp;"), "& < > \" '  ");
});

test("stripTags removes nested tags and collapses whitespace", () => {
  assert.equal(stripTags("  <p>Hello <strong>AI</strong><br>   world&nbsp; </p>  "), "Hello AI world");
});

test("parseTrendingHtml matches the committed snapshot", () => {
  assert.deepEqual(parseTrendingHtml(fixtureHtml), snapshot);
});

import assert from "node:assert/strict";
import test from "node:test";

import { parseArgs as parseModelDailyArgs } from "../columns/models/daily.mjs";
import { generateModelEntry } from "../columns/models/generate.mjs";

test("models daily supports force and regenerate aliases", () => {
  assert.equal(parseModelDailyArgs(["--force"]).force, true);
  assert.equal(parseModelDailyArgs(["--regenerate"]).force, true);
});

test("version-update paradigm also carries the canonical card fields", async () => {
  const entry = await generateModelEntry({
    model: {
      id: "openai-gpt",
      name: "OpenAI GPT",
      vendor: "OpenAI",
      country: "US",
      kind: "closed",
      changelogUrl: "https://platform.openai.com/docs/changelog",
    },
    fetched: {
      status: {
        latestVersion: "GPT-5.5",
        latestReleasedAt: "2026-06-03",
        latestReleasedAtPrecision: "day",
        license: "closed",
        hasEvalData: false,
        evalSources: [],
        hasChangelog: true,
        changelogUrl: "https://platform.openai.com/docs/changelog",
        lastCheckedAt: "2026-06-03T12:00:00.000Z",
        model_string: "gpt-5.5",
        price_in: "$1.25",
        price_out: "$10.00",
        modalities: "text/image input, text output",
      },
    },
    options: {
      existingEntry: { id: "openai-gpt", kind: "closed", latestVersion: "GPT-5.4" },
      generatedAt: "2026-06-03T13:00:00.000Z",
      chatJson: async () => ({
        changelog: {
          oneLineTakeaway: "Use GPT-5.5 for longer context tasks.",
          newFeatures: [{
            feature: "larger context window",
            whatItIs: "The context window is larger.",
            forYou: "You can send longer documents.",
            howToUse: "Use the gpt-5.5 model string.",
            whenToUse: "Long-context workflows.",
          }],
          limitations: "Check migration notes before switching.",
          sources: [{ name: "OpenAI official changelog", url: "https://platform.openai.com/docs/changelog" }],
        },
      }),
    },
  });

  assert.equal(entry.paradigm.branch, "update");
  assert.equal(entry.paradigm.template, "version_update");
  assert.equal(entry.paradigm.card["model string"], "gpt-5.5");
  assert.equal(entry.paradigm.card["价格"]["输入每百万token"], "$1.25");
  assert.match(entry.paradigm.update["版本"], /GPT-5\.4.*GPT-5\.5/);
});

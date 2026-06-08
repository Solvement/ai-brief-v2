import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import test from "node:test";

import { createClaudeAuthorClient, extractClaudeResultText } from "../lib/claude-author.mjs";

test("extractClaudeResultText reads Claude JSON result field", () => {
  const stdout = JSON.stringify({
    type: "result",
    subtype: "success",
    is_error: false,
    result: "{\"ok\":true,\"items\":[1,2]}",
  });

  assert.equal(extractClaudeResultText(stdout), "{\"ok\":true,\"items\":[1,2]}");
});

test("claude author chatJson extracts inner JSON from mocked spawn output", async () => {
  let receivedInput = "";
  let receivedArgs = [];
  const spawnImpl = (command, args) => {
    assert.equal(command, "claude");
    receivedArgs = args;
    const child = new EventEmitter();
    child.stdout = new PassThrough();
    child.stderr = new PassThrough();
    child.stdin = {
      end(input) {
        receivedInput = input;
      },
    };
    child.kill = () => {};
    queueMicrotask(() => {
      child.stdout.write(JSON.stringify({
        type: "result",
        subtype: "success",
        is_error: false,
        result: "Here is the JSON:\n```json\n{\"analysis\":{\"oneLineTakeaway\":\"ok\"}}\n```",
      }));
      child.stdout.end();
      child.emit("close", 0);
    });
    return child;
  };

  const client = createClaudeAuthorClient({
    binPath: "claude",
    model: "sonnet",
    timeoutMs: 1000,
    spawnImpl,
    cwd: process.cwd(),
  });
  const parsed = await client.chatJson({
    system: "Return JSON.",
    user: "Make a card.",
    maxTokens: 100,
  });

  assert.deepEqual(parsed, { analysis: { oneLineTakeaway: "ok" } });
  assert.deepEqual(receivedArgs, ["-p", "--output-format", "json", "--tools", "", "--model", "sonnet"]);
  assert.match(receivedInput, /Return JSON/);
  assert.match(receivedInput, /Make a card/);
});

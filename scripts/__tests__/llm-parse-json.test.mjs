import test from "node:test";
import assert from "node:assert/strict";
import { parseJson } from "../lib/llm.mjs";

test("parseJson accepts fenced JSON", () => {
  assert.deepEqual(parseJson("```json\n{\"ok\":true}\n```"), { ok: true });
});

test("parseJson extracts an object from leading prose", () => {
  assert.deepEqual(parseJson("Here is the result:\n{\"ok\":true,\"count\":2}\nDone."), {
    ok: true,
    count: 2,
  });
});

test("parseJson removes trailing commas before object and array closers", () => {
  assert.deepEqual(parseJson("{\"items\":[1,2,],\"ok\":true,}"), {
    items: [1, 2],
    ok: true,
  });
});

test("parseJson recovers the first complete object before truncated text", () => {
  assert.deepEqual(parseJson("Result: {\"ok\":true,\"nested\":{\"x\":1}} trailing {\"bad\":\"unterminated"), {
    ok: true,
    nested: { x: 1 },
  });
});

test("parseJson repairs captured DeepSeek deep-dive stray array closer", () => {
  const malformed = `{
  "tech_breakdown_md": "### 安全边界\\n- **数据完整性**：强制区分“已观察”和“未知”，防止代理将未经验证的数据提升为声明。\\n这些机制共同确保代理输出是**可审计、可复现、高质量**的。"
  ],
  "value_to_us": {
    "learn": "如何设计一个结构化的 AI 代理工作流。"
  }
}`;

  assert.deepEqual(parseJson(malformed), {
    tech_breakdown_md: "### 安全边界\n- **数据完整性**：强制区分“已观察”和“未知”，防止代理将未经验证的数据提升为声明。\n这些机制共同确保代理输出是**可审计、可复现、高质量**的。",
    value_to_us: {
      learn: "如何设计一个结构化的 AI 代理工作流。",
    },
  });
});

test("parseJson repairs raw controls and unescaped quotes inside string values", () => {
  assert.deepEqual(parseJson("{\"body\":\"first line\nsecond \"quoted\" line\"}"), {
    body: "first line\nsecond \"quoted\" line",
  });
});

test("parseJson throws when no complete JSON object can be recovered", () => {
  assert.throws(() => parseJson("{\"bad\":\"unterminated"), SyntaxError);
});

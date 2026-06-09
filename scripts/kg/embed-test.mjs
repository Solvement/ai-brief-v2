// De-risk: local multilingual embeddings (no API, ONNX via @huggingface/transformers).
// Verifies zh+en embedding + cosine on this Windows/OneDrive box before we build on it.
import { pipeline } from "@huggingface/transformers";

const MODEL = "Xenova/multilingual-e5-small"; // 384-dim, multilingual (zh+en), small/fast

const cos = (a, b) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return d / (Math.sqrt(na) * Math.sqrt(nb));
};

console.log(`[embed-test] loading ${MODEL} (first run downloads model)…`);
const t0 = Date.now();
const extractor = await pipeline("feature-extraction", MODEL);
console.log(`[embed-test] loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// e5 convention: prefix "query:" / "passage:"
const embed = async (text) => {
  const out = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(out.data);
};

const docs = {
  agemem: "passage: 把记忆操作（存取改删压缩过滤）变成 agent 能调用的一等 policy action，用 step-wise GRPO 强化学习教它何时按哪个，解决记忆生命周期缺乏端到端监督的问题。",
  metagpt: "passage: 把标准作业流程 SOP 写成提示序列 + 结构化产物 + 共享消息池，让多 agent 角色分工不互相带偏，是编排骨架。",
  unrelated: "passage: 一个把视频生成做成 4D 重建的扩散模型，用于三维场景合成。",
};
const query = "query: 我要给一个 agent 加可学习的长期记忆，让它自己决定记什么删什么";

const qv = await embed(query);
const scored = [];
for (const [k, v] of Object.entries(docs)) scored.push([k, cos(qv, await embed(v))]);
scored.sort((a, b) => b[1] - a[1]);
console.log("[embed-test] query → nearest:");
for (const [k, s] of scored) console.log(`  ${s.toFixed(4)}  ${k}`);
console.log(scored[0][0] === "agemem" ? "[embed-test] PASS — recall ranked the right doc top" : "[embed-test] CHECK — top was not agemem");

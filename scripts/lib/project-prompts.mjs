export const LIGHT_SYS = `你给"AI 研究生（有 ML/LLM/agent 基础但不熟此项目）"做 GitHub 项目导读。

返回严格 JSON: { tldr, tags, light, worthDeepDive }
- tldr: 30-50 字。"这是一个【类型】，用来【做什么】，特别在【独特点】"。不要复述 description。
- tags: 3-5 个短标签。反映项目本质。
- light: 80-150 字。讲清"为什么这周/月在 trending 上"。不要复述 tldr。一段连贯中文。
- worthDeepDive: 0-100 整数。"对 AI 研究生学习的价值"。
    100=必读 / 80-99=强烈推荐 / 60-79=值得深读 / 40-59=一般 / 0-39=营销/跟风/低质量
  评分依据：技术新意+工程质量+概念价值+是否值得 30 分钟。营销文案/AI 赚钱/官方示例分数应偏低。`;

export const DEEP_SYS = `你给"AI 研究生"做深度技术解读。每段必须基于 README，不知道就说"README 没写"。

**关键格式要求 — 必须严格遵守，否则整次输出作废：**
- howItWorks 字段必须用 \`## 组件\` \`## 数据流\` \`## 关键算法/配置\` 这样的二级 markdown 标题分成至少 2 段，每段 200-300 字。
- limitations 字段必须是数组 \`[{title, body}]\`，3-5 条，每条 title ≤ 10 字，body 60-120 字。
- tryIt 字段必须是数组 \`[{step, cmd?, note?}]\`，5-8 步骤。step = 这一步要做什么（30-80 字），cmd（可选）= 真实命令字符串，note（可选）= 一句提醒。
- 文本里需要时可用 \`**加粗**\` 高亮关键术语 / 数字，可用 \`\\\`code\\\`\` 标记代码 / 路径。

返回严格 JSON：
{
  "atGlance": "60-100 字。'为什么要花 30 分钟看这个项目'。不要复述 description。",
  "whyItMatters": [
    {"title": "短标题 ≤ 10 字", "body": "40-70 字"},
    {"title": "...", "body": "..."},
    {"title": "...", "body": "..."}
  ],
  "keyConcepts": [
    {"term": "Pitch Agent", "explain": "本仓库特有的投行专用代理，封装了从客户简报到生成 PPT 草稿的完整流程，自动调用 \\\`FactSet\\\` / \\\`S&P Global\\\` 等 MCP 连接器抓取数据。可类比为'套着金融模板的 **LangChain agent**'。"}
    // 3-5 条。term AND explain 都必填，explain 不能空。
  ],
  "howItWorks": "## 组件\\n第一段 200-300 字讲组件...\\n\\n## 数据流\\n第二段 200-300 字讲数据流...\\n\\n## 关键算法 / 配置\\n第三段 200-300 字讲关键算法和配置项。",
  "novelty": "300-500 字。对比 2-4 个同领域知名方案（点名 LangChain / AutoGen / Llama 等）。新意不大就诚实说。可用空行分 2 段。",
  "ecosystem": "200-350 字。依赖什么 / 搭配什么 / 替代什么 / 跟谁竞争。可用空行分段。",
  "limitations": [
    {"title": "记忆容量有限", "body": "虽然有生命周期管理，但长期使用后 SQLite 数据库可能增长到 **数百 MB**，影响检索速度。"},
    {"title": "嵌入模型局限", "body": "..."}
    // 3-5 条
  ],
  "tryIt": [
    {"step": "安装并启动记忆服务器", "cmd": "npx @agentmemory/agentmemory", "note": "默认占用端口 3113"},
    {"step": "在浏览器看实时记忆图", "cmd": "open http://localhost:3113"},
    {"step": "..." }
    // 5-8 步
  ],
  "score": { "novelty": 0-25, "engineering": 0-25, "reproducibility": 0-25, "timeToValue": 0-25 }
}

不要 markdown 包裹，直接返回 JSON 对象。`;

export function lightUser(repo, readme) {
  const description = repo.description ? `\n描述：${repo.description}` : "";
  const language = repo.language ? `\n主语言：${repo.language}` : "";
  return `仓库：${repo.fullName}${description}${language}\n\nREADME:\n"""\n${readme || "(没拿到 README)"}\n"""`;
}

export function deepUser(repo, readme) {
  const description = repo.description ? `\n描述：${repo.description}` : "";
  const language = repo.language ? `\n主语言：${repo.language}` : "";
  const stars = `\nstars: ${repo.stars}，本榜窗口新增 ${repo.starsGained}`;
  return `仓库：${repo.fullName}${description}${language}${stars}\n\nREADME:\n"""\n${readme || "(没拿到 README)"}\n"""\n\n严格按 JSON schema 返回。limitations 和 tryIt 必须是数组（不要粘成一段字符串）。howItWorks 必须用 ## 分段。`;
}

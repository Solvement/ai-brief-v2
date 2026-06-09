// scripts/kg/focus-edges.mjs
// ------------------------------------------------------------------
// AUTHORED focus-cluster typed edges (Kevin 2026-06-09, second-layer).
//
// These are NOT mined deterministically. They are Claude-reasoned edges over
// candidate pairs WITHIN the focus clusters (self-evolving / multi-agent /
// deep-research-agent / agent-memory), each carrying a confidence + a one-
// sentence Chinese evidence — like the existing good edge
// (content/agemem -same_track_as-> content/memoryagentbench).
//
// Typed edge vocabulary (associative-memory semantics):
//   builds_on      A 在 B 的思路上往前推进/扩展
//   shares_method  A、B 用同一类方法/训练配方/评测机制
//   same_use_case  A、B 服务同一类落地用途(同赛道的不同实现)
//
// Grounding: titles/tags from content/papers/<slug>/metadata.json + the briefs.
// Only emitted if BOTH endpoints exist in the graph (runner skips broken ones),
// so this file is safe to over-specify.
// ------------------------------------------------------------------

export const FOCUS_TAGS = [
  'self-improving-agent-lineage',
  'self-evolving-agent',
  'self-improving-agent',
  'multi-agent',
  'multi-agent-harness',
  'deep-research-agent',
  'agent-memory',
  'agentic-search',
];

export const FOCUS_TYPED_EDGES = [
  // ── 自进化 / multi-agent lineage ─────────────────────────────
  {
    from: 'paper:2402.16823', // GPTSwarm
    to: 'paper:2308.00352', // MetaGPT
    type: 'builds_on',
    confidence: 'high',
    evidence:
      'MetaGPT 把多智能体协作固化成人写的 SOP 角色流程;GPTSwarm 进一步把这套协作结构表示成可优化的图,用 RL 自动学边/提示词——从「人定流程」走向「自学结构」。',
  },
  {
    from: 'paper:2507.21046', // self-evolving survey
    to: 'paper:2402.16823', // GPTSwarm
    type: 'builds_on',
    confidence: 'medium',
    evidence:
      '自进化智能体综述把 GPTSwarm 这类「把智能体结构当可优化对象」的工作归到 what/when/how/where 自进化框架里,是它综述的具体实例之一。',
  },
  {
    from: 'paper:2508.07407', // comprehensive self-evolving survey
    to: 'paper:2507.21046', // self-evolving survey
    type: 'shares_method',
    confidence: 'high',
    evidence:
      '两篇都在系统综述「自进化智能体的优化回路」:同一赛道、同一组织维度(单体优化 / 多智能体优化 / 终身学习),互为同期对照综述。',
  },
  {
    from: 'paper:2410.10934', // agent-as-a-judge
    to: 'paper:2508.07407', // comprehensive self-evolving survey
    type: 'shares_method',
    confidence: 'medium',
    evidence:
      'Agent-as-a-Judge 提供的「用智能体给智能体过程打分」正是自进化综述里优化回路所需的反馈/奖励信号来源,二者共享「过程级评判驱动改进」这一机制。',
  },

  // ── deep-research / search-agent 赛道 ────────────────────────
  {
    from: 'paper:2606.00408', // masking stale observations
    to: 'paper:2606.02060', // DRIFT (where do deep-research agents go wrong)
    type: 'same_use_case',
    confidence: 'high',
    evidence:
      '两篇都服务「深度研究/搜索智能体」同一用途并都做轨迹分析:前者从上下文管理(屏蔽过期观测)、后者从 span 级错误定位,各自给出让研究智能体更可靠的抓手。',
  },
  {
    from: 'paper:2605.31584', // LongTraceRL
    to: 'paper:2606.02373', // Harness-1
    type: 'shares_method',
    confidence: 'high',
    evidence:
      '两篇都在「搜索智能体轨迹」上做强化学习:LongTraceRL 用 rubric/过程奖励训练长上下文检索推理,Harness-1 用 RL + 状态外置训练搜索智能体,共享 RLVR-on-trajectory 这套训练配方。',
  },
  {
    from: 'paper:2606.02373', // Harness-1
    to: 'paper:2606.00408', // masking stale observations
    type: 'same_use_case',
    confidence: 'medium',
    evidence:
      '两篇都在做搜索/研究智能体的「上下文与状态工程」:Harness-1 把状态外置以减负、masking 屏蔽过期观测,都是为延长有效检索推理这一同用途服务。',
  },
  {
    from: 'paper:2606.02060', // DRIFT
    to: 'paper:2410.10934', // agent-as-a-judge
    type: 'shares_method',
    confidence: 'medium',
    evidence:
      'DRIFT 做研究智能体的 span 级错误定位、agent-as-a-judge 做过程级智能体评测,二者共享「用细粒度过程评判替代只看最终答案」的方法取向。',
  },

  // ── agent-memory / 持久状态 赛道 ─────────────────────────────
  {
    from: 'paper:2606.02437', // scaling PEFT — million personal models (lora-as-memory)
    to: 'content/agemem', // AgeMem (brief-wiki)
    type: 'shares_method',
    confidence: 'medium',
    evidence:
      '两篇都把「持久化记忆」做成可学习的一等对象:AgeMem 让记忆存取改删成为可 RL 训练的策略动作,PEFT 论文把 LoRA 适配器当作可训练的个性化记忆载体,共享「记忆即可学习状态」的思路。',
  },
  {
    from: 'content/memoryagentbench', // MemoryAgentBench (brief-wiki)
    to: 'paper:2606.02437', // scaling PEFT
    type: 'same_use_case',
    confidence: 'low',
    evidence:
      'MemoryAgentBench 评测智能体长期记忆系统、PEFT 论文用 LoRA 承载个性化持久状态,都围绕「给智能体一份可持续累积的记忆」这一用途,前者是后者一类方法的潜在评测台。',
  },
];

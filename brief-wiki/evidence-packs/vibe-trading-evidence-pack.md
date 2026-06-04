---
content: "vibe-trading"
kind: "evidence-pack"
title: "Vibe-Trading — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "planner"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "面向个人开发者的 AI 交易代理框架，一条命令让 LLM 智能体接管市场研究、策略回测与多券商安全交易（来源：README 标题与定位语）"
    internal_logic: "### 代理循环与工具接口\n\n代理循环采用典型的 ReAct 模式，LLM 通过工具调用来完成任务。关键特性：\n- **迭代预算与强制结束**：代理循环在达到 80% 迭代预算时触发 wrap-up nudge，最后一步移除工具定义，强制模型生成最终文本答案，防止陷入死循环（来源：README 2026-05-30 robustness pass #148）\n- **MCP 工具集成**：通过 MCP 协议暴露 36 个工具，涵盖数据获取、回测、交易下单等。工具调用 trace 携带 `call_id` 以实现结果回溯（来源：README 2026-06-03 #168）\n- **并发与心跳**：Swarm 模式下 worker 可调用外部 MCP 服务器，带心跳保活与 stale run 回收机制（来源：README 2026-05-28 Swarm safety & 05-22 MCP keepalive）\n\n**示例**：对代理说“分析特斯拉过去一个月走势，如果适合买入则用 paper 账户下 10 股”，代理会依次调用 `yfinance` 数据工具、`run_backtest` 工具、`trading_place_order` MCP 工具（经过 mandate 检查）。\n\n### 状态与记忆\n\n- **会话持久化**：session 消息以 JSONL 追加写入，每次写入后 `flush + fsync` 防止崩溃丢失（来源：README 2026-05-30 #147）\n- **研究目标快照**：Goal 层持久化 claims、evidence 等，代理可从当前快照继续推进，而非仅依赖原始 prompt（来源：README 2026-05-26 Goal lifecycle）\n- **假设注册表**：Hypothesis Registry 支持持久化查询和状态过滤（来源：README 2026-05-20）\n\n### 规划与多代理协作\n\n- **Research Goal**：用户可定义目标、接受标准、证据行和完成策略，代理自动分解任务并记录进度（来源：README 2026-05-24）\n- **Swarm**：DAG 工作流，支持上游失败阻断下游任务，worker 可配置外部 MCP 工具（来源：README 2026-05-28 #145, #142）\n- **strict alpha gate**：`run_bench_strict()` 加入同 universe 随机对照与 OOS 分割，防止仅捕捉市场 Beta 的因子通过（来源：README 2026-05-28 #143）\n\n### 沙盒与安全边界\n\n**安全模型的核心是 mandate + 多道防线**：\n- **用户提交的 mandate**：交易前需定义 symbol 白名单、最大 order size、总曝光、杠杆倍数、日交易额上限（来源：README 2026-05-29 Robinhood 安全模型）\n- **文件系统 kill switch**：存在特定文件即立刻阻止所有新订单并平仓（来源：同上）\n- **fail-closed pre-trade gate**：任何检查失败拒绝下单，不静默放行（来源：同上）\n- **审计账本**：所有指令与决策记录完整审计日志（来源：同上）\n- **paper/live 结构隔离**：通过帐号格式、主机隔离、demo flag 等确保 paper 和 live 绝对分离，Longbridge 因 API 无 paper/live 判别器而只能 paper + read-only（来源：README 2026-06-02 broker connectors）\n\n**连接器设计**：每个 broker connector 明确区分只读、paper 下单、mandate 保护的下单三种能力层次，并在连接器选择时显式区分 paper/live 属性（来源：README 2026-05-31 connector-first architecture）\n\n### 数据与回测\n\n- 多数据源 fallback: `mootdx`（通达信原生 TCP，A 股）、`ccxt`（代理支持，加密货币）、`yfinance` 等\n- 回测支持 LLM 生成信号引擎，有预检接口验证（来源：README 2026-05-30 #149）\n- 输出渲染优化，鼓励 markdown 表格，去除多余分隔线（来源：README 2026-05-27 #139）\n\n### 部署与前端\n\n- 单命令安装 `pip install vibe-trading-ai`，支持 Docker\n- 后端 FastAPI + React 19 前端\n- CLI 交互式终端，支持管道输出（来源：README 2026-05-23 Interactive CLI refresh）"
    failure_mode: "安全依赖用户正确配置 mandate，若用户疏忽将限制设得过宽，可能存在意外损失风险；项目声明「Experimental / use at your own risk」"
    source_pointer: "https://github.com/hkuds/vibe-trading"
pipeline_steps:
  - "project_type 分诊:agent_framework"
  - "verdict:deep_dive"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/false/false/MIT/v0.1.9"
experiments: []
claims:
  - "[[claims/vibe-trading-main-claim]]"
artifacts:
  - "[[artifacts/vibe-trading-repo]]"
metrics:
  - "stars=10060"
  - "forks=2016"
  - "open_issues=7"
  - "latest_release=v0.1.9"
  - "pushed_at=2026-06-04T02:43:31Z"
baselines: []
failure_modes:
  - "安全依赖用户正确配置 mandate，若用户疏忽将限制设得过宽，可能存在意外损失风险；项目声明「Experimental / use at your own risk」"
  - "LLM 输出的不可预测性可能导致不符合预期的交易行为，即使有 mandate 限制，仍可能在允许范围内做出错误决策"
  - "金融监管合规风险：代理提供的建议和自动交易可能涉及投资咨询牌照，不同司法管辖区要求不同"
  - "依赖的实验性 broker connector（如 Binance、OKX）可能不稳定，导致订单丢失或状态不一致"
  - "社区版可见 issue 少但实际使用中可能有较深的 bug，因开源时间短尚未暴露"
missing_details: []
source_pointers:
  - "https://github.com/hkuds/vibe-trading"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/vibe-trading-main-claim]],官方 artifact 落库为 [[artifacts/vibe-trading-repo]]。See [[content/vibe-trading]]。

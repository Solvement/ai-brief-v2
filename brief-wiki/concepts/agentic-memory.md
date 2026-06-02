---
name: "Agentic memory (memory ops as policy actions)"
slug: agentic-memory
kind: concept
tags:
  - agent-memory
  - llm-agents
maturity: emerging
first_seen_in: agemem
explanation: "Treat memory management not as an external controller but as actions inside the agent's own decision policy — the LLM emits store/retrieve/update/summarize/discard as tool calls and is optimized end-to-end for them."
examples:
  - "AgeMem exposes Add/Update/Delete (LTM) and Retrieve/Summary/Filter (STM) as tool-actions the policy selects. Source: arxiv:2601.01885v2 §method."
common_misunderstandings:
  - "It is not RAG: retrieval is one action among several the agent learns to time, not a fixed pre-step."
open_questions:
  - "Does a learned, fixed tool set generalize beyond the training task distribution (here, HotpotQA-sourced trajectories)?"
---

## Explanation

Memory becomes part of the action space. Instead of a heuristic deciding when to write/read memory, the agent learns those decisions jointly with reasoning, so memory policy is end-to-end optimizable. Source: arxiv:2601.01885 (abstract) + v2 §method.

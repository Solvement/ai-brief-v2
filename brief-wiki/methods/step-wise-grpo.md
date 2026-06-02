---
name: "Step-wise GRPO"
slug: step-wise-grpo
kind: method
type: training
tags:
  - reinforcement-learning
  - credit-assignment
used_by_content:
  - agemem
problem_solved: "Memory operations produce sparse, discontinuous rewards across a fragmented multi-stage trajectory, so terminal task reward doesn't cleanly attribute to the memory decisions that caused it."
naive_baseline: "Vanilla GRPO assumes a continuous trajectory and scores the rollout as one unit."
how_it_works: "Compute the terminal reward R(τ) then broadcast it to all preceding steps so each intermediate step (incl. cross-stage memory actions) receives the same advantage A_t = A_T — long-range credit assignment across stage boundaries."
input: "multi-stage trajectory τ = (τ1, τ2, τ3) with terminal reward"
output: "per-step advantages for heterogeneous memory + reasoning actions"
tradeoff: "Uniform broadcast is coarse — every step gets identical credit, which can over-reward incidental actions on a successful rollout."
evidence_strength: medium
reusable_pattern: "When rewards are terminal but decisions are spread across phases, broadcast the terminal advantage to all steps rather than discounting — cheap long-range credit assignment."
---

## Mechanism

Source: arxiv:2601.01885v2 §training. See [[content/agemem]].

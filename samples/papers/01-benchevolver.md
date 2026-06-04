# BenchEvolver：当代码 Benchmark 被做穿，题目应该从解法里重新长出来

一句话钩子：当最强代码模型把公开评测做到接近满分，BenchEvolver 的回答不是再写一批题，而是先让参考解变难，再把题面和测试长出来。

元信息：论文《BenchEvolver: Frontier Task Synthesis via Solution-Centric Evolution》，作者为 Yangzhen Wu、Aaron J. Li、Wenjie Ma、Li Cao、Ziheng Zhou、Mert Cemri、Shu Liu、Yuran Xiu、Chenxiao Yan、Haikun Zhao、Bin Yu、Ion Stoica、Dawn Song；论文报告 arXiv:2606.01286（来源：Metadata），Hugging Face upvotes 为 2（来源：Metadata），全文依据为 arXiv HTML full text（来源：Metadata）。

代码模型评测现在的真实张力是：一边，静态 benchmark 会被快速做穿，论文报告 LiveCodeBench easy split 上前沿模型 Pass@1 超过 99%、跨难度平均超过 90%（来源：摘要与第1节）；另一边，完全靠人类重新出题，成本又跟不上模型迭代。合成数据看似是出路，但常见 statement-first 生成容易制造“看起来复杂、语义不稳、测试不可信”的题，尤其在模型要挑战自己时更脆弱。

BenchEvolver 的一句话主张是：要让模型持续暴露自己的弱点，benchmark 生成必须从可执行计算本身出发，而不是从题面花样出发。

先看结果。论文报告 LiveCodeBench-Plus 最终包含 91 道题，前沿模型 Pass@1 从 27.5% 到 62.6%（来源：表3与第4.2节），把一个接近饱和的代码评测重新拉回可区分区间。更具体地，Hard split 的平均 Pass@1 从 seed 的 87.0% 降到 evolved 的 45.7%，绝对下降 41.3 个百分点（来源：表3）；Medium split 从 96.5% 降到 69.6%，下降 26.8 个百分点（来源：表3）。这个数字背后回答的是一个更本质的问题：AI 评测能不能从静态题库，变成随模型能力一起生长的可执行环境。

看点先读：BenchEvolver 不先写题，而是先改参考解 C→C′，再围绕 C′ 生成题面与测试，把难度锚定在可执行语义上（来源：第3.2节）。

看点先读：候选题通过一致性验证后，才让目标模型多次尝试，难度由真实失败率决定，而不是由 LLM judge 打分决定（来源：第3.3节与算法1）。

看点先读：在同一 GPT-5.4-mini evolver 下，BenchEvolver 的 validity 为 97.7%，problem-centric baseline 为 79.3%，memory-free baseline 为 86.2%（来源：表1）。

看点先读：RL 实验中，gpt-oss-20b 的 seed+evolved 训练在 LCB v6 Hard 上从 40.0% 到 48.7%，提升 8.7 个百分点（来源：图5、图6与第4.3节）。

## 难题为什么要先从解法里长出来

BenchEvolver 的直觉很简单：如果你先让模型写一个难题，再反过来补参考答案和测试，最容易得到的是题面变长、边界变怪、但核心算法没变的伪难题。论文改成相反方向：先把父题参考实现 C 变异成新参考实现 C′，再生成新题面 S′ 和测试 T′，即 C→C′→I′=(S′,C′,T′,E)（来源：第3.2节）。

人话翻译是：先确定这道题到底要算什么，再让自然语言去描述它。这样，难度来自计算结构的改变，例如更强的渐进复杂度、更复杂的数据结构、新的数学重写，或让原题捷径失效的自然约束。

为什么不是常见的 problem-centric 生成？论文的判断是，在自挑战场景下，同一个模型既写题又验证题，最容易放过歧义、隐藏假设和表面复杂度问题（来源：第3.2节）。所以 BenchEvolver 把生成锚点放在可执行参考解上，并要求 dominant algorithmic lift，而不是把长题面、怪 I/O、冷门边界当成难度（来源：第3.2节与第3.3节）。

消融结果支持这个选择。论文报告，在同一 GPT-5.4-mini evolver 下，BenchEvolver 在 LiveCodeBench 上的 validity 为 97.7%，problem-centric baseline 为 79.3%（来源：表1）。同一设置下，BenchEvolver 在 Easy/Medium/Hard 上分别完成 17/22、16/23、12/20 个 seed，problem-centric 分别为 12/22、11/23、6/20（来源：表1）。这说明效果不只是模型大，而是生成方向本身在起作用。

## 难不难，不让出题模型自己说了算

BenchEvolver 的 Evaluator 分两步：先问“题是否自洽”，再问“模型是否真的做不出来”。在 LiveCodeBench 上，它使用参考解、statement-only 暴力解、statement-only 公共输出 oracle 做三方交叉；在 SciCode 上，由于科学函数题不适合暴力解，它改用 statement-faithfulness check，看独立解法是否能从题面复现测试行为（来源：附录C.1与C.2）。

难度定义也很行为主义：目标模型面向题面多次生成解，只有通过全部隐藏测试才算成功，平均成功率越低，题越难（来源：第3.1节与算法1）。公式 a(I;Π,K)=1/(JK)∑V_E(Ĉ_j,k,T) 的意思就是：把所有模型、所有尝试的通过情况平均起来，用真实执行结果给难度定价（来源：算法1）。

这里还有一个关键设计：memory-guided evolution。local memory 记录同一 seed 的成功变异、失败原因、修复问题和模型错误模式；global memory 记录跨 seed 的变异家族，避免不同题反复走同一种算法升级（来源：第3.4节）。为什么不是独立采样？因为独立 mutation 会重复踩坑，也容易把多样性浪费在表面换皮上。

表1给出直接消融：论文报告 full BenchEvolver validity 为 97.7%，memory-free 为 86.2%；Hard 完成比例 full 为 12/20，memory-free 为 9/20（来源：表1）。这说明记忆不是装饰，而是在搜索方向和失败回避上提供了实际作用。

## LCB-Plus 把饱和题库重新拉回可区分区间

BenchEvolver 最像 benchmark 产品的产物是 LiveCodeBench-Plus。论文从 LiveCodeBench-v6 的 saturated Medium 与 Hard 题出发，经过内部验证、人类质量审查和难度过滤，保留 evolved tasks，再补充原始困难题，形成最终集合（来源：第4.2节）。论文报告最终 LiveCodeBench-Plus 包含 91 道题，其中 64 道 evolved problems 与 27 道 difficult original LiveCodeBench-v6 problems（来源：第4.2节）。

关键不是“题更难”这句空话，而是模型之间重新拉开。论文报告在 LCB-Plus 上，DeepSeek-V4-Pro 为 27.5%，GPT-5.5 为 62.6%（来源：表3）。在 Hard split 上，GPT-5.4 从 94.8% 降到 49.7%，DeepSeek-V4-Pro 从 83.7% 降到 23.2%（来源：表3）。

为什么不只放演化题？因为只放演化题可能形成单一分布；为什么不只保留原题？因为原题已经不足以对前沿模型施压。混合设计保留真实原题锚点，同时加入演化难题（来源：第4.2节）。论文还设置质量门槛和 Pass@1 难度区间，避免把模型全错的退化题误当成好题（来源：第4.2节）。

## 自挑战不是只为评测，也能变成训练信号

论文最有方法论野心的部分在第4.3节：让 gpt-oss-20b 同时做 evolver 和 target model。它只从模型已经稳定解出的老题出发，生成让当前模型开始失败但又不是完全无解的变体，再用可执行测试奖励做 RL。论文报告生成 586 道 evolved problems，来自 404 个 successfully evolved seeds；训练集合分别是 880 道 seed、586 道 evolved，以及 1466 道 union（来源：第4.3节）。

结果很直接。LCB v6 Hard 上，论文报告 base 为 40.0%，seed-only 到 45.1%，evolved-only 到 47.6%，seed+evolved 到 48.7%（来源：图5、图6与第4.3节）。LCB-Pro Easy 上，base 为 64.6%，seed-only 到 70.8%，evolved-only 到 71.8%，seed+evolved 到 72.9%（来源：图5、图6与第4.3节）。在独立演化评测集 LCB-Evolved Medium 上，base 为 30.45%，seed-only 为 33.66%，evolved-only 为 38.22%，seed+evolved 为 37.32%（来源：第4.3节）。

这组对照回答了一个关键问题：是机制在起作用，还是只是模型大、调参好？论文固定同一个 gpt-oss-20b 和同一 RL 配置，只改变训练数据组成；LCB v6 Hard 上 seed+evolved 相比 seed-only 多 3.6 个百分点，evolved-only 多 2.5 个百分点（来源：第4.3节、图5与图6）。因此，evolved tasks 不只是 harder benchmark items，也提供了 seed-only 数据没有暴露的学习信号。

## 工作意义

工程上，BenchEvolver 给出了一条可落地的 benchmark 维护路线：固定执行 harness，把题目、参考解、隐藏测试和验证日志作为同一个可审计单元演化。对评测平台而言，这比不断人工攒题更接近“版本化 living benchmark”。

方法论上，它把合成数据的对象从 instruction 或 solution trace，推进到完整 executable task。更关键的是，选择标准从“模型觉得难”换成“目标模型在隐藏测试上真实失败”，让 benchmark 生成进入可测量闭环。

对 AI 应用构建者，尤其是做代码 Agent、数据分析 Agent、自动修复系统的人，这篇论文的启发是：不要只收集用户失败样例，也可以围绕已通过任务自动生成更难的可执行回归集。这样每次模型升级、prompt 改动或工具链调整，都能用演化任务检查系统是否真的跨过了原来的能力边界。

## 局限

第一，论文的 RL 自我改进只实例化了一轮闭环；多轮“改进后的模型继续生成下一代挑战”的稳定性、课程设计和多样性控制仍是 future work（来源：第5.2节）。

第二，SciCode 的 statement-faithfulness check 主要检测规格是否足够明确，并不等价于科学正确性证明；论文也指出 same-model self-play 可能共享数值盲点（来源：附录C.2）。

第三，任务范围集中在可执行 coding domains，包括 LiveCodeBench 与 SciCode；对非代码推理、开放式 agent 任务或无明确执行 oracle 的场景，论文未提供同等实验（来源：第4节；论文未提供）。

第四，训练成本不为零；论文报告每个 RL run 约 40 小时、约 800 美元 Tinker credits（来源：附录D.5），这会限制普通团队直接复现实验规模。

一句话结语：BenchEvolver 的价值不只是做出更难的代码题，而是把 benchmark 从一次性试卷，改造成模型持续暴露弱点、验证弱点、学习弱点的机器。
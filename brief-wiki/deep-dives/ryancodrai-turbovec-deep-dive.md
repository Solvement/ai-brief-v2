---
content: "ryancodrai-turbovec"
kind: "deep-dive"
schema_version: "project-tier-template/v1"
shape: "howto-use"
project_type: "library_sdk"
title: "turbovec — 深度拆解"
tier_template:
  tier: 3
  bucket: "真·新项目"
  tag: "[Tier 3｜真·新项目]"
  one_sentence_positioning: "RyanCodrai/turbovec：GitHub 描述为“A vector index built on TurboQuant, written in Rust with Python bindings”。"
  what_it_does: "A vector index built on TurboQuant, written in Rust with Python bindings"
  metadata:
    language: "Python"
    total_stars: "7952"
    stars_in_period: "1554"
    author: "RyanCodrai"
  labels:
    - "Tier 3"
    - "真·新项目"
    - "models"
    - "docs"
    - "deep"
  pain_point: "人话：这个项目值得看，不是因为 README 说“更快”，而是因为它把压缩、稳定 ID、过滤、Python/Rust 双接口和四个 RAG 框架适配放在同一个小型库里。它对本地、离线、内存敏感的 RAG 管线有直接工程价值。 术语：它属于 in-process vector index，不是 client/server vector database；它的过滤路径是 kernel-level filtering，不是先搜很多再在 Python 里丢结果。"
  core_capabilities:
    - "稳定 ID 包装层"
    - "候选集先解析、内核只接 bitset"
    - "首次 add 锁定维度"
  how_to_run:
    install_command: ""
    minimal_example: ""
  comparison: "FAISS：turbovec README 直接把 FAISS `IndexPQ`/`IndexPQFastScan` 当基线。FAISS 官方 `IndexPQ` API 有 `train(n, x)`，并支持 `sa_encode`/`sa_decode`、`add_with_ids` 等更成熟的索引生态（来源：FAISS IndexPQ docs https://faiss.ai/cpp_api/struct/structfaiss_1_1IndexPQ.html）。取舍：如果你要成熟、多索引类型、GPU/生态和长期基线，先选 FAISS；如果你要本地 Python/Rust 小库、无单独 train phase、压缩后直接接 LangChain/LlamaIndex/Haystack/Agno，并且过滤候选来自外部系统，可以看 turbovec。README 里的速度胜出仍按项目自称处理。 LanceDB：LanceDB 官方 quickstart 说 OSS 是 embedded database，像 SQLite 一样 in-process，并支持 local path、object storage URI、Enterprise `db://`（来源：LanceDB Quickstart https://docs.lancedb.com/quickstart）。它还提供 brute force 和 ANN 搜索路径（来源：LanceDB Vector Search https://docs.lancedb.com/search/vector-search）。取舍：如果你要表格式存储、对象存储、完整数据库体验和更宽的数据管理面，选 LanceDB；如果你只要压缩向量索引嵌入现有应用，且文档/metadata 已由别处管理，turbovec 更轻。 Qdrant：Qdrant 官方文档定位为 AI-native vector search / semantic search engine，并有 filtering、hybrid queries、payload、collections、quantization、multitenancy 等服务化能力（来源：Qdrant docs https://qdrant.tech/documentation/；Qdrant filtering docs https://qdrant.tech/documentation/search/filtering/）。取舍：如果你要服务端、集合管理、payload filter、多租户、运维工具，选 Qdrant；如果你需要无网络、本地进程内、只把外部系统的 candidate IDs 交给向量 rerank，turbovec 的边界更窄也更简单。"
  trajectory_note: ""
  manual_confirmation: true
  how_it_works_with_analogy: "人话流程：假设你有 1536 维 embedding 和业务文档 ID。Python 侧用 `idx = IdMapIndex(dim=1536, bit_width=4)`，再 `idx.add_with_ids(vectors, np.array([1001, 1002, 1003], dtype=np.uint64))`。搜索时可以直接 `idx.search(query, k=10)`，也可以先从 SQL 拿候选：`allowed = ... SELECT id FROM docs WHERE tenant=? ...`，再 `idx.search(query, k=10, allowlist=allowed)`（来源：README Python；README Hybrid retrieval）。 源码路径：`turbovec-python/src/lib.rs` 接收 `PyReadonlyArray2<f32>` 和 `PyReadonlyArray1<u64>`，要求数组 C-contiguous；`add_with_ids` 调 `turbovec_core::IdMapIndex::add_with_ids_2d`。`turbovec/src/id_map.rs` 先检查 `ids.len() == vectors.len()/dim` 和重复 ID，再调用内部 `TurboQuantIndex.add_2d`，成功后才写 `id_to_slot` 和 `slot_to_id`，避免 inner add 失败后留下 ghost ID（来源：turbovec-python/src/lib.rs add_with_ids；turbovec/src/id_map.rs add_with_ids_2d）。 编码路径：`turbovec/src/encode.rs` 对每行向量计算 norm、归一化、乘同一个 rotation matrix；如果首批样本数 `n >= 1000`，TQ+ 用每个坐标的经验 5%/95% 分位去拟合 `shift` 和 `scale`，否则返回 identity calibration；随后按 Lloyd-Max boundaries 把每维变成小整数 code，并按 `bytes_per_row = bit_width * (dim / 8)` bit-pack（来源：turbovec/src/encode.rs encode；compute_tqplus_calibration）。 搜索路径：allowlist 搜索先在 Python 侧拒绝空 allowlist 和未知 id；Rust `IdMapIndex.search_with_allowlist` 把外部 `u64` id 映射到 slot bool mask；`TurboQuantIndex.search_with_mask` 再把 bool mask 打成每 64 slot 一个 `u64` 的 bitset。`search.rs` 对 query 做 batched rotation，用 query LUT 和 packed codes 直接计分；x86 运行时选择 AVX-512BW、AVX2 或 scalar fallback；有 mask 时，`block_has_allowed` 在 32-vector block 级别提前跳过没有允许 slot 的 block，最后返回外部 id（来源：turbovec/src/id_map.rs search_with_allowlist；turbovec/src/lib.rs search_with_mask；turbovec/src/search.rs search/block_has_allowed）。 术语解释：slot 是内部数组位置；external id 是调用方给的稳定 `u64` 文档 ID；LUT 是把 query 与 quantized codebook 的分数预先做成查表；SIMD 是 CPU 一条指令同时处理多组 code。"
  essential_design_difference: "这些模式比具体 TurboQuant 算法更容易复用到别的 AI 基建里。 - 稳定 ID 包装层；把高速 positional index 留在内层，外层维护 `slot_to_id` 和 `id_to_slot`，删除时同步 swap-remove 后的 moved id。；如果底层存储原生支持稳定主键，或者删除会保序移动大量元素，就不需要这层。；RAG 文档 ID 必须稳定；`IdMapIndex.remove(id)` 的 O(1) 路径把性能和产品语义拆开了（来源：turbovec/src/id_map.rs）。 - 候选集先解析、内核只接 bitset；把 SQL/BM25/ACL/time-window 等复杂条件在外部解析成 ID allowlist，核心向量内核只处理 packed bitset。；如果项目需要原生复杂 metadata 查询、范围索引、分布式过滤，直接用向量数据库更合适。；接口保持小，仍避免 post-filter 丢 top-k；`block_has_allowed` 能在 32-vector block 级别跳过计算（来源：README Hybrid retrieval；turbovec/src/search.rs）。 - 首次 add 锁定维度；允许 `dim=None` 的 lazy constructor，首次 `add`/`add_with_ids` 从输入 shape 锁定 dim。；如果系统必须在建索引前做严格 schema validation，显式 dim 更清晰。；框架 wrapper 不必提前知道 embedding 模型维度，LangChain/LlamaIndex/Haystack docs 都使用了这个 ergonomics（来源：docs/api.md；docs/integrations/langchain.md；docs/integrations/llama_index.md）。 - 二进制索引 + JSON side-car；向量索引用 `.tvim`，文档文本、metadata、string-id map 用 `docstore.json` 或 `{stem}.nodes.json`。；如果需要事务、并发写、多进程一致性，这种文件组合不够。；避免 pickle/危险反序列化，同时让 framework store 保留文档 payload（来源：docs/integrations/langchain.md Save/load；docs/integrations/llama_index.md Persist/load；docs/integrations/haystack.md Save/load）。 - 文档化的“不支持”；对 MMR、full-precision embedding recovery、非默认 LlamaIndex query mode 等不可实现能力直接 raise `NotImplementedError`。；不要用静默 fallback 伪装支持。；压缩索引丢弃原始向量，MMR 需要候选之间的全精度向量；明确失败比返回误导结果更安全（来源：docs/integrations/langchain.md Known limitations；turbovec-python/python/turbovec/langchain.py）。"
  practitioner_meaning: "结论：值得继续 clone-and-run，尤其是你在做本地 RAG、离线部署、候选集 rerank、内存压缩，且不想引入服务化向量数据库时。 扣分点也明确：Python package classifier 是 `Development Status :: 3 - Alpha`；README 性能结论需要自己复现；docs/api.md 和源码在 bit_width/文件格式上有漂移。工程上最可复用的是 `IdMapIndex`、allowlist-to-bitset、block skip、JSON side-car，以及对不可支持能力直接 fail 的 wrapper 设计。"
  cross_links: []
  prose_body: ""
light_spine:
  schema_version: "project-tier-template/v1"
  one_sentence:
    summary: "turbovec 是一个 Rust 写的本地向量索引库，提供 Python 绑定，用 TurboQuant/TQ+ 把 embedding 压到 2-4 bit/维，并重点支持带 allowlist/mask 的过滤式检索。"
    body_md: "人话：它不是托管向量数据库，而是一个可以嵌进本机进程的压缩向量索引；典型用法是 `TurboQuantIndex(dim=1536, bit_width=4)` 或 `IdMapIndex(dim=1536, bit_width=4)`，然后 `add`/`add_with_ids`、`search`、`write`/`load`（来源：README Python；docs/api.md TurboQuantIndex；turbovec-python/src/lib.rs Python binding）。\n\n术语：TurboQuant 是压缩向量方向的量化算法；`IdMapIndex` 是在内部 slot 之上维护稳定 `u64` 外部 ID 的封装；`allowlist`/`mask` 是搜索时把候选集合限制到指定 ID 或 slot 的过滤机制。"
  why_worth_attention:
    summary: ""
    body_md: "人话：这个项目值得看，不是因为 README 说“更快”，而是因为它把压缩、稳定 ID、过滤、Python/Rust 双接口和四个 RAG 框架适配放在同一个小型库里。它对本地、离线、内存敏感的 RAG 管线有直接工程价值。\n\n术语：它属于 in-process vector index，不是 client/server vector database；它的过滤路径是 kernel-level filtering，不是先搜很多再在 Python 里丢结果。"
    bullets:
      - "Rust crate `turbovec` 当前版本是 `0.8.0`，Python distribution `turbovec` 当前版本是 `0.7.0`，workspace 同时包含 `turbovec` 和 `turbovec-python`（来源：turbovec/Cargo.toml；turbovec-python/pyproject.toml；CHANGELOG.md turbovec 0.7.0 + 0.8.0）。"
      - "Python 入口只导出 `IdMapIndex` 和 `TurboQuantIndex`，绑定层要求 NumPy 数组 C-contiguous，维度不匹配会转成 `ValueError`（来源：turbovec-python/python/turbovec/__init__.py；turbovec-python/src/lib.rs）。"
      - "框架适配覆盖 LangChain、LlamaIndex、Haystack、Agno，并通过 extras 声明：`langchain-core>=0.3`、`llama-index-core>=0.11`、`haystack-ai>=2.0`、`agno>=2.0`（来源：turbovec-python/pyproject.toml optional-dependencies）。"
      - "源码中有 Rust tests 和 Python tests，包含 `filtering`、`id_map`、`io_versioning`、`concurrent_search`、LangChain/LlamaIndex/Haystack/Agno wrapper 测试；本次未运行测试，只核实测试文件存在（来源：repo tree；turbovec/tests；turbovec-python/tests）。"
  key_claims_evidence:
    summary: ""
    body_md: "下面把 README/benchmark 的自称和从源码核实的事实分开。benchmark 数字即使来自仓库内 JSON，也仍然按“项目自称”处理，因为本次没有复现实验。"
    items:
      - claim: "README 自称：`A 10 million document corpus takes 31 GB of RAM as float32. turbovec fits it in 4 GB - and searches it faster than FAISS.`"
        plain_english: "作者想解决的是大规模 embedding 的内存占用和本地检索速度。"
        source: "README opening claim"
        attribution: "自称"
        evidence_strength: "low"
        supports: "README 给出 10 million、31 GB、4 GB、FAISS 这些具体对比词。"
        does_not_support: "本次未复现 10 million corpus，也未验证“faster than FAISS”的外部可重复性。"
        threat: "benchmark 环境、数据集、FAISS 参数和硬件都会影响结论。"
      - claim: "仓库内 benchmark 结果记录：`openai_d1536_4bit` 的 `fp32_mb` 为 `585.9`、`index_mb` 为 `73.6`、`ratio` 为 `8.0`；`openai_d3072_2bit` 的 `fp32_mb` 为 `1171.9`、`index_mb` 为 `73.6`、`ratio` 为 `15.9`。"
        plain_english: "在仓库提交的结果文件里，4-bit 大约对应 8 倍压缩，2-bit 大约对应 16 倍压缩量级。"
        source: "benchmarks/results/compression.json"
        attribution: "自称"
        evidence_strength: "medium"
        supports: "具体 JSON 数字存在于 upstream checkout。"
        does_not_support: "未证明这些数字来自最新代码重新跑出的结果。"
        threat: "结果文件可能滞后于实现，或者只覆盖作者选择的数据集。"
      - claim: "核心 API 已核实：`TurboQuantIndex` 是 positional index，`IdMapIndex` 是 stable external `u64` IDs on top of `TurboQuantIndex`。"
        plain_english: "如果你只要内部数组位置，用 `TurboQuantIndex`；如果删除后外部文档 ID 还要稳定，用 `IdMapIndex`。"
        source: "docs/api.md TurboQuantIndex / IdMapIndex；turbovec/src/id_map.rs"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`id_map.rs` 里有 `slot_to_id: Vec<u64>` 和 `id_to_slot: HashMap<u64, usize>`；`remove(id)` 调用内部 `swap_remove` 后同步两张表。"
        does_not_support: "不支持字符串 ID 直接进内核；LangChain/LlamaIndex wrapper 自己维护 string 到 u64 的 side map。"
        threat: "调用方仍要管理原始文档文本、metadata、embedding 模型版本。"
      - claim: "过滤搜索已核实：Python `IdMapIndex.search(..., allowlist=...)` 会校验空 allowlist 和未知 id；Rust `search_with_allowlist` 把外部 ID 转成 slot bool mask；核心搜索再打包成 `u64` bitset。"
        plain_english: "SQL/BM25/ACL 先给一批候选 ID，再让向量搜索只在这批 ID 里排 top-k。"
        source: "turbovec-python/src/lib.rs IdMapIndex.search；turbovec/src/id_map.rs search_with_allowlist；turbovec/src/lib.rs search_with_mask"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "源码中空 allowlist 抛 `ValueError(\"allowlist is empty\")`，未知 id 抛 `KeyError`；Rust 侧用 `mask[slot] = true`，再由 `search_with_mask` 打包到 `Vec<u64>`。"
        does_not_support: "不等于完整 SQL filter engine；复杂 metadata 条件由外层框架或数据库先解析成候选 ID。"
        threat: "allowlist 很大时仍需在调用侧构造和传输候选集合。"
      - claim: "内核级 block skip 已核实：`BLOCK = 32`，`block_has_allowed` 检查 32-vector block 是否有允许 slot；无允许 slot 时增加 `BLOCKS_SKIPPED_BY_MASK` 并跳过。"
        plain_english: "过滤很窄时，不只是算完再丢，而是整块不算。"
        source: "turbovec/src/search.rs block_has_allowed；turbovec/tests/filtering.rs block_skip_path_actually_fires_under_selective_mask"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`block_has_allowed(mask, base_vec)` 对 packed mask 做 32-bit window 检查；测试用 4096 vectors、只允许最后 40 slots，断言 skip delta `>= 50`。"
        does_not_support: "不证明所有真实业务 filter 都能获得同等加速。"
        threat: "候选 ID 分布如果覆盖大多数 block，skip 收益会下降。"
      - claim: "编码流程已核实：`encode.rs` 先 normalize，再 rotate，再 TQ+ calibration，再 quantize/pack，并存 `scale = ||v|| / <u_rot, x_hat_orig>`。"
        plain_english: "它不保存原始 float32 向量；它保存压缩 code 和一个用于修正分数的 per-vector scale。"
        source: "turbovec/src/encode.rs module docs and encode function"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`TQPLUS_P_LO = 0.05`、`TQPLUS_P_HI = 0.95`、`TQPLUS_MIN_SAMPLES = 1000`；packed size 由 `bytes_per_row = bit_width * (dim / 8)` 得出。"
        does_not_support: "不支持从索引精确恢复原始 embedding；integration docs 明确 MMR/get embedding 相关能力受限。"
        threat: "低样本首批 add 会走 identity calibration，后续 add 复用第一次校准策略。"
      - claim: "SIMD/平台路径已核实：x86 搜索运行时在 AVX-512BW+AVX512F、AVX2、scalar fallback 之间分派；aarch64 有 NEON 路径；`.cargo/config.toml` 对 x86_64 设置 `target-cpu=x86-64-v3`。"
        plain_english: "性能依赖 CPU 指令集；现代 x86 会走 AVX2/AVX-512，ARM 会走 NEON。"
        source: "turbovec/src/search.rs x86 dispatch；.cargo/config.toml；turbovec/build.rs"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "源码调用 `is_x86_feature_detected!(\"avx512bw\")`、`is_x86_feature_detected!(\"avx512f\")`、`is_x86_feature_detected!(\"avx2\")`；config 注释写 x86-64-v3 是 AVX2 baseline。"
        does_not_support: "不保证旧 x86_64、受限 VM 或非主流 CPU 上的性能/可运行性。"
        threat: "编译目标与运行硬件不匹配会成为部署风险。"
      - claim: "文件格式源码已核实为 v3：`.tv` 写入 magic `TVPI` + version `3`，`.tvim` 写入 magic `TVIM` + version `3`，v3 在 core payload 后追加 TQ+ trailer。"
        plain_english: "当前源码写出的文件不是 docs/api.md 里旧图示的裸 9-byte `.tv` header。"
        source: "turbovec/src/io.rs；CHANGELOG.md On-disk format version bumped to 3；docs/api.md File formats"
        attribution: "已核实"
        evidence_strength: "high"
        supports: "`io.rs` 定义 `TV_MAGIC = b\"TVPI\"`、`TV_VERSION = 3`、`TVIM_VERSION = 3`；`write_core` 写 `n_calib`、`tqplus_shift`、`tqplus_scale`。"
        does_not_support: "docs/api.md 的 `.tv` 9-byte header 和 `.tvim version = 1` 表述与源码不一致。"
        threat: "用户按 docs/api.md 手写 reader/writer 会读错当前文件格式。"
  how_it_works:
    summary: ""
    body_md: "人话流程：假设你有 1536 维 embedding 和业务文档 ID。Python 侧用 `idx = IdMapIndex(dim=1536, bit_width=4)`，再 `idx.add_with_ids(vectors, np.array([1001, 1002, 1003], dtype=np.uint64))`。搜索时可以直接 `idx.search(query, k=10)`，也可以先从 SQL 拿候选：`allowed = ... SELECT id FROM docs WHERE tenant=? ...`，再 `idx.search(query, k=10, allowlist=allowed)`（来源：README Python；README Hybrid retrieval）。\n\n源码路径：`turbovec-python/src/lib.rs` 接收 `PyReadonlyArray2<f32>` 和 `PyReadonlyArray1<u64>`，要求数组 C-contiguous；`add_with_ids` 调 `turbovec_core::IdMapIndex::add_with_ids_2d`。`turbovec/src/id_map.rs` 先检查 `ids.len() == vectors.len()/dim` 和重复 ID，再调用内部 `TurboQuantIndex.add_2d`，成功后才写 `id_to_slot` 和 `slot_to_id`，避免 inner add 失败后留下 ghost ID（来源：turbovec-python/src/lib.rs add_with_ids；turbovec/src/id_map.rs add_with_ids_2d）。\n\n编码路径：`turbovec/src/encode.rs` 对每行向量计算 norm、归一化、乘同一个 rotation matrix；如果首批样本数 `n >= 1000`，TQ+ 用每个坐标的经验 5%/95% 分位去拟合 `shift` 和 `scale`，否则返回 identity calibration；随后按 Lloyd-Max boundaries 把每维变成小整数 code，并按 `bytes_per_row = bit_width * (dim / 8)` bit-pack（来源：turbovec/src/encode.rs encode；compute_tqplus_calibration）。\n\n搜索路径：allowlist 搜索先在 Python 侧拒绝空 allowlist 和未知 id；Rust `IdMapIndex.search_with_allowlist` 把外部 `u64` id 映射到 slot bool mask；`TurboQuantIndex.search_with_mask` 再把 bool mask 打成每 64 slot 一个 `u64` 的 bitset。`search.rs` 对 query 做 batched rotation，用 query LUT 和 packed codes 直接计分；x86 运行时选择 AVX-512BW、AVX2 或 scalar fallback；有 mask 时，`block_has_allowed` 在 32-vector block 级别提前跳过没有允许 slot 的 block，最后返回外部 id（来源：turbovec/src/id_map.rs search_with_allowlist；turbovec/src/lib.rs search_with_mask；turbovec/src/search.rs search/block_has_allowed）。\n\n术语解释：slot 是内部数组位置；external id 是调用方给的稳定 `u64` 文档 ID；LUT 是把 query 与 quantized codebook 的分数预先做成查表；SIMD 是 CPU 一条指令同时处理多组 code。"
  reusable_abstractions:
    summary: ""
    body_md: "这些模式比具体 TurboQuant 算法更容易复用到别的 AI 基建里。"
    items:
      - name: "稳定 ID 包装层"
        copy: "把高速 positional index 留在内层，外层维护 `slot_to_id` 和 `id_to_slot`，删除时同步 swap-remove 后的 moved id。"
        skip: "如果底层存储原生支持稳定主键，或者删除会保序移动大量元素，就不需要这层。"
        why_it_matters: "RAG 文档 ID 必须稳定；`IdMapIndex.remove(id)` 的 O(1) 路径把性能和产品语义拆开了（来源：turbovec/src/id_map.rs）。"
      - name: "候选集先解析、内核只接 bitset"
        copy: "把 SQL/BM25/ACL/time-window 等复杂条件在外部解析成 ID allowlist，核心向量内核只处理 packed bitset。"
        skip: "如果项目需要原生复杂 metadata 查询、范围索引、分布式过滤，直接用向量数据库更合适。"
        why_it_matters: "接口保持小，仍避免 post-filter 丢 top-k；`block_has_allowed` 能在 32-vector block 级别跳过计算（来源：README Hybrid retrieval；turbovec/src/search.rs）。"
      - name: "首次 add 锁定维度"
        copy: "允许 `dim=None` 的 lazy constructor，首次 `add`/`add_with_ids` 从输入 shape 锁定 dim。"
        skip: "如果系统必须在建索引前做严格 schema validation，显式 dim 更清晰。"
        why_it_matters: "框架 wrapper 不必提前知道 embedding 模型维度，LangChain/LlamaIndex/Haystack docs 都使用了这个 ergonomics（来源：docs/api.md；docs/integrations/langchain.md；docs/integrations/llama_index.md）。"
      - name: "二进制索引 + JSON side-car"
        copy: "向量索引用 `.tvim`，文档文本、metadata、string-id map 用 `docstore.json` 或 `{stem}.nodes.json`。"
        skip: "如果需要事务、并发写、多进程一致性，这种文件组合不够。"
        why_it_matters: "避免 pickle/危险反序列化，同时让 framework store 保留文档 payload（来源：docs/integrations/langchain.md Save/load；docs/integrations/llama_index.md Persist/load；docs/integrations/haystack.md Save/load）。"
      - name: "文档化的“不支持”"
        copy: "对 MMR、full-precision embedding recovery、非默认 LlamaIndex query mode 等不可实现能力直接 raise `NotImplementedError`。"
        skip: "不要用静默 fallback 伪装支持。"
        why_it_matters: "压缩索引丢弃原始向量，MMR 需要候选之间的全精度向量；明确失败比返回误导结果更安全（来源：docs/integrations/langchain.md Known limitations；turbovec-python/python/turbovec/langchain.py）。"
  dependency_platform_risk:
    summary: ""
    body_md: "主要风险不在 API 会不会存在，而在原生扩展、CPU 指令集、BLAS 链接、文件格式和框架版本漂移。"
    items:
      - dependency: "x86 SIMD baseline / AVX2 / AVX-512BW"
        what_if_change: "老 x86_64、隐藏 AVX2 的 VM 或不符合 x86-64-v3 的机器会影响运行或性能；AVX-512 只在运行时检测后启用。"
        exposure: "high"
        mitigation_or_unknown: "源码有 scalar fallback 分支，但 `.cargo/config.toml` 明确把 x86_64 编译目标设为 `x86-64-v3`；pre-AVX2 部署策略未在 README 说明。"
        source: ".cargo/config.toml；turbovec/src/search.rs x86 dispatch"
      - dependency: "BLAS provider: Linux OpenBLAS / macOS Accelerate"
        what_if_change: "Linux 缺少 OpenBLAS 或 wheel 打包错误会导致 import/link 失败；macOS 走 Accelerate；Windows 按 build.rs 注释落到 ndarray pure-Rust fallback。"
        exposure: "medium"
        mitigation_or_unknown: "build.rs 发出 `cargo:rustc-link-lib=openblas` 或 `framework=Accelerate`；CHANGELOG 记录过 Linux wheel 缺 `libopenblas` 的问题已修。"
        source: "turbovec/build.rs；CHANGELOG.md turbovec 0.5.3 Python package"
      - dependency: "Python native extension: maturin + pyo3 + numpy"
        what_if_change: "Python 包不是纯 Python；构建和 ABI 依赖 Rust extension、NumPy 和平台 wheel。"
        exposure: "medium"
        mitigation_or_unknown: "`pyproject.toml` 使用 `maturin>=1.12,<2.0`，`pyo3` 开启 `abi3-py39`，Python 要求 `>=3.9`，依赖 `numpy>=1.20`。"
        source: "turbovec-python/pyproject.toml；turbovec-python/Cargo.toml"
      - dependency: "framework extras: LangChain / LlamaIndex / Haystack / Agno"
        what_if_change: "这些框架的接口变动会让 drop-in wrapper 失配，尤其是过滤语义、persist 格式和 async 方法。"
        exposure: "medium"
        mitigation_or_unknown: "pyproject 只声明下限：`langchain-core>=0.3`、`llama-index-core>=0.11`、`haystack-ai>=2.0`、`agno>=2.0`；未锁定上限。"
        source: "turbovec-python/pyproject.toml optional-dependencies；docs/integrations/*.md"
      - dependency: "`.tv` / `.tvim` file format"
        what_if_change: "当前源码写 v3；v2 可读为 identity calibration；v1 被拒绝。docs/api.md 仍描述旧的 `.tv` 9-byte header 和 `.tvim version = 1`，会误导自写 reader。"
        exposure: "medium"
        mitigation_or_unknown: "以 `turbovec/src/io.rs` 和 CHANGELOG 为准；不要按 docs/api.md 手写格式解析，除非先确认文档已更新。"
        source: "turbovec/src/io.rs；CHANGELOG.md On-disk format version bumped to 3；docs/api.md File formats"
  unknowns_to_confirm:
    summary: ""
    body_md: "这些不是负面结论，而是 README/docs/tree/source 没法完全确认的点。"
    items:
      - "本次未运行 `cargo test`、`pytest`、benchmark 或 `maturin build`；可运行性按源码和配置判断，未做本机验证。"
      - "README 的 FAISS 性能结论、10 million/31 GB/4 GB 结论、ARM 12-20% 结论和 x86 1-6% 结论没有在本次复现实验中验证，只能写为自称。"
      - "docs/api.md 写 Python `bit_width ∈ {2, 4}`，但 Rust/Python 构造器通过核心 `new` 接受 `2..=4`，CHANGELOG 也写 `{2, 3, 4}`；3-bit 的公开支持口径需确认。"
      - "docs/api.md 的文件格式段落与 `turbovec/src/io.rs` 当前 v3 magic/version/TQ+ trailer 不一致；文档是否已计划更新未知。"
      - "没有在 README/docs 中看到分布式索引、多进程并发写、事务、GPU、云服务、原生 BM25/lexical index 的实现说明。"
      - "embedding 模型版本管理、文档 chunking、metadata schema、tenant ACL 由外部系统负责；仓库没有提供端到端 RAG 数据治理方案。"
  judgment:
    action: "clone-and-run"
    ratings:
      相关度: 4
      工程深度: 4
      复用价值: 4
      成熟度: 3
    body_md: "结论：值得继续 clone-and-run，尤其是你在做本地 RAG、离线部署、候选集 rerank、内存压缩，且不想引入服务化向量数据库时。\n\n扣分点也明确：Python package classifier 是 `Development Status :: 3 - Alpha`；README 性能结论需要自己复现；docs/api.md 和源码在 bit_width/文件格式上有漂移。工程上最可复用的是 `IdMapIndex`、allowlist-to-bitset、block skip、JSON side-car，以及对不可支持能力直接 fail 的 wrapper 设计。"
authoring:
  method: "codex-exec"
  model: "gpt-5.5"
  model_reasoning_effort: "high"
  command: "\"C:\\\\Program Files\\\\nodejs\\\\node.exe\" \"C:\\\\Users\\\\Ykw18\\\\AppData\\\\Roaming\\\\npm\\\\node_modules\\\\@openai\\\\codex\\\\bin\\\\codex.js\" exec -c model_reasoning_effort=\"high\" -m gpt-5.5 -s danger-full-access -C \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\" --color never --output-last-message \"C:\\\\Users\\\\Ykw18\\\\OneDrive\\\\Desktop\\\\Study\\\\Project\\\\AI-Brief v2\\\\logs\\\\codex-deepdive-20260608-backlog-12\\\\ryancodrai-turbovec\\\\codex-last-message.json\" -"
  prompt: "logs\\codex-deepdive-20260608-backlog-12\\ryancodrai-turbovec\\prompt.md"
  raw_response: "logs\\codex-deepdive-20260608-backlog-12\\ryancodrai-turbovec\\codex-last-message.json"
  invoked_at: "2026-06-08T14:14:27.047Z"
  completed_at: "2026-06-08T14:18:49.324Z"
  repo: "RyanCodrai/turbovec"
reasoning_trace:
  paper_type_decision: "project_type = library_sdk; evidence from README/artifactAudit only."
  central_contribution: "A vector index built on TurboQuant, written in Rust with Python bindings"
  inspected:
    - "README"
    - "artifactAudit"
  top_claims:
    - "README 自称：`A 10 million document corpus takes 31 GB of RAM as float32. turbovec fits it in 4 GB - and searches it faster than FAISS.`"
    - "仓库内 benchmark 结果记录：`openai_d1536_4bit` 的 `fp32_mb` 为 `585.9`、`index_mb` 为 `73.6`、`ratio` 为 `8.0`；`openai_d3072_2bit` 的 `fp32_mb` 为 `1171.9`、`index_mb` 为 `73.6`、`ratio` 为 `15.9`。"
    - "核心 API 已核实：`TurboQuantIndex` 是 positional index，`IdMapIndex` 是 stable external `u64` IDs on top of `TurboQuantIndex`。"
  evidence_needed:
    - "README statements"
    - "artifactAudit fields"
  main_threats:
    - ".cargo/config.toml；turbovec/src/search.rs x86 dispatch"
    - "turbovec/build.rs；CHANGELOG.md turbovec 0.5.3 Python package"
    - "turbovec-python/pyproject.toml；turbovec-python/Cargo.toml"
    - "turbovec-python/pyproject.toml optional-dependencies；docs/integrations/*.md"
    - "turbovec/src/io.rs；CHANGELOG.md On-disk format version bumped to 3；docs/api.md File formats"
  transfer_decision: "未在 README/artifact 说明"
project_verdict:
  verdict: "clone_and_run"
  relevance_to_ai_engineer: 4
  engineering_depth: 4
  reuse_value: 4
  maturity: 3
  main_risk: "结论：值得继续 clone-and-run，尤其是你在做本地 RAG、离线部署、候选集 rerank、内存压缩，且不想引入服务化向量数据库时。 扣分点也明确：Python package classifier 是 `Development Status :: 3 - Alpha`；README 性能结论需要自己复现；docs/api.md 和源码在 bit_width/文件格式上有漂移。工程上最可复用的是 `IdMapIndex`、allowlist-to-bitset、block skip、JSON side-car，以及对不可支持能力直接 fail 的 wrapper 设计。"
next_actions:
  - "clone-and-run"
unknowns:
  - "本次未运行 `cargo test`、`pytest`、benchmark 或 `maturin build`；可运行性按源码和配置判断，未做本机验证。"
  - "README 的 FAISS 性能结论、10 million/31 GB/4 GB 结论、ARM 12-20% 结论和 x86 1-6% 结论没有在本次复现实验中验证，只能写为自称。"
  - "docs/api.md 写 Python `bit_width ∈ {2, 4}`，但 Rust/Python 构造器通过核心 `new` 接受 `2..=4`，CHANGELOG 也写 `{2, 3, 4}`；3-bit 的公开支持口径需确认。"
  - "docs/api.md 的文件格式段落与 `turbovec/src/io.rs` 当前 v3 magic/version/TQ+ trailer 不一致；文档是否已计划更新未知。"
  - "没有在 README/docs 中看到分布式索引、多进程并发写、事务、GPU、云服务、原生 BM25/lexical index 的实现说明。"
  - "embedding 模型版本管理、文档 chunking、metadata schema、tenant ACL 由外部系统负责；仓库没有提供端到端 RAG 数据治理方案。"
builder_reuse:
  pattern: "稳定 ID 包装层"
  copy: "把高速 positional index 留在内层，外层维护 `slot_to_id` 和 `id_to_slot`，删除时同步 swap-remove 后的 moved id。"
  skip: "如果底层存储原生支持稳定主键，或者删除会保序移动大量元素，就不需要这层。"
  why_it_matters: "RAG 文档 ID 必须稳定；`IdMapIndex.remove(id)` 的 O(1) 路径把性能和产品语义拆开了（来源：turbovec/src/id_map.rs）。"
dependency_platform_risk:
  dependency: "x86 SIMD baseline / AVX2 / AVX-512BW"
  what_if_change: "老 x86_64、隐藏 AVX2 的 VM 或不符合 x86-64-v3 的机器会影响运行或性能；AVX-512 只在运行时检测后启用。"
  exposure: "high"
  mitigation_or_unknown: "源码有 scalar fallback 分支，但 `.cargo/config.toml` 明确把 x86_64 编译目标设为 `x86-64-v3`；pre-AVX2 部署策略未在 README 说明。"
claim_ledger:
  - claim: "README 自称：`A 10 million document corpus takes 31 GB of RAM as float32. turbovec fits it in 4 GB - and searches it faster than FAISS.`"
    plain_english: "作者想解决的是大规模 embedding 的内存占用和本地检索速度。"
    source: "README opening claim"
    attribution: "自称"
    evidence_strength: "low"
    supports: "README 给出 10 million、31 GB、4 GB、FAISS 这些具体对比词。"
    does_not_support: "本次未复现 10 million corpus，也未验证“faster than FAISS”的外部可重复性。"
    threat: "benchmark 环境、数据集、FAISS 参数和硬件都会影响结论。"
  - claim: "仓库内 benchmark 结果记录：`openai_d1536_4bit` 的 `fp32_mb` 为 `585.9`、`index_mb` 为 `73.6`、`ratio` 为 `8.0`；`openai_d3072_2bit` 的 `fp32_mb` 为 `1171.9`、`index_mb` 为 `73.6`、`ratio` 为 `15.9`。"
    plain_english: "在仓库提交的结果文件里，4-bit 大约对应 8 倍压缩，2-bit 大约对应 16 倍压缩量级。"
    source: "benchmarks/results/compression.json"
    attribution: "自称"
    evidence_strength: "medium"
    supports: "具体 JSON 数字存在于 upstream checkout。"
    does_not_support: "未证明这些数字来自最新代码重新跑出的结果。"
    threat: "结果文件可能滞后于实现，或者只覆盖作者选择的数据集。"
  - claim: "核心 API 已核实：`TurboQuantIndex` 是 positional index，`IdMapIndex` 是 stable external `u64` IDs on top of `TurboQuantIndex`。"
    plain_english: "如果你只要内部数组位置，用 `TurboQuantIndex`；如果删除后外部文档 ID 还要稳定，用 `IdMapIndex`。"
    source: "docs/api.md TurboQuantIndex / IdMapIndex；turbovec/src/id_map.rs"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`id_map.rs` 里有 `slot_to_id: Vec<u64>` 和 `id_to_slot: HashMap<u64, usize>`；`remove(id)` 调用内部 `swap_remove` 后同步两张表。"
    does_not_support: "不支持字符串 ID 直接进内核；LangChain/LlamaIndex wrapper 自己维护 string 到 u64 的 side map。"
    threat: "调用方仍要管理原始文档文本、metadata、embedding 模型版本。"
  - claim: "过滤搜索已核实：Python `IdMapIndex.search(..., allowlist=...)` 会校验空 allowlist 和未知 id；Rust `search_with_allowlist` 把外部 ID 转成 slot bool mask；核心搜索再打包成 `u64` bitset。"
    plain_english: "SQL/BM25/ACL 先给一批候选 ID，再让向量搜索只在这批 ID 里排 top-k。"
    source: "turbovec-python/src/lib.rs IdMapIndex.search；turbovec/src/id_map.rs search_with_allowlist；turbovec/src/lib.rs search_with_mask"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "源码中空 allowlist 抛 `ValueError(\"allowlist is empty\")`，未知 id 抛 `KeyError`；Rust 侧用 `mask[slot] = true`，再由 `search_with_mask` 打包到 `Vec<u64>`。"
    does_not_support: "不等于完整 SQL filter engine；复杂 metadata 条件由外层框架或数据库先解析成候选 ID。"
    threat: "allowlist 很大时仍需在调用侧构造和传输候选集合。"
  - claim: "内核级 block skip 已核实：`BLOCK = 32`，`block_has_allowed` 检查 32-vector block 是否有允许 slot；无允许 slot 时增加 `BLOCKS_SKIPPED_BY_MASK` 并跳过。"
    plain_english: "过滤很窄时，不只是算完再丢，而是整块不算。"
    source: "turbovec/src/search.rs block_has_allowed；turbovec/tests/filtering.rs block_skip_path_actually_fires_under_selective_mask"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`block_has_allowed(mask, base_vec)` 对 packed mask 做 32-bit window 检查；测试用 4096 vectors、只允许最后 40 slots，断言 skip delta `>= 50`。"
    does_not_support: "不证明所有真实业务 filter 都能获得同等加速。"
    threat: "候选 ID 分布如果覆盖大多数 block，skip 收益会下降。"
  - claim: "编码流程已核实：`encode.rs` 先 normalize，再 rotate，再 TQ+ calibration，再 quantize/pack，并存 `scale = ||v|| / <u_rot, x_hat_orig>`。"
    plain_english: "它不保存原始 float32 向量；它保存压缩 code 和一个用于修正分数的 per-vector scale。"
    source: "turbovec/src/encode.rs module docs and encode function"
    attribution: "已核实"
    evidence_strength: "high"
    supports: "`TQPLUS_P_LO = 0.05`、`TQPLUS_P_HI = 0.95`、`TQPLUS_MIN_SAMPLES = 1000`；packed size 由 `bytes_per_row = bit_width * (dim / 8)` 得出。"
    does_not_support: "不支持从索引精确恢复原始 embedding；integration docs 明确 MMR/get embedding 相关能力受限。"
    threat: "低样本首批 add 会走 identity calibration，后续 add 复用第一次校准策略。"
artifact_audit:
  official_repo: "https://github.com/RyanCodrai/turbovec"
  official_data: "not_found"
  evaluation_code: "not_found"
  prompts_or_rubrics: "not_found"
  benchmark_tasks: "not_found"
  model_checkpoints: "not_found"
  appendix: "not_found"
  license: "MIT"
  minimal_demo: "artifactAudit.has_examples/has_docs=true"
  closed_dependencies: []
  third_party_dependencies: []
  broken_links: []
  hardware: "未在 README/artifact 说明"
  reproducibility_status: "partial"
---

## [Tier 3｜真·新项目]（来源：README/artifactAudit）

## 一句话定位

RyanCodrai/turbovec：GitHub 描述为“A vector index built on TurboQuant, written in Rust with Python bindings”。

（来源：README/artifactAudit）

## 干什么

A vector index built on TurboQuant, written in Rust with Python bindings

（来源：README/artifactAudit）

## 元数据

| 项 | 值 |
| --- | --- |
| language | Python |
| total_stars | 7952 |
| stars_in_period | 1554 |
| author | RyanCodrai |

## 标签

- Tier 3（来源：数据不足）
- 真·新项目（来源：数据不足）
- models（来源：数据不足）
- docs（来源：数据不足）
- deep（来源：数据不足）

## 解决什么痛点

人话：这个项目值得看，不是因为 README 说“更快”，而是因为它把压缩、稳定 ID、过滤、Python/Rust 双接口和四个 RAG 框架适配放在同一个小型库里。它对本地、离线、内存敏感的 RAG 管线有直接工程价值。 术语：它属于 in-process vector index，不是 client/server vector database；它的过滤路径是 kernel-level filtering，不是先搜很多再在 Python 里丢结果。

（来源：README/artifactAudit）

## 核心能力

- 稳定 ID 包装层（来源：数据不足）
- 候选集先解析、内核只接 bitset（来源：数据不足）
- 首次 add 锁定维度（来源：数据不足）

## 怎么跑起来

- 安装命令：数据不足（来源：README/artifactAudit）
- 最小可运行示例：数据不足（来源：README/artifactAudit）

## 成熟度信号

| 项 | 值 |
| --- | --- |
| 数据不足 | 数据不足 |

## 和同类的区别

FAISS：turbovec README 直接把 FAISS `IndexPQ`/`IndexPQFastScan` 当基线。FAISS 官方 `IndexPQ` API 有 `train(n, x)`，并支持 `sa_encode`/`sa_decode`、`add_with_ids` 等更成熟的索引生态（来源：FAISS IndexPQ docs https://faiss.ai/cpp_api/struct/structfaiss_1_1IndexPQ.html）。取舍：如果你要成熟、多索引类型、GPU/生态和长期基线，先选 FAISS；如果你要本地 Python/Rust 小库、无单独 train phase、压缩后直接接 LangChain/LlamaIndex/Haystack/Agno，并且过滤候选来自外部系统，可以看 turbovec。README 里的速度胜出仍按项目自称处理。 LanceDB：LanceDB 官方 quickstart 说 OSS 是 embedded database，像 SQLite 一样 in-process，并支持 local path、object storage URI、Enterprise `db://`（来源：LanceDB Quickstart https://docs.lancedb.com/quickstart）。它还提供 brute force 和 ANN 搜索路径（来源：LanceDB Vector Search https://docs.lancedb.com/search/vector-search）。取舍：如果你要表格式存储、对象存储、完整数据库体验和更宽的数据管理面，选 LanceDB；如果你只要压缩向量索引嵌入现有应用，且文档/metadata 已由别处管理，turbovec 更轻。 Qdrant：Qdrant 官方文档定位为 AI-native vector search / semantic search engine，并有 filtering、hybrid queries、payload、collections、quantization、multitenancy 等服务化能力（来源：Qdrant docs https://qdrant.tech/documentation/；Qdrant filtering docs https://qdrant.tech/documentation/search/filtering/）。取舍：如果你要服务端、集合管理、payload filter、多租户、运维工具，选 Qdrant；如果你需要无网络、本地进程内、只把外部系统的 candidate IDs 交给向量 rerank，turbovec 的边界更窄也更简单。

## 轨迹备注

数据不足

（来源：README/artifactAudit）

## 它怎么工作 + 类比

人话流程：假设你有 1536 维 embedding 和业务文档 ID。Python 侧用 `idx = IdMapIndex(dim=1536, bit_width=4)`，再 `idx.add_with_ids(vectors, np.array([1001, 1002, 1003], dtype=np.uint64))`。搜索时可以直接 `idx.search(query, k=10)`，也可以先从 SQL 拿候选：`allowed = ... SELECT id FROM docs WHERE tenant=? ...`，再 `idx.search(query, k=10, allowlist=allowed)`（来源：README Python；README Hybrid retrieval）。 源码路径：`turbovec-python/src/lib.rs` 接收 `PyReadonlyArray2<f32>` 和 `PyReadonlyArray1<u64>`，要求数组 C-contiguous；`add_with_ids` 调 `turbovec_core::IdMapIndex::add_with_ids_2d`。`turbovec/src/id_map.rs` 先检查 `ids.len() == vectors.len()/dim` 和重复 ID，再调用内部 `TurboQuantIndex.add_2d`，成功后才写 `id_to_slot` 和 `slot_to_id`，避免 inner add 失败后留下 ghost ID（来源：turbovec-python/src/lib.rs add_with_ids；turbovec/src/id_map.rs add_with_ids_2d）。 编码路径：`turbovec/src/encode.rs` 对每行向量计算 norm、归一化、乘同一个 rotation matrix；如果首批样本数 `n >= 1000`，TQ+ 用每个坐标的经验 5%/95% 分位去拟合 `shift` 和 `scale`，否则返回 identity calibration；随后按 Lloyd-Max boundaries 把每维变成小整数 code，并按 `bytes_per_row = bit_width * (dim / 8)` bit-pack（来源：turbovec/src/encode.rs encode；compute_tqplus_calibration）。 搜索路径：allowlist 搜索先在 Python 侧拒绝空 allowlist 和未知 id；Rust `IdMapIndex.search_with_allowlist` 把外部 `u64` id 映射到 slot bool mask；`TurboQuantIndex.search_with_mask` 再把 bool mask 打成每 64 slot 一个 `u64` 的 bitset。`search.rs` 对 query 做 batched rotation，用 query LUT 和 packed codes 直接计分；x86 运行时选择 AVX-512BW、AVX2 或 scalar fallback；有 mask 时，`block_has_allowed` 在 32-vector block 级别提前跳过没有允许 slot 的 block，最后返回外部 id（来源：turbovec/src/id_map.rs search_with_allowlist；turbovec/src/lib.rs search_with_mask；turbovec/src/search.rs search/block_has_allowed）。 术语解释：slot 是内部数组位置；external id 是调用方给的稳定 `u64` 文档 ID；LUT 是把 query 与 quantized codebook 的分数预先做成查表；SIMD 是 CPU 一条指令同时处理多组 code。

## 本质不同的设计取舍

这些模式比具体 TurboQuant 算法更容易复用到别的 AI 基建里。 - 稳定 ID 包装层；把高速 positional index 留在内层，外层维护 `slot_to_id` 和 `id_to_slot`，删除时同步 swap-remove 后的 moved id。；如果底层存储原生支持稳定主键，或者删除会保序移动大量元素，就不需要这层。；RAG 文档 ID 必须稳定；`IdMapIndex.remove(id)` 的 O(1) 路径把性能和产品语义拆开了（来源：turbovec/src/id_map.rs）。 - 候选集先解析、内核只接 bitset；把 SQL/BM25/ACL/time-window 等复杂条件在外部解析成 ID allowlist，核心向量内核只处理 packed bitset。；如果项目需要原生复杂 metadata 查询、范围索引、分布式过滤，直接用向量数据库更合适。；接口保持小，仍避免 post-filter 丢 top-k；`block_has_allowed` 能在 32-vector block 级别跳过计算（来源：README Hybrid retrieval；turbovec/src/search.rs）。 - 首次 add 锁定维度；允许 `dim=None` 的 lazy constructor，首次 `add`/`add_with_ids` 从输入 shape 锁定 dim。；如果系统必须在建索引前做严格 schema validation，显式 dim 更清晰。；框架 wrapper 不必提前知道 embedding 模型维度，LangChain/LlamaIndex/Haystack docs 都使用了这个 ergonomics（来源：docs/api.md；docs/integrations/langchain.md；docs/integrations/llama_index.md）。 - 二进制索引 + JSON side-car；向量索引用 `.tvim`，文档文本、metadata、string-id map 用 `docstore.json` 或 `{stem}.nodes.json`。；如果需要事务、并发写、多进程一致性，这种文件组合不够。；避免 pickle/危险反序列化，同时让 framework store 保留文档 payload（来源：docs/integrations/langchain.md Save/load；docs/integrations/llama_index.md Persist/load；docs/integrations/haystack.md Save/load）。 - 文档化的“不支持”；对 MMR、full-precision embedding recovery、非默认 LlamaIndex query mode 等不可实现能力直接 raise `NotImplementedError`。；不要用静默 fallback 伪装支持。；压缩索引丢弃原始向量，MMR 需要候选之间的全精度向量；明确失败比返回误导结果更安全（来源：docs/integrations/langchain.md Known limitations；turbovec-python/python/turbovec/langchain.py）。

## 对从业者意味着什么

结论：值得继续 clone-and-run，尤其是你在做本地 RAG、离线部署、候选集 rerank、内存压缩，且不想引入服务化向量数据库时。 扣分点也明确：Python package classifier 是 `Development Status :: 3 - Alpha`；README 性能结论需要自己复现；docs/api.md 和源码在 bit_width/文件格式上有漂移。工程上最可复用的是 `IdMapIndex`、allowlist-to-bitset、block skip、JSON side-car，以及对不可支持能力直接 fail 的 wrapper 设计。

（来源：README/artifactAudit）

## 交叉链接

- 未在 README/artifact 说明

可复用范式落库:[[concepts/ryancodrai-turbovec-turboquant-vector-quantization]]、[[concepts/ryancodrai-turbovec-id-mapped-vector-index]]。另见 [[content/ryancodrai-turbovec]]、[[claims/ryancodrai-turbovec-main-claim]]。

---
content: "ryancodrai-turbovec"
kind: "evidence-pack"
title: "turbovec — Evidence Pack"
technical_objects:
  - name: "README/artifact 中说明的核心项目对象"
    type: "API"
    input: "未在 README/artifact 说明"
    output: "未在 README/artifact 说明"
    role: "turbovec 是一个 Rust 写的本地向量索引库，提供 Python 绑定，用 TurboQuant/TQ+ 把 embedding 压到 2-4 bit/维，并重点支持带 allowlist/mask 的过滤式检索。"
    internal_logic: "人话流程：假设你有 1536 维 embedding 和业务文档 ID。Python 侧用 `idx = IdMapIndex(dim=1536, bit_width=4)`，再 `idx.add_with_ids(vectors, np.array([1001, 1002, 1003], dtype=np.uint64))`。搜索时可以直接 `idx.search(query, k=10)`，也可以先从 SQL 拿候选：`allowed = ... SELECT id FROM docs WHERE tenant=? ...`，再 `idx.search(query, k=10, allowlist=allowed)`（来源：README Python；README Hybrid retrieval）。\n\n源码路径：`turbovec-python/src/lib.rs` 接收 `PyReadonlyArray2<f32>` 和 `PyReadonlyArray1<u64>`，要求数组 C-contiguous；`add_with_ids` 调 `turbovec_core::IdMapIndex::add_with_ids_2d`。`turbovec/src/id_map.rs` 先检查 `ids.len() == vectors.len()/dim` 和重复 ID，再调用内部 `TurboQuantIndex.add_2d`，成功后才写 `id_to_slot` 和 `slot_to_id`，避免 inner add 失败后留下 ghost ID（来源：turbovec-python/src/lib.rs add_with_ids；turbovec/src/id_map.rs add_with_ids_2d）。\n\n编码路径：`turbovec/src/encode.rs` 对每行向量计算 norm、归一化、乘同一个 rotation matrix；如果首批样本数 `n >= 1000`，TQ+ 用每个坐标的经验 5%/95% 分位去拟合 `shift` 和 `scale`，否则返回 identity calibration；随后按 Lloyd-Max boundaries 把每维变成小整数 code，并按 `bytes_per_row = bit_width * (dim / 8)` bit-pack（来源：turbovec/src/encode.rs encode；compute_tqplus_calibration）。\n\n搜索路径：allowlist 搜索先在 Python 侧拒绝空 allowlist 和未知 id；Rust `IdMapIndex.search_with_allowlist` 把外部 `u64` id 映射到 slot bool mask；`TurboQuantIndex.search_with_mask` 再把 bool mask 打成每 64 slot 一个 `u64` 的 bitset。`search.rs` 对 query 做 batched rotation，用 query LUT 和 packed codes 直接计分；x86 运行时选择 AVX-512BW、AVX2 或 scalar fallback；有 mask 时，`block_has_allowed` 在 32-vector block 级别提前跳过没有允许 slot 的 block，最后返回外部 id（来源：turbovec/src/id_map.rs search_with_allowlist；turbovec/src/lib.rs search_with_mask；turbovec/src/search.rs search/block_has_allowed）。\n\n术语解释：slot 是内部数组位置；external id 是调用方给的稳定 `u64` 文档 ID；LUT 是把 query 与 quantized codebook 的分数预先做成查表；SIMD 是 CPU 一条指令同时处理多组 code。"
    failure_mode: ".cargo/config.toml；turbovec/src/search.rs x86 dispatch"
    source_pointer: "https://github.com/ryancodrai/turbovec"
pipeline_steps:
  - "project_type 分诊:library_sdk"
  - "verdict:clone_and_run"
  - "artifactAudit src/tests/docs/examples/license/release:false/false/true/true/MIT/not_found"
experiments: []
claims:
  - "[[claims/ryancodrai-turbovec-main-claim]]"
artifacts:
  - "[[artifacts/ryancodrai-turbovec-repo]]"
metrics:
  - "stars=7952"
  - "forks=749"
  - "open_issues=12"
  - "latest_release=not_found"
  - "pushed_at=2026-05-30T13:12:07Z"
baselines: []
failure_modes:
  - ".cargo/config.toml；turbovec/src/search.rs x86 dispatch"
  - "turbovec/build.rs；CHANGELOG.md turbovec 0.5.3 Python package"
  - "turbovec-python/pyproject.toml；turbovec-python/Cargo.toml"
  - "turbovec-python/pyproject.toml optional-dependencies；docs/integrations/*.md"
  - "turbovec/src/io.rs；CHANGELOG.md On-disk format version bumped to 3；docs/api.md File formats"
missing_details:
  - "latest_release_tag_name: not_found"
  - "latest_release_published_at: not_found"
source_pointers:
  - "https://github.com/ryancodrai/turbovec"
---

## Notes

证据包来自 README 摘要、P1 artifactAudit 和 deep-dive claim ledger。主 claim 落库为 [[claims/ryancodrai-turbovec-main-claim]],官方 artifact 落库为 [[artifacts/ryancodrai-turbovec-repo]]。See [[content/ryancodrai-turbovec]]。

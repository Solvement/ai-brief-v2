import { getAllContentItems } from "../lib/content/queries";
import { listMediaAssets, validateMediaAsset } from "../lib/media";
import type { MediaAsset } from "../lib/content/types";

interface ReviewRow {
  itemId: string;
  itemTitle: string;
  itemContentType: string;
  asset: MediaAsset;
  issues: string[];
}

const statusOrder: Record<MediaAsset["status"], number> = {
  needs_review: 0,
  draft: 1,
  approved: 2,
  rejected: 3,
};

const statusLabel: Record<MediaAsset["status"], string> = {
  needs_review: "待审核",
  draft: "草稿",
  approved: "已通过",
  rejected: "已拒绝",
};

const statusHelp: Record<MediaAsset["status"], string> = {
  needs_review: "等待编辑确认 alt、credit 与是否符合配图原则。",
  draft: "未提交审核，前台不会显示。",
  approved: "已上线，可在卡片或详情页中显示。",
  rejected: "不符合配图原则或来源问题，已退回。",
};

function buildRows(): ReviewRow[] {
  const rows: ReviewRow[] = [];
  for (const item of getAllContentItems()) {
    for (const asset of listMediaAssets(item)) {
      rows.push({
        itemId: item.id,
        itemTitle: item.title,
        itemContentType: item.content_type,
        asset,
        issues: validateMediaAsset(asset),
      });
    }
  }
  rows.sort((a, b) => statusOrder[a.asset.status] - statusOrder[b.asset.status]);
  return rows;
}

function summarize(rows: ReviewRow[]) {
  const counts: Record<MediaAsset["status"], number> = {
    needs_review: 0,
    draft: 0,
    approved: 0,
    rejected: 0,
  };
  let withIssues = 0;
  for (const row of rows) {
    counts[row.asset.status] += 1;
    if (row.issues.length > 0) withIssues += 1;
  }
  return { counts, withIssues };
}

export function AdminMediaPage() {
  const rows = buildRows();
  const { counts, withIssues } = summarize(rows);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <span className="eyebrow">Admin / Media</span>
        <h1>媒体审核</h1>
        <p>
          所有媒体资产都来自人工生成、官方截图或截图工具，AI-brief 不再自动生成封面图。审核时检查 alt、credit
          与是否符合 <code>docs/image-policy.md</code>，公开页面只展示 approved 媒体。
        </p>
        <ul className="admin-media__counts" role="list">
          {(Object.keys(counts) as MediaAsset["status"][]).map((status) => (
            <li key={status}>
              <strong>{counts[status]}</strong>
              <span>{statusLabel[status]}</span>
            </li>
          ))}
          <li>
            <strong>{withIssues}</strong>
            <span>校验异常</span>
          </li>
        </ul>
      </section>

      {rows.length === 0 ? (
        <p className="admin-media__empty">当前没有媒体资产，可在内容上挂 cover_image / thumbnail_image 后回到此页审核。</p>
      ) : (
        <div className="media-review-grid">
          {rows.map((row) => (
            <article className="media-review-card" key={`${row.itemId}-${row.asset.id}`} data-status={row.asset.status}>
              <div className="media-review-card__visual">
                {row.asset.url ? (
                  <img src={row.asset.url} alt={row.asset.alt} loading="lazy" />
                ) : (
                  <div className="media-review-card__missing" aria-label="missing image">
                    暂无图片文件
                  </div>
                )}
              </div>
              <div className="media-review-card__body">
                <header>
                  <span className="media-review-card__status" data-status={row.asset.status}>
                    {statusLabel[row.asset.status]}
                  </span>
                  <span className="media-review-card__type">{row.asset.type}</span>
                  <span className="media-review-card__source-type">{row.asset.source_type}</span>
                </header>
                <h3>{row.itemTitle}</h3>
                <p className="media-review-card__takeaway">{row.asset.alt}</p>
                <dl className="media-review-card__meta">
                  <div>
                    <dt>所属内容</dt>
                    <dd>{row.itemContentType} / {row.itemId}</dd>
                  </div>
                  {row.asset.credit ? (
                    <div>
                      <dt>Credit</dt>
                      <dd>{row.asset.credit}</dd>
                    </div>
                  ) : null}
                  {row.asset.aspect_ratio ? (
                    <div>
                      <dt>比例</dt>
                      <dd>{row.asset.aspect_ratio}</dd>
                    </div>
                  ) : null}
                  {row.asset.prompt ? (
                    <div>
                      <dt>Prompt</dt>
                      <dd>{row.asset.prompt}</dd>
                    </div>
                  ) : null}
                </dl>
                <p className="media-review-card__hint">{statusHelp[row.asset.status]}</p>
                {row.issues.length > 0 ? (
                  <ul className="media-review-card__issues" role="list">
                    {row.issues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

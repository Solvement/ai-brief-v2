import React from "react";
import type { AnyContentItem } from "../../lib/content/types";
import { getCardVisual, isPlaceholder, type CardVisual } from "../../lib/media";

interface ContentCardProps {
  item: AnyContentItem;
  href?: string;
  compact?: boolean;
}

interface ContentCardEmptyProps {
  title: string;
  description: string;
}

interface ContentCardErrorProps {
  message: string;
}

const actionText = {
  know: "知道即可",
  read: "值得深读",
  try: "值得试",
  save: "收藏",
  use_now: "马上用",
  monitor: "继续观察",
  avoid: "谨慎观望",
} as const;

const contentTypeText = {
  news: "新闻",
  model: "模型",
  tool: "工具",
  project: "项目",
  integration: "集成",
  article: "文章",
  paper: "论文",
  guide: "指南",
  course: "课程",
} as const;

const audienceText = {
  developer: "开发者",
  pm: "产品",
  founder: "创业者",
  creator: "创作者",
  operator: "运营",
  researcher: "研究者",
  enterprise: "企业",
} as const;

function formatDateLabel(value: string): string {
  return value.slice(0, 10);
}

function ScoreMeter({ label, value }: { label: string; value: number }) {
  return (
    <span className="content-card__score-meter" style={{ "--score": `${value}%` } as React.CSSProperties}>
      <span>{label}</span>
      <strong>{value}</strong>
    </span>
  );
}

function CardVisualSlot({ visual }: { visual: CardVisual }) {
  if (isPlaceholder(visual)) {
    return (
      <div
        className="content-card__visual content-card__visual--placeholder"
        role="img"
        aria-label={`${visual.label} 占位图`}
        data-content-type={visual.contentType}
        style={{
          background: `linear-gradient(135deg, ${visual.gradientFrom} 0%, ${visual.gradientTo} 100%)`,
          color: visual.ink,
        }}
      >
        <span className="content-card__placeholder-label">{visual.label}</span>
        <span className="content-card__placeholder-rule" aria-hidden="true" />
        <span className="content-card__placeholder-initials" aria-hidden="true">
          {visual.initials}
        </span>
      </div>
    );
  }

  return (
    <div className="content-card__visual">
      <img src={visual.url} alt={visual.alt} data-source-type={visual.source_type} loading="lazy" />
    </div>
  );
}

function ContentCardBody({ item, compact = false }: Pick<ContentCardProps, "item" | "compact">) {
  const date = item.published_at ?? item.collected_at;
  const dateLabel = formatDateLabel(date);
  const visual = getCardVisual(item);
  const showDecisionSignals = item.content_type !== "news";

  return (
    <>
      <CardVisualSlot visual={visual} />
      <div className="content-card__body">
        <div className="content-card__kicker">
          <span data-content-type={item.content_type}>
            {contentTypeText[item.content_type]}
          </span>
          <span>{item.reading_time_minutes} 分钟</span>
          <time dateTime={date}>{dateLabel}</time>
        </div>
        <h3>{item.title}</h3>
        <p className="content-card__takeaway">{item.one_sentence_takeaway}</p>
        {!compact && (
          <p className="content-card__why">
            <span>为什么重要</span>
            {item.why_it_matters}
          </p>
        )}
        <div className="content-card__footer">
          <div className="content-card__audience">
            {item.target_audience.map((audience) => (
              <span key={audience}>{audienceText[audience]}</span>
            ))}
          </div>
          {showDecisionSignals && (
            <div className="content-card__scores" aria-label="内容评分">
              <ScoreMeter label="影响" value={item.impact_score} />
              <ScoreMeter label="可信" value={item.confidence_score} />
              {!compact && <ScoreMeter label="行动" value={item.actionability_score} />}
            </div>
          )}
        </div>
        <div className="content-card__source-strip">
          {showDecisionSignals ? (
            <span className="content-card__action-badge" data-action={item.recommended_action}>
              {actionText[item.recommended_action]}
            </span>
          ) : (
            <span className="content-card__story-badge">Story</span>
          )}
          <span className="content-card__source-name">{item.source_name}</span>
          <time dateTime={date}>{dateLabel}</time>
        </div>
      </div>
    </>
  );
}

export function ContentCard({ item, href, compact = false }: ContentCardProps) {
  const className = compact ? "content-card content-card--compact" : "content-card";
  if (href) {
    return (
      <a className={className} href={href}>
        <ContentCardBody item={item} compact={compact} />
      </a>
    );
  }
  return (
    <article className={className}>
      <ContentCardBody item={item} compact={compact} />
    </article>
  );
}

export function ContentCardLoading() {
  return (
    <article className="content-card content-card--loading" aria-busy="true" aria-label="内容卡片加载中">
      <div className="content-card__visual skeleton" />
      <div className="content-card__body">
        <span className="skeleton skeleton-line skeleton-line--short" />
        <span className="skeleton skeleton-line skeleton-line--title" />
        <span className="skeleton skeleton-line" />
        <span className="skeleton skeleton-line" />
      </div>
    </article>
  );
}

export function ContentCardEmpty({ title, description }: ContentCardEmptyProps) {
  return (
    <div className="content-card-state content-card-state--empty">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}

export function ContentCardError({ message }: ContentCardErrorProps) {
  return (
    <div className="content-card-state content-card-state--error" role="alert">
      <h3>内容加载失败</h3>
      <p>{message}</p>
    </div>
  );
}

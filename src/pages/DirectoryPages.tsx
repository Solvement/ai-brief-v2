import { ContentCard, ContentCardEmpty } from "../components/content/ContentCard";
import { SectionTitle } from "../components/SectionTitle";
import { filterContentItems, hasActiveFilters, type ContentFilters } from "../lib/content/filters";
import { getContentByColumn, getContentBySlug, getRelatedContent } from "../lib/content/queries";
import { actionLabels, audiences, contentTags, type AnyContentItem } from "../lib/content/types";
import { getCardVisual, isPlaceholder, type CardVisual } from "../lib/media";

interface SectionPageProps {
  filters: ContentFilters;
}

type DirectoryVariant = "content" | "news";

const contentTypeLabel = {
  news: "新闻",
  model: "模型",
  tool: "工具",
  project: "项目",
  integration: "技能 / 集成",
  article: "文章",
  paper: "论文",
  guide: "指南",
  course: "课程",
} as const;

const actionLabelText = {
  know: "知道即可",
  read: "值得深读",
  try: "值得试",
  save: "收藏",
  use_now: "马上用",
  monitor: "继续观察",
  avoid: "谨慎观望",
} as const;

const audienceLabelText = {
  developer: "开发者",
  pm: "产品",
  founder: "创业者",
  creator: "创作者",
  operator: "运营",
  researcher: "研究者",
  enterprise: "企业",
} as const;

const difficultyLabelText = {
  beginner: "入门",
  intermediate: "进阶",
  advanced: "高级",
} as const;

export function NewsPage({ filters }: SectionPageProps) {
  return (
    <ContentListPage
      eyebrow="News"
      title="News"
      kicker="AI 相关新闻和资讯流：先看事实、来源和发生了什么，不在新闻流里显示评分。"
      items={getContentByColumn("news")}
      filters={filters}
      variant="news"
    />
  );
}

export function ModelsPage({ filters }: SectionPageProps) {
  return (
    <ContentListPage
      eyebrow="Models"
      title="Models"
      kicker="模型相关更新、测评和分析：能力、成本、速度、上下文、工具调用和适用场景。"
      items={getContentByColumn("models")}
      filters={filters}
    />
  );
}

export function ProjectsPage({ filters }: SectionPageProps) {
  const items = getContentByColumn("projects");
  return (
    <ContentListPage
      eyebrow="Projects"
      title="Projects"
      kicker="GitHub Trending 为主，Hugging Face 为辅：看热度项目、可运行性、维护信号和学习价值。"
      items={items}
      filters={filters}
      hrefFor={(item) => `/projects/${item.slug}`}
    />
  );
}

export function SkillsPage({ filters }: SectionPageProps) {
  return (
    <ContentListPage
      eyebrow="Skills / MCP / Hooks"
      title="Skills"
      kicker="SKILL.md、CLAUDE.md、MCP server、Cursor rules 和 agent hooks：先判断是否值得安装，再拆规则、触发场景、风险和轻量验证。"
      items={getContentByColumn("skills")}
      filters={filters}
      hrefFor={(item) => `/skills/${item.slug}`}
    />
  );
}

export function ArticlesPage({ filters }: SectionPageProps) {
  const items = getContentByColumn("articles");
  return (
    <ContentListPage
      eyebrow="Articles"
      title="Articles"
      kicker="高质量文章、厂商技术博客、论文和顶会方向内容：重点是解释概念、机制和可迁移经验。"
      items={items}
      filters={filters}
    />
  );
}

export function CoursesPage({ filters }: SectionPageProps) {
  return (
    <ContentListPage
      eyebrow="Courses"
      title="Courses"
      kicker="课程不做每日抓取，只在可信课程源有新内容时更新。"
      items={getContentByColumn("courses")}
      filters={filters}
    />
  );
}

export function ToolsPage({ filters }: SectionPageProps) {
  return <ProjectsPage filters={filters} />;
}

export function PlaybooksPage({ filters }: SectionPageProps) {
  return <ProjectsPage filters={filters} />;
}

export function LearnPage({ filters }: SectionPageProps) {
  return <CoursesPage filters={filters} />;
}

function ContentListPage({
  eyebrow,
  title,
  kicker,
  items,
  filters,
  hrefFor = (item) => `/content/${item.slug}`,
  variant = "content",
}: {
  eyebrow: string;
  title: string;
  kicker: string;
  items: AnyContentItem[];
  filters: ContentFilters;
  hrefFor?: (item: AnyContentItem) => string;
  variant?: DirectoryVariant;
}) {
  const filteredItems = filterContentItems(items, filters);

  return (
    <div className="page-stack">
      <section className="page-hero">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{kicker}</p>
      </section>
      <FilterBar title={title} filters={filters} resultCount={filteredItems.length} totalCount={items.length} />
      {filteredItems.length > 0 ? (
        <div className={variant === "news" ? "content-grid content-grid--news" : "content-grid"}>
          {filteredItems.map((item) =>
            variant === "news" ? (
              <NewsListCard item={item} href={hrefFor(item)} key={item.id} />
            ) : (
              <ContentCard item={item} href={hrefFor(item)} key={item.id} />
            ),
          )}
        </div>
      ) : (
        <ContentCardEmpty title="暂无匹配内容" description="调整标签、人群或动作过滤条件后再试。" />
      )}
    </div>
  );
}

function NewsListCard({ item, href }: { item: AnyContentItem; href: string }) {
  const visual = getCardVisual(item);

  return (
    <article className="news-list-card">
      <a className="news-list-card__link" href={href}>
        <NewsVisual visual={visual} />
        <div className="news-list-card__body">
          <span className="news-list-card__source">{item.source_name}</span>
          <h2>{item.title}</h2>
          <p>{item.one_sentence_takeaway || item.summary}</p>
          <div className="news-list-card__meta">
            <span>{item.published_at ? new Date(item.published_at).toLocaleDateString("zh-CN") : "未标注日期"}</span>
            <span>{contentTypeLabel[item.content_type]}</span>
            {item.tags.slice(0, 3).map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </a>
    </article>
  );
}

function NewsVisual({ visual }: { visual: CardVisual }) {
  if (isPlaceholder(visual)) {
    return (
      <div
        className="news-list-card__visual news-list-card__visual--placeholder"
        role="img"
        aria-label={`${visual.label} 新闻视觉占位图`}
        style={{
          background: `linear-gradient(135deg, ${visual.gradientFrom} 0%, ${visual.gradientTo} 100%)`,
          color: visual.ink,
        }}
      >
        <span>{visual.label}</span>
        <strong>{visual.initials}</strong>
      </div>
    );
  }

  return (
    <div className="news-list-card__visual">
      <img src={visual.url} alt={visual.alt} loading="lazy" />
    </div>
  );
}

function FilterBar({
  title,
  filters,
  resultCount,
  totalCount,
}: {
  title: string;
  filters: ContentFilters;
  resultCount: number;
  totalCount: number;
}) {
  const active = hasActiveFilters(filters);
  const basePath = `/${title.toLowerCase()}`;

  return (
    <div className="filter-panel">
      <div className="filter-panel__summary">
        <div>
          <span>结果集</span>
          <strong>
            {resultCount} / {totalCount}
          </strong>
        </div>
        <p>
          {active
            ? `已启用筛选：${[filters.tag, filters.audience && audienceLabelText[filters.audience], filters.action && actionLabelText[filters.action]].filter(Boolean).join(" / ")}`
            : "按标签、人群或推荐动作筛选。"}
        </p>
        <a className="ghost-button" href={basePath}>
          重置筛选
        </a>
      </div>
      <div className="filter-panel__controls">
        <div>
          <span>标签</span>
          <div className="category-pills" aria-label={`${title} tag filters`}>
            <a href={basePath} data-active={!active}>
              全部
            </a>
            {contentTags.slice(0, 8).map((tag) => (
              <a href={`${basePath}?tag=${encodeURIComponent(tag)}`} data-active={filters.tag === tag} key={tag}>
                {tag}
              </a>
            ))}
          </div>
        </div>
        <div>
          <span>人群</span>
          <div className="category-pills" aria-label={`${title} audience filters`}>
            {audiences.slice(0, 5).map((audience) => (
              <a href={`${basePath}?audience=${audience}`} data-active={filters.audience === audience} key={audience}>
                {audienceLabelText[audience]}
              </a>
            ))}
          </div>
        </div>
        <div>
          <span>动作</span>
          <div className="category-pills" aria-label={`${title} action filters`}>
            {actionLabels.slice(0, 5).map((action) => (
              <a href={`${basePath}?action=${action}`} data-active={filters.action === action} key={action}>
                {actionLabelText[action]}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ToolDetailPage({ slug }: { slug: string }) {
  return <ProjectDetailPage slug={slug} />;
}

export function PlaybookDetailPage({ slug }: { slug: string }) {
  return <ProjectDetailPage slug={slug} />;
}

export function ProjectDetailPage({ slug }: { slug: string }) {
  const item = getContentBySlug(slug);
  if (!item) return <NotFoundPanel />;

  return <InsightDetailPage item={item} sectionLabel="项目" />;
}

export function GenericContentPage({ slug }: { slug: string }) {
  const item = getContentBySlug(slug);
  if (!item) return <NotFoundPanel />;
  return <InsightDetailPage item={item} sectionLabel={contentTypeLabel[item.content_type]} />;
}

export function SkillDetailPage({ slug }: { slug: string }) {
  const item = getContentBySlug(slug);
  if (!item) return <NotFoundPanel />;
  return <InsightDetailPage item={item} sectionLabel="Skills" />;
}

function InsightDetailPage({ item, sectionLabel }: { item: AnyContentItem; sectionLabel: string }) {
  const detail = createDetailViewModel(item);
  const related = getRelatedContent(item.id);
  const sectionHref = getSectionHref(item, sectionLabel);

  return (
    <article className="insight-detail">
      <header className="insight-header">
        <div className="insight-header__copy">
          <nav className="insight-breadcrumb" aria-label="Breadcrumb">
            <a href={sectionHref}>{sectionLabel}</a>
            <span>/</span>
            <span>{contentTypeLabel[item.content_type]}</span>
          </nav>
          <h1>{item.title}</h1>
          <p>{item.summary}</p>
          <div className="insight-tags">
            <span className={`chip chip--${item.content_type}`}>{contentTypeLabel[item.content_type]}</span>
            {item.tags.slice(0, 4).map((tag) => (
              <span className="chip chip--ghost" key={tag}>{tag}</span>
            ))}
          </div>
          <div className="insight-meta">
            <span>{item.source_name}</span>
            <span>{item.published_at ? new Date(item.published_at).toLocaleDateString("zh-CN") : "未标注日期"}</span>
            <span>阅读时间：{item.reading_time_minutes} 分钟</span>
            <span>{difficultyLabelText[item.difficulty]}</span>
          </div>
        </div>
        <div className="insight-header__actions" aria-label="Page actions">
          <a className="insight-action-button" href={item.source_url} target="_blank" rel="noreferrer">查看来源</a>
          <a className="insight-action-button" href="#action-layer">行动层</a>
          <a className="insight-action-button" href="#related">相关内容</a>
        </div>
      </header>

      <div className="insight-workspace">
        <main className="insight-main">
          <AtAGlance item={item} detail={detail} />
          <nav className="insight-tabs" aria-label="Detail sections">
            <a href="#overview">概览</a>
            <a href="#facts">事实</a>
            <a href="#concepts">概念</a>
            <a href="#judgment">判断</a>
            <a href="#action-layer">行动</a>
            {item.deep_dive_status === "generated" && <a href="#deep-dive">深度解读</a>}
          </nav>

          <section className="insight-section" id="overview">
            <SectionKicker label="标准详情" title="TL;DR / 概览" />
            <p className="insight-lead">{detail.tldr}</p>
            <h3>给小白的解释</h3>
            <p>{detail.beginnerExplanation}</p>
            <h3>背景</h3>
            <p>{detail.background}</p>
            {item.deep_dive_status === "needed_not_generated" && (
              <p className="detail-note">当前为标准详情，Deep Dive 尚未生成。</p>
            )}
          </section>

          <section className="insight-section" id="facts">
            <SectionKicker label="事实层" title="来源明确说了什么" />
            <NumberedList items={detail.keyPoints} />
          </section>

          <section className="insight-section" id="concepts">
            <SectionKicker label="学习层" title="核心概念和机制" />
            <div className="concept-grid">
              {detail.coreConcepts.map((concept) => (
                <article className="concept-card" key={concept.name}>
                  <h3>{concept.name}</h3>
                  <p>{concept.explanation}</p>
                  <span>{concept.why_it_matters_here}</span>
                </article>
              ))}
            </div>
            {detail.terminology.length > 0 && (
              <div className="terminology-strip">
                {detail.terminology.map((term) => (
                  <p key={term.term}><strong>{term.term}</strong>: {term.plain_explanation}</p>
                ))}
              </div>
            )}
            <h3>机制解释</h3>
            <p>{detail.mechanismExplanation}</p>
          </section>

          {(detail.innovationAnalysis || detail.valueAnalysis || detail.examples.length > 0) && (
            <section className="insight-section">
              <SectionKicker label="解读层" title="价值、创新和例子" />
              {detail.innovationAnalysis && <p><strong>创新点：</strong> {detail.innovationAnalysis}</p>}
              {detail.valueAnalysis && <p><strong>价值：</strong> {detail.valueAnalysis}</p>}
              {detail.examples.length > 0 && (
                <ul>
                  {detail.examples.map((example) => (
                    <li key={example.scenario}>
                      <strong>{example.scenario}</strong>: {example.explanation} {example.expected_value}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section className="insight-section" id="judgment">
            <SectionKicker label="AI-brief 判断" title="为什么重要" />
            <p className="insight-lead">{item.one_sentence_takeaway}</p>
            <p>{detail.whyItMatters}</p>
            <h3>影响人群</h3>
            <p>{item.target_audience.map((audience) => audienceLabelText[audience]).join(" / ")}</p>
            <div className="judgment-grid">
              <div>
                <span>机会</span>
                <ul>{item.opportunities.map((opportunity) => <li key={opportunity}>{opportunity}</li>)}</ul>
              </div>
              <div>
                <span>风险</span>
                <ul>{detail.risks.map((risk) => <li key={risk}>{risk}</li>)}</ul>
              </div>
            </div>
          </section>

          <TypeSpecificPanel item={item} />

          <section className="insight-section" id="action-layer">
            <SectionKicker label="行动层" title="怎么用、怎么验证" />
            <p>{detail.actionSummary}</p>
            <div className="action-checklist-grid">
              <div>
                <h3>清单 / Prompt / 工作流</h3>
                <NumberedList items={detail.checklist} />
              </div>
              <div>
                <h3>验证方式</h3>
                <NumberedList items={detail.validationMethods} />
              </div>
            </div>
            {detail.prompts.map((prompt) => (
              <pre className="prompt-block" key={prompt}>{prompt}</pre>
            ))}
          </section>

          {item.deep_dive_status === "generated" && item.deep_dive && (
            <section className="insight-section insight-section--deep" id="deep-dive">
              <SectionKicker label="深度解读" title={item.deep_dive.core_question} />
              <p>{item.deep_dive.background}</p>
              <h3>核心概念</h3>
              <ul>
                {item.deep_dive.core_concepts.map((concept) => (
                  <li key={concept.name}><strong>{concept.name}</strong>: {concept.explanation}</li>
                ))}
              </ul>
              <h3>机制解释</h3>
              <p>{item.deep_dive.mechanism_explanation}</p>
              {item.deep_dive.comparison_or_alternatives && item.deep_dive.comparison_or_alternatives.length > 0 && (
                <>
                  <h3>对比 / 替代方案</h3>
                  <ul>{item.deep_dive.comparison_or_alternatives.map((comparison) => <li key={comparison}>{comparison}</li>)}</ul>
                </>
              )}
              <h3>验证方式</h3>
              <ul>{item.deep_dive.validation_methods.map((method) => <li key={method}>{method}</li>)}</ul>
            </section>
          )}

          <section className="insight-section" id="related">
            <SectionKicker label="相关内容" title="继续阅读" />
            {related.length > 0 ? (
              <div className="content-grid">
                {related.slice(0, 2).map((relatedItem) => (
                  <ContentCard item={relatedItem} href={`/content/${relatedItem.slug}`} compact key={relatedItem.id} />
                ))}
              </div>
            ) : (
              <p>暂无相关内容。</p>
            )}
          </section>
        </main>

        <InsightRightRail item={item} detail={detail} />
      </div>
    </article>
  );
}

function getSectionHref(item: AnyContentItem, sectionLabel: string): string {
  if (sectionLabel === "Skills" || sectionLabel === "技能") return "/skills";
  if (sectionLabel === "Projects" || sectionLabel === "项目" || ["tool", "project", "integration"].includes(item.content_type)) return "/projects";
  if (item.content_type === "news") return "/news";
  if (item.content_type === "model") return "/models";
  if (item.content_type === "article" || item.content_type === "paper") return "/articles";
  if (item.content_type === "course") return "/courses";
  if (item.content_type === "guide") return "/projects";
  return "/";
}

type DetailViewModel = {
  tldr: string;
  beginnerExplanation: string;
  background: string;
  keyPoints: string[];
  whyItMatters: string;
  coreConcepts: Array<{ name: string; explanation: string; why_it_matters_here: string }>;
  terminology: Array<{ term: string; plain_explanation: string; why_it_matters: string }>;
  mechanismExplanation: string;
  innovationAnalysis?: string;
  valueAnalysis?: string;
  examples: Array<{ scenario: string; explanation: string; expected_value: string }>;
  risks: string[];
  actionSummary: string;
  validationMethods: string[];
  checklist: string[];
  prompts: string[];
  score: number;
};

function createDetailViewModel(item: AnyContentItem): DetailViewModel {
  const briefDetail = item.brief_detail ?? {
    tldr: item.one_sentence_takeaway,
    background: item.summary,
    key_points: item.key_facts,
    why_it_matters: item.why_it_matters,
    risks_and_uncertainties: item.risks,
    action_summary: item.next_steps.join(" "),
    validation_methods: item.next_steps,
  };
  const checklist = item.content_type === "guide" ? item.checklist : item.next_steps;
  const prompts = item.content_type === "guide" ? item.prompts : [];
  const validationMethods = briefDetail.validation_methods.length > 0 ? briefDetail.validation_methods : checklist;
  const coreConcepts = briefDetail.core_concepts ?? [
    {
      name: item.content_type,
      explanation: item.one_sentence_takeaway,
      why_it_matters_here: item.why_it_matters,
    },
  ];
  const sourceExamples = briefDetail.examples ?? briefDetail.practical_examples ?? [];
  const examples = sourceExamples.map((example, index) => {
    if (typeof example === "string") {
      return {
        scenario: `示例 ${index + 1}`,
        explanation: example,
        expected_value: validationMethods[0] ?? "用作进一步投入前的学习信号。",
      };
    }
    return example;
  });

  return {
    tldr: briefDetail.tldr,
    beginnerExplanation: briefDetail.beginner_explanation ?? item.summary,
    background: briefDetail.background,
    keyPoints: briefDetail.key_points.length > 0 ? briefDetail.key_points : item.key_facts,
    whyItMatters: briefDetail.why_it_matters || item.why_it_matters,
    coreConcepts,
    terminology: briefDetail.terminology ?? [],
    mechanismExplanation: briefDetail.mechanism_explanation ?? briefDetail.why_it_matters,
    innovationAnalysis: briefDetail.innovation_analysis,
    valueAnalysis: briefDetail.value_analysis,
    examples,
    risks: briefDetail.risks_and_uncertainties.length > 0 ? briefDetail.risks_and_uncertainties : item.risks,
    actionSummary: briefDetail.action_summary,
    validationMethods,
    checklist,
    prompts,
    score: Math.round((item.impact_score + item.actionability_score + item.confidence_score + item.readability_score) / 4),
  };
}

function AtAGlance({ item, detail }: { item: AnyContentItem; detail: DetailViewModel }) {
  const visual = getCardVisual(item);
  return (
    <section className="at-glance-card" aria-label="速览">
      <DetailVisual visual={visual} />
      <div className="at-glance-card__copy">
        <span>速览</span>
        <h2>{item.one_sentence_takeaway}</h2>
        <p>{detail.tldr}</p>
        {item.content_type === "news" ? (
          <div className="at-glance-card__story-meta" aria-label="新闻摘要元信息">
            <span>Story</span>
            <strong>{item.source_name}</strong>
            <span>{actionLabelText[item.recommended_action]}</span>
          </div>
        ) : (
          <div className="at-glance-card__stats">
            <InsightMiniStat label="影响" value={item.impact_score} text="决策信号" />
            <InsightMiniStat label="行动" value={item.actionability_score} text={actionLabelText[item.recommended_action]} />
            <InsightMiniStat label="可信" value={item.confidence_score} text="来源可信度" />
          </div>
        )}
      </div>
    </section>
  );
}

function InsightMiniStat({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="insight-mini-stat">
      <strong>{value}</strong>
      <span>{label}</span>
      <p>{text}</p>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <li>
      <span>{label}</span>
      <div aria-hidden="true"><span style={{ width: `${value}%` }} /></div>
      <strong>{value}</strong>
    </li>
  );
}

function InsightRightRail({ item, detail }: { item: AnyContentItem; detail: DetailViewModel }) {
  const sourceLabel = item.source_name || "来源";
  return (
    <aside className="insight-rail" aria-label="Detail summary">
      <section className="rail-card rail-card--summary">
        <h2>快速摘要</h2>
        <p>{detail.tldr}</p>
        <a href="#overview">阅读完整概览</a>
      </section>

      {item.content_type !== "news" && (
        <section className="rail-card rail-card--score">
          <span className="rail-card__title">AI Brief 评分</span>
          <strong className="rail-card__big-num" data-band={detail.score >= 80 ? "high" : detail.score >= 60 ? "mid" : "low"}>{detail.score}</strong>
          <span className="rail-card__band-text">{detail.score >= 80 ? "学习价值高" : "需要复核"}</span>
        </section>
      )}

      {item.content_type !== "news" && (
        <section className="rail-card">
          <h2>评分拆解</h2>
          <ul className="insight-score-list">
            <ScoreBar label="影响" value={item.impact_score} />
            <ScoreBar label="可执行" value={item.actionability_score} />
            <ScoreBar label="可读" value={item.readability_score} />
            <ScoreBar label="可信" value={item.confidence_score} />
          </ul>
        </section>
      )}

      <section className="rail-card">
        <h2>行动建议 / 下一步</h2>
        <ul className="insight-action-list">
          {detail.checklist.slice(0, 3).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
        <a href="#action-layer">打开行动层</a>
      </section>

      <section className="rail-card">
        <h2>来源</h2>
        <div className="source-stack">
          <span>{sourceLabel}</span>
          <a href={item.source_url} target="_blank" rel="noreferrer">打开原文</a>
        </div>
      </section>
    </aside>
  );
}

function DetailHero({ item, sectionLabel }: { item: AnyContentItem; sectionLabel: string }) {
  const visual = getCardVisual(item);
  const showDecisionSignals = item.content_type !== "news";

  return (
    <section className="detail-hero">
      <div className="detail-hero__copy">
        <span className="eyebrow">{sectionLabel}</span>
        <h1>{item.title}</h1>
        <p>{item.summary}</p>
        <div className="detail-hero__actions">
          <a className="primary-button" href={item.source_url} target="_blank" rel="noreferrer">
            查看来源
          </a>
          <a className="secondary-button" href="#action-layer">
            看行动建议
          </a>
        </div>
      </div>
      <aside className="detail-hero__panel" aria-label="内容决策摘要">
        <DetailVisual visual={visual} />
        {showDecisionSignals ? (
          <div className="detail-score-grid">
            <ScoreTile label="影响" value={item.impact_score} />
            <ScoreTile label="行动" value={item.actionability_score} />
            <ScoreTile label="可信" value={item.confidence_score} />
          </div>
        ) : (
          <div className="detail-meta-strip">
            <span>Story</span>
            <span>{item.source_name}</span>
            <span>{item.published_at ? new Date(item.published_at).toLocaleDateString("zh-CN") : "未标注日期"}</span>
          </div>
        )}
        <div className="detail-meta-strip">
          <span>{contentTypeLabel[item.content_type]}</span>
          {showDecisionSignals && <span>{actionLabelText[item.recommended_action]}</span>}
          <span>{item.reading_time_minutes} 分钟</span>
          <span>{difficultyLabelText[item.difficulty]}</span>
        </div>
      </aside>
    </section>
  );
}

function DetailVisual({ visual }: { visual: CardVisual }) {
  if (isPlaceholder(visual)) {
    return (
      <div
        className="detail-visual detail-visual--placeholder"
        role="img"
        aria-label={`${visual.label} 视觉占位图`}
        style={{
          background: `linear-gradient(135deg, ${visual.gradientFrom} 0%, ${visual.gradientTo} 100%)`,
          color: visual.ink,
        }}
      >
        <span>{visual.label}</span>
        <strong>{visual.initials}</strong>
      </div>
    );
  }

  return (
    <div className="detail-visual">
      <img src={visual.url} alt={visual.alt} loading="lazy" />
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="score-tile">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function SectionKicker({ label, title }: { label: string; title: string }) {
  return (
    <header className="detail-section-head">
      <span>{label}</span>
      <h2>{title}</h2>
    </header>
  );
}

function NumberedList({ items }: { items: string[] }) {
  return (
    <ol className="numbered-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <p>{item}</p>
        </li>
      ))}
    </ol>
  );
}

function DetailBlocks({ item }: { item: AnyContentItem }) {
  const related = getRelatedContent(item.id);
  const briefDetail = item.brief_detail ?? {
    tldr: item.one_sentence_takeaway,
    background: item.summary,
    key_points: item.key_facts,
    why_it_matters: item.why_it_matters,
    risks_and_uncertainties: item.risks,
    action_summary: item.next_steps.join(" "),
    validation_methods: item.next_steps,
  };
  const checklist = item.content_type === "guide" ? item.checklist : item.next_steps;
  const prompts = item.content_type === "guide" ? item.prompts : [];
  const deepDiveStatus = item.deep_dive_status ?? "not_needed";
  const validationMethods = briefDetail.validation_methods.length > 0 ? briefDetail.validation_methods : checklist;
  const beginnerExplanation = briefDetail.beginner_explanation ?? item.summary;
  const coreConcepts = briefDetail.core_concepts ?? [
    {
      name: item.content_type,
      explanation: item.one_sentence_takeaway,
      why_it_matters_here: item.why_it_matters,
    },
  ];
  const terminology = briefDetail.terminology ?? [];
  const mechanismExplanation = briefDetail.mechanism_explanation ?? briefDetail.why_it_matters;
  const examples = briefDetail.examples ?? [
    {
      scenario: "小范围验证",
      explanation: briefDetail.action_summary,
      expected_value: validationMethods[0] ?? "确认它是否值得继续投入时间。",
    },
  ];

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <section className="detail-section detail-section--lead">
          <SectionKicker label="标准详情" title="TL;DR：先把这件事讲清楚" />
          <p className="detail-lead">{briefDetail.tldr}</p>
          <h3>给小白的解释</h3>
          <p>{beginnerExplanation}</p>
          <h3>背景</h3>
          <p>{briefDetail.background}</p>
          {deepDiveStatus === "needed_not_generated" && <p className="detail-note">当前为标准详情，Deep Dive 尚未生成。</p>}
        </section>

        {(coreConcepts.length || terminology.length || mechanismExplanation) && (
          <section className="detail-section">
            <SectionKicker label="解释层" title="核心概念：把概念和机制讲给小白听" />
            {coreConcepts.length > 0 && (
              <ul>
                {coreConcepts.map((concept) => (
                  <li key={concept.name}>
                    <strong>{concept.name}</strong>: {concept.explanation} {concept.why_it_matters_here}
                  </li>
                ))}
              </ul>
            )}
            {terminology.length > 0 && (
              <>
                <h3>术语解释</h3>
                <ul>
                  {terminology.map((term) => (
                    <li key={term.term}>
                      <strong>{term.term}</strong>: {term.plain_explanation} {term.why_it_matters}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3>机制解释</h3>
            <p>{mechanismExplanation}</p>
          </section>
        )}

        {(briefDetail.innovation_analysis || briefDetail.value_analysis || examples.length) && (
          <section className="detail-section">
            <SectionKicker label="学习层" title="例子：为什么值得学，怎么举例说明" />
            {briefDetail.innovation_analysis && (
              <>
                <h3>创新点</h3>
                <p>{briefDetail.innovation_analysis}</p>
              </>
            )}
            {briefDetail.value_analysis && (
              <>
                <h3>价值</h3>
                <p>{briefDetail.value_analysis}</p>
              </>
            )}
            {examples.length > 0 && (
              <ul>
                {examples.map((example) => (
                  <li key={example.scenario}>
                    <strong>{example.scenario}</strong>: {example.explanation} {example.expected_value}
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="detail-section">
          <SectionKicker label="事实层" title="关键事实：来源明确说了什么" />
          <NumberedList items={briefDetail.key_points} />
        </section>

        <section className="detail-section detail-section--judgment">
          <SectionKicker label="AI-brief 判断" title="为什么重要：判断层，为什么这条值得你花时间" />
          <h3>影响人群</h3>
          <p>{item.target_audience.map((audience) => audienceLabelText[audience]).join(" / ")}</p>
          <p className="detail-lead">{item.one_sentence_takeaway}</p>
          <p>{briefDetail.why_it_matters || item.why_it_matters}</p>
          <div className="judgment-grid">
            <div>
              <span>机会</span>
              <ul>{item.opportunities.map((opportunity) => <li key={opportunity}>{opportunity}</li>)}</ul>
            </div>
            <div>
              <span>风险</span>
              <ul>{briefDetail.risks_and_uncertainties.map((risk) => <li key={risk}>{risk}</li>)}</ul>
            </div>
          </div>
        </section>

        <TypeSpecificPanel item={item} />

        <section id="action-layer" className="detail-section detail-section--action">
          <SectionKicker label="行动层" title="怎么用：下一步怎么做，怎么验证" />
          <p>{briefDetail.action_summary}</p>
          <div className="action-checklist-grid">
            <div>
              <h3>清单 / Prompt / 工作流</h3>
              <NumberedList items={checklist} />
            </div>
            <div>
              <h3>验证方式</h3>
              <NumberedList items={validationMethods} />
            </div>
          </div>
          {prompts.map((prompt) => (
            <pre className="prompt-block" key={prompt}>
              {prompt}
            </pre>
          ))}
        </section>

        {deepDiveStatus === "generated" && item.deep_dive && (
          <section className="detail-section detail-section--deep">
            <SectionKicker label="深度解读" title="深度解读" />
            <h3>{item.deep_dive.core_question}</h3>
            <p>{item.deep_dive.background}</p>
            <h3>核心概念</h3>
            <ul>
              {item.deep_dive.core_concepts.map((concept) => (
                <li key={concept.name}>
                  <strong>{concept.name}</strong>: {concept.explanation}
                </li>
              ))}
            </ul>
            <h3>机制解释</h3>
            <p>{item.deep_dive.mechanism_explanation}</p>
            {item.deep_dive.comparison_or_alternatives && item.deep_dive.comparison_or_alternatives.length > 0 && (
              <>
                <h3>对比 / 替代方案</h3>
                <ul>{item.deep_dive.comparison_or_alternatives.map((comparison) => <li key={comparison}>{comparison}</li>)}</ul>
              </>
            )}
            <h3>验证方式</h3>
            <ul>{item.deep_dive.validation_methods.map((method) => <li key={method}>{method}</li>)}</ul>
          </section>
        )}

        <section className="detail-section">
          <SectionKicker label="相关内容" title="继续看什么" />
          {related.length > 0 ? (
            <div className="content-grid">
              {related.slice(0, 2).map((relatedItem) => (
                <ContentCard item={relatedItem} href={`/content/${relatedItem.slug}`} compact key={relatedItem.id} />
              ))}
            </div>
          ) : (
            <p>暂无相关内容。</p>
          )}
        </section>
      </div>
      <DetailSidebar item={item} validationMethods={validationMethods} />
    </div>
  );
}

function TypeSpecificPanel({ item }: { item: AnyContentItem }) {
  if (item.content_type === "news") {
    const watchPoints = item.brief_detail?.what_to_look_for ?? item.next_steps;
    const eventFacts = item.brief_detail?.key_points ?? item.key_facts;
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="新闻脉络" title="这条 story 应该继续看什么" />
        <p>{item.brief_detail?.what_changed ?? item.one_sentence_takeaway}</p>
        <NumberedList items={[...eventFacts.slice(0, 3), ...watchPoints.slice(0, 2)]} />
      </section>
    );
  }

  if (item.content_type === "model") {
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="模型雷达" title="模型选择应该怎么理解" />
        <p>{item.primary_capability}</p>
        <NumberedList items={[...item.benchmark_notes, ...item.test_prompts].slice(0, 5)} />
      </section>
    );
  }

  if (["tool", "project", "integration"].includes(item.content_type)) {
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="项目判断" title="是否值得进入你的工具箱" />
        <p>这类内容不能只看热度和介绍，真正要看它是否能在真实任务里减少返工、保留证据，并且在失败时可回滚。</p>
      </section>
    );
  }

  if (item.content_type === "article") {
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="观点判断" title="文章观点是否站得住" />
        <p>{item.core_argument}</p>
      </section>
    );
  }

  if (item.content_type === "paper") {
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="论文阅读" title="论文应该学什么" />
        <p>{item.method_summary}</p>
      </section>
    );
  }

  if (item.content_type === "course") {
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="学习路径" title="学完应该产出什么" />
        <NumberedList items={item.learning_outcomes} />
      </section>
    );
  }

  if (item.content_type === "guide") {
    return (
      <section className="detail-section detail-section--accent">
        <SectionKicker label="跟做指南" title="这个 Playbook 要交付什么" />
        <p>{item.outcome}</p>
        <NumberedList items={item.prerequisites} />
      </section>
    );
  }

  return null;
}

function DetailSidebar({ item, validationMethods }: { item: AnyContentItem; validationMethods: string[] }) {
  return (
    <aside className="detail-sidebar">
      <section className="detail-sidebar__card detail-sidebar__card--action">
        <span className="detail-sidebar__label">推荐动作</span>
        <strong>{actionLabelText[item.recommended_action]}</strong>
        <p>{item.one_sentence_takeaway}</p>
      </section>
      <section className="detail-sidebar__card">
        <span className="detail-sidebar__label">适合人群</span>
        <div className="detail-chip-list">
          {item.target_audience.map((audience) => (
            <span key={audience}>{audienceLabelText[audience]}</span>
          ))}
        </div>
      </section>
      <section className="detail-sidebar__card">
        <span className="detail-sidebar__label">标签</span>
        <div className="detail-chip-list">
          {item.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </section>
      <section className="detail-sidebar__card">
        <span className="detail-sidebar__label">快速验证</span>
        <ul>
          {validationMethods.slice(0, 3).map((method) => (
            <li key={method}>{method}</li>
          ))}
        </ul>
      </section>
      <section className="detail-sidebar__card">
        <span className="detail-sidebar__label">来源</span>
        <a href={item.source_url} target="_blank" rel="noreferrer">
          {item.source_name}
        </a>
      </section>
    </aside>
  );
}

export function NotFoundPanel() {
  return (
    <section className="page-hero">
      <span className="eyebrow">404</span>
      <h1>内容不存在</h1>
      <p>请回到 Home 或目录页继续浏览。</p>
    </section>
  );
}

import { getQualityWarnings, getReviewQueue } from "../lib/admin/review";
import { getAllContentItems } from "../lib/content/queries";

const reviewQueue = getReviewQueue(getAllContentItems());

export function AdminContentPage() {
  const queueWithWarnings = reviewQueue.map((item) => ({ item, warnings: getQualityWarnings(item) }));
  const blockingSignals = queueWithWarnings.reduce((total, entry) => total + entry.warnings.length, 0);
  const readyItems = queueWithWarnings.filter((entry) => entry.warnings.length === 0).length;
  const averageConfidence =
    queueWithWarnings.length > 0
      ? Math.round(queueWithWarnings.reduce((total, entry) => total + entry.item.confidence_score, 0) / queueWithWarnings.length)
      : 0;

  return (
    <div className="admin-workspace">
      <section className="admin-hero">
        <div>
          <span className="eyebrow">Review cockpit</span>
          <h1>Content Review</h1>
          <p>Review AI evaluation output, quality warnings, source evidence, and publish/archive decisions before public release.</p>
        </div>
        <div className="admin-metrics" aria-label="Review metrics">
          <div>
            <span>Open items</span>
            <strong>{reviewQueue.length}</strong>
          </div>
          <div>
            <span>Blocking signals</span>
            <strong>{blockingSignals}</strong>
          </div>
          <div>
            <span>Ready to publish</span>
            <strong>{readyItems}</strong>
          </div>
          <div>
            <span>Avg confidence</span>
            <strong>{averageConfidence}</strong>
          </div>
        </div>
      </section>

      <section className="admin-review-board" aria-label="Review queue">
        <div className="admin-board-head">
          <div>
            <span>Review queue</span>
            <h2>Human gate before publish</h2>
          </div>
          <p>Public pages only show published content. Low confidence, missing evidence, or action claims without next steps stay here.</p>
        </div>
        <div className="admin-review-list">
          {queueWithWarnings.length === 0 ? (
            <article className="admin-review-row" data-blocked={false}>
              <div className="admin-review-main">
                <span>empty / live-only</span>
                <h3>No draft items waiting for review</h3>
                <p>Live ingestion publishes only schema-valid LLM evaluations. Failed or fallback evaluations stay in the ingestion logs instead of becoming mock content.</p>
              </div>
            </article>
          ) : queueWithWarnings.map(({ item, warnings }) => {
            const isBlocked = warnings.length > 0;
          return (
            <article className="admin-review-row" data-blocked={isBlocked} key={item.id}>
              <div className="admin-review-main">
                <span>{item.status} / {item.content_type}</span>
                <h3>{item.title}</h3>
                <p>{item.one_sentence_takeaway}</p>
              </div>
              <div className="admin-review-scores" aria-label={`${item.title} scores`}>
                <div>
                  <span>confidence</span>
                  <strong>{item.confidence_score}</strong>
                </div>
                <div>
                  <span>impact</span>
                  <strong>{item.impact_score}</strong>
                </div>
                <div>
                  <span>action</span>
                  <strong>{item.actionability_score}</strong>
                </div>
              </div>
              <div className="admin-warning-panel">
                <h4>{isBlocked ? "Quality warnings" : "Quality clear"}</h4>
                <ul>
                  {isBlocked ? warnings.map((warning) => <li key={warning.code}>{warning.message}</li>) : <li>No warnings.</li>}
                </ul>
              </div>
              <div className="admin-review-actions">
                <button className="secondary-button" disabled={isBlocked} type="button">Publish</button>
                <button className="ghost-button" type="button">Archive</button>
              </div>
            </article>
          );
        })}
        </div>
      </section>
    </div>
  );
}

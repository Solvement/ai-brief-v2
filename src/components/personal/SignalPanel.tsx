import { useEffect, useMemo, useRef, useState } from "react";

import { actionLabels, type ActionLabel } from "../../lib/content/types";
import {
  evaluationRatingLabel,
  evaluationRatings,
  type EvaluationRating,
  type PersonalSignals,
} from "../../lib/personal/signals";
import {
  exportSignalsAsJson,
  importSignalsFromJson,
  readSignals,
  subscribe,
  writeSignals,
} from "../../lib/personal/storage";

interface SignalPanelProps {
  itemId: string;
  recommendedAction?: ActionLabel;
}

const debounceMs = 300;

function useDebouncedWriter(itemId: string) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useMemo(() => {
    return (partial: Partial<PersonalSignals>): void => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        writeSignals(itemId, partial);
      }, debounceMs);
    };
  }, [itemId]);
}

/**
 * `SignalPanel` is a local-only component for private review workflows. It is
 * intentionally not mounted on public detail pages so showcase builds do not
 * mix product content with the maintainer's personal notes.
 *
 * Storage adapter is `src/lib/personal/storage.ts` (localStorage). The DB
 * adapter (`src/lib/storage/repositories/signals.ts`) is used by Node tooling.
 */
export function SignalPanel({ itemId, recommendedAction }: SignalPanelProps) {
  const [signals, setSignals] = useState<PersonalSignals | null>(() => readSignals(itemId));
  const [showExporter, setShowExporter] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const debouncedWrite = useDebouncedWriter(itemId);

  useEffect(() => {
    setSignals(readSignals(itemId));
  }, [itemId]);

  useEffect(() => {
    return subscribe(() => setSignals(readSignals(itemId)));
  }, [itemId]);

  const update = (partial: Partial<PersonalSignals>) => {
    const next = writeSignals(itemId, partial);
    setSignals(next);
  };

  const toggleRating = (rating: EvaluationRating) => {
    update({ evaluation_rating: signals?.evaluation_rating === rating ? undefined : rating });
  };

  const handleNotesChange = (notes: string) => {
    setSignals((prev) => ({ ...(prev ?? { saved_to_kb: false, updated_at: new Date(0).toISOString() }), notes, updated_at: new Date().toISOString() }));
    debouncedWrite({ notes });
  };

  const handleOverrideTakeawayChange = (override_takeaway: string) => {
    setSignals((prev) => ({ ...(prev ?? { saved_to_kb: false, updated_at: new Date(0).toISOString() }), override_takeaway, updated_at: new Date().toISOString() }));
    debouncedWrite({ override_takeaway });
  };

  const handleOverrideActionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ActionLabel | "";
    update({ override_action: value === "" ? undefined : value });
  };

  const handleSaveToKbToggle = () => update({ saved_to_kb: !(signals?.saved_to_kb ?? false) });

  const handleMarkActed = () => update({ acted_on_at: new Date().toISOString() });

  const handleClearActed = () => update({ acted_on_at: undefined });

  const handleImport = (event: React.MouseEvent<HTMLButtonElement>, mode: "merge" | "replace") => {
    event.preventDefault();
    const textarea = document.querySelector<HTMLTextAreaElement>(".signal-panel__io-input");
    if (!textarea || !textarea.value.trim()) {
      setImportMessage("请先粘贴 JSON 内容。");
      return;
    }
    try {
      const result = importSignalsFromJson(textarea.value, mode);
      setImportMessage(`已导入 ${result.imported} 条，跳过 ${result.skipped} 条。`);
      setSignals(readSignals(itemId));
    } catch (error) {
      setImportMessage(error instanceof Error ? error.message : String(error));
    }
  };

  const acted = signals?.acted_on_at;

  return (
    <section className="signal-panel" aria-labelledby={`signal-panel-${itemId}`}>
      <header className="signal-panel__header">
        <h3 id={`signal-panel-${itemId}`}>个人反馈</h3>
        <button
          type="button"
          className="signal-panel__io-toggle"
          onClick={() => setShowExporter((value) => !value)}
        >
          {showExporter ? "收起 导出 / 导入" : "导出 / 导入"}
        </button>
      </header>

      <div className="signal-panel__row signal-panel__row--rating" role="group" aria-label="评估评级">
        {evaluationRatings.map((rating) => (
          <button
            key={rating}
            type="button"
            className="signal-panel__chip"
            data-active={signals?.evaluation_rating === rating}
            onClick={() => toggleRating(rating)}
          >
            {evaluationRatingLabel[rating]}
          </button>
        ))}
      </div>

      <details className="signal-panel__override">
        <summary>修正判断</summary>
        <label>
          <span>我自己的一句话判断</span>
          <textarea
            value={signals?.override_takeaway ?? ""}
            onChange={(event) => handleOverrideTakeawayChange(event.target.value.slice(0, 200))}
            maxLength={200}
            placeholder="不必每条都写。最多 200 字。"
          />
        </label>
        <label>
          <span>我建议的行动</span>
          <select value={signals?.override_action ?? ""} onChange={handleOverrideActionChange}>
            <option value="">{recommendedAction ? `沿用 AI 建议（${recommendedAction}）` : "不修正"}</option>
            {actionLabels.map((label) => (
              <option key={label} value={label}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </details>

      <div className="signal-panel__row signal-panel__row--actions">
        <label className="signal-panel__checkbox">
          <input
            type="checkbox"
            checked={signals?.saved_to_kb ?? false}
            onChange={handleSaveToKbToggle}
          />
          <span>我打算做这件事</span>
        </label>
        {acted ? (
          <span className="signal-panel__acted">
            已执行 {new Date(acted).toLocaleDateString("zh-CN")}
            <button type="button" onClick={handleClearActed} aria-label="撤销已执行标记">
              撤销
            </button>
          </span>
        ) : (
          <button type="button" className="signal-panel__action" onClick={handleMarkActed}>
            标记为已执行
          </button>
        )}
      </div>

      <label className="signal-panel__notes">
        <span>笔记（支持 Markdown，写完会自动保存）</span>
        <textarea
          value={signals?.notes ?? ""}
          onChange={(event) => handleNotesChange(event.target.value)}
          placeholder="比如：尝试时遇到了什么、和现有方案对比下来值不值。"
        />
      </label>

      {showExporter ? (
        <div className="signal-panel__io">
          <p>当前导出 JSON（覆盖全部条目）：</p>
          <textarea
            className="signal-panel__io-export"
            readOnly
            value={exportSignalsAsJson()}
            rows={6}
          />
          <p>粘贴 JSON 后导入：</p>
          <textarea className="signal-panel__io-input" rows={4} placeholder="粘贴此前导出的 JSON 内容…" />
          <div className="signal-panel__io-controls">
            <button type="button" onClick={(event) => handleImport(event, "merge")}>
              合并导入（保留新版本）
            </button>
            <button type="button" onClick={(event) => handleImport(event, "replace")}>
              覆盖式导入（清空后再写入）
            </button>
          </div>
          {importMessage ? <p className="signal-panel__io-message">{importMessage}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

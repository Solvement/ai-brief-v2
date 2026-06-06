"use client";
import { useEffect, useState } from "react";

interface Props {
  itemType: string;
  itemId: string;
  itemTitle?: string;
}

interface Feedback {
  pick_score: number | null;
  quality_score: number | null;
  hide: boolean;
  note: string;
}

const EMPTY: Feedback = { pick_score: null, quality_score: null, hide: false, note: "" };
type Status = "loading" | "idle" | "saving" | "saved" | "error";

function Stars({ value, onPick }: { value: number | null; onPick: (n: number) => void }) {
  return (
    <span className="fb-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className={`fb-star${value && n <= value ? " on" : ""}`}
          onClick={() => onPick(n)}
          aria-label={`${n} 分`}
        >
          ★
        </button>
      ))}
    </span>
  );
}

export function FeedbackWidget({ itemType, itemId, itemTitle }: Props) {
  const [fb, setFb] = useState<Feedback>(EMPTY);
  const [status, setStatus] = useState<Status>("loading");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`/api/feedback?item_type=${encodeURIComponent(itemType)}&item_id=${encodeURIComponent(itemId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        const f = d?.feedback;
        if (f) setFb({ pick_score: f.pick_score ?? null, quality_score: f.quality_score ?? null, hide: f.hide ?? false, note: f.note ?? "" });
      })
      .catch(() => {})
      .finally(() => {
        if (alive) {
          setStatus("idle");
          setDirty(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [itemType, itemId]);

  // 只改本地状态,不保存;等点【提交评价】才一次性写云端。
  function update(next: Partial<Feedback>) {
    setFb((prev) => ({ ...prev, ...next }));
    setDirty(true);
    setStatus((s) => (s === "saved" ? "idle" : s));
  }

  async function submit() {
    setStatus("saving");
    try {
      const r = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ item_type: itemType, item_id: itemId, item_title: itemTitle, ...fb }),
      });
      if (!r.ok) throw new Error();
      setStatus("saved");
      setDirty(false);
    } catch {
      setStatus("error");
    }
  }

  const statusText =
    status === "loading" ? "读取中…"
    : status === "saving" ? "提交中…"
    : status === "saved" ? "已保存 ✓"
    : status === "error" ? "保存失败,稍后再试"
    : dirty ? "有未提交的修改" : "";

  return (
    <section className="fb" aria-label="我的评价">
      <div className="fb-head">
        我的评价
        <span className="fb-status">{statusText}</span>
      </div>
      <div className="fb-body">
        <div className="fb-row">
          <span className="fb-label">该不该选给我</span>
          <Stars value={fb.pick_score} onPick={(n) => update({ pick_score: n })} />
        </div>
        <div className="fb-row">
          <span className="fb-label">深读质量</span>
          <Stars value={fb.quality_score} onPick={(n) => update({ quality_score: n })} />
        </div>
        <div className="fb-row">
          <label className="fb-hide">
            <input type="checkbox" checked={fb.hide} onChange={(e) => update({ hide: e.target.checked })} />
            不想再看这类
          </label>
        </div>
        <textarea
          className="fb-note"
          placeholder="随手记:好的点 / 坏的点 / 没看懂的 / 我的理解 / 学到啥…"
          value={fb.note}
          onChange={(e) => update({ note: e.target.value })}
        />
        <div className="fb-actions">
          <button
            type="button"
            className="fb-submit"
            onClick={submit}
            disabled={status === "saving" || status === "loading" || !dirty}
          >
            提交评价
          </button>
        </div>
      </div>
    </section>
  );
}

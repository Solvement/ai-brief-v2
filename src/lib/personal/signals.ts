import type { ActionLabel } from "../content/types";

/**
 * Per-item personal feedback. Captured to:
 *
 * - override an evaluation Kevin disagrees with;
 * - flag items he's actually going to act on (vs. only intended);
 * - look back 7–30 days later to see whether plans turned into action;
 * - attach freeform notes alongside the AI evaluation.
 *
 * Storage adapter is decided at runtime: a Node DB-backed repository (see
 * `src/lib/storage/repositories/signals.ts`) writes to SQLite; the browser
 * adapter (`./storage.ts`) writes to localStorage. Both implement the same
 * shape so callers don't branch.
 */
export type EvaluationRating = "accurate" | "wrong" | "shallow" | "insightful";

export const evaluationRatings: EvaluationRating[] = ["accurate", "wrong", "shallow", "insightful"];

export const evaluationRatingLabel: Record<EvaluationRating, string> = {
  accurate: "准",
  wrong: "错",
  shallow: "浅",
  insightful: "有启发",
};

export interface PersonalSignals {
  /** How Kevin rates AI-brief's evaluation of this item. */
  evaluation_rating?: EvaluationRating;
  /** Kevin's own one-sentence judgment, when he disagrees with the AI's. */
  override_takeaway?: string;
  /** Kevin's preferred action when he disagrees with `recommended_action`. */
  override_action?: ActionLabel;
  /** True when Kevin marks this for eventual KB / wiki export. */
  saved_to_kb: boolean;
  /** ISO timestamp when Kevin actually used / read / tried the thing. */
  acted_on_at?: string;
  /** Free-form notes (markdown allowed). No length cap in MVP. */
  notes?: string;
  /** Last write timestamp. Stamped automatically by the adapter. */
  updated_at: string;
}

export function emptySignals(): PersonalSignals {
  return { saved_to_kb: false, updated_at: new Date(0).toISOString() };
}

export function mergeSignals(
  existing: PersonalSignals | null | undefined,
  partial: Partial<PersonalSignals>,
): PersonalSignals {
  return {
    ...(existing ?? emptySignals()),
    ...partial,
    updated_at: new Date().toISOString(),
  };
}

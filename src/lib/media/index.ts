import type { AnyContentItem, ContentType, MediaAsset } from "../content/types";

/**
 * AI-brief media policy (post-cleanup):
 *
 * 1. We do NOT auto-generate cover images here. Image generation is a manual
 *    editorial step done outside the app (ChatGPT, screenshots, hand-drawn
 *    diagrams). The evaluator may emit an `image_plan` with a recommended
 *    prompt and policy; the human writes the actual image and drops it in
 *    `public/assets/`.
 * 2. The job of this module is therefore to (a) decide whether a content
 *    item has an approved image we can show, and (b) produce a deterministic
 *    visual placeholder when it does not.
 * 3. Only `status === "approved"` media should ever be rendered in public
 *    surfaces. Drafts and rejected assets are admin-only.
 */

const cardMediaTypes: MediaAsset["type"][] = ["thumbnail", "cover", "logo"];

const placeholderPalettes: Record<ContentType, { from: string; to: string; ink: string }> = {
  news: { from: "#fff4d8", to: "#e7d09a", ink: "#4d3b18" },
  model: { from: "#edf3ff", to: "#b9c9ff", ink: "#1f3670" },
  tool: { from: "#f0f8ef", to: "#b9d8b5", ink: "#213f24" },
  project: { from: "#ecf4ff", to: "#bdd7ee", ink: "#1e3c5a" },
  integration: { from: "#fff0ec", to: "#e3b6aa", ink: "#563028" },
  article: { from: "#fff6df", to: "#e3cda0", ink: "#453619" },
  paper: { from: "#f0f1ff", to: "#c7cbf4", ink: "#252b63" },
  guide: { from: "#f9f1e7", to: "#d8baa0", ink: "#4b3320" },
  course: { from: "#ecfbf8", to: "#b1ddd3", ink: "#1f453e" },
};

const contentTypeLabel: Record<ContentType, string> = {
  news: "NEWS",
  model: "MODEL",
  tool: "TOOL",
  project: "PROJECT",
  integration: "INTEGRATION",
  article: "ARTICLE",
  paper: "PAPER",
  guide: "GUIDE",
  course: "COURSE",
};

function isApprovedCardAsset(asset: MediaAsset | undefined): asset is MediaAsset {
  return Boolean(asset) && asset!.status === "approved" && cardMediaTypes.includes(asset!.type);
}

export function getApprovedCardMedia(item: AnyContentItem): MediaAsset | undefined {
  const candidates = [item.thumbnail_image, item.cover_image, ...(item.media_assets ?? [])];
  return candidates.find(isApprovedCardAsset);
}

export function getApprovedCoverMedia(item: AnyContentItem): MediaAsset | undefined {
  const explicit = item.cover_image;
  if (isApprovedCardAsset(explicit) && explicit.type === "cover") return explicit;
  const fromAssets = (item.media_assets ?? []).find(
    (asset): asset is MediaAsset => asset.status === "approved" && asset.type === "cover",
  );
  return fromAssets ?? getApprovedCardMedia(item);
}

export interface VisualPlaceholder {
  kind: "placeholder";
  contentType: ContentType;
  label: string;
  initials: string;
  gradientFrom: string;
  gradientTo: string;
  ink: string;
}

function deriveInitials(item: AnyContentItem): string {
  const candidate = item.title.trim().split(/\s+/)[0] ?? "";
  if (/^[\u4e00-\u9fff]+$/.test(candidate)) {
    return [...candidate].slice(0, 2).join("");
  }
  return contentTypeLabel[item.content_type].slice(0, 2);
}

export function placeholderForItem(item: AnyContentItem): VisualPlaceholder {
  const palette = placeholderPalettes[item.content_type] ?? placeholderPalettes.article;
  return {
    kind: "placeholder",
    contentType: item.content_type,
    label: contentTypeLabel[item.content_type],
    initials: deriveInitials(item),
    gradientFrom: palette.from,
    gradientTo: palette.to,
    ink: palette.ink,
  };
}

export type CardVisual = MediaAsset | VisualPlaceholder;

export function getCardVisual(item: AnyContentItem): CardVisual {
  return getApprovedCardMedia(item) ?? placeholderForItem(item);
}

export function isPlaceholder(visual: CardVisual): visual is VisualPlaceholder {
  return (visual as VisualPlaceholder).kind === "placeholder";
}

export function validateMediaAsset(asset: MediaAsset): string[] {
  const issues: string[] = [];
  if (!asset.id) issues.push("Media asset requires id.");
  if (!asset.url) issues.push("Media asset requires url.");
  if (!asset.alt) issues.push("Media asset requires alt text.");
  if (!asset.created_at) issues.push("Media asset requires created_at.");
  if (asset.source_type.startsWith("generated") && !asset.prompt) {
    issues.push("Generated media requires the prompt that produced it for traceability.");
  }
  if (asset.status === "approved" && !asset.credit) {
    issues.push("Approved media requires credit (photographer, screenshot source, or 'Generated with <tool>').");
  }
  return issues;
}

export function listMediaAssets(item: AnyContentItem): MediaAsset[] {
  const out: MediaAsset[] = [];
  if (item.cover_image) out.push(item.cover_image);
  if (item.thumbnail_image && item.thumbnail_image.id !== item.cover_image?.id) {
    out.push(item.thumbnail_image);
  }
  for (const asset of item.media_assets ?? []) {
    if (!out.some((existing) => existing.id === asset.id)) out.push(asset);
  }
  return out;
}

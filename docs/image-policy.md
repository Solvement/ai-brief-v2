# Image Policy

This document is the source of truth for how AI-brief decides whether content
gets an image, what kind, and where the image comes from. The schema in
`src/lib/content/types.ts` (`ImagePolicy`, `ImagePlan`) and the validator in
`src/lib/ai/evaluation/schema.ts` (`validateImagePlan`) enforce this.

## Principles

1. **Few, high quality, consistent.** AI-brief does not configure a glamour
   cover for every item. Images exist to help the reader judge "what is this"
   and "how do I use it" — not to make the page look busy.
2. **AI plans the image, humans produce it.** The evaluator emits an
   `image_plan` (policy + reason + prompt + alt). Editors take the prompt to
   ChatGPT (or pick a screenshot) and drop the resulting file into
   `public/assets/`, or approve a source-provided thumbnail URL when the source
   grants a usable image. **AI-brief does not call any image-generation API.**
3. **Public surfaces only render `MediaAsset.status === "approved"`.** Drafts
   and rejected assets stay in `/admin/media`.
4. **No broken images, ever.** When nothing is approved, the card renders a
   deterministic CSS placeholder (`placeholderForItem` in `src/lib/media`),
   never a 404 `<img>`.

## The matrix

For each content type we pick a default `ImagePolicy`. The deterministic
chooser in `src/lib/ai/evaluation/schema.ts::defaultImagePolicy` implements the
table below; the LLM is allowed to override but the validator pushes back when
the override doesn't make sense.

| Content type   | Default policy            | Notes                                                    |
| -------------- | ------------------------- | -------------------------------------------------------- |
| `news`         | `thumbnail_only`          | Quick hits stay quick. Never `cover_and_diagram`.        |
| `model`        | `logo_only` / `cover_and_diagram` | Logo by default; deep-dive items get a cover + diagram. |
| `tool`         | `screenshot_required`     | Real screenshot beats abstract illustration.             |
| `project`      | `screenshot_required`     | Same.                                                    |
| `integration`  | `screenshot_required`     | Same.                                                    |
| `article`      | `thumbnail_only` / `cover_and_diagram` | Deep-dive only earns the cover.                  |
| `paper`        | `thumbnail_only` / `cover_and_diagram` | Deep-dive earns a mechanism diagram.            |
| `guide`        | `step_images`             | Step screenshots are mandatory; cover optional.          |
| `course`       | `logo_only`               | Provider/platform logo is enough.                        |

Two overrides apply regardless of content type:

- `confidence_score < 45` or `recommended_action === "avoid"` → `policy = "none"`.
  Low-confidence items must not be presented with hero imagery — that signals
  authority we don't have.
- Skill / Skill Pack / SKILL.md / agent-rules content (detected by
  `isSkillLikeInput`) → `thumbnail_only` with a `rule_card` or `diagram`
  recommendation. No glamour cover.

## Image-plan shape

```ts
interface ImagePlan {
  policy: ImagePolicy;                          // one of imagePolicies
  reason: string;                               // editorial reason, 30–160 zh chars
  recommended_types: RecommendedImageType[];    // priority-ordered
  prompt?: string;                              // required iff policy is cover/cover_and_diagram
  alt: string;                                  // 30–120 zh chars, describes the image, not the article
}
```

`recommended_types` is ordered from preferred to fallback. For example a
`screenshot_required` item recommends `["screenshot", "logo"]` — the editor
prefers a real product screenshot, but a logo crop is acceptable when no
screenshot is available.

## Where images come from

Order of preference (high to low):

1. **Self-captured screenshot** — terminal, GitHub README, product screen.
2. **Official logo / official media** — used with attribution.
3. **README crop / project diagram** — the project's own architecture diagram.
4. **Hand-drawn diagram** — Mermaid, Excalidraw, or a Figma sketch.
5. **AI-generated illustration** — only when steps 1–4 don't fit. Use the
   `image_plan.prompt` in ChatGPT, save the file, drop it into
   `public/assets/<slug>/<asset-id>.png`.
6. **Placeholder gradient** — automatic, no work needed; `getCardVisual`
   returns a `VisualPlaceholder`.

If you generate an AI image, the resulting `MediaAsset` must have
`source_type: "generated_editorial"` (or `generated_diagram`) **and** a
non-empty `prompt` field — the validator rejects approved generated media
without prompt traceability.

## Style rules for AI-generated covers

When the editor goes to ChatGPT/DALL-E to produce a cover from
`image_plan.prompt`:

- **No readable text.** Image models are bad at it.
- **No real brand logos.**
- **No real person likeness.**
- **No fake UI screenshots.** If you want UI, take a real screenshot.
- **Style:** Clean modern editorial illustration, off-white background,
  restrained blue/violet/cyan accents, professional newsletter feel.
- **Aspect ratio:** `16:9` for `cover` and `cover_and_diagram`; `4:3` for
  `thumbnail_only`.

The default prompt the evaluator emits already includes these constraints; do
not strip them before pasting.

## Admin review checklist

For every `MediaAsset` you approve in `/admin/media`:

- `alt` reads like a sentence, not a title.
- `credit` is filled in (`"Generated with ChatGPT"`, `"Project README screenshot"`,
  `"Hand-drawn"`, etc.).
- For `generated_*` types, `prompt` matches what was actually used.
- The image matches the matrix policy (quick-hit news doesn't get a cover; a
  Skill doesn't get a glamour hero).
- The image isn't a generic "AI brain / cyberpunk city / neon eye" stock cliché.

## What this policy does NOT do (yet)

- It does not call image-generation APIs. Source-provided remote thumbnails may
  render only when attached as approved `source_image` assets with alt and
  credit; generated images should be stored locally under `public/assets/`.
- It does not auto-resize or auto-crop. The editor produces the asset at the
  right aspect ratio.
- It does not enforce a global style transfer. Consistency comes from
  prompting discipline and review, not a layer.

When any of these become real needs, write a follow-up phase under
`docs/handoff/codex-next-tasks.md`. Don't grow this file into a build pipeline.

# Simcha — design spec (v2, "invitation & ledger")

Handoff doc for implementation. Concept: the guest-facing app should feel like an
actual wedding invitation (paper, torn edges, wax-seal actions), not a generic SaaS
form. The admin app keeps the same color/type system but should read as a **modern
dashboard** — this spec locks the visual language; the admin *layout* (grid, cards,
nav pattern) is intentionally left open for a fresh, more conventional-dashboard pass.

## Design tokens

```css
:root {
  /* paper / structure */
  --simcha-paper: #EFE6D2;      /* page/card background, guest-facing surfaces */
  --simcha-paper-dark: #E3D6B8; /* recessed/active surface on paper */
  --simcha-ink: #241A14;        /* primary text */
  --simcha-ink-muted: #5A4D3A;  /* secondary text */
  --simcha-line: #C9B98D;       /* hairline borders/rules on paper */

  /* accents */
  --simcha-red: #B23A2E;        /* primary accent — CTAs, confirmed status, seal */
  --simcha-gold: #8C7038;       /* secondary accent — labels, hairlines, dividers */
  --simcha-green: #4F5C3A;      /* tertiary accent — leaf motif, secondary status */

  /* for the ADMIN app specifically, prefer a neutral modern surface instead of
     --simcha-paper as the base — white/near-white background, --simcha-ink for
     text, and the three accent colors above used sparingly for status/action,
     the same way they're used on the guest-facing side. Keep the accents
     consistent across both apps; that's what ties them together as one brand. */
}
```

## Typography

- **Bellefair** (Google Fonts) — couple's names / hero moments only. Large sizes (40px+). Has real Hebrew glyph support, not just Latin.
- **Frank Ruhl Libre**, weight 500/700 — section headers, form section titles.
- **Rubik**, weight 400/500 — everything else (body, labels, table content, nav).

Import: `https://fonts.googleapis.com/css2?family=Bellefair&family=Frank+Ruhl+Libre:wght@500;700&family=Rubik:wght@400;500&display=swap`

All UI is **RTL-first**: `dir="rtl"` at the app root, layouts mirrored (nav/sidebar on the right, not left).

## Signature motifs

1. **Torn/deckled paper edge** — used on the invitation landing page card only (not overused elsewhere). CSS `clip-path` zigzag, see reference code.
2. **Wax-seal circular button** — the primary CTA pattern (RSVP confirm, run seating optimization). Circle, 2px accent-color border, centered label, slight rotation (`-6deg` or `4deg`) for a hand-stamped feel. Use for the 1–2 most important actions per screen, not every button.
3. **Pomegranate seed dots** — used functionally, not decoratively: as the party-size selector on the RSVP form (filled vs outline circles), and can extend to any small-count selector. Don't reuse as a generic progress bar — that's the thing we moved away from.

## Reference implementation (from mockups)

Two working HTML/CSS mockups exist from the design pass — hand these to Claude Code as literal reference for markup structure and exact values:

- **Guest-facing invitation/RSVP page**: torn-edge card, Bellefair couple names, vine divider (SVG), underline-style form fields (no boxed inputs), seed-dot party size selector, wax-seal confirm button.
- **Admin ledger (v1, to be redirected toward "modern dashboard")**: folder-tab nav, ruled guest rows, stamp badges for stats. Keep the color tokens and stamp-button CTA pattern from this version even as the grid/layout gets modernized — don't keep the ledger/paper metaphor for the admin shell itself.

(Full HTML for both is in the chat history — paste directly into Claude Code as a reference file, e.g. `design-reference/landing.html` and `design-reference/admin-ledger-v1.html`, and ask it to extract the component structure rather than starting from a blank page.)

## Direction for admin dashboard v2 (not yet designed)

Modern dashboard conventions to apply on next pass, keeping the tokens above:
- Persistent left/right nav rail (RTL: right side) — standard sidebar, not folder tabs
- Metric cards in a responsive grid, using `--simcha-red` / `--simcha-green` / `--simcha-gold` for status meaning (confirmed / available / budget), not as decoration
- Data-dense guest table with sort/filter, not a static ruled list
- Keep the wax-seal button pattern for the 1–2 highest-stakes actions (run seating optimizer); everything else should be standard modern dashboard controls

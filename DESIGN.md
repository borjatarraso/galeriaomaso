# Design system — galeriaomaso.com

The visual/interaction blueprint. The implementation lives in a single
`style.css` (~2,360 lines) and `site.js`. This document captures the design
decisions a contributor should keep consistent. For where these files sit
in the system see [`ARCHITECTURE.md`](ARCHITECTURE.md); for the JS feature
breakdown see [`docs/frontend.md`](docs/frontend.md).

## Theme tokens

All color/spacing decisions go through CSS custom properties on `:root` in
`style.css`. Use the tokens — don't hard-code hex values in new rules.

| Token | Value | Role |
|-------|-------|------|
| `--bg-dark` | `#37021c` | Page background (deep burgundy). |
| `--bg-darker` | `#2a0115` | Recessed surfaces, tiles. |
| `--bg-card` | `#4a0a2e` | Card background. |
| `--bg-card-hover` | `#5a1038` | Card hover. |
| `--accent` | `#ffd966` | Gold — links, headings flourish, focus ring. |
| `--accent-dim` | `#c9a84a` | Muted gold. |
| `--text` / `--text-bright` / `--text-muted` / `--text-body` | `#f0e8e0` / `#fff` / `#d4a0b8` / `#e0d0d8` | Text ramp. |
| `--hover` | `#741b47` | Hover wash. |
| `--border` / `--border-light` | `#6b1d42` / `#8a2a55` | Hairlines; `-light` on hover. |
| `--teal` | `#339999` | Sparing secondary accent. |
| `--radius` | `6px` | Default corner radius. |
| `--max-width` | `1200px` | Content column cap. |
| `--transition` | `0.25s ease` | Standard transition. |

The palette is a **dark burgundy + gold** identity. New components should
read from these tokens so a future palette change stays a one-file edit.

## Typography

- **Display / headings:** `'Cinzel Decorative', 'Cinzel', Georgia, serif`
  (loaded from Google Fonts, `preconnect`-warmed in `<head>`).
- **Body:** `Georgia, serif` family.
- The header logo is the LCP element on most pages — it loads
  `eager` + `fetchpriority=high` while everything else is lazy.

## Layout & responsiveness

- Single centered column capped at `--max-width` (1200px).
- Mobile-first refinements via `max-width` media queries. Active
  breakpoints (smallest set that the CSS actually uses): **980, 820, 768,
  760, 640, 600, 500, 480 px**. Reuse an existing breakpoint rather than
  inventing a near-duplicate.
- A `@media print` block and **four `prefers-reduced-motion: reduce`**
  blocks exist — any new animation must ship a reduced-motion opt-out.

## Components (conventions)

- **Cards** (`.post-card`, section grids): rounded via `--radius`, border
  `--border` → `--border-light` on hover, image scaled on hover inside a
  `clip-path: inset(0)` clip so the zoom never bleeds past the card.
- **Top bar / nav:** social icons + language/view toggles; nav strings come
  from `translations.js`, never hard-coded in markup.
- **Focus:** `:focus-visible` gets a 2px gold (`--accent`) outline — keep
  it; it's the accessibility focus indicator.
- **Scrollbar:** themed via `scrollbar-color` + webkit pseudo-elements to
  match the burgundy/gold palette.

## Entry animation

`site.js` plays a **once-per-session** full-screen art-themed intro on the
first page rendered. Implementation notes:

- Gate key: `sessionStorage['oo_intro_played_v2']`. Setting it to `'1'`
  before load (e.g. in tests/screenshots) skips the intro.
- A random variant is chosen per session from an 8-entry `VARIANTS`
  registry, each shipping its own CSS + SVG payload:
  **`sumi`, `tachisme`, `rothko`, `aurora`, `constellation`, `kintsugi`,
  `bauhaus`, `klimt`**.
- Skipped entirely for `prefers-reduced-motion` users.
- Dismissable (click / key) and auto-dismisses after its duration.

## Conventions Claude should respect

1. **Token-first:** new styling references `:root` custom properties; avoid
   raw hex/spacing literals.
2. **Reuse breakpoints** from the list above; don't add near-duplicates.
3. **Every animation needs a `prefers-reduced-motion` opt-out.**
4. **`style.css` is the deploy fingerprint asset** — it is hashed local vs
   live in CI. Keep it a single file; don't split it into multiple
   stylesheets without updating the verification step.
5. After editing, **mirror `style.css` to the repo root manually**
   (`cp public/style.css style.css`) — the SEO scripts mirror HTML only.

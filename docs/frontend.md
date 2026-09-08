# Frontend behavior

What `site.js` and `translations.js` do at runtime. For the visual system
(tokens, layout, components, entry animation) see [`../DESIGN.md`](../DESIGN.md).

## Files

| File | Role |
|------|------|
| `site.js` | All client-side behavior, organized as independent IIFEs. |
| `translations.js` | `galTranslations` — nav/toolbar UI strings keyed by `data-g18n`, for 8 languages. |
| `style.css` | Single stylesheet (see DESIGN.md). |

No framework, no bundler — the scripts are loaded directly and run on the
static HTML.

## `site.js` features (IIFE blocks)

Each feature is a self-contained `(function(){ … })()` so blocks stay
isolated:

1. **Mobile menu toggle** — toggles `.open` on the topbar nav; Esc closes.
2. **Google Translate integration** — full-page machine translation for
   body content. The in-repo `data-g18n` map handles nav/toolbar; Google
   Translate handles everything else.
3. **Language selector** — switches the `data-g18n` UI strings and drives
   the Google Translate widget. Languages: **es, en, de, fr, it, zh, ja,
   fa**.
4. **View-mode toggle** — desktop/mobile preview switch in the toolbar.
5. **Image lightbox** — click-to-zoom for content images.
6. **Gallery contact form** — the form on `contacta.html`.
7. **Critique modal** — opens full critique text from an inline
   `<template>`.
8. **Entry animation** — once-per-session art-themed intro (8 random
   variants; gated by `sessionStorage['oo_intro_played_v2']`; skipped under
   `prefers-reduced-motion`). Details in [`../DESIGN.md`](../DESIGN.md).

## Internationalization

- **UI chrome** (nav, toolbar, topbar) is translated from
  `translations.js`: elements carry `data-g18n="nav.exposiciones"` etc.,
  and the language selector swaps in the right string per language.
- **Body content** is translated at runtime by the Google Translate widget.
  `robots.txt` blocks Google Translate's `?_x_tr_*` URL mirrors so the
  machine-translated variants don't compete with canonical pages in search.

## Conventions Claude should respect

1. **Keep features as separate IIFEs.** Don't merge blocks or leak globals
   between them.
2. **Never hard-code nav/toolbar text in markup** — add a key to
   `translations.js` for all 8 languages and reference it via `data-g18n`.
3. **`site.js` is mirrored to the repo root manually** (`cp public/site.js
   site.js`) — the SEO scripts mirror HTML only.
4. **Respect `prefers-reduced-motion`** for any new motion.

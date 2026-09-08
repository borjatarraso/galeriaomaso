# SEO pipeline

The three Python scripts in [`../scripts/`](../scripts/CLAUDE.md) that
enrich the static HTML. This is a **text companion** to
`seo_visibility_pipeline.svg/png` in this folder. They are run **manually
by the maintainer** after content edits — there is no build step at request
time.

Run order (always):

```bash
python3 scripts/seo-transform.py   # 1
python3 scripts/seo-files.py       # 2
python3 scripts/seo-plus.py        # 3
```

## 1. `seo-transform.py` — per-page metadata + JSON-LD

Walks every `public/*.html` and `public/posts/*.html`. For each file it:

1. Locates `<div class="page-content">` or `<main>` to skip the shared
   topbar/nav (so the language switcher never leaks into descriptions).
2. Extracts the **title** from the first significant `<h2>`.
3. Extracts the **description** from the first body paragraph (strips the
   repeated title and the `lunes, 8 de mayo de 2017`-style date prefix,
   ~155 char cap).
4. Uses the first non-logo `<img>` as `og:image`.
5. Builds canonical URL (extension-less), Open Graph, Twitter Card, and
   JSON-LD: `ArtGallery`+`WebSite` on home, `CollectionPage` on sections,
   `Article`+`BreadcrumbList` on posts, plus `ExhibitionEvent` when a
   `del N de mes al N de mes de YYYY` range is detected.
6. Writes everything between `<!-- gal-seo:start/end -->` (and the
   `gal-cf-beacon` stub) so re-running **replaces** rather than duplicates.
7. Mirrors each edited HTML file from `public/` up to the repo root.

Title suffixes: posts get `… | Galería O+O · Valencia` (local-SEO
long-tail); sections get `… | Galería O+O`.

## 2. `seo-files.py` — crawler & feed support files

Generates, into `public/`:

- **`robots.txt`** — allows all, blocks Google Translate's `?_x_tr_*`
  machine-translated URL mirrors, advertises the sitemap.
- **`sitemap.xml`** — one `<url>` per page, `lastmod` from file mtime,
  per-section priority/changefreq.
- **`_headers`** — Cloudflare cache-control + security headers per path
  glob (see [`operations.md`](operations.md)).
- **`llms.txt`** — Anthropic LLMS.txt convention: a curated site map for AI
  assistants.
- **`feed.xml`** — RSS 2.0 of the latest 50 posts by mtime.

## 3. `seo-plus.py` — perf + related posts

Edits `public/**/*.html` in place, then mirrors to root:

- Adds `loading="lazy"` + `decoding="async"` to every `<img>` lacking them;
  bumps the header logo to `loading="eager"` + `fetchpriority="high"` (LCP
  candidate).
- Injects the `<head>` perf block (preconnect to Fonts/GTranslate/CF,
  dns-prefetch, RSS `<link>`) inside `<!-- gal-perf:start/end -->`.
- On **posts only**, builds the "related exhibitions" block (4
  chronologically-nearest siblings, excluding prev/next) inside
  `<!-- gal-related:start/end -->`, before `.post-nav`.

## Idempotency contract

Every transform is wrapped in `<!-- gal-*:start/end -->` markers and the
generated support files are fully overwritten. Re-running the whole
pipeline on an already-processed tree should be a no-op (modulo `lastmod`
timestamps). Preserve this property in any change — it's what makes the
scripts safe to run repeatedly.

## Dependencies

The trio is **Python standard library only** — no `pip install`. (Only
`generate_qr_codes.py`, which is *not* part of this pipeline, needs
`qrcode` + `Pillow`.)

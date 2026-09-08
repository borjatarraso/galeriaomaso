# `scripts/` — content & SEO build tooling (module guidance)

Scoped guidance for the `scripts/` module. For the project-wide picture
see the root [`../CLAUDE.md`](../CLAUDE.md) and
[`../ARCHITECTURE.md`](../ARCHITECTURE.md).

## Responsibility

`scripts/` holds the **only executable code in the project**: small,
standalone Python utilities that post-process the static site. The site
itself has no build step — these scripts are run **manually by the
maintainer** after editing content, not by CI. They enrich the hand-written
HTML with SEO/perf metadata and (re)generate the edge support files.

## The scripts

| Script | What it does | Outputs |
|--------|--------------|---------|
| `seo-transform.py` | Per-page `<head>` rewrite: unique `<title>`/`<meta description>` (from first `<h2>` + first paragraph), `<link rel=canonical>`, Open Graph, Twitter Card, JSON-LD (`ArtGallery`+`WebSite` on home, `Article`+`BreadcrumbList` on posts, `ExhibitionEvent` when a `del N de mes al N de mes de YYYY` date range is present), `CollectionPage` on sections. | Edits every `public/**/*.html` in place, then mirrors HTML to repo root. |
| `seo-files.py` | Generates the crawler/feed support files from the file tree. | `public/{robots.txt, sitemap.xml, _headers, llms.txt, feed.xml}` (feed = latest 50 posts by mtime). |
| `seo-plus.py` | Tier-2 perf: adds `loading=lazy`/`decoding=async` to imgs (logo gets `eager`+`fetchpriority=high`), injects the `<head>` preconnect/RSS block, and builds the per-post "related exhibitions" block (4 chronologically-nearest siblings). | Edits `public/**/*.html` in place, then mirrors HTML to repo root. |
| `generate_qr_codes.py` | One-off marketing tool (not part of the SEO pipeline). Builds vCard-3.0 QR codes for both gallery domains. | `../qr-codes/{galeriaomaso,enriquetahueso}.{vcf,svg,png}` + `_card.png`. |

## Public interface

These are **CLIs with no arguments** — run them from the repo root:

```bash
python3 scripts/seo-transform.py   # 1. per-page metadata + JSON-LD
python3 scripts/seo-files.py       # 2. sitemap, robots, _headers, feed, llms
python3 scripts/seo-plus.py        # 3. image perf + related-posts block
```

Run them **in that order** after any content change — `seo-plus.py`'s
related block and `seo-files.py`'s sitemap/feed both assume the head/body
already carry the canonical metadata that `seo-transform.py` writes.

`generate_qr_codes.py` is independent and run only when QR assets change.

## Module-local conventions Claude should respect

1. **Idempotent by design.** Every transform is wrapped in
   `<!-- gal-*:start -->…<!-- gal-*:end -->` markers; re-running replaces
   the block rather than duplicating it. Preserve the markers and the
   replace-not-append pattern in any change.
2. **`public/` is processed first, then mirrored to root.** Both
   `seo-transform.py` and `seo-plus.py` copy each edited HTML file to the
   repo-root path at the end of `main()`. Keep that mirror step intact.
   Note the scripts mirror **HTML only** — `style.css` / `site.js` are
   mirrored manually.
3. **Stdlib-only for the SEO trio.** `seo-transform/seo-files/seo-plus`
   import only the Python standard library — no `pip install` needed.
   Don't add third-party dependencies to them. (`generate_qr_codes.py`
   does need `qrcode` + `Pillow`; that's the only script with deps.)
4. **Paths are currently absolute** (`ROOT = Path('/home/overdrive/claude/galeriaomaso')`
   in the SEO scripts; `generate_qr_codes.py` derives `ROOT` from
   `__file__`). If you touch these, don't silently change the resolution
   behavior — see [`../ROADMAP.md`](../ROADMAP.md).
5. **Content rules the scripts depend on** are documented in
   [`../docs/content-model.md`](../docs/content-model.md) and
   [`../docs/seo-pipeline.md`](../docs/seo-pipeline.md). Read those before
   changing extraction logic.

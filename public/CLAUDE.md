# `public/` — Cloudflare deploy root (module guidance)

Scoped guidance for the `public/` module. For the project-wide picture see
the root [`../CLAUDE.md`](../CLAUDE.md), [`../ARCHITECTURE.md`](../ARCHITECTURE.md)
and [`../README.md`](../README.md).

## Responsibility

`public/` is the **directory Cloudflare actually deploys**. The GitHub
Action (`.github/workflows/deploy.yml`) runs `wrangler deploy` with
`working-directory: public`, and `public/wrangler.jsonc` sets
`assets.directory = "."`, so every file here is published verbatim to the
edge and served at `https://www.galeriaomaso.com/`.

It is a flat static site — **no build step, no framework, no server code.**
What is in this folder is what visitors get.

## What lives here

| Path | Purpose |
|------|---------|
| `index.html` + 12 other root `*.html` | Landing page and section pages (artistas, exposiciones, criticas, ferias, cursos, noticias, enlaces, articulos, contacta, como-llegar, 404, plus the Google verification stub). |
| `posts/*.html` | 315 individual exhibition/article pages (migrated from Blogger). |
| `style.css` | Single site-wide stylesheet. See [`../DESIGN.md`](../DESIGN.md). |
| `site.js` | All client-side behavior (menu, i18n, lightbox, forms, entry animation). |
| `translations.js` | Nav/toolbar UI strings for the 8 supported languages. |
| `images/` | ~2,280 photographic assets (jpg/png). |
| `assets/` | Shared static assets (fonts/icons). |
| `feed.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`, `_headers`, `_redirects` | **Generated / hand-maintained edge files** — see Conventions. |
| `wrangler.jsonc` | Cloudflare Workers Assets config. Project name `galeriaomaso`. |

## Public interface

The "interface" of this module is the set of **URLs served at the edge**:

- Clean URLs: the Worker serves `/posts/foo` for `posts/foo.html`. Always
  link with the path the Worker serves; `rel="canonical"` is set to the
  extension-less form by the SEO pipeline.
- `_redirects` declares 301s (`/internacional` → `/exposiciones.html`).
- `_headers` declares cache-control + security headers per path glob.
- `style.css` is the **deploy fingerprint asset** — the CI step and the
  Lynx Factory verifier hash it to confirm the live edge matches local.
  Never use an HTML page as the fingerprint (Cloudflare injects per-request
  script into HTML, so its hash is never stable).

## Module-local conventions Claude should respect

1. **Most files here are generated.** The three scripts in
   [`../scripts/`](../scripts/CLAUDE.md) process `public/` first, then
   mirror the HTML to the repo root. Treat `public/` as the primary tree.
2. **Never hand-edit inside marker comments.** Blocks delimited by
   `<!-- gal-seo:start -->…<!-- gal-seo:end -->` (and `gal-perf`,
   `gal-related`, `gal-socials`, `gal-topnav`, `gal-cf-beacon`) are
   regenerated. Edit the source content or the generating script, then
   re-run the pipeline — don't patch the rendered block.
3. **`feed.xml`, `sitemap.xml`, `robots.txt`, `llms.txt`, `_headers` are
   fully generated** by `scripts/seo-files.py`. Don't edit by hand.
4. **After any content edit, re-run the pipeline and re-sync the root
   mirror.** The scripts mirror HTML automatically; `style.css` and
   `site.js` are **not** copied by the scripts and must be mirrored
   manually (`cp public/style.css style.css`, `cp public/site.js site.js`).
5. **`data-cf-beacon='{"token": ""}'` is intentionally empty** — the
   domain uses Cloudflare Web Analytics in automatic (proxied) mode. Do
   not go looking for a beacon token.
6. **Preview locally on port `5253`** (never `8765`):
   `python3 -m http.server 5253 --bind 127.0.0.1 --directory public`.
7. **New posts** must open with a descriptive `<h2>`, a summarizing first
   paragraph, and an early representative `<img>` — the pipeline derives
   title / description / `og:image` from those. See
   [`../docs/content-model.md`](../docs/content-model.md).

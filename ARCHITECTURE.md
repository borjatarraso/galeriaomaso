# Architecture — galeriaomaso.com

A one-page tour of how the pieces fit together. For operational/maintainer
detail see [`README.md`](README.md); for the per-page SEO mechanics see
[`docs/seo-pipeline.md`](docs/seo-pipeline.md); for the deploy chain see
[`docs/deploy-pipeline.md`](docs/deploy-pipeline.md).

## What this is

A **bilingual-first (8-language) static art-gallery website** for Galería
O+O (Oriente y Occidente), Valencia. Pure HTML/CSS/JS — **no CMS, no
framework, no build step.** Content was migrated out of Blogger and now
lives as flat HTML files. The site was split out of the `enriquetahueso`
repository on 2026-05-17; cross-links between the two sites use absolute
URLs.

## Modules

The repo has two source-bearing modules plus the supporting trees:

```
galeriaomaso/
├── public/        ← MODULE: the Cloudflare deploy root (what ships)
│   ├── *.html         13 section pages (index + 11 sections + 404 + GSC stub)
│   ├── posts/*.html   315 exhibition/article pages
│   ├── style.css      one stylesheet  (deploy fingerprint asset)
│   ├── site.js        all client behavior (8 IIFE features)
│   ├── translations.js  nav/toolbar strings × 8 languages
│   ├── images/        ~2,280 photos
│   ├── feed.xml sitemap.xml robots.txt llms.txt _headers _redirects  (generated)
│   └── wrangler.jsonc   Cloudflare Workers Assets config
│       → see public/CLAUDE.md
├── scripts/       ← MODULE: manual Python build tooling (stdlib only)
│   ├── seo-transform.py   per-page metadata + JSON-LD
│   ├── seo-files.py       sitemap / robots / _headers / feed / llms
│   ├── seo-plus.py        image perf + related-posts block
│   └── generate_qr_codes.py   one-off QR marketing assets
│       → see scripts/CLAUDE.md
├── <root *.html, style.css, site.js, …>   mirror of public/ HTML (see below)
├── docs/          architectural & pipeline docs (this folder of *.md + diagrams/PDFs)
├── qr-codes/      generated vCard QR outputs
└── ARCHITECTURE.md ROADMAP.md DESIGN.md README.md CONTRIBUTING.md CLAUDE.md
```

> **Why root files mirror `public/`:** `public/` is the deploy root
> (`wrangler deploy` runs there). The SEO scripts edit `public/` first and
> then copy the HTML up to the repo root so the project is also browsable
> at root on GitHub and so the root tree stays a faithful copy. `public/`
> is the source of truth; the root HTML is a generated mirror. `style.css`
> and `site.js` are mirrored **manually** (the scripts mirror HTML only).

## Dataflow

### Authoring → publish

```
   author edits HTML/CSS/JS in public/
              │
              ▼
   python3 scripts/seo-transform.py   (head metadata, JSON-LD)   ─┐
   python3 scripts/seo-files.py       (sitemap, robots, feed…)    │ manual,
   python3 scripts/seo-plus.py        (img perf, related posts)   │ in order
              │  (each mirrors HTML public/ → root)              ─┘
              ▼
   cp public/style.css style.css ; cp public/site.js site.js   (manual mirror)
              │
              ▼
   git commit + push to main
              │
              ▼
   GitHub Actions  →  wrangler deploy (from public/)  →  Cloudflare edge
              │
              ▼
   CI verifies: sha256(local style.css) == sha256(live style.css)
```

### Request → visitor

```
   browser → Cloudflare edge (HTTP/3, Brotli, cache per _headers)
           → static asset served from public/
           → site.js runs: language switcher (data-g18n + Google Translate),
             view-mode toggle, image lightbox, contact form, critique modal,
             once-per-session entry animation
```

## External dependencies

| Dependency | Role | Notes |
|------------|------|-------|
| **Cloudflare Workers (Assets)** | Hosting / CDN / edge cache | Deploy target; project name `galeriaomaso`. Proxied (orange-cloud) DNS. |
| **GitHub Actions** | CI/CD | `.github/workflows/deploy.yml` runs `wrangler deploy` on push to `main`, then verifies live==local by hashing `style.css`. |
| **Arsys** | Domain registrar | Nameservers delegated to Cloudflare. |
| **Google Fonts** | `Cinzel Decorative` display font | `preconnect`-warmed in `<head>`. |
| **Google Translate widget** | Full-page MT for the 8-language switcher | Nav/toolbar use the in-repo `translations.js`; body content is machine-translated. |
| **Cloudflare Web Analytics** | Pageview metrics | Automatic mode (proxied domain) — empty beacon token is intentional. |
| **Search / discovery surfaces** | GSC, Bing, RSS readers, LLM assistants | Fed by `sitemap.xml`, `feed.xml`, `llms.txt`. |
| **Python stdlib** | The SEO scripts | No third-party deps. `generate_qr_codes.py` alone needs `qrcode`+`Pillow`. |

## Key conventions (load-bearing)

- **Idempotent marker blocks** — generated regions live inside
  `<!-- gal-*:start -->…<!-- gal-*:end -->`. Edit source/script, re-run;
  never hand-patch a rendered block.
- **`style.css` is the deploy fingerprint** — CI and the Lynx Factory
  verifier compare its SHA-256 local vs live. Never fingerprint on HTML.
- **Preview on port `5253`**, never `8765` (collides with `enriquetahueso`).
- **No build step at request time** — the Python scripts are an authoring
  convenience run before commit, not a runtime.

## Where to look next

| You want to… | Read |
|--------------|------|
| Edit/add a page or post | [`public/CLAUDE.md`](public/CLAUDE.md), [`docs/content-model.md`](docs/content-model.md) |
| Change SEO/metadata behavior | [`scripts/CLAUDE.md`](scripts/CLAUDE.md), [`docs/seo-pipeline.md`](docs/seo-pipeline.md) |
| Touch styles or the entry animation | [`DESIGN.md`](DESIGN.md), [`docs/frontend.md`](docs/frontend.md) |
| Deploy / debug the edge | [`docs/deploy-pipeline.md`](docs/deploy-pipeline.md), [`docs/operations.md`](docs/operations.md) |
| Know what's planned / known gaps | [`ROADMAP.md`](ROADMAP.md) |

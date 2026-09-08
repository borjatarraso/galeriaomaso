# Operations

Local preview, the edit→publish loop, edge caching, and analytics. For the
deploy chain itself see [`deploy-pipeline.md`](deploy-pipeline.md).

## Local preview

**Always serve on port `5253`** (assigned in the Lynx Factory ledger).
**Never use `8765`** — it collides with the `enriquetahueso` session.

```bash
python3 -m http.server 5253 --bind 127.0.0.1 --directory public
# stop a previous instance:
pkill -f "python3 -m http.server 5253"
```

Drop `--directory public` to preview an asset at the repo root. For a
one-off second port, pick anything free in `5200–5249`.

## The edit → publish loop

```bash
# 1. edit content/assets under public/
# 2. regenerate SEO (in order):
python3 scripts/seo-transform.py
python3 scripts/seo-files.py
python3 scripts/seo-plus.py
# 3. mirror the assets the scripts DON'T copy:
cp public/style.css style.css
cp public/site.js   site.js
# 4. commit + push (CI deploys + verifies)
git add -A && git commit -m "…" && git push origin main
# 5. confirm the edge updated:
sha256sum public/style.css
curl -s https://www.galeriaomaso.com/style.css | sha256sum
```

The scripts mirror **HTML** from `public/` to root automatically; only
`style.css` and `site.js` need the manual `cp`.

## Edge caching (`public/_headers`)

| Path | Cache-Control |
|------|---------------|
| `/images/*` | `max-age=31536000, immutable` |
| `/*.css`, `/*.js` | `max-age=86400, must-revalidate` |
| `/favicon.ico` | `max-age=604800` |
| `/sitemap.xml`, `/feed.xml` | `max-age=3600` |
| `/robots.txt`, `/llms.txt` | `max-age=86400` |
| `/*.html` | `max-age=300, s-maxage=3600` |

Security headers on `/*`: `X-Content-Type-Options: nosniff`,
`X-Frame-Options: SAMEORIGIN`,
`Referrer-Policy: strict-origin-when-cross-origin`,
`Permissions-Policy: interest-cohort=()`.

Redirects (`public/_redirects`): `/internacional[.html]` → `/exposiciones.html`
(301).

## Analytics

Cloudflare Web Analytics runs in **automatic mode** because the domain is
proxied (orange-cloud) — pageviews are collected at the edge with no JS
beacon token and no cookie. The `data-cf-beacon='{"token": ""}'` stub in
the HTML is an **intentional no-op**, kept only in case the site ever moves
to grey-cloud DNS. Do not go hunting for a beacon token. The report is the
Cloudflare dashboard → Analytics & Logs → Web Analytics.

## Search-engine properties

Google Search Console + Bing Webmaster were verified and the sitemap
submitted on 2026-05-18 (one-time, see README). New content is picked up via
the regenerated `sitemap.xml` / `feed.xml` on the next crawl.

## Cloudflare secrets

CI uses repo secrets `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`.
Real token values live only in the maintainer's environment — never
committed. Per project policy the existing deploy token is left as-is (not
rotated or scoped down).

# Deploy pipeline

How a change reaches visitors. This is a **text companion** to the diagrams
and PDFs in this folder (`deploy_pipeline_overview/detailed/internals.*`,
`deploy_pipeline_guide_en/es.pdf`). For day-to-day commands and
troubleshooting see [`../README.md`](../README.md) and
[`operations.md`](operations.md).

## The five stages

```
edit  →  commit  →  push  →  Cloudflare build  →  serve from edge
```

Each stage runs on a different machine and can fail independently — which
is why the last stage is verified end-to-end on every push.

## What actually runs

1. **Author** edits HTML/CSS/JS in `public/`, runs the SEO pipeline
   (see [`seo-pipeline.md`](seo-pipeline.md)), mirrors `style.css`/`site.js`
   to root, then `git commit` + `git push origin main`.
2. **GitHub Actions** (`.github/workflows/deploy.yml`) fires on push to
   `main` (and `workflow_dispatch`):
   - `actions/checkout` + `setup-node@22`.
   - `npx --yes wrangler@latest deploy` with `working-directory: public`,
     authenticated by the `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`
     repository secrets.
   - **Verify step:** hashes local `public/style.css` and polls
     `https://www.galeriaomaso.com/style.css` up to 6×/10s, comparing
     SHA-256. Logs OK on match; does **not** fail the job if the edge is
     still propagating after 60s.
3. **Cloudflare Workers Assets** serves the contents of `public/` (config:
   `public/wrangler.jsonc`, project `galeriaomaso`, `assets.directory = "."`)
   from the edge with HTTP/3 + Brotli, caching per `_headers`.

## Why `style.css` is the fingerprint

Deploy success is confirmed by comparing the **SHA-256 of `style.css`**
local vs live. HTML must never be used as the fingerprint: Cloudflare's
bot-management layer injects a per-request `<script>` into HTML responses,
so an HTML hash is never stable. The Lynx Factory dashboard's verifier uses
the same CSS-hash technique and can re-issue a `wrangler deploy` if local
and live diverge.

## DNS / TLS

- Registrar **Arsys**; nameservers delegated to **Cloudflare**.
- DNS is **proxied** (orange cloud) — which is also why Web Analytics works
  in automatic mode with an empty beacon token.
- Cloudflare TLS mode **Full (strict)**, **Always Use HTTPS** on.

## Manual redeploy (maintainer)

```bash
cd public && npx wrangler deploy
```

## Known failure modes

- **Webhook desync / "connected but not firing"** — reconnect the source
  in Workers & Pages → galeriaomaso → Settings → Builds & deployments.
- **Green build, stale edge** — the CSS-hash verify catches this; force a
  manual `wrangler deploy` from `public/`.

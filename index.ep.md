---
ep_version: 1
project: galeriaomaso
title: Galería O+O — galeriaomaso.com
status: PAUSED
last_touched: 2026-06-12
last_touched_text: 12 June 2026
section: top
category: website
generated: 2026-08-15
ep_locked: false   # set true and this file is never regenerated
---

# Galería O+O — galeriaomaso.com

> Galería O+O (Oriente y Occidente) gallery site

🟠 **PAUSED** · last touched **12 June 2026** (last commit)

---

## What this is

Bilingual (EN/ES) art-gallery website for **Galería Oriente y Occidente**.

- **Live site:** https://www.galeriaomaso.com
- **Hosting:** Cloudflare Workers (deployed via `wrangler`)
- **DNS:** Arsys (registrar) → Cloudflare nameservers
- **Repo:** https://github.com/borjatarraso/galeriaomaso
- **Stack:** static HTML / CSS / JS — no build step, no CMS

The site was split out of the older `enriquetahueso` repository on 2026-05-17. Cross-links between the two sites use absolute URLs.

🤝 **Are you an external contributor?** Everything between here and the Contributing section describes how the **maintainer** (Borja Tarraso) operates the site day-to-day — direct pushes to `main`, local helper tooling (Lynx Factory, multiplexers, auto-redeploy watchers), Cloudflare credentials, etc. **You do not need any of that.** Jump straight to [Contributing](#contributing) for the fork → branch → Pull Request workflow that's open to anyone.

The same five-stage flow that every modern static site uses. Each stage runs on a different machine and can fail independently — which is why we verify end-to-end on every push.

Click for full resolution: [`docs/deploy_pipeline_overview.png`](docs/deploy_pipeline_overview.png)

Full-screen: [`docs/deploy_pipeline_detailed.png`](docs/deploy_pipeline_detailed.png)

Full-screen: [`docs/deploy_pipeline_internals.png`](docs/deploy_pipeline_internals.png)

Only the maintainer (Borja Tarraso) has push access to `main`. If you're an external contributor, the workflow you want is in [Contributing](#contributing) — fork, branch, Pull Request.

If the live site does **not** pick up the change within ~2 minutes, see the troubleshooting section below — Cloudflare's GitHub auto-deploy integration can silently disconnect, which is exactly why we built the verification tooling described next.

Cloudflare's "push and forget" GitHub integration looks reliable but has two failure modes that are silent from the publisher's point of view:

1. **The webhook can desync.** A repo permission change, a token rotation
   or even a transient GitHub outage can leave the integration in a
   "connected but not firing" state. The dashboard still says *Connected*.
2. **A build succeeds without reaching the edge.** The Cloudflare build
   log is green, but the asset that the public sees still hashes to the
   previous version. This happens around cache-busting / route conflicts.

Our companion tool (**Lynx Factory** — a local-only dashboard) closes both gaps by:

- Hashing the local artifact (e.g. `style.css`) with SHA-256.
- Fetching the same asset from the live URL.
- Comparing the two. If they differ, it re-issues the deploy with
  `wrangler` and polls every 5 s for up to 90 s.

The **Test** button in that dashboard turns **green only when the live SHA matches local**. No more "I pushed, looks fine, but visitors see the old page".

**Heads-up:** never use an HTML page as the fingerprint asset. Cloudflare's bot-management layer injects a per-request `<script>` tag into HTML responses, so the hash always changes. Pick a CSS/JS/font/ image asset instead.

The deploy verifier and the auto-redeploy watcher need three pieces of metadata. Real values live only in shell env vars (`CF_API_TOKEN_*`) on the maintainer's machine — **never** committed.

The deploy token only needs:

- **Account → Workers Scripts → Edit**
- **Zone → galeriaomaso.com → Cache Purge → Purge** *(optional, for
  manual cache busts)*

## Start here

- [`README.md`](README.md) — what the project is, in its own words
- [`CLAUDE.md`](CLAUDE.md) — working agreement for a session in this repo
- [`ARCHITECTURE.md`](ARCHITECTURE.md) — module map and how the pieces fit
- [`ROADMAP.md`](ROADMAP.md) — where this is heading
- [`index.html`](index.html) — the deliverable itself — open it in a browser

## Run it

```bash
cd ~/claude/galeriaomaso
xdg-open index.html                   # static build — no server needed
```

## The rest of it

**Directories**

- `assets/` — 5 entries
- `docs/` — 16 entries
- `images/` — 2286 entries
- `posts/` — 315 entries
- `public/` — 29 entries
- `qr-codes/` — 8 entries
- `scripts/` — 5 entries

**Other documentation**

- [`CONTRIBUTING.md`](CONTRIBUTING.md)
- [`DESIGN.md`](DESIGN.md)

**`docs/`** holds 16 files.

---

## Ownership

<img src="https://www.cortex-university.com/static/brand/lince-logo.png" alt="Lince" width="96" height="96" align="left" style="margin-right:16px" />

**Galería O+O is proudly part of Lince.**

| Company ID | Headquarters |
|---|---|
| 3015071-2 | Helsinki, Finland |

Part of the LINCE company · © All rights reserved


<sub>Standard entry-point card (`index.ep.md`, format v1) — generated 2026-08-15 by Lynx Factory. Regenerating overwrites this file unless `ep_locked: true`.</sub>

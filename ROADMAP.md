# Roadmap & known limitations — galeriaomaso.com

This file records the **current state**, the **known limitations of the
code as it stands today**, and **candidate next steps**. It is deliberately
conservative: items below are grounded in what the code actually does now,
not aspirational features. Nothing here is a commitment or a schedule.

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for how the pieces fit together.

## Current state (as of this writing)

- ✅ Static site live on Cloudflare Workers Assets, proxied DNS.
- ✅ 13 section pages + 315 posts, all carrying generated SEO metadata,
  JSON-LD, Open Graph / Twitter cards.
- ✅ SEO support files generated: `sitemap.xml`, `robots.txt`, `feed.xml`
  (RSS 2.0, latest 50), `llms.txt`, `_headers`.
- ✅ 8-language switcher (nav/toolbar via `translations.js`, body via
  Google Translate).
- ✅ CI deploy + live==local `style.css` SHA verification on push to `main`.
- ✅ Google Search Console + Bing Webmaster verified and sitemap submitted
  (2026-05-18).
- ✅ Per-module scoped guidance (`public/CLAUDE.md`, `scripts/CLAUDE.md`)
  and architectural blueprints (this file, `ARCHITECTURE.md`, `DESIGN.md`,
  `docs/`).

## Known limitations (factual, present in the code today)

1. **Hard-coded absolute paths in the SEO scripts.**
   `seo-transform.py`, `seo-files.py`, and `seo-plus.py` set
   `ROOT = Path('/home/overdrive/devel/galeriaomaso')`. The scripts only
   run as-is on the maintainer's machine; a contributor on a different path
   must edit the constant. (`generate_qr_codes.py` already derives `ROOT`
   from `__file__` and is portable.)
2. **Two-tree mirror is partly manual.** The scripts mirror **HTML** from
   `public/` to the repo root, but `style.css` and `site.js` must be copied
   by hand. It is possible to forget the manual copy and ship a root tree
   that disagrees with `public/`.
3. **Pipeline ordering is implicit.** The three scripts must be run in the
   order transform → files → plus; nothing enforces or chains this.
4. **No automated tests.** Correctness of the SEO transforms is verified by
   eye and by the live==local CSS hash in CI; there is no unit/regression
   suite for the HTML rewriting.
5. **Modularization is shallow.** The project has two source modules
   (`public/`, `scripts/`); most of the surface area is content rather than
   code, so further code-level module splitting has limited upside.
6. **Body translation depends on the Google Translate widget** — a
   third-party runtime dependency for everything outside nav/toolbar.

## Candidate next steps (unprioritized, non-committal)

These would address the limitations above without changing site behavior:

- Make the SEO scripts path-independent (derive `ROOT` from `__file__`,
  matching `generate_qr_codes.py`) so any contributor can run them.
- Add a single `scripts/build.sh` (or `make`) that runs the three SEO
  scripts in order and performs the `style.css`/`site.js` mirror, removing
  the manual-step footguns in items 2–3.
- Optionally fold the manual asset mirror into the scripts themselves.
- A lightweight smoke test: re-run the pipeline and assert it is a no-op on
  an already-processed tree (guards the idempotency contract).
- Revisit whether body translation could move to pre-rendered per-language
  pages instead of the runtime widget (large change; only if SEO of
  translated content becomes a priority).

## Out of scope / deliberate non-goals

- **No CMS / no framework / no build-at-request-time.** The static,
  zero-runtime model is intentional — it keeps hosting trivial and the
  attack surface minimal.
- **No HTML fingerprinting for deploy verification** — Cloudflare injects
  per-request script into HTML, so `style.css` remains the fingerprint.

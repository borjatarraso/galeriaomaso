# Content model

How pages and posts are structured, and the rules the SEO pipeline relies
on. See also [`seo-pipeline.md`](seo-pipeline.md) and the module guide
[`../public/CLAUDE.md`](../public/CLAUDE.md).

## Page types

| Type | Files | JSON-LD type |
|------|-------|--------------|
| Home | `index.html` | `ArtGallery` + `WebSite` (with postal address) |
| Section pages | `artistas, exposiciones, criticas, ferias, cursos, noticias, enlaces, articulos, contacta, como-llegar` (`.html`) | `CollectionPage` |
| Posts | `posts/*.html` (315) | `Article` + `BreadcrumbList` (+ `ExhibitionEvent` when a date range is present) |
| Utility | `404.html`, `google…​.html` (GSC verification stub) | — |

## Anatomy of a post

A post is hand-written HTML. The pipeline reads specific landmarks, so new
posts must follow this shape:

```html
<main> (or <div class="page-content">)
  <h2>Descriptive exhibition title</h2>          ← becomes <title>, og:title, breadcrumb leaf
  <p class="post-date">lunes, 8 de mayo de 2017</p>  ← parsed for datePublished
  <p>First paragraph summarizing the post…</p>    ← becomes <meta description> + card snippet
  <img src="images/…​.jpg" alt="…">                ← first non-logo img → og:image
  …body…
</main>
```

### Rules the scripts depend on

1. **Open with a meaningful `<h2>`.** `seo-transform.py` takes the first
   significant `<h2>` as the page title (and `og:title`, Twitter title,
   breadcrumb leaf). Without it the page falls back to the generic gallery
   name.
2. **First paragraph = the summary.** It becomes `<meta description>` and
   the social-card snippet (title + date noise stripped, ~155 char cap).
3. **Date format matters.** A `<p class="post-date">` single date drives
   `datePublished`. A range written **`del N de mes al N de mes de YYYY`**
   additionally emits `ExhibitionEvent` JSON-LD (start/end/location/
   organizer). Any other phrasing still works, just without the event-rich
   result.
4. **Put a representative `<img>` early.** The first non-logo image becomes
   `og:image` (the share preview).
5. **Always set `alt`** on images (accessibility + image SEO).

## Generated regions (do not hand-edit)

Inside every page, these marker blocks are owned by the scripts:

| Marker | Owner | Contents |
|--------|-------|----------|
| `<!-- gal-seo:start/end -->` | `seo-transform.py` | canonical, description, OG, Twitter, robots |
| `<!-- gal-perf:start/end -->` | `seo-plus.py` | preconnect / dns-prefetch / RSS link |
| `<!-- gal-related:start/end -->` | `seo-plus.py` | related-exhibitions list (posts only) |
| `<!-- gal-socials:start/end -->` | (shared partial) | social icon row |
| `<!-- gal-topnav:start/end -->` | (shared partial) | top navigation |
| `<!-- gal-cf-beacon:start/end -->` | `seo-transform.py` | CF analytics stub (empty token, intentional) |

The `<script type="application/ld+json">` block is also regenerated.

## After editing content

Run the pipeline (transform → files → plus) from the repo root, then mirror
`style.css`/`site.js` manually. See [`operations.md`](operations.md).

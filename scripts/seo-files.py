#!/usr/bin/env python3
"""Generate robots.txt, sitemap.xml, and _headers for galeriaomaso."""
from pathlib import Path
from datetime import datetime, timezone

ROOT = Path('/home/overdrive/claude/galeriaomaso')
SITE = 'https://galeriaomaso.com'
PUB = ROOT / 'public'

# ---- robots.txt ----
robots = f"""User-agent: *
Allow: /

# Block Google Translate's machine-translated mirrors from being indexed
Disallow: /*?_x_tr_sl=
Disallow: /*?_x_tr_tl=
Disallow: /*?_x_tr_hl=

Sitemap: {SITE}/sitemap.xml
"""
(PUB / 'robots.txt').write_text(robots, encoding='utf-8')

# ---- sitemap.xml ----
now = datetime.now(timezone.utc).strftime('%Y-%m-%d')

def file_lastmod(path: Path) -> str:
    ts = datetime.fromtimestamp(path.stat().st_mtime, tz=timezone.utc)
    return ts.strftime('%Y-%m-%d')

def url_for(rel: str) -> str:
    if rel == 'index.html':
        return SITE + '/'
    if rel.endswith('/index.html'):
        return SITE + '/' + rel[:-len('index.html')]
    if rel.endswith('.html'):
        return SITE + '/' + rel[:-5]
    return SITE + '/' + rel

entries = []
section_priority = {
    'index.html': ('1.0', 'weekly'),
    'exposiciones.html': ('0.9', 'weekly'),
    'artistas.html': ('0.8', 'monthly'),
    'articulos.html': ('0.7', 'monthly'),
    'internacional.html': ('0.7', 'monthly'),
    'ferias.html': ('0.7', 'monthly'),
    'cursos.html': ('0.6', 'monthly'),
    'noticias.html': ('0.6', 'monthly'),
    'enlaces.html': ('0.5', 'yearly'),
    'contacta.html': ('0.5', 'yearly'),
    'como-llegar.html': ('0.5', 'yearly'),
}
for f in sorted(PUB.glob('*.html')):
    if f.name in section_priority:
        prio, freq = section_priority[f.name]
    else:
        prio, freq = ('0.5', 'monthly')
    entries.append((url_for(f.name), file_lastmod(f), freq, prio))
for f in sorted((PUB / 'posts').glob('*.html')):
    entries.append((url_for(f'posts/{f.name}'), file_lastmod(f), 'yearly', '0.6'))

xml_parts = ['<?xml version="1.0" encoding="UTF-8"?>',
             '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for url, lastmod, freq, prio in entries:
    xml_parts.append(f'  <url>')
    xml_parts.append(f'    <loc>{url}</loc>')
    xml_parts.append(f'    <lastmod>{lastmod}</lastmod>')
    xml_parts.append(f'    <changefreq>{freq}</changefreq>')
    xml_parts.append(f'    <priority>{prio}</priority>')
    xml_parts.append(f'  </url>')
xml_parts.append('</urlset>')
(PUB / 'sitemap.xml').write_text('\n'.join(xml_parts) + '\n', encoding='utf-8')

# ---- _headers (Cloudflare Workers Assets) ----
# Long TTLs for byte-stable assets, short TTL for HTML so edits show fast.
headers = """/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: interest-cohort=()

/images/*
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=86400, must-revalidate

/*.js
  Cache-Control: public, max-age=86400, must-revalidate

/favicon.ico
  Cache-Control: public, max-age=604800

/sitemap.xml
  Cache-Control: public, max-age=3600

/robots.txt
  Cache-Control: public, max-age=86400

/feed.xml
  Cache-Control: public, max-age=3600

/llms.txt
  Cache-Control: public, max-age=86400

/*.html
  Cache-Control: public, max-age=300, s-maxage=3600
"""
(PUB / '_headers').write_text(headers, encoding='utf-8')

# ---- /llms.txt (Anthropic LLMS.txt convention) ----
llms = """# Galería O+O 东西方画廊

> Centro de referencia internacional de arte entre Oriente y Occidente. Galería de arte contemporáneo en Valencia (España), dedicada al intercambio cultural Spain–China desde 2007. Dirigida por Enriqueta Hueso.

## About
- Name: Galería O+O / 东西方画廊
- Founded: 2007
- Director: Enriqueta Hueso
- Location: C/ Francisco Martínez nº 34-36 bajo, 46020 Valencia, Spain
- Phone: +34 639 99 03 92
- Email: enriqueta.hueso@gmail.com

## Sections
- [Exposiciones](https://galeriaomaso.com/exposiciones): Exhibition archive (300+ shows since 2007)
- [Artistas](https://galeriaomaso.com/artistas): Roster of represented artists
- [Artículos](https://galeriaomaso.com/articulos): Articles and essays
- [Internacional](https://galeriaomaso.com/internacional): International projects (China + others)
- [Ferias](https://galeriaomaso.com/ferias): Art fairs
- [Cursos](https://galeriaomaso.com/cursos): Workshops and courses
- [Noticias](https://galeriaomaso.com/noticias): News
- [Contacto](https://galeriaomaso.com/contacta): Contact
- [Cómo llegar](https://galeriaomaso.com/como-llegar): How to reach the gallery

## Resources
- Sitemap: https://galeriaomaso.com/sitemap.xml
- RSS feed: https://galeriaomaso.com/feed.xml
"""
(PUB / 'llms.txt').write_text(llms, encoding='utf-8')

# ---- /feed.xml (RSS 2.0, latest 50 posts by mtime) ----
import html as _html
import re as _re

import re as _re_pre

FILENAME_DATE_RE = _re_pre.compile(r'^post-(\d{4})-(\d{2})')


def _post_date(p: Path) -> datetime:
    """Parse YYYY-MM from filename; fall back to file mtime."""
    m = FILENAME_DATE_RE.match(p.stem)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        return datetime(y, mo, 1, 12, 0, 0, tzinfo=timezone.utc)
    return datetime.fromtimestamp(p.stat().st_mtime, tz=timezone.utc)


posts_for_rss = sorted((PUB / 'posts').glob('*.html'),
                       key=_post_date, reverse=True)[:50]

H2_RE = _re.compile(r'<h2[^>]*>(.*?)</h2>', _re.IGNORECASE | _re.DOTALL)
DESC_RE = _re.compile(
    r'<meta\s+name=["\']description["\']\s+content=["\']([^"\']*)["\']',
    _re.IGNORECASE,
)
TAG_RE = _re.compile(r'<[^>]+>')
WS_RE = _re.compile(r'\s+')


def _strip(s: str) -> str:
    return WS_RE.sub(' ', _html.unescape(TAG_RE.sub(' ', s))).strip()


items = []
for p in posts_for_rss:
    text = p.read_text(encoding='utf-8')
    m = H2_RE.search(text)
    title = _strip(m.group(1)) if m else p.stem
    m2 = DESC_RE.search(text)
    desc = m2.group(1) if m2 else ''
    url = SITE + '/posts/' + p.stem
    pub_dt = _post_date(p)
    pub_822 = pub_dt.strftime('%a, %d %b %Y %H:%M:%S +0000')
    items.append(
        '    <item>\n'
        f'      <title>{_html.escape(title)}</title>\n'
        f'      <link>{url}</link>\n'
        f'      <guid isPermaLink="true">{url}</guid>\n'
        f'      <pubDate>{pub_822}</pubDate>\n'
        f'      <description>{_html.escape(desc)}</description>\n'
        '    </item>'
    )

build_822 = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S +0000')
rss = (
    '<?xml version="1.0" encoding="UTF-8"?>\n'
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n'
    '  <channel>\n'
    '    <title>Galería O+O — Últimas exposiciones</title>\n'
    f'    <link>{SITE}/</link>\n'
    '    <description>Exposiciones, artistas y noticias de Galería O+O '
    '(Valencia, España).</description>\n'
    '    <language>es-ES</language>\n'
    f'    <lastBuildDate>{build_822}</lastBuildDate>\n'
    f'    <atom:link href="{SITE}/feed.xml" rel="self" type="application/rss+xml"/>\n'
    + '\n'.join(items) + '\n'
    '  </channel>\n'
    '</rss>\n'
)
(PUB / 'feed.xml').write_text(rss, encoding='utf-8')

print(f'sitemap entries: {len(entries)}; rss items: {len(items)}')
print('written: robots.txt, sitemap.xml, _headers, llms.txt, feed.xml')

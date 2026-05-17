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

/*.html
  Cache-Control: public, max-age=300, s-maxage=3600
"""
(PUB / '_headers').write_text(headers, encoding='utf-8')

print(f'sitemap entries: {len(entries)}')
print('written: robots.txt, sitemap.xml, _headers')

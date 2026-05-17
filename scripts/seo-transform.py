#!/usr/bin/env python3
"""Add per-page SEO metadata: unique title/description, canonical, OG, Twitter Card,
   JSON-LD (Organization on home, Article on posts), and the CF Web Analytics beacon.

   Idempotent: if a tag already exists with the marker comment, it is replaced.
   Operates on public/ then mirrors to root.
"""
from pathlib import Path
import re
import html
import json

ROOT = Path('/home/overdrive/claude/galeriaomaso')
SITE = 'https://galeriaomaso.com'
ORG_NAME = 'Galería O+O 东西方画廊'
ORG_DESC = ('Galería O+O — Centro de referencia internacional de arte entre Oriente y Occidente. '
            'Gestión Cultural en Valencia, España.')
ORG_ADDR = {
    '@type': 'PostalAddress',
    'streetAddress': 'C/ del Mar, 24',
    'addressLocality': 'Valencia',
    'postalCode': '46003',
    'addressCountry': 'ES',
}
DEFAULT_IMG = SITE + '/images/portada_letras.png'

MARK_START = '<!-- gal-seo:start -->'
MARK_END = '<!-- gal-seo:end -->'

# CF Web Analytics: token is intentionally empty; fill once from CF dashboard
# (Cloudflare → Analytics & Logs → Web Analytics → add site → copy token into
# CF_ANALYTICS_TOKEN below). Beacon with empty token is a harmless no-op.
CF_ANALYTICS_TOKEN = ''
CF_BEACON_MARK_START = '<!-- gal-cf-beacon:start -->'
CF_BEACON_MARK_END = '<!-- gal-cf-beacon:end -->'

# ---------- helpers ----------

H_RE = re.compile(r'<h[12][^>]*>(.*?)</h[12]>', re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r'<[^>]+>')
WS_RE = re.compile(r'\s+')
P_BLOCK_RE = re.compile(r'<(?:p|div)[^>]*>(.*?)</(?:p|div)>', re.IGNORECASE | re.DOTALL)
IMG_RE = re.compile(r'<img\s+[^>]*src=["\']([^"\']+)["\']', re.IGNORECASE)
MSO_RE = re.compile(r'<!--\[if.*?\[endif\]-->', re.DOTALL)
O_TAG_RE = re.compile(r'<(?:o|w|v):[^>]*?/?>|</(?:o|w|v):[^>]*>', re.IGNORECASE)


def clean_text(s):
    s = MSO_RE.sub('', s)
    s = O_TAG_RE.sub('', s)
    s = TAG_RE.sub(' ', s)
    s = html.unescape(s)
    s = WS_RE.sub(' ', s).strip()
    return s


def extract_title(body, fallback):
    for m in H_RE.finditer(body):
        t = clean_text(m.group(1))
        # Skip generic placeholders or empty
        if not t or len(t) < 3:
            continue
        if t.lower() in ('inicio', 'galería o+o', 'galeria o+o',
                         'gestión cultural o+o', 'gestion cultural o+o',
                         'volver', 'menú', 'menu'):
            continue
        return t[:120]
    return fallback


WEEKDAY_DATE_RE = re.compile(
    r'^(?:lunes|martes|mi[eé]rcoles|jueves|viernes|s[áa]bado|domingo),?\s*'
    r'\d+\s+de\s+\w+\s+de\s+\d{4}\.?\s*',
    re.IGNORECASE,
)
ADDR_RE = re.compile(r'C/\s*Francisco\s*Mart[ií]nez', re.IGNORECASE)


def extract_description(body, title, fallback):
    """Build a description from the post body, skipping title/date noise.

    The body slice usually opens with the page-content div, then <h2>title</h2>,
    then <p class="post-date">date</p>. We strip those, then take the first
    sentence-ish chunk."""
    full = clean_text(body)
    if not full:
        return fallback
    # Drop leading title if it repeats at the top.
    if title:
        t = title.strip()
        if full.lower().startswith(t.lower()):
            full = full[len(t):].lstrip(' .,;:-—–')
    # Drop weekday-style post date
    full = WEEKDAY_DATE_RE.sub('', full).strip()
    # The address/contact lives in the page footer — if it surfaces first it
    # means the body is mostly empty, so fall back.
    if ADDR_RE.match(full):
        return fallback
    # Cap to ~155 chars at a word boundary
    if len(full) > 155:
        full = full[:152].rsplit(' ', 1)[0] + '…'
    return full or fallback


def find_image(body, is_post):
    for m in IMG_RE.finditer(body):
        src = m.group(1)
        if 'portada_letras' in src or src.startswith('data:'):
            continue
        # Normalize relative paths
        if src.startswith('../'):
            src = src.replace('../', '/', 1)
        elif src.startswith('./'):
            src = src[2:]
        if not src.startswith(('http://', 'https://', '/')):
            src = '/' + src
        if src.startswith('/'):
            src = SITE + src
        return src
    return DEFAULT_IMG


def canonical_for(rel_path):
    """rel_path like 'index.html' or 'posts/foo.html' (relative to public/)."""
    p = rel_path.replace('\\', '/')
    # The deployed site strips .html (307 redirects); canonical uses clean URL.
    if p == 'index.html':
        return SITE + '/'
    if p.endswith('/index.html'):
        return SITE + '/' + p[:-len('index.html')]
    if p.endswith('.html'):
        return SITE + '/' + p[:-5]
    return SITE + '/' + p


def build_seo_block(*, title, description, canonical, image, is_post, page_path):
    t = html.escape(title, quote=True)
    d = html.escape(description, quote=True)
    img = html.escape(image, quote=True)
    can = html.escape(canonical, quote=True)
    og_type = 'article' if is_post else 'website'
    lines = [
        MARK_START,
        f'<link rel="canonical" href="{can}">',
        f'<meta name="description" content="{d}">',
        '<meta name="robots" content="index,follow,max-image-preview:large">',
        # Open Graph
        f'<meta property="og:type" content="{og_type}">',
        f'<meta property="og:site_name" content="Galería O+O">',
        f'<meta property="og:locale" content="es_ES">',
        f'<meta property="og:title" content="{t}">',
        f'<meta property="og:description" content="{d}">',
        f'<meta property="og:url" content="{can}">',
        f'<meta property="og:image" content="{img}">',
        # Twitter Card
        f'<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{t}">',
        f'<meta name="twitter:description" content="{d}">',
        f'<meta name="twitter:image" content="{img}">',
        MARK_END,
    ]
    return '\n    '.join(lines)


def build_jsonld(*, is_home, is_post, title, description, canonical, image, page_path):
    if is_home:
        data = {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'ArtGallery',
                    '@id': SITE + '/#gallery',
                    'name': 'Galería O+O',
                    'alternateName': '东西方画廊',
                    'url': SITE + '/',
                    'description': ORG_DESC,
                    'image': DEFAULT_IMG,
                    'logo': DEFAULT_IMG,
                    'address': ORG_ADDR,
                    'sameAs': [],
                    'areaServed': ['ES', 'CN', 'International'],
                },
                {
                    '@type': 'WebSite',
                    '@id': SITE + '/#website',
                    'url': SITE + '/',
                    'name': ORG_NAME,
                    'inLanguage': 'es-ES',
                    'publisher': {'@id': SITE + '/#gallery'},
                },
            ],
        }
    elif is_post:
        data = {
            '@context': 'https://schema.org',
            '@type': 'Article',
            'headline': title,
            'description': description,
            'image': image,
            'url': canonical,
            'inLanguage': 'es-ES',
            'isPartOf': {'@id': SITE + '/#website'},
            'publisher': {
                '@type': 'Organization',
                'name': 'Galería O+O',
                'logo': {'@type': 'ImageObject', 'url': DEFAULT_IMG},
            },
        }
    else:
        # Section pages (exposiciones, artistas, etc.)
        data = {
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            'name': title,
            'description': description,
            'url': canonical,
            'inLanguage': 'es-ES',
            'isPartOf': {'@id': SITE + '/#website'},
        }
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    return f'<script type="application/ld+json">{payload}</script>'


SEO_REPLACE_RE = re.compile(
    re.escape(MARK_START) + r'.*?' + re.escape(MARK_END),
    re.DOTALL,
)
TITLE_RE = re.compile(r'<title>.*?</title>', re.DOTALL | re.IGNORECASE)
OLD_DESC_RE = re.compile(r'<meta\s+name=["\']description["\'][^>]*>', re.IGNORECASE)
JSONLD_RE = re.compile(
    r'<script type="application/ld\+json">.*?</script>', re.DOTALL
)
CF_BEACON_RE = re.compile(
    re.escape(CF_BEACON_MARK_START) + r'.*?' + re.escape(CF_BEACON_MARK_END),
    re.DOTALL,
)


def cf_beacon_block():
    cfg = json.dumps({'token': CF_ANALYTICS_TOKEN})
    return (
        f'{CF_BEACON_MARK_START}\n'
        f'<script defer src="https://static.cloudflareinsights.com/beacon.min.js" '
        f"data-cf-beacon='{cfg}'></script>\n"
        f'{CF_BEACON_MARK_END}'
    )


def _extract_main(text):
    """Return the slice of text that holds the *page's own content*, skipping the
    shared topbar/nav/header (which would otherwise leak the language switcher
    into our description)."""
    # Prefer <div class="page-content"> ... </div> (used in posts), then <main>.
    low = text.lower()
    for opener in ('<div class="page-content"', '<main'):
        i = low.find(opener)
        if i >= 0:
            # cap at 60kb after the opener
            return text[i:i + 60000]
    return text[:60000]


def transform_file(path: Path, rel: str):
    text = path.read_text(encoding='utf-8')

    # Skip the shared topbar/header so we don't pick up the language switcher.
    body_slice = _extract_main(text)

    is_post = rel.startswith('posts/')
    is_home = rel == 'index.html'

    # Title: prefer existing meaningful <title>, else extract from H2
    m = TITLE_RE.search(text)
    existing_title = clean_text(m.group(0)[7:-8]) if m else ''
    # If existing title is one of the generic blogger placeholders, re-extract
    generic_marks = [
        'Galeria O+O',
        'Galería O+O 东西方画廊（西班牙—中国）',
        'Inicio',
    ]
    needs_new = (
        not existing_title
        or existing_title in generic_marks
        or existing_title.startswith('Galeria O+O   ')
        or '|' not in existing_title
    )
    if is_home:
        page_title = 'Galería O+O — Arte entre Oriente y Occidente | Valencia'
    elif is_post:
        page_title = extract_title(body_slice, fallback='Galería O+O')
        page_title = f'{page_title} | Galería O+O'
    else:
        # Section page: use existing title if descriptive, else extract from H2
        if needs_new:
            page_title = extract_title(body_slice, fallback=rel[:-5].title()) + ' | Galería O+O'
        else:
            page_title = existing_title

    # Description
    if is_home:
        description = ORG_DESC
    else:
        # Pass the extracted title so we can strip it if it leads the body.
        bare_title = page_title.replace(' | Galería O+O', '') if is_post else page_title
        description = extract_description(body_slice, bare_title, fallback=ORG_DESC)

    canonical = canonical_for(rel)
    image = find_image(body_slice, is_post)

    seo_block = build_seo_block(
        title=page_title.replace(' | Galería O+O', '') if is_post else page_title,
        description=description,
        canonical=canonical,
        image=image,
        is_post=is_post,
        page_path=rel,
    )
    jsonld = build_jsonld(
        is_home=is_home, is_post=is_post,
        title=page_title, description=description, canonical=canonical,
        image=image, page_path=rel,
    )

    # 1) Replace <title>
    new_title_tag = f'<title>{html.escape(page_title)}</title>'
    if m:
        text = text[:m.start()] + new_title_tag + text[m.end():]
    else:
        text = text.replace('</head>', f'    {new_title_tag}\n</head>', 1)

    # 2) Replace/insert SEO block (idempotent via marker).
    # OLD_DESC_RE would also match the description *inside* our new block, so
    # only run it on the initial install — never after the marker exists.
    if SEO_REPLACE_RE.search(text):
        text = SEO_REPLACE_RE.sub(seo_block, text, count=1)
    else:
        text = OLD_DESC_RE.sub('', text, count=1)
        text = text.replace('</head>', f'    {seo_block}\n</head>', 1)

    # 3) JSON-LD: idempotent replace, else insert before </head>
    new_jsonld = jsonld
    if JSONLD_RE.search(text):
        text = JSONLD_RE.sub(new_jsonld, text, count=1)
    else:
        text = text.replace('</head>', f'    {new_jsonld}\n</head>', 1)

    # 4) CF Web Analytics beacon: idempotent, inject before </body>
    beacon = cf_beacon_block()
    if CF_BEACON_RE.search(text):
        text = CF_BEACON_RE.sub(beacon, text, count=1)
    else:
        text = text.replace('</body>', f'{beacon}\n</body>', 1)

    path.write_text(text, encoding='utf-8')


def main():
    pub = ROOT / 'public'
    files = []
    for p in sorted(pub.glob('*.html')):
        files.append((p, p.name))
    for p in sorted((pub / 'posts').glob('*.html')):
        files.append((p, f'posts/{p.name}'))
    for path, rel in files:
        transform_file(path, rel)
    print(f'transformed {len(files)} files in public/')

    # Mirror to root tree
    for path, rel in files:
        dest = ROOT / rel
        dest.write_text(path.read_text(encoding='utf-8'), encoding='utf-8')
    print(f'mirrored {len(files)} files to repo root')


if __name__ == '__main__':
    main()

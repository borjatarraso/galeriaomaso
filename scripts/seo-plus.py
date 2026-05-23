#!/usr/bin/env python3
"""Tier-2 SEO/perf enhancements layered on top of seo-transform.py.

Idempotent. Runs after seo-transform.py and seo-files.py.

- Image perf: add loading="lazy" + decoding="async" to every <img> that
  doesn't have them. The header logo is bumped to loading="eager" +
  fetchpriority="high" (it's the LCP candidate on most pages).
- <head> preconnect/preload + RSS link, wrapped in <!-- gal-perf --> markers.
- "Related" block on posts only, before .post-nav, wrapped in
  <!-- gal-related --> markers. Picks 4 chronologically-nearest siblings
  (excluding prev/next which already exist in .post-nav).

Operates on public/ then mirrors to repo root.
"""
from pathlib import Path
import re
import html

ROOT = Path('/home/overdrive/claude/galeriaomaso')
PUB = ROOT / 'public'

PERF_START = '<!-- gal-perf:start -->'
PERF_END = '<!-- gal-perf:end -->'
RELATED_START = '<!-- gal-related:start -->'
RELATED_END = '<!-- gal-related:end -->'

PERF_RE = re.compile(re.escape(PERF_START) + r'.*?' + re.escape(PERF_END), re.DOTALL)
RELATED_RE = re.compile(re.escape(RELATED_START) + r'.*?' + re.escape(RELATED_END),
                        re.DOTALL)

IMG_RE = re.compile(r'<img\b([^>]*)>', re.IGNORECASE)
ATTR_RE = re.compile(r'(\w+)\s*=\s*"([^"]*)"|(\w+)\s*=\s*\'([^\']*)\'|(\w+)')
POST_NAV_RE = re.compile(r'(\s*)<div class="post-nav">', re.IGNORECASE)
H2_RE = re.compile(r'<h2[^>]*>(.*?)</h2>', re.IGNORECASE | re.DOTALL)
TAG_RE = re.compile(r'<[^>]+>')
WS_RE = re.compile(r'\s+')

# Inserted right after the existing fonts.googleapis.com <link> in <head>.
FONTS_LINK_RE = re.compile(
    r'<link\s+[^>]*href=["\']https://fonts\.googleapis\.com[^"\']*["\'][^>]*>',
    re.IGNORECASE,
)


def perf_block(is_root_level: bool) -> str:
    """Preconnect to Google Fonts/Translate + RSS alternate.

    is_root_level toggles the RSS href so posts can use ../feed.xml; we just use
    the absolute URL to keep it portable across both trees.
    """
    return (
        f'{PERF_START}\n'
        '    <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>\n'
        '    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
        '    <link rel="preconnect" href="https://translate.googleapis.com" crossorigin>\n'
        '    <link rel="dns-prefetch" href="https://static.cloudflareinsights.com">\n'
        '    <link rel="alternate" type="application/rss+xml" '
        'title="Galería O+O — Últimas exposiciones" '
        'href="https://galeriaomaso.com/feed.xml">\n'
        f'    {PERF_END}'
    )


# ---------- image perf ----------

def parse_img_attrs(inner: str):
    """Return ordered list of (name, value_or_None) attrs for an <img>."""
    attrs = []
    # Walk attributes; we don't need a full HTML parser, just robust enough
    # for the Blogger output we have.
    i = 0
    n = len(inner)
    while i < n:
        while i < n and inner[i].isspace():
            i += 1
        if i >= n:
            break
        # name
        j = i
        while j < n and (inner[j].isalnum() or inner[j] in '-_:'):
            j += 1
        name = inner[i:j].lower()
        if not name:
            i = j + 1
            continue
        i = j
        # optional =value
        while i < n and inner[i].isspace():
            i += 1
        if i < n and inner[i] == '=':
            i += 1
            while i < n and inner[i].isspace():
                i += 1
            if i < n and inner[i] in ('"', "'"):
                quote = inner[i]
                i += 1
                k = inner.find(quote, i)
                if k < 0:
                    k = n
                val = inner[i:k]
                i = k + 1
            else:
                k = i
                while k < n and not inner[k].isspace() and inner[k] != '/':
                    k += 1
                val = inner[i:k]
                i = k
            attrs.append((name, val))
        else:
            attrs.append((name, None))
    return attrs


def render_img(attrs) -> str:
    parts = []
    for k, v in attrs:
        if v is None:
            parts.append(k)
        else:
            # Idempotent escape: unescape first so re-runs don't double-encode
            # (e.g. alt="A &amp; B" must stay "A &amp; B", not become "A &amp;amp; B").
            parts.append(f'{k}="{html.escape(html.unescape(v), quote=True)}"')
    return '<img ' + ' '.join(parts) + '>'


def upgrade_imgs(text: str) -> tuple[str, int]:
    """Add loading=lazy + decoding=async to every img; force the logo eager."""
    count = 0
    first_seen = False  # the first img we hit is the header logo

    def repl(m):
        nonlocal count, first_seen
        inner = m.group(1)
        attrs = parse_img_attrs(inner)
        names = {n for n, _ in attrs}
        cls = next((v for n, v in attrs if n == 'class' and v), '')
        is_logo = 'logo-img' in cls or (not first_seen)
        first_seen = True

        # Build the desired final attrs dict, preserving existing values where
        # the author set them.
        out = []
        seen = set()
        for n, v in attrs:
            if n in ('loading', 'decoding', 'fetchpriority'):
                continue  # we'll re-emit deterministically
            out.append((n, v))
            seen.add(n)
        if is_logo:
            out.append(('loading', 'eager'))
            out.append(('decoding', 'async'))
            out.append(('fetchpriority', 'high'))
        else:
            out.append(('loading', 'lazy'))
            out.append(('decoding', 'async'))
        count += 1
        return render_img(out)

    new = IMG_RE.sub(repl, text)
    return new, count


# ---------- preconnect/preload block ----------

def inject_perf_block(text: str) -> str:
    block = perf_block(is_root_level=False)
    if PERF_RE.search(text):
        return PERF_RE.sub(block, text, count=1)
    # Insert after the fonts.googleapis link if present, else before </head>.
    m = FONTS_LINK_RE.search(text)
    if m:
        end = m.end()
        return text[:end] + '\n    ' + block + text[end:]
    return text.replace('</head>', f'    {block}\n</head>', 1)


# ---------- related posts ----------

def post_title_from_file(path: Path) -> str:
    """Cheap title extractor for the related block — uses first H2 in
    page-content, falls back to filename stem."""
    try:
        text = path.read_text(encoding='utf-8')
    except Exception:
        return path.stem
    low = text.lower()
    i = low.find('<div class="page-content"')
    body = text[i:i + 8000] if i >= 0 else text
    m = H2_RE.search(body)
    if m:
        t = TAG_RE.sub(' ', m.group(1))
        t = html.unescape(t)
        t = WS_RE.sub(' ', t).strip()
        if t:
            return t[:80]
    return path.stem


def build_related(post_paths: list[Path], idx: int) -> str:
    """Pick 4 chronologically-nearest siblings (skipping prev/next that
    .post-nav already covers) and render a small related block."""
    candidates = []
    # Skip ±1 (already shown in post-nav) — take ±2, ±3.
    for off in (-3, -2, 2, 3):
        j = idx + off
        if 0 <= j < len(post_paths):
            candidates.append(post_paths[j])
    if not candidates:
        # Tiny corpora: fall back to nearest neighbors.
        for off in (-1, 1):
            j = idx + off
            if 0 <= j < len(post_paths):
                candidates.append(post_paths[j])
    if not candidates:
        return ''

    items = []
    for p in candidates:
        title = post_title_from_file(p)
        href = p.name
        items.append(
            f'      <li><a href="{html.escape(href, quote=True)}">'
            f'{html.escape(title)}</a></li>'
        )
    inner = '\n'.join(items)
    return (
        f'{RELATED_START}\n'
        f'<aside class="post-related" aria-label="Exposiciones relacionadas">\n'
        f'    <h3 style="color:var(--accent);margin-top:2rem;">'
        f'Exposiciones relacionadas</h3>\n'
        f'    <ul style="list-style:none;padding:0;line-height:1.8;">\n'
        f'{inner}\n'
        f'    </ul>\n'
        f'</aside>\n'
        f'{RELATED_END}'
    )


def inject_related(text: str, block: str) -> str:
    if not block:
        return text
    if RELATED_RE.search(text):
        return RELATED_RE.sub(block, text, count=1)
    # Insert right before .post-nav.
    m = POST_NAV_RE.search(text)
    if not m:
        return text
    return text[:m.start()] + '\n    ' + block + text[m.start():]


# ---------- driver ----------

def main():
    posts_dir = PUB / 'posts'
    post_paths = sorted(posts_dir.glob('*.html'))
    post_index = {p.name: i for i, p in enumerate(post_paths)}

    files = list(sorted(PUB.glob('*.html'))) + post_paths
    img_total = 0
    related_added = 0
    for p in files:
        text = p.read_text(encoding='utf-8')
        text, n_imgs = upgrade_imgs(text)
        img_total += n_imgs
        text = inject_perf_block(text)
        if p.parent.name == 'posts':
            idx = post_index[p.name]
            block = build_related(post_paths, idx)
            text = inject_related(text, block)
            if block:
                related_added += 1
        p.write_text(text, encoding='utf-8')

    # Mirror to root.
    for p in files:
        rel = p.relative_to(PUB)
        dest = ROOT / rel
        dest.write_text(p.read_text(encoding='utf-8'), encoding='utf-8')

    print(f'imgs touched: {img_total}, related blocks: {related_added}, '
          f'files: {len(files)}')


if __name__ == '__main__':
    main()

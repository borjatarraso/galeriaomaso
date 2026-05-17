/* Galería O+O - Site JavaScript with Language + Mode controls */

// Mobile menu toggle
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('open');
});

// ============================================================
// Google Translate (full-page MT for body content)
// Our own data-g18n map handles nav/toolbar; GT handles everything else.
// ============================================================
(function() {
    // Map our internal lang codes -> Google Translate codes.
    // 'es' is the source language; selecting it means "no translation".
    var GT_MAP = { es: '', en: 'en', de: 'de', fr: 'fr', it: 'it', zh: 'zh-CN', ja: 'ja', fa: 'fa' };

    // Build every domain variant the GT cookie might live under so we can
    // reliably wipe it on a switch back to Spanish. GT and our own setter
    // have both used the bare hostname and the dotted root over time.
    function cookieDomainVariants() {
        var host = location.hostname;
        var out = ['']; // no domain attribute (host-only cookie)
        if (host && host !== 'localhost' && !/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
            out.push(host);
            out.push('.' + host);
            var bare = host.replace(/^www\./, '');
            if (bare !== host) { out.push(bare); out.push('.' + bare); }
            var parts = host.split('.');
            if (parts.length >= 2) {
                var root = parts.slice(-2).join('.');
                out.push(root); out.push('.' + root);
            }
        }
        return out;
    }
    function setGoogtrans(value) {
        var d = new Date(); d.setTime(d.getTime() + 365 * 86400000);
        var expires = d.toUTCString();
        var variants = cookieDomainVariants();
        for (var i = 0; i < variants.length; i++) {
            var dom = variants[i] ? ';domain=' + variants[i] : '';
            document.cookie = 'googtrans=' + value + ';expires=' + expires + ';path=/' + dom;
        }
    }
    function clearGoogtrans() {
        var past = 'Thu, 01 Jan 1970 00:00:00 GMT';
        var variants = cookieDomainVariants();
        var paths = ['/', location.pathname, location.pathname.replace(/[^/]+$/, '')];
        for (var i = 0; i < variants.length; i++) {
            var dom = variants[i] ? ';domain=' + variants[i] : '';
            for (var j = 0; j < paths.length; j++) {
                if (!paths[j]) continue;
                document.cookie = 'googtrans=;expires=' + past + ';path=' + paths[j] + dom;
            }
        }
    }
    // Drop any "#googtrans(es|xx)" hash that GT may have left in the URL —
    // if it survives a reload, GT will re-read it and re-translate.
    function stripGoogtransHash() {
        if (location.hash && location.hash.indexOf('#googtrans') === 0) {
            var clean = location.pathname + location.search;
            if (history && history.replaceState) {
                history.replaceState(null, '', clean);
            } else {
                location.hash = '';
            }
        }
    }

    window.googleTranslateElementInit = function() {
        new google.translate.TranslateElement({
            pageLanguage: 'es',
            includedLanguages: 'en,de,fr,it,zh-CN,ja,fa',
            autoDisplay: false,
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        }, 'google_translate_element');
    };

    function inject() {
        if (document.getElementById('google_translate_element')) return;
        var div = document.createElement('div');
        div.id = 'google_translate_element';
        document.body.appendChild(div);
        var s = document.createElement('script');
        s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        s.async = true;
        document.head.appendChild(s);
    }

    // Public hook used by the language switcher. Sets/clears the googtrans
    // cookie, scrubs any #googtrans hash, then loads a clean URL.
    window._galApplyGoogleTrans = function(lang) {
        var gLang = GT_MAP[lang];
        if (gLang === undefined) return;
        clearGoogtrans(); // always wipe first to drop stale variants
        if (gLang !== '') setGoogtrans('/es/' + gLang);
        var clean = location.pathname + location.search;
        // replace() (not reload) avoids back-button to the polluted URL
        // and forces a fresh document without any GT-injected DOM state.
        location.replace(clean);
    };

    // On every page load: if a stale #googtrans hash sneaked in, strip it
    // before GT initializes so the cookie is the only source of truth.
    stripGoogtransHash();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inject);
    } else {
        inject();
    }
})();

// ============================================================
// Language Selector
// ============================================================
(function() {
    var langToggle = document.getElementById('galLangToggle');
    var langDropdown = document.getElementById('galLangDropdown');
    var langLabel = document.getElementById('galLangLabel');
    var langFlag = document.getElementById('galLangFlag');
    if (!langToggle) return;

    var currentLang = 'es';
    var langLabels = { es:'ES', en:'EN', de:'DE', fr:'FR', it:'IT', zh:'中', ja:'日', fa:'فا' };
    var langFlags = {
        es: '\uD83C\uDDEA\uD83C\uDDF8', en: '\uD83C\uDDEC\uD83C\uDDE7',
        de: '\uD83C\uDDE9\uD83C\uDDEA', fr: '\uD83C\uDDEB\uD83C\uDDF7',
        it: '\uD83C\uDDEE\uD83C\uDDF9', zh: '\uD83C\uDDE8\uD83C\uDDF3',
        ja: '\uD83C\uDDEF\uD83C\uDDF5', fa: 'IR'
    };
    var rtlLangs = ['fa'];
    var pahlaviSvg = '<svg viewBox="0 0 36 24" width="18" height="12"><rect width="36" height="8" fill="#239f40"/><rect y="8" width="36" height="8" fill="#fff"/><rect y="16" width="36" height="8" fill="#da0000"/><circle cx="18" cy="12" r="3.5" fill="#da0000"/><path d="M15.5 10.5c0 0 1-1.5 2.5-1.5s2.5 1.5 2.5 1.5" stroke="#f4c430" stroke-width="0.6" fill="none"/><line x1="18" y1="8" x2="18" y2="10" stroke="#f4c430" stroke-width="0.7"/></svg>';

    var options = langDropdown.querySelectorAll('.gal-dropdown-option');

    langToggle.addEventListener('click', function(e) {
        e.stopPropagation();
        langDropdown.classList.toggle('open');
        // Close mode dropdown
        var md = document.getElementById('galModeDropdown');
        if (md) md.classList.remove('open');
    });

    document.addEventListener('click', function() {
        langDropdown.classList.remove('open');
        var md = document.getElementById('galModeDropdown');
        if (md) md.classList.remove('open');
    });

    for (var i = 0; i < options.length; i++) {
        options[i].addEventListener('click', function(e) {
            e.stopPropagation();
            switchLang(this.getAttribute('data-lang'));
            langDropdown.classList.remove('open');
        });
    }

    function switchLang(lang, opts) {
        if (!galTranslations || !galTranslations[lang]) return;
        var isInitial = opts && opts.initial;
        var prev = currentLang;
        currentLang = lang;

        // Update active
        for (var o = 0; o < options.length; o++) {
            options[o].classList.remove('active');
            if (options[o].getAttribute('data-lang') === lang) options[o].classList.add('active');
        }

        // Update label + flag
        langLabel.textContent = langLabels[lang];
        if (lang === 'fa') {
            langFlag.innerHTML = pahlaviSvg;
        } else {
            langFlag.textContent = langFlags[lang];
        }

        // Direction
        document.documentElement.lang = lang;
        document.documentElement.dir = rtlLangs.indexOf(lang) !== -1 ? 'rtl' : 'ltr';

        // Translate all data-g18n elements (nav, toolbar, etc.)
        var els = document.querySelectorAll('[data-g18n]');
        for (var e = 0; e < els.length; e++) {
            var key = els[e].getAttribute('data-g18n');
            if (galTranslations[lang][key]) {
                els[e].textContent = galTranslations[lang][key];
            }
        }

        // Update view label
        updateViewLabel();

        // Persist choice across pages
        try { localStorage.setItem('galLang', lang); } catch (_) {}

        // Drive Google Translate for the rest of the page (titles, body, posts)
        if (!isInitial && prev !== lang && typeof window._galApplyGoogleTrans === 'function') {
            window._galApplyGoogleTrans(lang);
        }
    }

    // Restore previously chosen language on page load
    var saved = null;
    try { saved = localStorage.getItem('galLang'); } catch (_) {}
    if (saved && saved !== 'es' && galTranslations[saved]) {
        switchLang(saved, { initial: true });
    }

    // Expose for view mode
    window._galCurrentLang = function() { return currentLang; };
})();

// ============================================================
// View Mode Toggle
// ============================================================
(function() {
    var viewToggle = document.getElementById('galViewToggle');
    var viewLabel = document.getElementById('galViewLabel');
    if (!viewToggle) return;

    var iconDesktop = viewToggle.querySelector('.gal-view-desktop');
    var iconMobile = viewToggle.querySelector('.gal-view-mobile');
    var currentView = 'auto';

    function detectView() { return window.innerWidth <= 768 ? 'mobile' : 'desktop'; }

    window.updateViewLabel = function() {
        var lang = window._galCurrentLang ? window._galCurrentLang() : 'es';
        var effective = currentView === 'auto' ? detectView() : currentView;
        var isMobile = effective === 'mobile';

        if (iconDesktop) iconDesktop.style.display = isMobile ? 'none' : 'block';
        if (iconMobile) iconMobile.style.display = isMobile ? 'block' : 'none';

        var key = isMobile ? 'toolbar.mobile' : 'toolbar.desktop';
        viewLabel.textContent = (galTranslations && galTranslations[lang] && galTranslations[lang][key]) || (isMobile ? 'Móvil' : 'Escritorio');

        document.documentElement.setAttribute('data-view', currentView);
    };

    viewToggle.addEventListener('click', function() {
        if (currentView === 'auto') {
            currentView = detectView() === 'desktop' ? 'mobile' : 'desktop';
        } else if (currentView === 'mobile') {
            currentView = 'desktop';
        } else {
            currentView = 'mobile';
        }
        updateViewLabel();
    });

    updateViewLabel();
    window.addEventListener('resize', function() {
        if (currentView === 'auto') updateViewLabel();
    });
})();

// ============================================================
// Image Lightbox
// ============================================================
(function() {
    var overlay = document.createElement('div');
    overlay.className = 'img-overlay';
    overlay.innerHTML = '<button class="img-overlay-close">&times;</button><img alt="">';
    document.body.appendChild(overlay);

    var overlayImg = overlay.querySelector('img');
    var closeBtn = overlay.querySelector('.img-overlay-close');

    function openOverlay(src, sourceImg) {
        overlayImg.style.display = '';
        overlayImg.style.width = '';
        overlayImg.style.height = '';
        overlayImg.src = src;
        overlay.classList.add('active');
        overlay.classList.remove('zoomed');
        document.body.style.overflow = 'hidden';

        // Size preview to ~2.5x the clicked image, capped at viewport.
        if (sourceImg) {
            var rect = sourceImg.getBoundingClientRect();
            var srcW = rect.width || sourceImg.naturalWidth || 200;
            var srcH = rect.height || sourceImg.naturalHeight || 200;
            var scale = 2.5;
            var targetW = srcW * scale;
            var targetH = srcH * scale;
            var maxW = window.innerWidth * 0.95;
            var maxH = window.innerHeight * 0.90;
            var fit = Math.min(maxW / targetW, maxH / targetH, 1);
            overlayImg.style.width = Math.round(targetW * fit) + 'px';
            overlayImg.style.height = Math.round(targetH * fit) + 'px';
        }
    }

    function closeOverlay() {
        overlay.classList.remove('active');
        overlay.classList.remove('zoomed');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', closeOverlay);
    closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeOverlay(); });
    overlayImg.addEventListener('click', function(e) {
        e.stopPropagation();
        overlay.classList.toggle('zoomed');
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeOverlay();
        if (e.key === '+' || e.key === '=') overlay.classList.add('zoomed');
        if (e.key === '-' || e.key === '0') overlay.classList.remove('zoomed');
    });

    var content = document.querySelector('.page-content');
    if (content) {
        content.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (!link) return;
            if (link.classList.contains('yt-thumb-link')) return;
            var href = link.getAttribute('href') || '';
            var hrefIsImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(href);
            var innerImg = link.querySelector('img');
            if (hrefIsImage) {
                e.preventDefault();
                openOverlay(href, innerImg);
                return;
            }
            if (innerImg && innerImg.getAttribute('src')) {
                e.preventDefault();
                openOverlay(innerImg.getAttribute('src'), innerImg);
            }
        });
    }

    // Handle broken images. For post-card thumbnails (YouTube thumbs that 404),
    // swap in a placeholder div so the card keeps its 200px height; otherwise hide.
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
        if (imgs[i].closest('.img-overlay')) continue;
        imgs[i].addEventListener('error', function() {
            if (this.classList && this.classList.contains('post-card-image')) {
                var ph = document.createElement('div');
                ph.className = 'post-card-placeholder';
                this.parentNode.insertBefore(ph, this);
                this.style.display = 'none';
            } else {
                this.style.display = 'none';
            }
        });
    }

    // Collapse gallery tiles that contain no image (Blogger leftover markup)
    var tiles = document.querySelectorAll('.page-content dl.gallery-item, .page-content dt.gallery-icon');
    for (var t = 0; t < tiles.length; t++) {
        if (!tiles[t].querySelector('img')) {
            tiles[t].classList.add('is-empty');
        }
    }

    // Auto-gallery: wrap runs of standalone <a><img></a> siblings in a uniform grid
    function isImageLink(node) {
        if (!node || node.nodeType !== 1 || node.tagName !== 'A') return false;
        if (node.closest('.gallery-item, .tr-caption-container, .auto-gallery')) return false;
        var imgs = node.querySelectorAll('img');
        if (imgs.length !== 1) return false;
        if (imgs[0].closest('.img-overlay')) return false;
        // anchor must contain only the image (no text)
        if (node.textContent && node.textContent.replace(/\s+/g, '') !== '') return false;
        return true;
    }
    // Step 1: unwrap <div>/<p>/<span> wrappers that contain only image-link anchors
    // (plus whitespace / <br>). Blogger emits these around photo groups and they
    // break sibling-run detection. Walk deepest-first so nested wrappers collapse.
    function unwrapImageOnlyContainers(root) {
        var wrappers = root.querySelectorAll('div, p, span, center');
        // deepest-first ordering
        var arr = [];
        for (var i = 0; i < wrappers.length; i++) arr.push(wrappers[i]);
        arr.sort(function(a, b) {
            // depth difference: deeper first
            var da = 0, db = 0, x = a;
            while (x) { da++; x = x.parentNode; }
            x = b;
            while (x) { db++; x = x.parentNode; }
            return db - da;
        });
        for (var w = 0; w < arr.length; w++) {
            var wrapNode = arr[w];
            if (!wrapNode.parentNode) continue;
            if (wrapNode.closest('.gallery-item, .tr-caption-container, .auto-gallery, .post-nav, header, footer, nav')) continue;
            if (wrapNode === root) continue;
            var anchorCount = 0;
            var hasOther = false;
            var ch = wrapNode.childNodes;
            for (var ci = 0; ci < ch.length; ci++) {
                var n = ch[ci];
                if (n.nodeType === 3) {
                    if (n.textContent.replace(/\s+/g, '')) { hasOther = true; break; }
                } else if (n.nodeType === 1) {
                    if (n.tagName === 'A' && isImageLink(n)) {
                        anchorCount++;
                    } else if (n.tagName === 'BR') {
                        // ok
                    } else {
                        hasOther = true; break;
                    }
                }
            }
            if (!hasOther && anchorCount >= 1) {
                // Move all children up to parent in order, then drop wrapper
                while (wrapNode.firstChild) {
                    wrapNode.parentNode.insertBefore(wrapNode.firstChild, wrapNode);
                }
                wrapNode.parentNode.removeChild(wrapNode);
            }
        }
    }
    var contentRoots = document.querySelectorAll('.page-content');
    for (var cr = 0; cr < contentRoots.length; cr++) {
        unwrapImageOnlyContainers(contentRoots[cr]);
    }
    // Any "tile-shaped" node that should pack into a flex row of equal-size tiles
    function isTileUnit(node) {
        if (!node || node.nodeType !== 1) return false;
        if (node.closest('.auto-gallery')) return false;
        var tag = node.tagName;
        if (tag === 'A') return isImageLink(node);
        if (tag === 'DL' && node.classList && node.classList.contains('gallery-item')) {
            return !!node.querySelector('img');
        }
        if (tag === 'DT' && node.classList && node.classList.contains('gallery-icon')) {
            if (!node.querySelector('img')) return false;
            // only orphan dt (not inside a dl.gallery-item) is its own tile
            if (node.parentNode && node.parentNode.closest &&
                node.parentNode.closest('dl.gallery-item')) return false;
            return true;
        }
        if (tag === 'TABLE' && node.classList && node.classList.contains('tr-caption-container')) {
            return !!node.querySelector('img');
        }
        return false;
    }
    function isFillerNode(node) {
        if (node.nodeType === 3) return !node.textContent.replace(/\s+/g, '');
        if (node.nodeType !== 1) return true;
        var tag = node.tagName;
        if (tag === 'BR') return true;
        if ((tag === 'P' || tag === 'DIV' || tag === 'SPAN') &&
            !node.textContent.replace(/\s+/g, '') &&
            !node.querySelector('img')) return true;
        // empty / image-less gallery placeholders that we already mark hidden
        if (tag === 'DL' && node.classList && node.classList.contains('gallery-item') &&
            !node.querySelector('img')) return true;
        if (tag === 'DT' && node.classList && node.classList.contains('gallery-icon') &&
            !node.querySelector('img')) return true;
        return false;
    }
    var contents = document.querySelectorAll('.page-content');
    for (var c = 0; c < contents.length; c++) {
        var parents = contents[c].querySelectorAll('*');
        var allParents = [contents[c]];
        for (var pp = 0; pp < parents.length; pp++) allParents.push(parents[pp]);

        for (var p = 0; p < allParents.length; p++) {
            var parent = allParents[p];
            if (parent.classList && parent.classList.contains('auto-gallery')) continue;

            var kids = parent.childNodes;
            var run = [];
            var runs = [];
            for (var k = 0; k < kids.length; k++) {
                var node = kids[k];
                if (isTileUnit(node)) {
                    run.push(node);
                } else if (run.length > 0 && isFillerNode(node)) {
                    // allow whitespace / <br> / empty <p> / empty gallery placeholders
                    continue;
                } else {
                    if (run.length >= 2) runs.push(run);
                    run = [];
                }
            }
            if (run.length >= 2) runs.push(run);

            for (var r = 0; r < runs.length; r++) {
                var group = runs[r];
                var wrap = document.createElement('div');
                wrap.className = 'auto-gallery';
                group[0].parentNode.insertBefore(wrap, group[0]);
                for (var g = 0; g < group.length; g++) {
                    wrap.appendChild(group[g]);
                }
            }
        }
    }
})();

// ============================================================
// Gallery Contact Form
// ============================================================
(function() {
    var form = document.getElementById('galContactForm');
    if (!form) return;
    var success = document.getElementById('galFormSuccess');
    var EMAIL = 'enriqueta.hueso@gmail.com';

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var nombre = document.getElementById('gNombre').value;
        var email = document.getElementById('gEmail').value;
        var asunto = document.getElementById('gAsunto').value;
        var mensaje = document.getElementById('gMensaje').value;
        if (!nombre || !email || !asunto || !mensaje) return;

        var subject = encodeURIComponent(asunto);
        var body = encodeURIComponent('Nombre: ' + nombre + '\nEmail: ' + email + '\n\n' + mensaje);
        window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;

        success.classList.add('show');
        form.reset();
        setTimeout(function() { success.classList.remove('show'); }, 6000);
    });
})();

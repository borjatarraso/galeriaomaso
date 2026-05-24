/* Galería O+O - Site JavaScript with Language + Mode controls */

// Mobile menu toggle — toggles .open on both the topbar nav wrapper
// (so its CSS picks up the dropdown) and the nav-links itself.
// Esc closes the menu when it's open.
(function() {
    var btn = document.querySelector('.menu-toggle');
    if (!btn) return;
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var topnav = btn.closest('.gal-topnav');
        if (topnav) topnav.classList.toggle('open');
        var links = (topnav || document).querySelector('.nav-links');
        if (links) links.classList.toggle('open');
    });
    document.addEventListener('keydown', function(e) {
        if (e.key !== 'Escape') return;
        var topnav = document.querySelector('.gal-topnav.open');
        if (!topnav) return;
        topnav.classList.remove('open');
        var links = topnav.querySelector('.nav-links.open');
        if (links) links.classList.remove('open');
        try { btn.focus(); } catch (err) {}
    });
})();

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
    if (!langToggle || !langDropdown) return;

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
        // Also close the mobile hamburger menu if open
        var topnav = document.querySelector('.gal-topnav.open');
        if (topnav) {
            topnav.classList.remove('open');
            var navLinks = topnav.querySelector('.nav-links.open');
            if (navLinks) navLinks.classList.remove('open');
        }
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

        // Update view label (defined by the View Mode IIFE later in this file —
        // guard because switchLang may also run during initial page-load before
        // that IIFE has had a chance to define window.updateViewLabel).
        if (typeof window.updateViewLabel === 'function') window.updateViewLabel();

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
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') closeOverlay();
    });

    var content = document.querySelector('.page-content');
    if (content) {
        content.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (!link) return;
            if (link.classList.contains('yt-thumb-link')) return;
            // Links the user intends as navigation (target=_blank, .enlace-card,
            // or any anchor whose href is a real URL to a non-image) should
            // navigate normally — never hijack them into the image lightbox.
            var href = link.getAttribute('href') || '';
            var hrefIsImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(href);
            var isNavTarget = link.target === '_blank' ||
                              link.classList.contains('enlace-card') ||
                              (href && /^https?:\/\//i.test(href) && !hrefIsImage);
            if (isNavTarget) return;
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

    var razonSelect = document.getElementById('gRazon');
    var razonLabels = {
        'exponer': 'Interesado/a en exponer',
        'critica': 'Crítica de arte',
        'compra-venta': 'Compra-venta de obras',
        'curso-taller': 'Cursos o talleres',
        'visita': 'Visita guiada o cita previa',
        'prensa': 'Prensa y comunicación',
        'colaboracion': 'Colaboración o proyecto cultural',
        'otro': 'Otro'
    };

    // Preselect "Razón de contacto" + prefill asunto from ?razon=… URL parameter
    if (razonSelect) {
        try {
            var params = new URLSearchParams(window.location.search);
            var razonParam = params.get('razon');
            if (razonParam && razonLabels[razonParam]) {
                razonSelect.value = razonParam;
                var asuntoField = document.getElementById('gAsunto');
                if (asuntoField && !asuntoField.value) {
                    asuntoField.value = razonLabels[razonParam];
                }
            }
        } catch (err) { /* URLSearchParams unsupported — skip preselect */ }
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        var nombre = document.getElementById('gNombre').value;
        var email = document.getElementById('gEmail').value;
        var razon = razonSelect ? razonSelect.value : '';
        var asunto = document.getElementById('gAsunto').value;
        var mensaje = document.getElementById('gMensaje').value;
        if (!nombre || !email || !razon || !asunto || !mensaje) return;

        var razonLabel = razonLabels[razon] || razon;
        var subject = encodeURIComponent('[' + razonLabel + '] ' + asunto);
        var body = encodeURIComponent(
            'Nombre: ' + nombre + '\n' +
            'Email: ' + email + '\n' +
            'Razón de contacto: ' + razonLabel + '\n\n' +
            mensaje
        );
        window.location.href = 'mailto:' + EMAIL + '?subject=' + subject + '&body=' + body;

        success.classList.add('show');
        form.reset();
        setTimeout(function() { success.classList.remove('show'); }, 6000);
    });
})();

// ============================================================
// Critique Modal — opens full critique text from inline <template>
// ============================================================
(function() {
    var modal = document.getElementById('criticaModal');
    if (!modal) return;
    var content = modal.querySelector('#criticaModalContent');
    var panel = modal.querySelector('.critica-modal-panel');
    var lastTrigger = null;

    var FOCUSABLE = 'a[href], area[href], button:not([disabled]), input:not([disabled]),' +
                    'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    function openCritica(triggerBtn) {
        var id = triggerBtn.getAttribute('data-critica');
        if (!id) return;
        var tpl = document.getElementById('critica-' + id);
        if (!tpl) return;
        content.innerHTML = '';
        content.appendChild(tpl.content ? tpl.content.cloneNode(true) : tpl.cloneNode(true));
        // aria-labelledby — point to the cloned <h2 id="critica-title-…">
        var titleEl = content.querySelector('h2[id^="critica-title-"]');
        if (titleEl) modal.setAttribute('aria-labelledby', titleEl.id);
        lastTrigger = triggerBtn;
        modal.hidden = false;
        document.body.classList.add('critica-modal-open');
        setTimeout(function() { content.focus(); content.scrollTop = 0; }, 0);
    }

    function closeCritica() {
        if (modal.hidden) return;
        modal.hidden = true;
        document.body.classList.remove('critica-modal-open');
        content.innerHTML = '';
        if (lastTrigger && typeof lastTrigger.focus === 'function') {
            lastTrigger.focus();
        }
    }

    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.critique-link[data-critica]');
        if (btn) {
            e.preventDefault();
            openCritica(btn);
            return;
        }
        if (e.target.closest('[data-critica-close]')) {
            closeCritica();
        }
    });

    document.addEventListener('keydown', function(e) {
        if (modal.hidden) return;
        if (e.key === 'Escape') { closeCritica(); return; }
        if (e.key !== 'Tab') return;
        // Focus trap — cycle Tab focus inside the modal panel.
        var focusables = panel.querySelectorAll(FOCUSABLE);
        if (!focusables.length) { e.preventDefault(); content.focus(); return; }
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        var active = document.activeElement;
        if (e.shiftKey) {
            if (active === first || active === content || !panel.contains(active)) {
                e.preventDefault();
                last.focus();
            }
        } else {
            if (active === last) {
                e.preventDefault();
                first.focus();
            }
        }
    });
})();

// ============================================================
// Entry animation — "First Brushstroke"
// Plays once per browser session on the first page rendered.
// A painterly intro: sweeping abstract strokes settle into the
// O+O calligraphy and the artist's name. Skipped by users with
// prefers-reduced-motion, by Esc / Space / Enter, or by click.
// ============================================================
(function() {
    var STORAGE_KEY = 'oo_intro_played_v1';
    try {
        if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch (e) { /* private mode: still play, just don't store */ }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
        return;
    }

    function build() {
        var SVG = 'http://www.w3.org/2000/svg';
        var overlay = document.createElement('div');
        overlay.className = 'oo-intro';
        overlay.setAttribute('role', 'presentation');
        overlay.setAttribute('aria-hidden', 'true');

        var svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('viewBox', '0 0 1600 900');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.setAttribute('aria-hidden', 'true');

        svg.innerHTML = [
            '<defs>',
              // Vignette gradient — deepens edges, warm at centre
              '<radialGradient id="oo-vignette" cx="50%" cy="42%" r="78%">',
                '<stop offset="0%" stop-color="#3a0820" stop-opacity="0"/>',
                '<stop offset="60%" stop-color="#14010a" stop-opacity="0.55"/>',
                '<stop offset="100%" stop-color="#050003" stop-opacity="0.95"/>',
              '</radialGradient>',
              // Paper-warm overlay (subtle cream sheen)
              '<radialGradient id="oo-paper-g" cx="50%" cy="40%" r="65%">',
                '<stop offset="0%" stop-color="#f4e4c1" stop-opacity="0.18"/>',
                '<stop offset="100%" stop-color="#f4e4c1" stop-opacity="0"/>',
              '</radialGradient>',
              // Brush roughness (displacement noise for hand-painted feel)
              '<filter id="oo-brush" x="-10%" y="-10%" width="120%" height="120%">',
                '<feTurbulence type="fractalNoise" baseFrequency="0.022 0.045" numOctaves="2" seed="7" result="t"/>',
                '<feDisplacementMap in="SourceGraphic" in2="t" scale="12" xChannelSelector="R" yChannelSelector="G"/>',
              '</filter>',
              // Watercolor bleed (heavier blur + displacement)
              '<filter id="oo-watercolor" x="-30%" y="-30%" width="160%" height="160%">',
                '<feGaussianBlur stdDeviation="5" result="b1"/>',
                '<feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="4" result="wt"/>',
                '<feDisplacementMap in="b1" in2="wt" scale="26"/>',
                '<feGaussianBlur stdDeviation="3"/>',
              '</filter>',
              // Soft glow for splatters
              '<filter id="oo-soft" x="-50%" y="-50%" width="200%" height="200%">',
                '<feGaussianBlur stdDeviation="1.8"/>',
              '</filter>',
              // Watercolor bloom gradients
              '<radialGradient id="oo-bloom-burgundy">',
                '<stop offset="0%" stop-color="#8b1538" stop-opacity="0.55"/>',
                '<stop offset="60%" stop-color="#4a0a2e" stop-opacity="0.22"/>',
                '<stop offset="100%" stop-color="#4a0a2e" stop-opacity="0"/>',
              '</radialGradient>',
              '<radialGradient id="oo-bloom-gold">',
                '<stop offset="0%" stop-color="#ffd966" stop-opacity="0.55"/>',
                '<stop offset="60%" stop-color="#c47a3a" stop-opacity="0.22"/>',
                '<stop offset="100%" stop-color="#c47a3a" stop-opacity="0"/>',
              '</radialGradient>',
              '<radialGradient id="oo-bloom-vermillion">',
                '<stop offset="0%" stop-color="#c41e3a" stop-opacity="0.5"/>',
                '<stop offset="60%" stop-color="#8b1538" stop-opacity="0.2"/>',
                '<stop offset="100%" stop-color="#8b1538" stop-opacity="0"/>',
              '</radialGradient>',
              '<radialGradient id="oo-bloom-cream">',
                '<stop offset="0%" stop-color="#f4e4c1" stop-opacity="0.35"/>',
                '<stop offset="60%" stop-color="#f4e4c1" stop-opacity="0.1"/>',
                '<stop offset="100%" stop-color="#f4e4c1" stop-opacity="0"/>',
              '</radialGradient>',
              // Final glint radial
              '<radialGradient id="oo-glint-g" cx="50%" cy="50%" r="50%">',
                '<stop offset="0%" stop-color="#fff7d4" stop-opacity="0.95"/>',
                '<stop offset="55%" stop-color="#ffd966" stop-opacity="0.3"/>',
                '<stop offset="100%" stop-color="#ffd966" stop-opacity="0"/>',
              '</radialGradient>',
              // Gold-leaf sheen — luminous bar that sweeps across the logo
              '<linearGradient id="oo-sheen-g" x1="0%" y1="0%" x2="100%" y2="0%">',
                '<stop offset="0%"  stop-color="#ffd966" stop-opacity="0"/>',
                '<stop offset="42%" stop-color="#fff7d4" stop-opacity="0"/>',
                '<stop offset="50%" stop-color="#fff7d4" stop-opacity="0.95"/>',
                '<stop offset="58%" stop-color="#fff7d4" stop-opacity="0"/>',
                '<stop offset="100%" stop-color="#ffd966" stop-opacity="0"/>',
              '</linearGradient>',
            '</defs>',

            // ----- Layer 0: deep canvas + vignette + paper warmth -----
            '<rect width="1600" height="900" fill="#0d0107"/>',
            '<rect class="oo-vignette" width="1600" height="900" fill="url(#oo-vignette)"/>',
            '<rect class="oo-paper"    width="1600" height="900" fill="url(#oo-paper-g)"/>',

            // ----- Layer 1: watercolor pools (soft pools of pigment) -----
            '<g filter="url(#oo-watercolor)">',
              '<ellipse class="oo-bloom b1" cx="420"  cy="380" rx="240" ry="180" fill="url(#oo-bloom-burgundy)"/>',
              '<ellipse class="oo-bloom b2" cx="1180" cy="500" rx="280" ry="200" fill="url(#oo-bloom-gold)"/>',
              '<ellipse class="oo-bloom b3" cx="850"  cy="280" rx="220" ry="160" fill="url(#oo-bloom-cream)"/>',
              '<ellipse class="oo-bloom b4" cx="720"  cy="680" rx="260" ry="170" fill="url(#oo-bloom-vermillion)"/>',
            '</g>',

            // ----- Layer 2: bold black sumi-e ink gestures -----
            '<g filter="url(#oo-brush)">',
              '<path pathLength="1" class="oo-stroke s1" stroke="#0c0006" stroke-width="44" stroke-opacity="0.92"',
                ' d="M 140 200 C 380 320, 640 480, 900 460 S 1320 300, 1480 240"/>',
              '<path pathLength="1" class="oo-stroke s2" stroke="#0c0006" stroke-width="32" stroke-opacity="0.82"',
                ' d="M 200 740 C 480 600, 780 540, 1080 620 S 1380 740, 1500 700"/>',
            '</g>',

            // ----- Layer 3: accent gestural strokes (gold / ochre / vermillion) -----
            '<g filter="url(#oo-brush)">',
              '<path pathLength="1" class="oo-stroke s3" stroke="#ffd966" stroke-width="14" stroke-opacity="0.9"',
                ' d="M 80 540 C 360 460, 660 560, 980 480 S 1360 420, 1560 480"/>',
              '<path pathLength="1" class="oo-stroke s4" stroke="#c47a3a" stroke-width="18" stroke-opacity="0.7"',
                ' d="M 100 400 C 380 540, 700 380, 1020 540 S 1340 460, 1520 540"/>',
              '<path pathLength="1" class="oo-stroke s5" stroke="#8b1538" stroke-width="10" stroke-opacity="0.85"',
                ' d="M 280 820 C 520 760, 800 820, 1080 780 S 1340 800, 1480 760"/>',
            '</g>',

            // ----- Layer 4: ensō — hand-painted Zen circle around the centre -----
            '<g filter="url(#oo-brush)">',
              '<path pathLength="1" class="oo-enso" stroke="#0c0006" stroke-width="20" stroke-opacity="0.9" fill="none"',
                ' d="M 800 460 m -210 0 a 210 210 0 1 1 400 -42 a 210 210 0 0 1 -400 50"/>',
            '</g>',

            // ----- Layer 5: splatter pigment dots (gold + vermillion + cream) -----
            '<g fill="#ffd966" filter="url(#oo-soft)">',
              '<circle class="oo-splat d1" cx="380"  cy="430" r="6"   opacity="0.85"/>',
              '<circle class="oo-splat d2" cx="640"  cy="290" r="4"   opacity="0.75"/>',
              '<circle class="oo-splat d3" cx="900"  cy="520" r="7"   opacity="0.85"/>',
              '<circle class="oo-splat d4" cx="1180" cy="380" r="5"   opacity="0.65"/>',
              '<circle class="oo-splat d5" cx="1310" cy="610" r="3.5" opacity="0.55"/>',
              '<circle class="oo-splat d6" cx="500"  cy="710" r="4.5" opacity="0.75"/>',
            '</g>',
            '<g fill="#8b1538" filter="url(#oo-soft)">',
              '<circle class="oo-splat d2" cx="760"  cy="640" r="3.5" opacity="0.7"/>',
              '<circle class="oo-splat d4" cx="280"  cy="540" r="4"   opacity="0.6"/>',
              '<circle class="oo-splat d6" cx="1050" cy="260" r="3"   opacity="0.6"/>',
              '<circle class="oo-splat d8" cx="1240" cy="720" r="3.5" opacity="0.55"/>',
            '</g>',
            '<g fill="#f4e4c1" filter="url(#oo-soft)">',
              '<circle class="oo-splat d3" cx="560"  cy="190" r="2.5" opacity="0.55"/>',
              '<circle class="oo-splat d5" cx="1100" cy="180" r="2"   opacity="0.5"/>',
              '<circle class="oo-splat d7" cx="200"  cy="280" r="2.5" opacity="0.5"/>',
            '</g>',

            // ----- Layer 6: drifting pigment motes (slow upward float) -----
            '<g fill="#ffd966">',
              '<circle class="oo-mote m1" cx="200"  cy="800" r="1.6"/>',
              '<circle class="oo-mote m2" cx="500"  cy="850" r="1.2"/>',
              '<circle class="oo-mote m3" cx="900"  cy="820" r="1.8"/>',
              '<circle class="oo-mote m4" cx="1200" cy="860" r="1.3"/>',
              '<circle class="oo-mote m5" cx="350"  cy="780" r="1.0"/>',
              '<circle class="oo-mote m6" cx="1100" cy="830" r="1.5"/>',
              '<circle class="oo-mote m7" cx="700"  cy="870" r="1.1"/>',
            '</g>',

            // ----- Layer 7: O+O calligraphy (painted last, above strokes) -----
            '<g class="oo-logo" filter="url(#oo-brush)">',
              '<circle pathLength="1" class="oo-o1" cx="650" cy="460" r="112" stroke="#ffd966" stroke-width="16"/>',
              '<g class="oo-plus" stroke="#ffd966" stroke-width="13" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="414" x2="800" y2="506"/>',
                '<line pathLength="1" x1="754" y1="460" x2="846" y2="460"/>',
              '</g>',
              '<circle pathLength="1" class="oo-o2" cx="950" cy="460" r="112" stroke="#ffd966" stroke-width="16"/>',
            '</g>',

            // ----- Layer 8: gold-leaf sheen — luminous bar sweeps across logo -----
            '<rect class="oo-sheen" x="420" y="320" width="760" height="280" fill="url(#oo-sheen-g)"/>',

            // ----- Layer 9: final golden glint pulse -----
            '<circle class="oo-glint" cx="800" cy="460" r="200" fill="url(#oo-glint-g)"/>',

            // ----- Layer 10: artist name + subtitle -----
            '<text class="oo-text oo-name" x="800" y="690" text-anchor="middle"',
              ' fill="#f4e4c1" font-family="Georgia, serif" font-size="48"',
              ' letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="oo-text oo-sub" x="800" y="744" text-anchor="middle"',
              ' fill="#d4a0b8" font-family="Georgia, serif" font-size="18"',
              ' letter-spacing="10">GALERÍA O+O · VALENCIA</text>',

            // ----- Layer 11: vermillion artist's seal — stamps into corner -----
            '<g class="oo-seal">',
              '<rect x="1320" y="700" width="86" height="86" rx="6" fill="#8b1538" filter="url(#oo-brush)"/>',
              '<text x="1363" y="758" text-anchor="middle"',
                ' fill="#f4e4c1" font-family="Georgia, serif" font-size="32"',
                ' font-weight="bold" letter-spacing="-2">O+O</text>',
            '</g>'
        ].join('');

        overlay.appendChild(svg);

        var skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'oo-skip';
        skip.textContent = 'Saltar';
        skip.setAttribute('aria-label', 'Saltar animación de entrada');
        overlay.appendChild(skip);

        return { overlay: overlay, skip: skip };
    }

    function show() {
        var parts = build();
        var overlay = parts.overlay;
        document.body.classList.add('oo-intro-active');
        document.body.appendChild(overlay);

        var removed = false;
        function dismiss() {
            if (removed) return;
            removed = true;
            try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
            overlay.classList.add('is-leaving');
            window.setTimeout(function() {
                document.body.classList.remove('oo-intro-active');
                if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
                document.removeEventListener('keydown', onKey, true);
                // Restore focus to a sensible landmark for keyboard users.
                var main = document.querySelector('main')
                    || document.querySelector('h1')
                    || document.body;
                if (main && typeof main.focus === 'function') {
                    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
                    try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
                }
            }, 750);
        }
        function onKey(e) {
            if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                dismiss();
            }
        }

        overlay.addEventListener('click', dismiss);
        parts.skip.addEventListener('click', function(e) { e.stopPropagation(); dismiss(); });
        document.addEventListener('keydown', onKey, true);

        // Auto-dismiss after the composition has landed.
        window.setTimeout(dismiss, 6400);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', show, { once: true });
    } else {
        show();
    }
})();

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
// Entry animation — random art-themed variants
// Plays once per browser session on the first page rendered.
// On each first visit a random variant is selected from the
// VARIANTS registry below; each variant ships its own CSS +
// SVG payload. Skipped by users with prefers-reduced-motion,
// by Esc / Space / Enter, or by click.
//
// Variants:
//   sumi          — Sumi-e Bloom (East-Asian ink + watercolor + ensō)
//   tachisme      — Tachisme / action-painting splatters on linen
//   rothko        — Color-field rectangles breathing on deep wine
//   aurora        — Translucent ribbons flowing across midnight
//   constellation — Gold pigment-dots connect into the O+O glyph
//   kintsugi      — Cracked porcelain mended in gold
//   bauhaus       — Kandinsky-style geometric primaries on cream
//   klimt         — Tiled gold leaf on deep ultramarine
// ============================================================
(function() {
    var STORAGE_KEY = 'oo_intro_played_v2';
    try {
        if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    } catch (e) { /* private mode: still play, just don't store */ }

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        try { sessionStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
        return;
    }

    // ---------- VARIANT REGISTRY ----------
    var VARIANTS = {
        sumi:          buildSumi,
        tachisme:      buildTachisme,
        rothko:        buildRothko,
        aurora:        buildAurora,
        constellation: buildConstellation,
        kintsugi:      buildKintsugi,
        bauhaus:       buildBauhaus,
        klimt:         buildKlimt
    };

    function pickVariant() {
        var keys = Object.keys(VARIANTS);
        var k = keys[Math.floor(Math.random() * keys.length)];
        return { id: k, data: VARIANTS[k]() };
    }

    // ---------- VARIANT 1 — SUMI-E BLOOM (sb-) ----------
    function buildSumi() {
        var css = [
            '.oo-v-sumi { background: radial-gradient(ellipse at 50% 38%, #2a0115 0%, #14010a 55%, #050003 100%); }',
            '.oo-v-sumi .sb-paper { opacity: 0; animation: sb-paper-in 1.4s ease-out .05s forwards; }',
            '@keyframes sb-paper-in { to { opacity: .18; } }',
            '.oo-v-sumi .sb-vignette { opacity: 0; animation: sb-vfade 1.6s ease-out forwards; }',
            '@keyframes sb-vfade { to { opacity: 1; } }',
            '.oo-v-sumi .sb-bloom { opacity: 0; transform: scale(.45); animation: sb-bloom 2.2s cubic-bezier(.16,.84,.44,1) forwards; }',
            '.oo-v-sumi .sb-b1 { animation-delay: .25s; }',
            '.oo-v-sumi .sb-b2 { animation-delay: .55s; }',
            '.oo-v-sumi .sb-b3 { animation-delay: .85s; }',
            '.oo-v-sumi .sb-b4 { animation-delay: 1.10s; }',
            '@keyframes sb-bloom { 0%{opacity:0;transform:scale(.45)} 40%{opacity:.85} 100%{opacity:.6;transform:scale(1)} }',
            '.oo-v-sumi .sb-stroke { fill:none;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:1;stroke-dashoffset:1;opacity:0; }',
            '.oo-v-sumi .sb-s1 { animation: sb-paint 1.4s cubic-bezier(.22,.78,.32,1) .55s forwards; }',
            '.oo-v-sumi .sb-s2 { animation: sb-paint 1.3s cubic-bezier(.22,.78,.32,1) .95s forwards; }',
            '.oo-v-sumi .sb-s3 { animation: sb-paint 1.1s cubic-bezier(.22,.78,.32,1) 1.25s forwards; }',
            '.oo-v-sumi .sb-s4 { animation: sb-paint 1.0s cubic-bezier(.22,.78,.32,1) 1.45s forwards; }',
            '.oo-v-sumi .sb-s5 { animation: sb-paint .8s cubic-bezier(.22,.78,.32,1) 1.70s forwards; }',
            '@keyframes sb-paint { 0%{opacity:0;stroke-dashoffset:1} 8%{opacity:1} 100%{opacity:1;stroke-dashoffset:0} }',
            '.oo-v-sumi .sb-enso { fill:none;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;opacity:0;animation: sb-enso 1.6s cubic-bezier(.4,0,.2,1) 1.95s forwards; }',
            '@keyframes sb-enso { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:.85;stroke-dashoffset:.05} }',
            '.oo-v-sumi .sb-splat { opacity:0;transform:scale(.3);animation: sb-splat .7s cubic-bezier(.16,.84,.44,1) forwards; }',
            '.oo-v-sumi .sb-d1 { animation-delay: 1.05s; } .oo-v-sumi .sb-d2 { animation-delay: 1.20s; }',
            '.oo-v-sumi .sb-d3 { animation-delay: 1.35s; } .oo-v-sumi .sb-d4 { animation-delay: 1.55s; }',
            '.oo-v-sumi .sb-d5 { animation-delay: 1.75s; } .oo-v-sumi .sb-d6 { animation-delay: 1.95s; }',
            '.oo-v-sumi .sb-d7 { animation-delay: 2.15s; } .oo-v-sumi .sb-d8 { animation-delay: 2.40s; }',
            '@keyframes sb-splat { 0%{opacity:0;transform:scale(.3)} 55%{opacity:.9;transform:scale(1.22)} 100%{opacity:.7;transform:scale(1)} }',
            '.oo-v-sumi .sb-mote { opacity:0;animation: sb-mote 5.6s linear forwards; }',
            '.oo-v-sumi .sb-m1 { animation-delay:.10s; } .oo-v-sumi .sb-m2 { animation-delay:.55s; }',
            '.oo-v-sumi .sb-m3 { animation-delay:.95s; } .oo-v-sumi .sb-m4 { animation-delay:1.35s; }',
            '.oo-v-sumi .sb-m5 { animation-delay:1.75s; } .oo-v-sumi .sb-m6 { animation-delay:2.10s; }',
            '.oo-v-sumi .sb-m7 { animation-delay:2.55s; }',
            '@keyframes sb-mote { 0%{opacity:0;transform:translate(0,0)} 18%{opacity:.75} 82%{opacity:.45} 100%{opacity:0;transform:translate(36px,-220px)} }',
            '.oo-v-sumi .sb-logo path, .oo-v-sumi .sb-logo circle, .oo-v-sumi .sb-logo line { fill:none;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;opacity:0; }',
            '.oo-v-sumi .sb-o1 { animation: sb-paint 1.0s cubic-bezier(.22,.78,.32,1) 2.95s forwards; }',
            '.oo-v-sumi .sb-plus { animation: sb-paint .5s cubic-bezier(.22,.78,.32,1) 3.55s forwards; }',
            '.oo-v-sumi .sb-o2 { animation: sb-paint 1.0s cubic-bezier(.22,.78,.32,1) 3.70s forwards; }',
            '.oo-v-sumi .sb-sheen { opacity:0;transform:translateX(-520px);animation: sb-sheen 1.6s cubic-bezier(.45,0,.55,1) 4.30s forwards; }',
            '@keyframes sb-sheen { 0%{opacity:0;transform:translateX(-520px)} 20%{opacity:.95} 80%{opacity:.95} 100%{opacity:0;transform:translateX(520px)} }',
            '.oo-v-sumi .sb-text { opacity:0;transform:translateY(14px);animation: sb-rise 1.0s cubic-bezier(.16,.84,.44,1) forwards; }',
            '.oo-v-sumi .sb-name { animation-delay:3.85s; } .oo-v-sumi .sb-sub { animation-delay:4.20s; }',
            '@keyframes sb-rise { to { opacity:1;transform:translateY(0); } }',
            '.oo-v-sumi .sb-seal { opacity:0;transform:scale(.4) rotate(-7deg);animation: sb-seal .7s cubic-bezier(.18,1.5,.4,1) 4.55s forwards; }',
            '@keyframes sb-seal { 0%{opacity:0;transform:scale(.4) rotate(-7deg)} 55%{opacity:.95;transform:scale(1.1) rotate(-7deg)} 100%{opacity:.92;transform:scale(1) rotate(-7deg)} }',
            '.oo-v-sumi .sb-glint { opacity:0;animation: sb-glint 1.8s ease 4.95s forwards; }',
            '@keyframes sb-glint { 0%{opacity:0;transform:scale(.5)} 35%{opacity:1;transform:scale(1.12)} 100%{opacity:0;transform:scale(1.6)} }'
        ].join('\n');
        var svg = [
            '<defs>',
              '<radialGradient id="sb-vignette" cx="50%" cy="42%" r="78%">',
                '<stop offset="0%" stop-color="#3a0820" stop-opacity="0"/>',
                '<stop offset="60%" stop-color="#14010a" stop-opacity=".55"/>',
                '<stop offset="100%" stop-color="#050003" stop-opacity=".95"/>',
              '</radialGradient>',
              '<radialGradient id="sb-paper-g" cx="50%" cy="40%" r="65%">',
                '<stop offset="0%" stop-color="#f4e4c1" stop-opacity=".18"/>',
                '<stop offset="100%" stop-color="#f4e4c1" stop-opacity="0"/>',
              '</radialGradient>',
              '<filter id="sb-brush" x="-10%" y="-10%" width="120%" height="120%">',
                '<feTurbulence type="fractalNoise" baseFrequency="0.022 0.045" numOctaves="2" seed="7" result="t"/>',
                '<feDisplacementMap in="SourceGraphic" in2="t" scale="12" xChannelSelector="R" yChannelSelector="G"/>',
              '</filter>',
              '<filter id="sb-watercolor" x="-30%" y="-30%" width="160%" height="160%">',
                '<feGaussianBlur stdDeviation="5" result="b1"/>',
                '<feTurbulence type="fractalNoise" baseFrequency="0.014" numOctaves="2" seed="4" result="wt"/>',
                '<feDisplacementMap in="b1" in2="wt" scale="26"/>',
                '<feGaussianBlur stdDeviation="3"/>',
              '</filter>',
              '<filter id="sb-soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.8"/></filter>',
              '<radialGradient id="sb-bg"><stop offset="0%" stop-color="#8b1538" stop-opacity=".55"/><stop offset="60%" stop-color="#4a0a2e" stop-opacity=".22"/><stop offset="100%" stop-color="#4a0a2e" stop-opacity="0"/></radialGradient>',
              '<radialGradient id="sb-go"><stop offset="0%" stop-color="#ffd966" stop-opacity=".55"/><stop offset="60%" stop-color="#c47a3a" stop-opacity=".22"/><stop offset="100%" stop-color="#c47a3a" stop-opacity="0"/></radialGradient>',
              '<radialGradient id="sb-vm"><stop offset="0%" stop-color="#c41e3a" stop-opacity=".5"/><stop offset="60%" stop-color="#8b1538" stop-opacity=".2"/><stop offset="100%" stop-color="#8b1538" stop-opacity="0"/></radialGradient>',
              '<radialGradient id="sb-cr"><stop offset="0%" stop-color="#f4e4c1" stop-opacity=".35"/><stop offset="60%" stop-color="#f4e4c1" stop-opacity=".1"/><stop offset="100%" stop-color="#f4e4c1" stop-opacity="0"/></radialGradient>',
              '<radialGradient id="sb-glint-g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff7d4" stop-opacity=".95"/><stop offset="55%" stop-color="#ffd966" stop-opacity=".3"/><stop offset="100%" stop-color="#ffd966" stop-opacity="0"/></radialGradient>',
              '<linearGradient id="sb-sheen-g" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ffd966" stop-opacity="0"/><stop offset="42%" stop-color="#fff7d4" stop-opacity="0"/><stop offset="50%" stop-color="#fff7d4" stop-opacity=".95"/><stop offset="58%" stop-color="#fff7d4" stop-opacity="0"/><stop offset="100%" stop-color="#ffd966" stop-opacity="0"/></linearGradient>',
            '</defs>',
            '<rect width="1600" height="900" fill="#0d0107"/>',
            '<rect class="sb-vignette" width="1600" height="900" fill="url(#sb-vignette)"/>',
            '<rect class="sb-paper"    width="1600" height="900" fill="url(#sb-paper-g)"/>',
            '<g filter="url(#sb-watercolor)">',
              '<ellipse class="sb-bloom sb-b1" cx="420"  cy="380" rx="240" ry="180" fill="url(#sb-bg)"/>',
              '<ellipse class="sb-bloom sb-b2" cx="1180" cy="500" rx="280" ry="200" fill="url(#sb-go)"/>',
              '<ellipse class="sb-bloom sb-b3" cx="850"  cy="280" rx="220" ry="160" fill="url(#sb-cr)"/>',
              '<ellipse class="sb-bloom sb-b4" cx="720"  cy="680" rx="260" ry="170" fill="url(#sb-vm)"/>',
            '</g>',
            '<g filter="url(#sb-brush)">',
              '<path pathLength="1" class="sb-stroke sb-s1" stroke="#0c0006" stroke-width="44" stroke-opacity=".92" d="M 140 200 C 380 320, 640 480, 900 460 S 1320 300, 1480 240"/>',
              '<path pathLength="1" class="sb-stroke sb-s2" stroke="#0c0006" stroke-width="32" stroke-opacity=".82" d="M 200 740 C 480 600, 780 540, 1080 620 S 1380 740, 1500 700"/>',
              '<path pathLength="1" class="sb-stroke sb-s3" stroke="#ffd966" stroke-width="14" stroke-opacity=".9"  d="M 80 540 C 360 460, 660 560, 980 480 S 1360 420, 1560 480"/>',
              '<path pathLength="1" class="sb-stroke sb-s4" stroke="#c47a3a" stroke-width="18" stroke-opacity=".7"  d="M 100 400 C 380 540, 700 380, 1020 540 S 1340 460, 1520 540"/>',
              '<path pathLength="1" class="sb-stroke sb-s5" stroke="#8b1538" stroke-width="10" stroke-opacity=".85" d="M 280 820 C 520 760, 800 820, 1080 780 S 1340 800, 1480 760"/>',
              '<path pathLength="1" class="sb-enso" stroke="#0c0006" stroke-width="20" stroke-opacity=".9" fill="none" d="M 800 460 m -210 0 a 210 210 0 1 1 400 -42 a 210 210 0 0 1 -400 50"/>',
            '</g>',
            '<g fill="#ffd966" filter="url(#sb-soft)">',
              '<circle class="sb-splat sb-d1" cx="380"  cy="430" r="6"   opacity=".85"/>',
              '<circle class="sb-splat sb-d2" cx="640"  cy="290" r="4"   opacity=".75"/>',
              '<circle class="sb-splat sb-d3" cx="900"  cy="520" r="7"   opacity=".85"/>',
              '<circle class="sb-splat sb-d4" cx="1180" cy="380" r="5"   opacity=".65"/>',
              '<circle class="sb-splat sb-d5" cx="1310" cy="610" r="3.5" opacity=".55"/>',
              '<circle class="sb-splat sb-d6" cx="500"  cy="710" r="4.5" opacity=".75"/>',
            '</g>',
            '<g fill="#8b1538" filter="url(#sb-soft)">',
              '<circle class="sb-splat sb-d2" cx="760"  cy="640" r="3.5" opacity=".7"/>',
              '<circle class="sb-splat sb-d4" cx="280"  cy="540" r="4"   opacity=".6"/>',
              '<circle class="sb-splat sb-d6" cx="1050" cy="260" r="3"   opacity=".6"/>',
              '<circle class="sb-splat sb-d8" cx="1240" cy="720" r="3.5" opacity=".55"/>',
            '</g>',
            '<g fill="#f4e4c1" filter="url(#sb-soft)">',
              '<circle class="sb-splat sb-d3" cx="560"  cy="190" r="2.5" opacity=".55"/>',
              '<circle class="sb-splat sb-d5" cx="1100" cy="180" r="2"   opacity=".5"/>',
              '<circle class="sb-splat sb-d7" cx="200"  cy="280" r="2.5" opacity=".5"/>',
            '</g>',
            '<g fill="#ffd966">',
              '<circle class="sb-mote sb-m1" cx="200"  cy="800" r="1.6"/>',
              '<circle class="sb-mote sb-m2" cx="500"  cy="850" r="1.2"/>',
              '<circle class="sb-mote sb-m3" cx="900"  cy="820" r="1.8"/>',
              '<circle class="sb-mote sb-m4" cx="1200" cy="860" r="1.3"/>',
              '<circle class="sb-mote sb-m5" cx="350"  cy="780" r="1.0"/>',
              '<circle class="sb-mote sb-m6" cx="1100" cy="830" r="1.5"/>',
              '<circle class="sb-mote sb-m7" cx="700"  cy="870" r="1.1"/>',
            '</g>',
            '<g class="sb-logo" filter="url(#sb-brush)">',
              '<circle pathLength="1" class="sb-o1" cx="650" cy="460" r="112" stroke="#ffd966" stroke-width="16"/>',
              '<g class="sb-plus" stroke="#ffd966" stroke-width="13" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="414" x2="800" y2="506"/>',
                '<line pathLength="1" x1="754" y1="460" x2="846" y2="460"/>',
              '</g>',
              '<circle pathLength="1" class="sb-o2" cx="950" cy="460" r="112" stroke="#ffd966" stroke-width="16"/>',
            '</g>',
            '<rect class="sb-sheen" x="420" y="320" width="760" height="280" fill="url(#sb-sheen-g)"/>',
            '<circle class="sb-glint" cx="800" cy="460" r="200" fill="url(#sb-glint-g)"/>',
            '<text class="sb-text sb-name" x="800" y="690" text-anchor="middle" fill="#f4e4c1" font-family="Georgia, serif" font-size="48" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="sb-text sb-sub"  x="800" y="744" text-anchor="middle" fill="#d4a0b8" font-family="Georgia, serif" font-size="18" letter-spacing="10">GALERÍA O+O · VALENCIA</text>',
            '<g class="sb-seal">',
              '<rect x="1320" y="700" width="86" height="86" rx="6" fill="#8b1538" filter="url(#sb-brush)"/>',
              '<text x="1363" y="758" text-anchor="middle" fill="#f4e4c1" font-family="Georgia, serif" font-size="32" font-weight="bold" letter-spacing="-2">O+O</text>',
            '</g>'
        ].join('');
        return { css: css, svg: svg, duration: 6400 };
    }

    // ---------- VARIANT 2 — TACHISME (tc-) ----------
    function buildTachisme() {
        var css = [
            '.oo-v-tachisme { background: #f0e8d8; }',
            '.oo-v-tachisme .tc-paper { opacity: 0; animation: tc-fade 1.2s ease forwards; }',
            '@keyframes tc-fade { to { opacity: 1; } }',
            '.oo-v-tachisme .tc-splat { opacity: 0; transform: scale(.2); animation: tc-splat .55s cubic-bezier(.16,1.4,.3,1) forwards; }',
            '.oo-v-tachisme .tc-s1{animation-delay:.40s} .oo-v-tachisme .tc-s2{animation-delay:.55s}',
            '.oo-v-tachisme .tc-s3{animation-delay:.70s} .oo-v-tachisme .tc-s4{animation-delay:.85s}',
            '.oo-v-tachisme .tc-s5{animation-delay:1.00s} .oo-v-tachisme .tc-s6{animation-delay:1.15s}',
            '.oo-v-tachisme .tc-s7{animation-delay:1.30s} .oo-v-tachisme .tc-s8{animation-delay:1.45s}',
            '.oo-v-tachisme .tc-s9{animation-delay:1.60s} .oo-v-tachisme .tc-s10{animation-delay:1.75s}',
            '@keyframes tc-splat { 0%{opacity:0;transform:scale(.2)} 55%{opacity:1;transform:scale(1.2)} 100%{opacity:.94;transform:scale(1)} }',
            '.oo-v-tachisme .tc-drip { opacity: 0; transform-origin: top; transform: scaleY(0); animation: tc-drip .8s cubic-bezier(.3,.8,.4,1) forwards; }',
            '.oo-v-tachisme .tc-d1{animation-delay:1.4s} .oo-v-tachisme .tc-d2{animation-delay:1.55s}',
            '.oo-v-tachisme .tc-d3{animation-delay:1.7s} .oo-v-tachisme .tc-d4{animation-delay:1.85s}',
            '.oo-v-tachisme .tc-d5{animation-delay:2.0s}',
            '@keyframes tc-drip { to { opacity: .9; transform: scaleY(1); } }',
            '.oo-v-tachisme .tc-stroke { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-tachisme .tc-st1 { animation: tc-paint .9s cubic-bezier(.22,.78,.32,1) 2.7s forwards; }',
            '.oo-v-tachisme .tc-st2 { animation: tc-paint .9s cubic-bezier(.22,.78,.32,1) 2.9s forwards; }',
            '.oo-v-tachisme .tc-st3 { animation: tc-paint .8s cubic-bezier(.22,.78,.32,1) 3.1s forwards; }',
            '.oo-v-tachisme .tc-st4 { animation: tc-paint .8s cubic-bezier(.22,.78,.32,1) 3.3s forwards; }',
            '@keyframes tc-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:1;stroke-dashoffset:0} }',
            '.oo-v-tachisme .tc-logo path, .oo-v-tachisme .tc-logo circle, .oo-v-tachisme .tc-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-tachisme .tc-o1 { animation: tc-paint .9s cubic-bezier(.22,.78,.32,1) 3.6s forwards; }',
            '.oo-v-tachisme .tc-plus { animation: tc-paint .4s cubic-bezier(.22,.78,.32,1) 4.1s forwards; }',
            '.oo-v-tachisme .tc-o2 { animation: tc-paint .9s cubic-bezier(.22,.78,.32,1) 4.2s forwards; }',
            '.oo-v-tachisme .tc-text { opacity: 0; transform: translateY(12px); animation: tc-rise .9s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-tachisme .tc-name { animation-delay: 4.5s; } .oo-v-tachisme .tc-sub { animation-delay: 4.8s; }',
            '@keyframes tc-rise { to { opacity: 1; transform: translateY(0); } }',
            '.oo-v-tachisme .tc-seal { opacity: 0; transform: scale(.3) rotate(-8deg); animation: tc-seal .6s cubic-bezier(.15,1.6,.3,1) 5.05s forwards; }',
            '@keyframes tc-seal { 0%{opacity:0;transform:scale(.3) rotate(-8deg)} 55%{opacity:1;transform:scale(1.1) rotate(-8deg)} 100%{opacity:.94;transform:scale(1) rotate(-8deg)} }'
        ].join('\n');
        var svg = [
            '<defs>',
              '<filter id="tc-paper-tx" x="0%" y="0%" width="100%" height="100%">',
                '<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="11"/>',
                '<feColorMatrix values="0 0 0 0 0.22  0 0 0 0 0.18  0 0 0 0 0.14  0 0 0 0.04 0"/>',
              '</filter>',
              '<filter id="tc-rough" x="-10%" y="-10%" width="120%" height="120%">',
                '<feTurbulence type="fractalNoise" baseFrequency="0.04 0.06" numOctaves="2" seed="9" result="t"/>',
                '<feDisplacementMap in="SourceGraphic" in2="t" scale="14"/>',
              '</filter>',
            '</defs>',
            '<rect width="1600" height="900" fill="#f0e8d8"/>',
            '<rect class="tc-paper" width="1600" height="900" filter="url(#tc-paper-tx)"/>',
            '<g filter="url(#tc-rough)">',
              '<circle class="tc-splat tc-s1"  cx="280"  cy="220" r="78" fill="#0b2a8a"/>',
              '<circle class="tc-splat tc-s2"  cx="1340" cy="300" r="64" fill="#d62828"/>',
              '<circle class="tc-splat tc-s3"  cx="850"  cy="180" r="50" fill="#f5cc00"/>',
              '<circle class="tc-splat tc-s4"  cx="480"  cy="560" r="90" fill="#d62828"/>',
              '<circle class="tc-splat tc-s5"  cx="1180" cy="640" r="60" fill="#0b2a8a"/>',
              '<circle class="tc-splat tc-s6"  cx="380"  cy="720" r="46" fill="#0a0a0a"/>',
              '<circle class="tc-splat tc-s7"  cx="1020" cy="340" r="42" fill="#0a0a0a"/>',
              '<circle class="tc-splat tc-s8"  cx="180"  cy="400" r="38" fill="#f5cc00"/>',
              '<circle class="tc-splat tc-s9"  cx="1440" cy="500" r="44" fill="#f5cc00"/>',
              '<circle class="tc-splat tc-s10" cx="700"  cy="380" r="34" fill="#d62828"/>',
            '</g>',
            '<g>',
              '<rect class="tc-drip tc-d1" x="276"  y="298" width="8" height="120" fill="#0b2a8a"/>',
              '<rect class="tc-drip tc-d2" x="1336" y="364" width="6" height="90"  fill="#d62828"/>',
              '<rect class="tc-drip tc-d3" x="476"  y="650" width="8" height="140" fill="#d62828"/>',
              '<rect class="tc-drip tc-d4" x="1178" y="700" width="6" height="100" fill="#0b2a8a"/>',
              '<rect class="tc-drip tc-d5" x="380"  y="766" width="5" height="80"  fill="#0a0a0a"/>',
            '</g>',
            '<g filter="url(#tc-rough)">',
              '<path class="tc-stroke tc-st1" pathLength="1" stroke="#0a0a0a" stroke-width="6" d="M 100 460 C 400 420, 800 500, 1200 440 S 1500 460, 1560 480"/>',
              '<path class="tc-stroke tc-st2" pathLength="1" stroke="#0a0a0a" stroke-width="4" d="M 80 800 C 360 760, 700 820, 1000 780 S 1380 800, 1540 780"/>',
              '<path class="tc-stroke tc-st3" pathLength="1" stroke="#d62828" stroke-width="3" d="M 200 280 L 500 240 L 800 260 L 1100 230 L 1400 250"/>',
              '<path class="tc-stroke tc-st4" pathLength="1" stroke="#0b2a8a" stroke-width="3" d="M 120 600 L 460 620 L 760 580 L 1060 610 L 1380 590"/>',
            '</g>',
            '<g class="tc-logo">',
              '<circle class="tc-o1" pathLength="1" cx="650" cy="460" r="100" stroke="#0a0a0a" stroke-width="14"/>',
              '<g class="tc-plus" stroke="#0a0a0a" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="418" x2="800" y2="502"/>',
                '<line pathLength="1" x1="758" y1="460" x2="842" y2="460"/>',
              '</g>',
              '<circle class="tc-o2" pathLength="1" cx="950" cy="460" r="100" stroke="#0a0a0a" stroke-width="14"/>',
            '</g>',
            '<text class="tc-text tc-name" x="800" y="690" text-anchor="middle" fill="#0a0a0a" font-family="Georgia, serif" font-size="46" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="tc-text tc-sub"  x="800" y="740" text-anchor="middle" fill="#444444" font-family="Georgia, serif" font-size="18" letter-spacing="10">GALERÍA O+O · VALENCIA</text>',
            '<g class="tc-seal">',
              '<rect x="1320" y="700" width="86" height="86" rx="6" fill="#d62828" filter="url(#tc-rough)"/>',
              '<text x="1363" y="758" text-anchor="middle" fill="#f4e4c1" font-family="Georgia, serif" font-size="32" font-weight="bold" letter-spacing="-2">O+O</text>',
            '</g>'
        ].join('');
        return { css: css, svg: svg, duration: 5800 };
    }

    // ---------- VARIANT 3 — ROTHKO COLOR FIELD (rk-) ----------
    function buildRothko() {
        var css = [
            '.oo-v-rothko { background: #1e0608; }',
            '.oo-v-rothko .rk-field { opacity: 0; animation: rk-field-in 1.6s cubic-bezier(.4,0,.3,1) forwards, rk-breathe 5s ease-in-out 2s infinite; }',
            '.oo-v-rothko .rk-f1 { animation-delay: .2s, 2s; }',
            '.oo-v-rothko .rk-f2 { animation-delay: 1.4s, 2.4s; }',
            '.oo-v-rothko .rk-f3 { animation-delay: 2.6s, 2.8s; }',
            '@keyframes rk-field-in { 0%{opacity:0;transform:scale(.94)} 100%{opacity:.92;transform:scale(1)} }',
            '@keyframes rk-breathe { 0%,100%{filter:brightness(1)} 50%{filter:brightness(1.08)} }',
            '.oo-v-rothko .rk-logo path, .oo-v-rothko .rk-logo circle, .oo-v-rothko .rk-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-rothko .rk-o1 { animation: rk-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.0s forwards; }',
            '.oo-v-rothko .rk-plus { animation: rk-paint .5s cubic-bezier(.22,.78,.32,1) 4.5s forwards; }',
            '.oo-v-rothko .rk-o2 { animation: rk-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.65s forwards; }',
            '@keyframes rk-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:.95;stroke-dashoffset:0} }',
            '.oo-v-rothko .rk-text { opacity: 0; transform: translateY(12px); animation: rk-rise 1.0s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-rothko .rk-name { animation-delay: 4.85s; }',
            '.oo-v-rothko .rk-sub { animation-delay: 5.15s; }',
            '@keyframes rk-rise { to { opacity: 1; transform: translateY(0); } }'
        ].join('\n');
        var svg = [
            '<defs>',
              '<filter id="rk-fuzzy" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="22"/></filter>',
              '<filter id="rk-fuzzy-soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10"/></filter>',
            '</defs>',
            '<rect width="1600" height="900" fill="#1e0608"/>',
            '<g filter="url(#rk-fuzzy)">',
              '<rect class="rk-field rk-f1" x="160"  y="110" width="1280" height="240" fill="#c0492c"/>',
              '<rect class="rk-field rk-f2" x="140"  y="390" width="1320" height="300" fill="#6b1d1d"/>',
              '<rect class="rk-field rk-f3" x="200"  y="710" width="1200" height="130" fill="#e8a449"/>',
            '</g>',
            '<g class="rk-logo">',
              '<circle class="rk-o1" pathLength="1" cx="650" cy="540" r="108" stroke="#f4e4c1" stroke-width="14"/>',
              '<g class="rk-plus" stroke="#f4e4c1" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="498" x2="800" y2="582"/>',
                '<line pathLength="1" x1="758" y1="540" x2="842" y2="540"/>',
              '</g>',
              '<circle class="rk-o2" pathLength="1" cx="950" cy="540" r="108" stroke="#f4e4c1" stroke-width="14"/>',
            '</g>',
            '<text class="rk-text rk-name" x="800" y="760" text-anchor="middle" fill="#f4e4c1" font-family="Georgia, serif" font-size="42" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="rk-text rk-sub"  x="800" y="808" text-anchor="middle" fill="#e8a449" font-family="Georgia, serif" font-size="17" letter-spacing="10">GALERÍA O+O · VALENCIA</text>'
        ].join('');
        return { css: css, svg: svg, duration: 6000 };
    }

    // ---------- VARIANT 4 — AURORA RIBBONS (ar-) ----------
    function buildAurora() {
        var css = [
            '.oo-v-aurora { background: radial-gradient(ellipse at 50% 50%, #0a0a30 0%, #050015 60%, #02000a 100%); }',
            '.oo-v-aurora .ar-star { opacity: 0; animation: ar-twinkle 3s ease-in-out infinite; }',
            '@keyframes ar-twinkle { 0%,100%{opacity:.2} 50%{opacity:.95} }',
            '.oo-v-aurora .ar-s1{animation-delay:.0s} .oo-v-aurora .ar-s2{animation-delay:.3s}',
            '.oo-v-aurora .ar-s3{animation-delay:.6s} .oo-v-aurora .ar-s4{animation-delay:.9s}',
            '.oo-v-aurora .ar-s5{animation-delay:1.2s} .oo-v-aurora .ar-s6{animation-delay:1.5s}',
            '.oo-v-aurora .ar-s7{animation-delay:1.8s} .oo-v-aurora .ar-s8{animation-delay:2.1s}',
            '.oo-v-aurora .ar-ribbon { opacity: 0; transform: translateX(-1600px); animation: ar-sweep 3.6s cubic-bezier(.25,.8,.3,1) forwards; }',
            '.oo-v-aurora .ar-r1 { animation-delay: .3s; }',
            '.oo-v-aurora .ar-r2 { animation-delay: .8s; }',
            '.oo-v-aurora .ar-r3 { animation-delay: 1.3s; }',
            '.oo-v-aurora .ar-r4 { animation-delay: 1.8s; }',
            '@keyframes ar-sweep { 0%{opacity:0;transform:translateX(-1600px)} 25%{opacity:.85} 75%{opacity:.85} 100%{opacity:0;transform:translateX(800px)} }',
            '.oo-v-aurora .ar-logo path, .oo-v-aurora .ar-logo circle, .oo-v-aurora .ar-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-aurora .ar-o1 { animation: ar-paint 1.0s cubic-bezier(.22,.78,.32,1) 3.4s forwards; }',
            '.oo-v-aurora .ar-plus { animation: ar-paint .5s cubic-bezier(.22,.78,.32,1) 4.0s forwards; }',
            '.oo-v-aurora .ar-o2 { animation: ar-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.15s forwards; }',
            '@keyframes ar-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:1;stroke-dashoffset:0} }',
            '.oo-v-aurora .ar-text { opacity: 0; transform: translateY(12px); animation: ar-rise 1.0s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-aurora .ar-name { animation-delay: 4.55s; }',
            '.oo-v-aurora .ar-sub  { animation-delay: 4.85s; }',
            '@keyframes ar-rise { to { opacity: 1; transform: translateY(0); } }'
        ].join('\n');
        var svg = [
            '<defs>',
              '<linearGradient id="ar-g1" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#1ee996" stop-opacity="0"/><stop offset="50%" stop-color="#1ee996" stop-opacity=".65"/><stop offset="100%" stop-color="#1ee996" stop-opacity="0"/></linearGradient>',
              '<linearGradient id="ar-g2" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#b649ff" stop-opacity="0"/><stop offset="50%" stop-color="#b649ff" stop-opacity=".6"/><stop offset="100%" stop-color="#b649ff" stop-opacity="0"/></linearGradient>',
              '<linearGradient id="ar-g3" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#2af5ff" stop-opacity="0"/><stop offset="50%" stop-color="#2af5ff" stop-opacity=".55"/><stop offset="100%" stop-color="#2af5ff" stop-opacity="0"/></linearGradient>',
              '<linearGradient id="ar-g4" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#ff4fa8" stop-opacity="0"/><stop offset="50%" stop-color="#ff4fa8" stop-opacity=".55"/><stop offset="100%" stop-color="#ff4fa8" stop-opacity="0"/></linearGradient>',
              '<filter id="ar-blur"><feGaussianBlur stdDeviation="18"/></filter>',
            '</defs>',
            '<rect width="1600" height="900" fill="#040013"/>',
            '<g fill="#ffffff">',
              '<circle class="ar-star ar-s1" cx="120"  cy="180" r="1.5"/>',
              '<circle class="ar-star ar-s2" cx="340"  cy="100" r="1.2"/>',
              '<circle class="ar-star ar-s3" cx="600"  cy="80"  r="1.6"/>',
              '<circle class="ar-star ar-s4" cx="900"  cy="150" r="1.0"/>',
              '<circle class="ar-star ar-s5" cx="1180" cy="90"  r="1.4"/>',
              '<circle class="ar-star ar-s6" cx="1440" cy="220" r="1.2"/>',
              '<circle class="ar-star ar-s7" cx="220"  cy="780" r="1.0"/>',
              '<circle class="ar-star ar-s8" cx="1380" cy="820" r="1.2"/>',
            '</g>',
            '<g filter="url(#ar-blur)">',
              '<path class="ar-ribbon ar-r1" d="M 0 220 C 400 150, 800 320, 1200 250 S 1600 280, 1700 240 L 1700 340 C 1300 410, 900 260, 500 340 S 100 320, 0 360 Z" fill="url(#ar-g1)"/>',
              '<path class="ar-ribbon ar-r2" d="M 0 360 C 400 290, 800 460, 1200 390 S 1600 420, 1700 380 L 1700 480 C 1300 550, 900 400, 500 480 S 100 460, 0 500 Z" fill="url(#ar-g2)"/>',
              '<path class="ar-ribbon ar-r3" d="M 0 540 C 400 470, 800 640, 1200 570 S 1600 600, 1700 560 L 1700 660 C 1300 730, 900 580, 500 660 S 100 640, 0 680 Z" fill="url(#ar-g3)"/>',
              '<path class="ar-ribbon ar-r4" d="M 0 720 C 400 650, 800 820, 1200 750 S 1600 780, 1700 740 L 1700 840 C 1300 910, 900 760, 500 840 S 100 820, 0 860 Z" fill="url(#ar-g4)"/>',
            '</g>',
            '<g class="ar-logo">',
              '<circle class="ar-o1" pathLength="1" cx="650" cy="460" r="110" stroke="#ffffff" stroke-width="14"/>',
              '<g class="ar-plus" stroke="#ffffff" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="418" x2="800" y2="502"/>',
                '<line pathLength="1" x1="758" y1="460" x2="842" y2="460"/>',
              '</g>',
              '<circle class="ar-o2" pathLength="1" cx="950" cy="460" r="110" stroke="#ffffff" stroke-width="14"/>',
            '</g>',
            '<text class="ar-text ar-name" x="800" y="690" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="46" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="ar-text ar-sub"  x="800" y="740" text-anchor="middle" fill="#2af5ff" font-family="Georgia, serif" font-size="17" letter-spacing="10">GALERÍA O+O · VALENCIA</text>'
        ].join('');
        return { css: css, svg: svg, duration: 5800 };
    }

    // ---------- VARIANT 5 — CONSTELLATION (cn-) ----------
    function buildConstellation() {
        var css = [
            '.oo-v-constellation { background: radial-gradient(ellipse at 50% 45%, #0a0a3a 0%, #050015 60%, #02000a 100%); }',
            '.oo-v-constellation .cn-dot { opacity: 0; transform: scale(0); animation: cn-dot .5s cubic-bezier(.16,1.4,.3,1) forwards; }',
            '@keyframes cn-dot { 0%{opacity:0;transform:scale(0)} 60%{opacity:1;transform:scale(1.4)} 100%{opacity:.95;transform:scale(1)} }',
            '.oo-v-constellation .cn-line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; animation: cn-line 1.0s cubic-bezier(.4,0,.2,1) forwards; }',
            '@keyframes cn-line { 0%{opacity:0;stroke-dashoffset:1} 15%{opacity:.85} 100%{opacity:.7;stroke-dashoffset:0} }',
            '.oo-v-constellation .cn-meteor { opacity: 0; transform: translate(-200px, -100px); animation: cn-meteor 1.4s cubic-bezier(.4,0,.6,1) 1.6s forwards; }',
            '@keyframes cn-meteor { 0%{opacity:0;transform:translate(-200px,-100px)} 25%{opacity:1} 75%{opacity:1} 100%{opacity:0;transform:translate(900px,500px)} }',
            '.oo-v-constellation .cn-logo path, .oo-v-constellation .cn-logo circle, .oo-v-constellation .cn-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-constellation .cn-o1 { animation: cn-paint 1.0s cubic-bezier(.22,.78,.32,1) 3.4s forwards; }',
            '.oo-v-constellation .cn-plus { animation: cn-paint .5s cubic-bezier(.22,.78,.32,1) 4.0s forwards; }',
            '.oo-v-constellation .cn-o2 { animation: cn-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.15s forwards; }',
            '@keyframes cn-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:1;stroke-dashoffset:0} }',
            '.oo-v-constellation .cn-text { opacity: 0; transform: translateY(12px); animation: cn-rise 1.0s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-constellation .cn-name { animation-delay: 4.55s; }',
            '.oo-v-constellation .cn-sub  { animation-delay: 4.85s; }',
            '@keyframes cn-rise { to { opacity: 1; transform: translateY(0); } }'
        ].join('\n');
        // Build dots with cn-d{n} delay classes computed inline
        var dotCss = [];
        var i;
        for (i = 1; i <= 22; i++) {
            dotCss.push('.oo-v-constellation .cn-d' + i + ' { animation-delay: ' + (0.1 + i * 0.06).toFixed(2) + 's; }');
        }
        var lineCss = [];
        for (i = 1; i <= 10; i++) {
            lineCss.push('.oo-v-constellation .cn-l' + i + ' { animation-delay: ' + (1.6 + i * 0.12).toFixed(2) + 's; }');
        }
        css = css + '\n' + dotCss.join('\n') + '\n' + lineCss.join('\n');

        var svg = [
            '<defs>',
              '<filter id="cn-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>',
              '<radialGradient id="cn-meteor-g" cx="100%" cy="0%" r="100%"><stop offset="0%" stop-color="#ffffff" stop-opacity=".95"/><stop offset="60%" stop-color="#ffd966" stop-opacity=".35"/><stop offset="100%" stop-color="#ffd966" stop-opacity="0"/></radialGradient>',
            '</defs>',
            '<rect width="1600" height="900" fill="url(#cn-bg)"/>',
            // Star dots forming the constellation; 22 dots positioned around the canvas
            '<g fill="#ffd966" filter="url(#cn-glow)">',
              '<circle class="cn-dot cn-d1"  cx="380"  cy="380" r="5"/>',
              '<circle class="cn-dot cn-d2"  cx="520"  cy="320" r="4"/>',
              '<circle class="cn-dot cn-d3"  cx="660"  cy="280" r="6"/>',
              '<circle class="cn-dot cn-d4"  cx="800"  cy="260" r="5"/>',
              '<circle class="cn-dot cn-d5"  cx="940"  cy="280" r="6"/>',
              '<circle class="cn-dot cn-d6"  cx="1080" cy="320" r="4"/>',
              '<circle class="cn-dot cn-d7"  cx="1220" cy="380" r="5"/>',
              '<circle class="cn-dot cn-d8"  cx="1240" cy="500" r="5"/>',
              '<circle class="cn-dot cn-d9"  cx="1180" cy="620" r="4"/>',
              '<circle class="cn-dot cn-d10" cx="1040" cy="700" r="5"/>',
              '<circle class="cn-dot cn-d11" cx="880"  cy="720" r="6"/>',
              '<circle class="cn-dot cn-d12" cx="720"  cy="720" r="5"/>',
              '<circle class="cn-dot cn-d13" cx="560"  cy="700" r="4"/>',
              '<circle class="cn-dot cn-d14" cx="420"  cy="620" r="5"/>',
              '<circle class="cn-dot cn-d15" cx="360"  cy="500" r="4"/>',
              '<circle class="cn-dot cn-d16" cx="200"  cy="220" r="3"/>',
              '<circle class="cn-dot cn-d17" cx="1400" cy="220" r="3"/>',
              '<circle class="cn-dot cn-d18" cx="120"  cy="600" r="3"/>',
              '<circle class="cn-dot cn-d19" cx="1480" cy="600" r="3"/>',
              '<circle class="cn-dot cn-d20" cx="800"  cy="120" r="3"/>',
              '<circle class="cn-dot cn-d21" cx="800"  cy="800" r="3"/>',
              '<circle class="cn-dot cn-d22" cx="800"  cy="460" r="4"/>',
            '</g>',
            // Connecting lines drawing the constellation outline (ring around centre)
            '<g stroke="#ffd966" stroke-width="1.5" stroke-opacity=".7">',
              '<line class="cn-line cn-l1"  pathLength="1" x1="380"  y1="380" x2="520"  y2="320"/>',
              '<line class="cn-line cn-l2"  pathLength="1" x1="520"  y1="320" x2="660"  y2="280"/>',
              '<line class="cn-line cn-l3"  pathLength="1" x1="660"  y1="280" x2="800"  y2="260"/>',
              '<line class="cn-line cn-l4"  pathLength="1" x1="800"  y1="260" x2="940"  y2="280"/>',
              '<line class="cn-line cn-l5"  pathLength="1" x1="940"  y1="280" x2="1080" y2="320"/>',
              '<line class="cn-line cn-l6"  pathLength="1" x1="1080" y1="320" x2="1220" y2="380"/>',
              '<line class="cn-line cn-l7"  pathLength="1" x1="1220" y1="380" x2="1180" y2="620"/>',
              '<line class="cn-line cn-l8"  pathLength="1" x1="1040" y1="700" x2="880"  y2="720"/>',
              '<line class="cn-line cn-l9"  pathLength="1" x1="720"  y1="720" x2="560"  y2="700"/>',
              '<line class="cn-line cn-l10" pathLength="1" x1="420"  y1="620" x2="380"  y2="380"/>',
            '</g>',
            // Meteor streak
            '<rect class="cn-meteor" x="0" y="0" width="220" height="3" fill="url(#cn-meteor-g)" transform="rotate(28)"/>',
            // O+O logo
            '<g class="cn-logo">',
              '<circle class="cn-o1" pathLength="1" cx="650" cy="460" r="100" stroke="#ffd966" stroke-width="14"/>',
              '<g class="cn-plus" stroke="#ffd966" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="418" x2="800" y2="502"/>',
                '<line pathLength="1" x1="758" y1="460" x2="842" y2="460"/>',
              '</g>',
              '<circle class="cn-o2" pathLength="1" cx="950" cy="460" r="100" stroke="#ffd966" stroke-width="14"/>',
            '</g>',
            '<text class="cn-text cn-name" x="800" y="690" text-anchor="middle" fill="#f4e4c1" font-family="Georgia, serif" font-size="46" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="cn-text cn-sub"  x="800" y="740" text-anchor="middle" fill="#ffd966" font-family="Georgia, serif" font-size="17" letter-spacing="10">GALERÍA O+O · VALENCIA</text>'
        ].join('');
        return { css: css, svg: svg, duration: 5800 };
    }

    // ---------- VARIANT 6 — KINTSUGI (ki-) ----------
    function buildKintsugi() {
        var css = [
            '.oo-v-kintsugi { background: #efe4cf; }',
            '.oo-v-kintsugi .ki-paper { opacity: 0; animation: ki-fade 1.2s ease forwards; }',
            '@keyframes ki-fade { to { opacity: 1; } }',
            '.oo-v-kintsugi .ki-crack { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-kintsugi .ki-c1 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) .6s forwards; }',
            '.oo-v-kintsugi .ki-c2 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) .85s forwards; }',
            '.oo-v-kintsugi .ki-c3 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 1.10s forwards; }',
            '.oo-v-kintsugi .ki-c4 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 1.35s forwards; }',
            '.oo-v-kintsugi .ki-c5 { animation: ki-paint .9s cubic-bezier(.22,.78,.32,1) 1.60s forwards; }',
            '@keyframes ki-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:.9;stroke-dashoffset:0} }',
            '.oo-v-kintsugi .ki-gold { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-kintsugi .ki-g1 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 2.2s forwards; }',
            '.oo-v-kintsugi .ki-g2 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 2.45s forwards; }',
            '.oo-v-kintsugi .ki-g3 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 2.70s forwards; }',
            '.oo-v-kintsugi .ki-g4 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 2.95s forwards; }',
            '.oo-v-kintsugi .ki-g5 { animation: ki-paint .9s cubic-bezier(.22,.78,.32,1) 3.20s forwards; }',
            '.oo-v-kintsugi .ki-dust { opacity: 0; transform: scale(.4); animation: ki-dust 1.2s cubic-bezier(.16,.84,.44,1) forwards; }',
            '.oo-v-kintsugi .ki-x1{animation-delay:3.0s} .oo-v-kintsugi .ki-x2{animation-delay:3.15s}',
            '.oo-v-kintsugi .ki-x3{animation-delay:3.30s} .oo-v-kintsugi .ki-x4{animation-delay:3.45s}',
            '.oo-v-kintsugi .ki-x5{animation-delay:3.60s} .oo-v-kintsugi .ki-x6{animation-delay:3.75s}',
            '@keyframes ki-dust { 0%{opacity:0;transform:scale(.4)} 60%{opacity:.9;transform:scale(1.2)} 100%{opacity:.7;transform:scale(1)} }',
            '.oo-v-kintsugi .ki-logo path, .oo-v-kintsugi .ki-logo circle, .oo-v-kintsugi .ki-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-kintsugi .ki-o1 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 3.8s forwards; }',
            '.oo-v-kintsugi .ki-plus { animation: ki-paint .5s cubic-bezier(.22,.78,.32,1) 4.3s forwards; }',
            '.oo-v-kintsugi .ki-o2 { animation: ki-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.45s forwards; }',
            '.oo-v-kintsugi .ki-text { opacity: 0; transform: translateY(12px); animation: ki-rise 1.0s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-kintsugi .ki-name { animation-delay: 4.85s; } .oo-v-kintsugi .ki-sub { animation-delay: 5.15s; }',
            '@keyframes ki-rise { to { opacity: 1; transform: translateY(0); } }'
        ].join('\n');
        var svg = [
            '<defs>',
              '<filter id="ki-paper-tx" x="0%" y="0%" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="2" seed="13"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.36  0 0 0 0 0.25  0 0 0 0.05 0"/></filter>',
              '<filter id="ki-rough" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.05 0.08" numOctaves="2" seed="7" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="5"/></filter>',
              '<linearGradient id="ki-gold-g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f6d27a"/><stop offset="50%" stop-color="#d4a82a"/><stop offset="100%" stop-color="#b08818"/></linearGradient>',
            '</defs>',
            '<rect width="1600" height="900" fill="#efe4cf"/>',
            '<rect class="ki-paper" width="1600" height="900" filter="url(#ki-paper-tx)"/>',
            // Slate crack paths
            '<g filter="url(#ki-rough)">',
              '<path class="ki-crack ki-c1" pathLength="1" stroke="#3a3a3a" stroke-width="3" d="M 0 280 L 220 320 L 360 240 L 580 360 L 800 300 L 1020 380 L 1240 280 L 1600 320"/>',
              '<path class="ki-crack ki-c2" pathLength="1" stroke="#3a3a3a" stroke-width="3" d="M 0 620 L 240 580 L 460 660 L 660 580 L 880 660 L 1100 580 L 1340 660 L 1600 600"/>',
              '<path class="ki-crack ki-c3" pathLength="1" stroke="#3a3a3a" stroke-width="2.5" d="M 460 0 L 480 180 L 420 300 L 500 460 L 440 620 L 520 780 L 480 900"/>',
              '<path class="ki-crack ki-c4" pathLength="1" stroke="#3a3a3a" stroke-width="2.5" d="M 1140 0 L 1100 200 L 1180 360 L 1100 520 L 1180 700 L 1120 900"/>',
              '<path class="ki-crack ki-c5" pathLength="1" stroke="#3a3a3a" stroke-width="2" d="M 800 200 L 760 380 L 820 520 L 780 680"/>',
            '</g>',
            // Gold mending lines overlaid (slightly offset, slimmer)
            '<g filter="url(#ki-rough)">',
              '<path class="ki-gold ki-g1" pathLength="1" stroke="url(#ki-gold-g)" stroke-width="4.5" d="M 0 282 L 220 322 L 360 242 L 580 362 L 800 302 L 1020 382 L 1240 282 L 1600 322"/>',
              '<path class="ki-gold ki-g2" pathLength="1" stroke="url(#ki-gold-g)" stroke-width="4.5" d="M 0 622 L 240 582 L 460 662 L 660 582 L 880 662 L 1100 582 L 1340 662 L 1600 602"/>',
              '<path class="ki-gold ki-g3" pathLength="1" stroke="url(#ki-gold-g)" stroke-width="4" d="M 462 0 L 482 180 L 422 300 L 502 460 L 442 620 L 522 780 L 482 900"/>',
              '<path class="ki-gold ki-g4" pathLength="1" stroke="url(#ki-gold-g)" stroke-width="4" d="M 1142 0 L 1102 200 L 1182 360 L 1102 520 L 1182 700 L 1122 900"/>',
              '<path class="ki-gold ki-g5" pathLength="1" stroke="url(#ki-gold-g)" stroke-width="3" d="M 802 200 L 762 380 L 822 520 L 782 680"/>',
            '</g>',
            // Gold dust around crack intersections
            '<g fill="#d4a82a">',
              '<circle class="ki-dust ki-x1" cx="360"  cy="240" r="3"/>',
              '<circle class="ki-dust ki-x2" cx="800"  cy="300" r="3"/>',
              '<circle class="ki-dust ki-x3" cx="500"  cy="460" r="3"/>',
              '<circle class="ki-dust ki-x4" cx="1100" cy="520" r="3"/>',
              '<circle class="ki-dust ki-x5" cx="660"  cy="580" r="3"/>',
              '<circle class="ki-dust ki-x6" cx="1100" cy="580" r="3"/>',
            '</g>',
            // O+O logo in slate, with gold inner accent
            '<g class="ki-logo">',
              '<circle class="ki-o1" pathLength="1" cx="650" cy="460" r="108" stroke="#3a3a3a" stroke-width="14"/>',
              '<g class="ki-plus" stroke="#3a3a3a" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="418" x2="800" y2="502"/>',
                '<line pathLength="1" x1="758" y1="460" x2="842" y2="460"/>',
              '</g>',
              '<circle class="ki-o2" pathLength="1" cx="950" cy="460" r="108" stroke="#3a3a3a" stroke-width="14"/>',
            '</g>',
            '<text class="ki-text ki-name" x="800" y="690" text-anchor="middle" fill="#3a3a3a" font-family="Georgia, serif" font-size="46" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="ki-text ki-sub"  x="800" y="740" text-anchor="middle" fill="#a08a55" font-family="Georgia, serif" font-size="17" letter-spacing="10">GALERÍA O+O · VALENCIA</text>'
        ].join('');
        return { css: css, svg: svg, duration: 5800 };
    }

    // ---------- VARIANT 7 — BAUHAUS (bh-) ----------
    function buildBauhaus() {
        var css = [
            '.oo-v-bauhaus { background: #f5efe0; }',
            '.oo-v-bauhaus .bh-paper { opacity: 0; animation: bh-fade .8s ease forwards; }',
            '@keyframes bh-fade { to { opacity: 1; } }',
            '.oo-v-bauhaus .bh-circ { opacity: 0; transform: scale(.2); animation: bh-pop .9s cubic-bezier(.16,1.3,.3,1) .4s forwards; }',
            '@keyframes bh-pop { 0%{opacity:0;transform:scale(.2)} 60%{opacity:1;transform:scale(1.08)} 100%{opacity:1;transform:scale(1)} }',
            '.oo-v-bauhaus .bh-tri { opacity: 0; transform: translateY(-200px); animation: bh-drop .9s cubic-bezier(.32,.94,.4,1) 1.0s forwards; }',
            '@keyframes bh-drop { to { opacity: 1; transform: translateY(0); } }',
            '.oo-v-bauhaus .bh-rect { opacity: 0; transform: translateX(220px); animation: bh-slide .9s cubic-bezier(.32,.94,.4,1) 1.4s forwards; }',
            '@keyframes bh-slide { to { opacity: 1; transform: translateX(0); } }',
            '.oo-v-bauhaus .bh-stroke { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-bauhaus .bh-l1 { animation: bh-paint .8s cubic-bezier(.22,.78,.32,1) 1.8s forwards; }',
            '.oo-v-bauhaus .bh-l2 { animation: bh-paint .8s cubic-bezier(.22,.78,.32,1) 2.05s forwards; }',
            '.oo-v-bauhaus .bh-l3 { animation: bh-paint .7s cubic-bezier(.22,.78,.32,1) 2.30s forwards; }',
            '.oo-v-bauhaus .bh-l4 { animation: bh-paint .7s cubic-bezier(.22,.78,.32,1) 2.50s forwards; }',
            '@keyframes bh-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:1;stroke-dashoffset:0} }',
            '.oo-v-bauhaus .bh-accent { opacity: 0; transform: scale(0); animation: bh-pop .5s cubic-bezier(.16,1.4,.3,1) forwards; }',
            '.oo-v-bauhaus .bh-a1{animation-delay:2.7s} .oo-v-bauhaus .bh-a2{animation-delay:2.85s}',
            '.oo-v-bauhaus .bh-a3{animation-delay:3.0s} .oo-v-bauhaus .bh-a4{animation-delay:3.15s}',
            '.oo-v-bauhaus .bh-a5{animation-delay:3.3s}',
            '.oo-v-bauhaus .bh-logo path, .oo-v-bauhaus .bh-logo circle, .oo-v-bauhaus .bh-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-bauhaus .bh-o1 { animation: bh-paint 1.0s cubic-bezier(.22,.78,.32,1) 3.5s forwards; }',
            '.oo-v-bauhaus .bh-plus { animation: bh-paint .5s cubic-bezier(.22,.78,.32,1) 4.1s forwards; }',
            '.oo-v-bauhaus .bh-o2 { animation: bh-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.25s forwards; }',
            '.oo-v-bauhaus .bh-text { opacity: 0; transform: translateY(12px); animation: bh-rise 1.0s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-bauhaus .bh-name { animation-delay: 4.6s; } .oo-v-bauhaus .bh-sub { animation-delay: 4.9s; }',
            '@keyframes bh-rise { to { opacity: 1; transform: translateY(0); } }'
        ].join('\n');
        var svg = [
            '<rect width="1600" height="900" fill="#f5efe0"/>',
            '<rect class="bh-paper" width="1600" height="900" fill="#faf3e3"/>',
            // Large yellow circle (Kandinsky)
            '<circle class="bh-circ" cx="320" cy="280" r="180" fill="#fcd91b"/>',
            // Red triangle (descends from above)
            '<polygon class="bh-tri" points="1260,200 1440,520 1080,520" fill="#c8232c"/>',
            // Blue rectangle (slides in from right)
            '<rect class="bh-rect" x="1080" y="640" width="220" height="180" fill="#1955a6"/>',
            // Black lines crisscross
            '<g>',
              '<line class="bh-stroke bh-l1" pathLength="1" x1="80"   y1="80"  x2="1520" y2="120" stroke="#0a0a0a" stroke-width="3"/>',
              '<line class="bh-stroke bh-l2" pathLength="1" x1="80"   y1="820" x2="1520" y2="780" stroke="#0a0a0a" stroke-width="3"/>',
              '<line class="bh-stroke bh-l3" pathLength="1" x1="200"  y1="600" x2="1400" y2="200" stroke="#0a0a0a" stroke-width="2"/>',
              '<line class="bh-stroke bh-l4" pathLength="1" x1="240"  y1="180" x2="1380" y2="640" stroke="#0a0a0a" stroke-width="2"/>',
            '</g>',
            // Accent shapes
            '<g>',
              '<circle class="bh-accent bh-a1" cx="540"  cy="160" r="14" fill="#1955a6"/>',
              '<circle class="bh-accent bh-a2" cx="1180" cy="300" r="10" fill="#fcd91b"/>',
              '<rect   class="bh-accent bh-a3" x="200"  y="540" width="32" height="32" fill="#c8232c"/>',
              '<circle class="bh-accent bh-a4" cx="980"  cy="780" r="18" fill="#c8232c"/>',
              '<rect   class="bh-accent bh-a5" x="700"  y="180" width="22" height="60" fill="#0a0a0a"/>',
            '</g>',
            // O+O logo in black centered
            '<g class="bh-logo">',
              '<circle class="bh-o1" pathLength="1" cx="650" cy="460" r="106" stroke="#0a0a0a" stroke-width="14"/>',
              '<g class="bh-plus" stroke="#0a0a0a" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="418" x2="800" y2="502"/>',
                '<line pathLength="1" x1="758" y1="460" x2="842" y2="460"/>',
              '</g>',
              '<circle class="bh-o2" pathLength="1" cx="950" cy="460" r="106" stroke="#0a0a0a" stroke-width="14"/>',
            '</g>',
            '<text class="bh-text bh-name" x="800" y="690" text-anchor="middle" fill="#0a0a0a" font-family="Georgia, serif" font-size="46" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="bh-text bh-sub"  x="800" y="740" text-anchor="middle" fill="#1955a6" font-family="Georgia, serif" font-size="18" letter-spacing="10">GALERÍA O+O · VALENCIA</text>'
        ].join('');
        return { css: css, svg: svg, duration: 5800 };
    }

    // ---------- VARIANT 8 — KLIMT GOLD LEAF (kl-) ----------
    function buildKlimt() {
        var css = [
            '.oo-v-klimt { background: radial-gradient(ellipse at 50% 45%, #0e0e54 0%, #050530 65%, #020018 100%); }',
            '.oo-v-klimt .kl-tile { opacity: 0; transform: scale(.3); animation: kl-tile .7s cubic-bezier(.16,1.3,.3,1) forwards; }',
            '@keyframes kl-tile { 0%{opacity:0;transform:scale(.3)} 60%{opacity:.95;transform:scale(1.1)} 100%{opacity:.92;transform:scale(1)} }',
            '.oo-v-klimt .kl-mandala { opacity: 0; transform: scale(.6) rotate(-12deg); animation: kl-mandala 1.4s cubic-bezier(.2,.84,.3,1) 2.0s forwards; }',
            '@keyframes kl-mandala { to { opacity: .95; transform: scale(1) rotate(0); } }',
            '.oo-v-klimt .kl-logo path, .oo-v-klimt .kl-logo circle, .oo-v-klimt .kl-logo line { fill: none; stroke-linecap: round; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; }',
            '.oo-v-klimt .kl-o1 { animation: kl-paint 1.0s cubic-bezier(.22,.78,.32,1) 3.4s forwards; }',
            '.oo-v-klimt .kl-plus { animation: kl-paint .5s cubic-bezier(.22,.78,.32,1) 4.0s forwards; }',
            '.oo-v-klimt .kl-o2 { animation: kl-paint 1.0s cubic-bezier(.22,.78,.32,1) 4.15s forwards; }',
            '@keyframes kl-paint { 0%{opacity:0;stroke-dashoffset:1} 10%{opacity:1} 100%{opacity:1;stroke-dashoffset:0} }',
            '.oo-v-klimt .kl-text { opacity: 0; transform: translateY(12px); animation: kl-rise 1.0s cubic-bezier(.2,.8,.3,1) forwards; }',
            '.oo-v-klimt .kl-name { animation-delay: 4.55s; } .oo-v-klimt .kl-sub { animation-delay: 4.85s; }',
            '@keyframes kl-rise { to { opacity: 1; transform: translateY(0); } }'
        ].join('\n');
        // 28 gold tiles at randomised positions; staggered delays
        var tileSvg = [];
        var positions = [
            [120,140,42,38],[260,80,28,34],[420,180,36,32],[560,80,30,30],[700,160,40,36],
            [880,90,32,34],[1040,160,38,30],[1180,80,28,36],[1320,160,42,32],[1460,100,30,28],
            [80,360,34,40],[1500,360,36,38],[140,520,30,34],[1480,560,32,40],
            [100,700,40,36],[260,800,30,30],[420,720,36,40],[560,820,28,32],[720,720,38,34],
            [880,820,32,30],[1040,720,40,36],[1200,820,28,34],[1360,720,36,32],[1500,820,30,30],
            [220,260,24,28],[1380,240,26,28],[1380,640,24,26],[220,640,26,28]
        ];
        for (var k = 0; k < positions.length; k++) {
            var p = positions[k];
            var delay = (0.05 + k * 0.06).toFixed(2);
            tileSvg.push('<rect class="kl-tile" style="animation-delay:' + delay + 's" x="' + p[0] + '" y="' + p[1] + '" width="' + p[2] + '" height="' + p[3] + '" fill="url(#kl-gold)"/>');
        }
        var svg = [
            '<defs>',
              '<linearGradient id="kl-gold" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fff1b8"/><stop offset="40%" stop-color="#ffd966"/><stop offset="100%" stop-color="#b08818"/></linearGradient>',
              '<radialGradient id="kl-mandala-g" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#fff1b8" stop-opacity=".4"/><stop offset="60%" stop-color="#ffd966" stop-opacity=".15"/><stop offset="100%" stop-color="#ffd966" stop-opacity="0"/></radialGradient>',
            '</defs>',
            '<rect width="1600" height="900" fill="#0a0a3a"/>',
            '<g>',
              tileSvg.join(''),
            '</g>',
            // Central mandala ornament
            '<g class="kl-mandala">',
              '<circle cx="800" cy="460" r="280" fill="url(#kl-mandala-g)"/>',
              '<circle cx="800" cy="460" r="240" fill="none" stroke="#ffd966" stroke-width="1.5" stroke-opacity=".5"/>',
              '<circle cx="800" cy="460" r="200" fill="none" stroke="#ffd966" stroke-width="1" stroke-opacity=".35"/>',
              '<g stroke="#ffd966" stroke-width="1" stroke-opacity=".4">',
                '<line x1="800" y1="180" x2="800" y2="740"/>',
                '<line x1="520" y1="460" x2="1080" y2="460"/>',
                '<line x1="600" y1="260" x2="1000" y2="660"/>',
                '<line x1="1000" y1="260" x2="600" y2="660"/>',
              '</g>',
            '</g>',
            // O+O logo in gold inside mandala
            '<g class="kl-logo">',
              '<circle class="kl-o1" pathLength="1" cx="650" cy="460" r="100" stroke="#ffd966" stroke-width="14"/>',
              '<g class="kl-plus" stroke="#ffd966" stroke-width="11" stroke-linecap="round">',
                '<line pathLength="1" x1="800" y1="418" x2="800" y2="502"/>',
                '<line pathLength="1" x1="758" y1="460" x2="842" y2="460"/>',
              '</g>',
              '<circle class="kl-o2" pathLength="1" cx="950" cy="460" r="100" stroke="#ffd966" stroke-width="14"/>',
            '</g>',
            '<text class="kl-text kl-name" x="800" y="690" text-anchor="middle" fill="#fff1b8" font-family="Georgia, serif" font-size="46" letter-spacing="6" font-style="italic">Enriqueta Hueso</text>',
            '<text class="kl-text kl-sub"  x="800" y="740" text-anchor="middle" fill="#ffd966" font-family="Georgia, serif" font-size="17" letter-spacing="10">GALERÍA O+O · VALENCIA</text>'
        ].join('');
        return { css: css, svg: svg, duration: 5800 };
    }

    // ---------- BUILDER + SHOWING ----------
    function build() {
        var SVG = 'http://www.w3.org/2000/svg';
        var picked = pickVariant();
        var v = picked.data;

        var overlay = document.createElement('div');
        overlay.className = 'oo-intro oo-v-' + picked.id;
        overlay.setAttribute('role', 'presentation');
        overlay.setAttribute('aria-hidden', 'true');
        overlay.dataset.variant = picked.id;

        var style = document.createElement('style');
        style.textContent = v.css;
        overlay.appendChild(style);

        var svg = document.createElementNS(SVG, 'svg');
        svg.setAttribute('viewBox', '0 0 1600 900');
        svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
        svg.setAttribute('aria-hidden', 'true');
        svg.innerHTML = v.svg;
        overlay.appendChild(svg);

        var skip = document.createElement('button');
        skip.type = 'button';
        skip.className = 'oo-skip';
        skip.textContent = 'Saltar';
        skip.setAttribute('aria-label', 'Saltar animación de entrada');
        overlay.appendChild(skip);

        return { overlay: overlay, skip: skip, duration: v.duration };
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
                var main = document.querySelector('main')
                    || document.querySelector('h1')
                    || document.body;
                if (main && typeof main.focus === 'function') {
                    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
                    try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
                }
            }, 900);
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
        window.setTimeout(dismiss, parts.duration);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', show, { once: true });
    } else {
        show();
    }
})();

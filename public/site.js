/* Galería O+O - Site JavaScript with Language + Mode controls */

// Mobile menu toggle
document.querySelector('.menu-toggle').addEventListener('click', function() {
    document.querySelector('.nav-links').classList.toggle('open');
});

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

    function switchLang(lang) {
        if (!galTranslations || !galTranslations[lang]) return;
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

        // Translate all data-g18n elements
        var els = document.querySelectorAll('[data-g18n]');
        for (var e = 0; e < els.length; e++) {
            var key = els[e].getAttribute('data-g18n');
            if (galTranslations[lang][key]) {
                els[e].textContent = galTranslations[lang][key];
            }
        }

        // Update view label
        updateViewLabel();
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
    overlay.innerHTML = '<button class="img-overlay-close">&times;</button><img src="" alt="">';
    document.body.appendChild(overlay);

    var overlayImg = overlay.querySelector('img');
    var closeBtn = overlay.querySelector('.img-overlay-close');

    function openOverlay(src) {
        overlayImg.src = src;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeOverlay() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    overlay.addEventListener('click', closeOverlay);
    closeBtn.addEventListener('click', function(e) { e.stopPropagation(); closeOverlay(); });
    overlayImg.addEventListener('click', function(e) { e.stopPropagation(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeOverlay(); });

    var content = document.querySelector('.page-content');
    if (content) {
        content.addEventListener('click', function(e) {
            var link = e.target.closest('a');
            if (!link) return;
            var href = link.getAttribute('href') || '';
            if (href.match(/\.(jpg|jpeg|png|gif)$/i)) {
                e.preventDefault();
                openOverlay(href);
            }
        });
    }

    // Hide broken images
    var imgs = document.querySelectorAll('img');
    for (var i = 0; i < imgs.length; i++) {
        imgs[i].addEventListener('error', function() { this.style.display = 'none'; });
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

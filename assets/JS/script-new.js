// Load HTML partials (header/footer)
async function loadPartial(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;
    try {
        const res = await fetch(url);
        if (!res.ok) {
            console.error('Failed to load partial:', url, res.status);
            return;
        }
        el.innerHTML = await res.text();
    } catch (err) {
        console.error('Error loading partial', url, err);
    }
}

async function loadPartialsIfNeeded() {
    const mappings = [
        { sel: '#header', url: 'Partials/header.html' },
        { sel: '#site-header', url: 'Partials/header.html' },
        { sel: '#site-nav', url: 'Partials/header.html' },
        { sel: '#footer', url: 'Partials/footer.html' },
        { sel: '#site-footer', url: 'Partials/footer.html' }
    ];
    await Promise.all(mappings.map(m => loadPartial(m.sel, m.url)));
}

// Navigation menu toggle
function initNav() {
    const navMenu = document.querySelector('.nav-menu');
    const navToggle = document.querySelector('.nav-toggle');

    function isOpen() {
        return navMenu && navMenu.classList.contains('active');
    }

    function openMenu() {
        if (!navMenu) return;
        navMenu.classList.add('active');
        navMenu.setAttribute('aria-hidden', 'false');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'true');
        const focusTarget = navMenu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
        if (focusTarget) focusTarget.focus();
    }

    function closeMenu() {
        if (!navMenu) return;
        navMenu.classList.remove('active');
        navMenu.setAttribute('aria-hidden', 'true');
        if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
        if (navToggle) navToggle.focus();
    }

    window.showSidebar = openMenu;
    window.hideSidebar = closeMenu;

    if (navToggle) {
        navToggle.addEventListener('click', (e) => {
            if (e && e.preventDefault) e.preventDefault();
            isOpen() ? closeMenu() : openMenu();
        });
    }

    if (navMenu) {
        navMenu.querySelectorAll('a').forEach(a => {
            a.addEventListener('click', () => {
                setTimeout(closeMenu, 50);
            });
        });
    }

    document.addEventListener('click', (e) => {
        if (!navMenu || !isOpen()) return;
        const target = e.target;
        if (navToggle && (navToggle === target || navToggle.contains(target))) return;
        if (!navMenu.contains(target)) closeMenu();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen()) closeMenu();
    });

    if (navMenu && !navMenu.hasAttribute('aria-hidden')) navMenu.setAttribute('aria-hidden', 'true');
    if (navToggle && !navToggle.hasAttribute('aria-expanded')) navToggle.setAttribute('aria-expanded', 'false');
}

// Carousel functionality
function initCarousel() {
    const track = document.querySelector('.carousel__track');
    if (!track) return;

    const slides = Array.from(track.children);
    if (!slides.length) return;

    const prevButton = document.querySelector('.carousel__button--left');
    const nextButton = document.querySelector('.carousel__button--right');

    function setSlidePositions() {
        const slideWidth = track.getBoundingClientRect().width;
        slides.forEach((slide, index) => {
            slide.style.left = (slideWidth * index) + 'px';
            slide.style.position = 'absolute';
            slide.style.top = 0;
            slide.style.width = slideWidth + 'px';
        });
        const current = track.querySelector('.current-slide') || slides[0];
        moveToSlide(track, null, current, { skipClassToggle: true });
    }

    function moveToSlide(trackEl, currentSlide, targetSlide, opts = {}) {
        if (!targetSlide) return;
        const leftPx = targetSlide.style.left || '0px';
        const left = parseFloat(leftPx);
        trackEl.style.transform = 'translateX(-' + left + 'px)';
        if (!opts.skipClassToggle) {
            if (currentSlide) currentSlide.classList.remove('current-slide');
            slides.forEach(s => s.classList.remove('current-slide'));
            targetSlide.classList.add('current-slide');
        }
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            const current = track.querySelector('.current-slide') || slides[0];
            const prev = current.previousElementSibling || slides[slides.length - 1];
            moveToSlide(track, current, prev);
            resetAutoSlide();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            const current = track.querySelector('.current-slide') || slides[0];
            const next = current.nextElementSibling || slides[0];
            moveToSlide(track, current, next);
            resetAutoSlide();
        });
    }

    let autoSlideTimer = setInterval(() => {
        const current = track.querySelector('.current-slide') || slides[0];
        const next = current.nextElementSibling || slides[0];
        moveToSlide(track, current, next);
    }, 6000);

    function resetAutoSlide() {
        clearInterval(autoSlideTimer);
        autoSlideTimer = setInterval(() => {
            const current = track.querySelector('.current-slide') || slides[0];
            const next = current.nextElementSibling || slides[0];
            moveToSlide(track, current, next);
        }, 6000);
    }

    if (!track.querySelector('.current-slide')) slides[0].classList.add('current-slide');
    setSlidePositions();
    window.addEventListener('resize', () => {
        window.requestAnimationFrame(setSlidePositions);
    });

    // Touch/swipe support
    let touchStartX = 0;
    let touchDeltaX = 0;
    const container = document.querySelector('.carousel__track-container');

    container.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchDeltaX = 0;
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
        touchDeltaX = e.touches[0].clientX - touchStartX;
    }, { passive: true });

    container.addEventListener('touchend', () => {
        const threshold = 50;
        if (touchDeltaX < -threshold) {
            const current = track.querySelector('.current-slide') || slides[0];
            const next = current.nextElementSibling || slides[0];
            moveToSlide(track, current, next);
            resetAutoSlide();
        } else if (touchDeltaX > threshold) {
            const current = track.querySelector('.current-slide') || slides[0];
            const prev = current.previousElementSibling || slides[slides.length - 1];
            moveToSlide(track, current, prev);
            resetAutoSlide();
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await loadPartialsIfNeeded();
    initNav();
    initCarousel();
});

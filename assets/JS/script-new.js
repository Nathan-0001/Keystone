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

    const origSlides = Array.from(track.children);
    if (!origSlides.length) return;

    const prevButton = document.querySelector('.carousel__button--left');
    const nextButton = document.querySelector('.carousel__button--right');
    const SLIDE_RATIO = 0.8;

    // Clone first/last for seamless loop
    const firstClone = origSlides[0].cloneNode(true);
    const lastClone = origSlides[origSlides.length - 1].cloneNode(true);
    firstClone.classList.add('first-clone');
    lastClone.classList.add('last-clone');
    track.appendChild(firstClone);
    track.insertBefore(lastClone, origSlides[0]);

    const slides = Array.from(track.children);
    const realCount = origSlides.length;
    let currentIndex = 0; // index into real slides

    function setSlidePositions() {
        const containerWidth = track.parentElement.getBoundingClientRect().width;
        const slideWidth = containerWidth * SLIDE_RATIO;
        const centerOffset = (containerWidth - slideWidth) / 2;

        slides.forEach((slide, index) => {
            slide.style.left = (centerOffset + slideWidth * index) + 'px';
            slide.style.position = 'absolute';
            slide.style.top = 0;
            slide.style.width = slideWidth + 'px';
        });

        centerOnRealSlide(currentIndex, false);
    }

    function centerOnRealSlide(realIdx, animate) {
        const targetSlide = slides[realIdx + 1]; // +1 because of prepended clone
        const slideWidth = parseFloat(targetSlide.style.left) - parseFloat(slides[0].style.left);
        const containerWidth = track.parentElement.getBoundingClientRect().width;
        const slideW = parseFloat(targetSlide.style.width);
        const centerOffset = (containerWidth - slideW) / 2;
        const leftPx = parseFloat(targetSlide.style.left);

        if (!animate) {
            track.style.transition = 'none';
        } else {
            track.style.transition = '';
        }
        track.style.transform = 'translateX(-' + (leftPx - centerOffset) + 'px)';

        // Update classes on real slides only
        const realSlides = slides.filter(s => !s.classList.contains('first-clone') && !s.classList.contains('last-clone'));
        realSlides.forEach((s, i) => {
            s.classList.remove('current-slide');
            s.classList.remove('carousel__slide--adjacent');
        });
        realSlides[realIdx].classList.add('current-slide');

        const dist = (a, b) => Math.min(Math.abs(a - b), realCount - Math.abs(a - b));
        realSlides.forEach((s, i) => {
            if (dist(i, realIdx) === 1) {
                s.classList.add('carousel__slide--adjacent');
            }
        });

        if (!animate) {
            // Force reflow then re-enable transition
            track.offsetHeight;
            track.style.transition = '';
        }
    }

    function goToRealSlide(realIdx) {
        currentIndex = realIdx;
        centerOnRealSlide(realIdx, true);

        // After transition ends, check if on a clone and snap to real
        track.addEventListener('transitionend', function handler() {
            track.removeEventListener('transitionend', handler);
            const displayed = track.querySelector('.current-slide');
            if (displayed && displayed.classList.contains('first-clone')) {
                currentIndex = 0;
                centerOnRealSlide(0, false);
            } else if (displayed && displayed.classList.contains('last-clone')) {
                currentIndex = realCount - 1;
                centerOnRealSlide(realCount - 1, false);
            }
        });
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + realCount) % realCount;
            goToRealSlide(currentIndex);
            resetAutoSlide();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % realCount;
            goToRealSlide(currentIndex);
            resetAutoSlide();
        });
    }

    let autoSlideTimer = setInterval(() => {
        currentIndex = (currentIndex + 1) % realCount;
        goToRealSlide(currentIndex);
    }, 6000);

    function resetAutoSlide() {
        clearInterval(autoSlideTimer);
        autoSlideTimer = setInterval(() => {
            currentIndex = (currentIndex + 1) % realCount;
            goToRealSlide(currentIndex);
        }, 6000);
    }

    centerOnRealSlide(0, false);
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
            currentIndex = (currentIndex + 1) % realCount;
            goToRealSlide(currentIndex);
            resetAutoSlide();
        } else if (touchDeltaX > threshold) {
            currentIndex = (currentIndex - 1 + realCount) % realCount;
            goToRealSlide(currentIndex);
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

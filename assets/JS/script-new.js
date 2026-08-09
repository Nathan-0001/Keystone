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
    let transitioning = false;
    let pendingDisplayIdx = null; // clone target while wrapping

    function containerWidth() {
        return track.parentElement.getBoundingClientRect().width;
    }

    function setSlidePositions() {
        const cw = containerWidth();
        const sWidth = cw * SLIDE_RATIO;
        const centerOffset = (cw - sWidth) / 2;

        slides.forEach((slide, index) => {
            slide.style.left = (centerOffset + sWidth * index) + 'px';
            slide.style.position = 'absolute';
            slide.style.top = 0;
            slide.style.width = sWidth + 'px';
        });

        if (transitioning && pendingDisplayIdx !== null) {
            // Finish an in-flight wrap instantly on resize so state stays consistent
            pendingTransition = null;
            snapToDisplay(pendingDisplayIdx);
            transitioning = false;
            pendingDisplayIdx = null;
        } else {
            snapToDisplay(currentIndex + 1);
        }
    }

    function setTransform(leftPx, animate) {
        const sWidth = containerWidth() * SLIDE_RATIO;
        const centerOffset = (containerWidth() - sWidth) / 2;
        const tx = -(leftPx - centerOffset);

        if (!animate) {
            track.style.transition = 'none';
            track.style.transform = 'translateX(' + tx + 'px)';
            track.offsetHeight; // force reflow
            track.style.transition = '';
        } else {
            track.style.transform = 'translateX(' + tx + 'px)';
        }
    }

    function updateClasses(displayIdx) {
        slides.forEach(s => {
            s.classList.remove('current-slide');
            s.classList.remove('carousel__slide--adjacent');
        });
        slides[displayIdx].classList.add('current-slide');
        if (displayIdx > 0) slides[displayIdx - 1].classList.add('carousel__slide--adjacent');
        if (displayIdx < slides.length - 1) slides[displayIdx + 1].classList.add('carousel__slide--adjacent');
    }

    function animateToDisplay(displayIdx) {
        setTransform(parseFloat(slides[displayIdx].style.left), true);
        updateClasses(displayIdx);
    }

    function snapToDisplay(displayIdx) {
        setTransform(parseFloat(slides[displayIdx].style.left), false);
        updateClasses(displayIdx);
    }

    // Single persistent listener so no stale handlers survive interrupted wraps
    let pendingTransition = null;
    track.addEventListener('transitionend', (e) => {
        if (e.target !== track || e.propertyName !== 'transform') return;
        if (pendingTransition) {
            const cb = pendingTransition;
            pendingTransition = null;
            cb();
        }
    });

    function afterTrackTransition(cb) {
        pendingTransition = cb;
    }

    function nextSlide() {
        if (transitioning) return;
        if (currentIndex === realCount - 1) {
            transitioning = true;
            pendingDisplayIdx = realCount + 1;
            currentIndex = 0;
            animateToDisplay(pendingDisplayIdx); // animate onto first clone
            afterTrackTransition(() => {
                snapToDisplay(1); // snap to real first slide
                transitioning = false;
                pendingDisplayIdx = null;
            });
        } else {
            currentIndex++;
            animateToDisplay(currentIndex + 1);
        }
    }

    function prevSlide() {
        if (transitioning) return;
        if (currentIndex === 0) {
            transitioning = true;
            pendingDisplayIdx = 0;
            currentIndex = realCount - 1;
            animateToDisplay(pendingDisplayIdx); // animate onto last clone
            afterTrackTransition(() => {
                snapToDisplay(realCount); // snap to real last slide
                transitioning = false;
                pendingDisplayIdx = null;
            });
        } else {
            currentIndex--;
            animateToDisplay(currentIndex + 1);
        }
    }

    if (prevButton) {
        prevButton.addEventListener('click', () => {
            prevSlide();
            resetAutoSlide();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            nextSlide();
            resetAutoSlide();
        });
    }

    let autoSlideTimer = setInterval(() => {
        nextSlide();
    }, 6000);

    function resetAutoSlide() {
        clearInterval(autoSlideTimer);
        autoSlideTimer = setInterval(() => {
            nextSlide();
        }, 6000);
    }

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
            nextSlide();
            resetAutoSlide();
        } else if (touchDeltaX > threshold) {
            prevSlide();
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

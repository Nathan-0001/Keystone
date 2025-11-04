// async function loadPartials() {
//     try {
//     const headerResponse = await fetch('/Keystone/Partials/header.html');
//     const footerResponse = await fetch('/Keystone/Partials/footer.html');

//     if (!headerResponse.ok || !footerResponse.ok) {
//         throw new Error('Failed to load header or footer');
//     }

//     const headerHTML = await headerResponse.text();
//     const footerHTML = await footerResponse.text();

//     document.getElementById('header').innerHTML = headerHTML;
//     document.getElementById('footer').innerHTML = footerHTML;
//     } catch (error) {
//     console.error(error);
// }
// }

// loadPartials();
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
  // support multiple placeholder id variants that you may use
    const mappings = [
    { sel: '#header', url: '/Keystone/Partials/header.html' },
    { sel: '#site-header', url: '/Keystone/Partials/header.html' },
    { sel: '#site-nav', url: '/Keystone/Partials/header.html' },
    { sel: '#footer', url: '/Keystone/Partials/footer.html' },
    { sel: '#site-footer', url: '/Keystone/Partials/footer.html' }
    ];
    await Promise.all(mappings.map(m => loadPartial(m.sel, m.url)));
}

function initNav() {
    const sidebar = document.querySelector('.sidebar'); // mobile panel
    const menuButtonLi = document.querySelector('.menu-button'); // your li.menu-button
  // prefer explicit button if present, fallback to anchor or li itself
    const menuButton =
    (menuButtonLi && (menuButtonLi.querySelector('button') || menuButtonLi.querySelector('a'))) ||
    menuButtonLi ||
    document.getElementById('menuBtn');

 // close control inside sidebar (various markup possibilities)
const closeBtn =
    (sidebar && (sidebar.querySelector('#sidebarCloseBtn') ||
        sidebar.querySelector('.sbx button') ||
        sidebar.querySelector('.sbx a') ||
        sidebar.querySelector('li:first-child button') ||
        sidebar.querySelector('li:first-child a'))) || null;

function isOpen() {
    return sidebar && sidebar.classList.contains('open');
}
function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('open');
    sidebar.setAttribute('aria-hidden', 'false');
    if (menuButton && menuButton.setAttribute) menuButton.setAttribute('aria-expanded', 'true');
    // focus first interactive element for keyboard users
    const focusTarget = sidebar.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
    if (focusTarget) focusTarget.focus();
}

function closeSidebar() {
    if (!sidebar) return;
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden', 'true');
    if (menuButton && menuButton.setAttribute) menuButton.setAttribute('aria-expanded', 'false');
    if (menuButton && menuButton.focus) menuButton.focus();
}

window.showSidebar = openSidebar;
window.hideSidebar = closeSidebar;

  // Bind toggle on menu button
if (menuButton) {
    menuButton.addEventListener('click', (e) => {
      if (e && e.preventDefault) e.preventDefault(); // prevent '#' jumps
    isOpen() ? closeSidebar() : openSidebar();
    });
}

  // Bind close inside sidebar
if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
    if (e && e.preventDefault) e.preventDefault();
    closeSidebar();
    });
}

// Any link inside sidebar should close the panel after navigating
if (sidebar) {
    sidebar.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
        // small delay to allow link navigation to begin
        setTimeout(closeSidebar, 50);
    });
    });
}
  // Click outside to close
document.addEventListener('click', (e) => {
    if (!sidebar || !isOpen()) return;
    const target = e.target;
    if (menuButton && (menuButton === target || menuButton.contains(target))) return;
    if (!sidebar.contains(target)) closeSidebar();
});

  // Escape key closes
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeSidebar();
});

  // Set initial ARIA states if missing
if (sidebar && !sidebar.hasAttribute('aria-hidden')) sidebar.setAttribute('aria-hidden', 'true');
if (menuButton && !menuButton.hasAttribute('aria-expanded')) menuButton.setAttribute('aria-expanded', 'false');
}

// CAROUSEL
//
function initCarousel() {
const track = document.querySelector('.carousel__track');
if (!track) return;

const slides = Array.from(track.children);
if (!slides.length) return;

const prevButton = document.querySelector('.carousel__button--left');
const nextButton = document.querySelector('.carousel__button--right');

  // set slide positions based on current widths
function setSlidePositions() {
    const slideWidth = track.getBoundingClientRect().width;
    slides.forEach((slide, index) => {
    slide.style.left = (slideWidth * index) + 'px';
    slide.style.position = 'absolute';
    slide.style.top = 0;
    slide.style.width = slideWidth + 'px';
    });
    // ensure transform corresponds to current slide
    const current = track.querySelector('.current-slide') || slides[0];
    moveToSlide(track, null, current, { skipClassToggle: true });
}
  // move to a target slide element
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
    // update arrow visibility
    updateArrows(slides, prevButton, nextButton, slides.indexOf(targetSlide));
}

function updateArrows(slidesArr, prevBtn, nextBtn, targetIndex) {
    if (!prevBtn || !nextBtn) return;
    if (targetIndex <= 0) {
        prevBtn.classList.add('is-hidden');
        nextBtn.classList.remove('is-hidden');
    } else if (targetIndex >= slidesArr.length - 1) {
        nextBtn.classList.add('is-hidden');
        prevBtn.classList.remove('is-hidden');
    } else {
        prevBtn.classList.remove('is-hidden');
        nextBtn.classList.remove('is-hidden');
    }
}

  // wire buttons
if (prevButton) {
    prevButton.addEventListener('click', () => {
        const current = track.querySelector('.current-slide') || slides[0];
        const prev = current.previousElementSibling || slides[0];
        moveToSlide(track, current, prev);
    });
}
if (nextButton) {
    nextButton.addEventListener('click', () => {
    const current = track.querySelector('.current-slide') || slides[0];
    const next = current.nextElementSibling || slides[slides.length - 1];
    moveToSlide(track, current, next);
    });
}

  // initial setup
  // mark first slide as current if none set
    if (!track.querySelector('.current-slide')) slides[0].classList.add('current-slide');
  // compute sizes & positions now and on resize
    setSlidePositions();
    window.addEventListener('resize', () => {
    // throttle/responsive simple approach
    window.requestAnimationFrame(setSlidePositions);
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  // load partials if placeholders exist (harmless if not)
await loadPartialsIfNeeded();

  // init navigation and carousel after partials may have been injected
initNav();
initCarousel();
});




const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbybHD85YZ8EvpRLEGyGAkCYfBALElrH338ca5JwNN84HsFjNCQ4MAr5-NscEDFUkGxdjg/exec";

const HEADER_HASHES = ['#news', '#projects', '#about', '#contact'];
const isHeaderAnchor = (hash) => HEADER_HASHES.includes(hash);

// Ensure returned visits (back/forward or bfcache) don't restore scroll to a previous anchor
window.addEventListener('pageshow', (event) => {
    try {
        const navEntries = performance && performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
        const navType = (navEntries && navEntries[0] && navEntries[0].type) || '';
        console.log('pageshow', { persisted: event.persisted, navType, hash: window.location.hash });
        if (event.persisted || navType === 'back_forward') {
            if (window.history && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            window.scrollTo(0, 0);
        }
    } catch (e) {
        // ignore — best-effort only
    }
});

// Also handle popstate (back/forward) to aggressively remove header anchors when they appear
window.addEventListener('popstate', () => {
    try {
        console.log('popstate', { hash: window.location.hash });
        if (isHeaderAnchor(window.location.hash)) {
            if (window.history && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            window.scrollTo(0, 0);
        }
    } catch (e) {}
});

window.addEventListener('hashchange', () => {
    try {
        if (isHeaderAnchor(window.location.hash)) {
            if (window.history && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            window.scrollTo(0, 0);
        }
    } catch (e) {}
});

document.addEventListener("DOMContentLoaded", async () => {
    if (window.history && typeof window.history.scrollRestoration === 'string') {
        window.history.scrollRestoration = 'manual';
    }

    console.log('DOMContentLoaded', { href: window.location.href, hash: window.location.hash, referrer: document.referrer });

    const loadHTMLIncludes = async () => {
        const includes = document.querySelectorAll('[data-include]');
        await Promise.all(Array.from(includes).map(async (el) => {
            const src = el.dataset.include;
            if (!src) return;
            try {
                const response = await fetch(src);
                if (!response.ok) {
                    throw new Error(`Failed to load include: ${src} (${response.status})`);
                }
                el.innerHTML = await response.text();
            } catch (error) {
                console.error('Error loading include', src, error);
            }
        }));
    };

    await loadHTMLIncludes();

    // Only clear #news when the URL actually contains it on load.
    const NAVBAR_OFFSET = 96;
    const scrollToTarget = (target, smooth = true) => {
        const scrollTop = target.getBoundingClientRect().top + window.pageYOffset - NAVBAR_OFFSET;
        window.scrollTo({ top: Math.max(0, scrollTop), behavior: smooth ? 'smooth' : 'auto' });
    };

    const initAnchorNav = () => {
        document.querySelectorAll('a.nav-link[href^="#"]').forEach(link => {
            const href = link.getAttribute('href');
            if (!href || href.length <= 1) return;
            const targetId = href.slice(1);
            const target = document.getElementById(targetId);
            if (!target) return;

            link.addEventListener('click', (event) => {
                event.preventDefault();
                scrollToTarget(target);
                if (window.history && typeof window.history.replaceState === 'function') {
                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                }
            });
        });
    };

    initAnchorNav();

    if (window.location.hash) {
        const target = document.querySelector(window.location.hash);
        if (target) {
            scrollToTarget(target, false);
        }
    }

    const form = document.getElementById("leadForm");

    if (form) {
        const btn = form.querySelector("button");
        const originalText = btn ? btn.innerText : '';

        form.addEventListener("submit", async (e) => {

        e.preventDefault();

        const name =
            document.getElementById("name")?.value.trim();

        const phone =
            document.getElementById("phone")?.value.trim();

        const project =
            document.getElementById("project")?.value || "";

        if (!name) {
            alert("Vui lòng nhập họ tên");
            return;
        }

        if (!phone) {
            alert("Vui lòng nhập số điện thoại");
            return;
        }

        if (!/^[0-9+\s()-]{8,15}$/.test(phone)) {
            alert("Số điện thoại không hợp lệ");
            return;
        }

        btn.disabled = true;
        btn.innerText = "ĐANG GỬI...";

        try {

            await fetch(SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                body: JSON.stringify({
                    name,
                    phone,
                    project,
                    createdAt: new Date().toISOString()
                })
            });

            const message =
                document.getElementById("message");

            if (message) {

                message.innerHTML = `
                <div class="alert alert-success mt-3">
                    ✅ Đăng ký thành công!<br>
                    Trí Đức Realty sẽ liên hệ với anh/chị trong thời gian sớm nhất.
                </div>
                `;
            }

            form.reset();

            window.scrollTo({
                top: form.offsetTop - 100,
                behavior: "smooth"
            });

        } catch (error) {

            console.error(error);

            const message =
                document.getElementById("message");

            if (message) {

                message.innerHTML = `
                <div class="alert alert-danger mt-3">
                    ❌ Không thể gửi dữ liệu.
                    Vui lòng thử lại sau.
                </div>
                `;
            }

        } finally {

            btn.disabled = false;
            btn.innerText = originalText;

        }

    });
    }

    const syncCarouselThumbnails = (carouselId) => {
        const carouselEl = document.getElementById(carouselId);
        if (!carouselEl) return;

        const thumbs = carouselEl.querySelectorAll('.carousel-thumb-btn');
        const carouselInstance = (window.bootstrap && window.bootstrap.Carousel)
            ? window.bootstrap.Carousel.getOrCreateInstance(carouselEl)
            : null;

        const setActiveThumb = (index) => {
            thumbs.forEach((thumb, i) => {
                thumb.classList.toggle('active', i === index);
            });
        };

        if (carouselInstance) {
            carouselEl.addEventListener('slid.bs.carousel', (event) => {
                setActiveThumb(event.to);
            });
        }

        const indicatorButtons = carouselEl.querySelectorAll('[data-bs-slide-to]');

        thumbs.forEach((thumb, index) => {
            thumb.addEventListener('click', (event) => {
                event.preventDefault();
                if (carouselInstance && typeof carouselInstance.to === 'function') {
                    carouselInstance.to(index);
                } else if (indicatorButtons[index]) {
                    indicatorButtons[index].click();
                }
                setActiveThumb(index);
            });
        });
    };

    const syncCarouselTracker = (carouselId) => {
        const carouselEl = document.getElementById(carouselId);
        if (!carouselEl) return;

        const items = carouselEl.querySelectorAll('.carousel-item');
        const total = items.length;
        const progressFill = document.getElementById(`${carouselId}-progress`);
        const counter = document.getElementById(`${carouselId}-counter`);

        const updateTracker = (index) => {
            if (progressFill) {
                const percentage = ((index + 1) / total) * 100;
                progressFill.style.width = `${percentage}%`;
            }
            if (counter) {
                counter.innerText = `${index + 1} / ${total}`;
            }
        };

        // Initialize progress
        updateTracker(0);

        carouselEl.addEventListener('slid.bs.carousel', (event) => {
            updateTracker(event.to);
        });
    };

    // Initialize single-frame payment tabs
    const initPaymentTabs = () => {
        const frame = document.querySelector('.payment-frame');
        if (!frame) return;

        const tabs = frame.querySelectorAll('.tab-btn');
        const panels = frame.querySelectorAll('.pay-panel');

        const activate = (targetId) => {
            tabs.forEach(t => t.classList.toggle('active', t.dataset.target === targetId));
            panels.forEach(p => p.classList.toggle('active', p.id === targetId));
            // smooth scroll into view on small screens
            const activePanel = frame.querySelector(`#${targetId}`);
            if (activePanel) {
                activePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        tabs.forEach(t => {
            t.addEventListener('click', (e) => {
                const target = t.dataset.target;
                if (!target) return;
                activate(target);
            });
        });
    };

    const initLocationTabs = () => {
        const tabs = document.querySelectorAll('.location-tab');
        const panels = document.querySelectorAll('.location-panel');
        if (!tabs.length || !panels.length) return;

        const activate = (targetId) => {
            tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.target === targetId));
            panels.forEach(panel => panel.classList.toggle('active', panel.id === targetId));
            const activePanel = document.getElementById(targetId);
            if (activePanel) {
                activePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                if (!target) return;
                activate(target);
            });
        });
    };

    initLocationTabs();
    const initAmenityTabs = () => {
        const tabs = document.querySelectorAll('.amenities-tab');
        const panels = document.querySelectorAll('.amenity-panel');
        if (!tabs.length || !panels.length) return;

        const activate = (targetId) => {
            tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.target === targetId));
            panels.forEach(panel => panel.classList.toggle('active', panel.id === targetId));
            const activePanel = document.getElementById(targetId);
            if (activePanel) {
                activePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;
                if (!target) return;
                activate(target);
            });
        });
    };

    initAmenityTabs();

    const initSpecSelector = () => {
        const dropdownToggle = document.querySelector('.spec-dropdown-toggle');
        const layoutMenu = document.querySelector('.spec-layout-menu');
        const layoutButtons = document.querySelectorAll('.spec-layout-btn');
        const resultCard = document.querySelector('.spec-result-card');
        const resultTitle = document.querySelector('.spec-result-title');
        const resultSize = document.querySelector('.spec-result-size');
        if (!dropdownToggle || !layoutMenu || !layoutButtons.length || !resultCard || !resultTitle || !resultSize) return;

        const layouts = Array.from(layoutButtons).map(btn => ({
            label: btn.dataset.label || btn.textContent.trim(),
            size: btn.dataset.size || ''
        }));

        dropdownToggle.addEventListener('click', () => {
            const expanded = dropdownToggle.getAttribute('aria-expanded') === 'true';
            dropdownToggle.setAttribute('aria-expanded', String(!expanded));
            layoutMenu.hidden = !layoutMenu.hidden;
        });

        const showResult = (index) => {
            const layout = layouts[index];
            if (!layout) return;
            layoutButtons.forEach((btn, idx) => btn.classList.toggle('active', idx === index));
            dropdownToggle.querySelector('span').textContent = layout.label;
            resultTitle.textContent = layout.label;
            resultSize.textContent = layout.size;
            resultCard.style.display = 'block';
        };

        layoutButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                dropdownToggle.setAttribute('aria-expanded', 'false');
                layoutMenu.hidden = true;
                showResult(index);
            });
        });
    };

    initSpecSelector();
    syncCarouselThumbnails('amenitiesCarousel');
    syncCarouselThumbnails('apartmentCarousel');
    syncCarouselThumbnails('scheduleCarousel');
    syncCarouselThumbnails('legalCarousel');

    syncCarouselTracker('amenitiesCarousel');
    syncCarouselTracker('apartmentCarousel');
    syncCarouselTracker('scheduleCarousel');
    syncCarouselTracker('legalCarousel');

    const initCarousel = (sectionId) => {
        const section = document.getElementById(sectionId);
        if (!section) return;

        const track = section.querySelector('.project-carousel-track');
        const prev = section.querySelector('.carousel-nav-prev');
        const next = section.querySelector('.carousel-nav-next');
        const dotsContainer = section.querySelector('.carousel-dots');
        const cards = Array.from(section.querySelectorAll('.project-card-slide'));

        if (!track || !prev || !next || cards.length === 0) return;

        let groupSize = window.innerWidth < 768 ? 1 : 2;
        let pages = Math.max(1, Math.ceil(cards.length / groupSize));
        let activePage = 0;

        const createDots = () => {
            if (!dotsContainer) return;
            dotsContainer.innerHTML = '';
            for (let page = 0; page < pages; page++) {
                const dot = document.createElement('button');
                dot.type = 'button';
                dot.className = page === 0 ? 'active' : '';
                dot.addEventListener('click', () => {
                    scrollToPage(page);
                });
                dotsContainer.appendChild(dot);
            }
        };

        const updateDots = () => {
            if (!dotsContainer) return;
            Array.from(dotsContainer.children).forEach((dot, index) => {
                dot.classList.toggle('active', index === activePage);
            });
        };

        const updateButtons = () => {
            prev.disabled = activePage <= 0;
            next.disabled = activePage >= pages - 1;
        };

        const scrollToPage = (page, smooth = true) => {
            activePage = Math.max(0, Math.min(page, pages - 1));
            const index = activePage * groupSize;
            const card = cards[index];
            if (card) {
                track.scrollTo({ left: card.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
            }
            updateButtons();
            updateDots();
        };

        prev.addEventListener('click', () => scrollToPage(activePage - 1));
        next.addEventListener('click', () => scrollToPage(activePage + 1));

        let pendingScroll = false;
        track.addEventListener('scroll', () => {
            if (pendingScroll) return;
            pendingScroll = true;
            requestAnimationFrame(() => {
                const pageWidth = track.clientWidth;
                const newPage = Math.round(track.scrollLeft / pageWidth);
                if (newPage !== activePage) {
                    activePage = Math.max(0, Math.min(newPage, pages - 1));
                    updateButtons();
                    updateDots();
                }
                pendingScroll = false;
            });
        }, { passive: true });

        // Recompute groupSize/pages on resize
        let resizeTimeout;
        const recompute = () => {
            groupSize = window.innerWidth < 768 ? 1 : 2;
            pages = Math.max(1, Math.ceil(cards.length / groupSize));
            // recreate dots and clamp activePage
            if (activePage >= pages) activePage = pages - 1;
            createDots();
            scrollToPage(activePage, false);
            updateButtons();
        };

        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(recompute, 150);
        });

        createDots();
        scrollToPage(0, false);
        updateButtons();
    };

    initCarousel('projects');
    initCarousel('news');

    // init single-panel payment switcher
    initPaymentTabs();

});

// Hide empty .info-box elements on initial load and when content changes
(() => {
    const hideEmptyInfoBoxes = () => {
        document.querySelectorAll('.info-box').forEach(el => {
            const text = (el.innerText || el.textContent || '').replace(/\u00A0/g, '').trim();
            if (text.length === 0) {
                el.classList.add('empty');
            } else {
                el.classList.remove('empty');
            }
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', hideEmptyInfoBoxes);
    } else {
        hideEmptyInfoBoxes();
    }

    // Observe changes inside info-boxes (for any dynamic content)
    const observer = new MutationObserver(hideEmptyInfoBoxes);
    document.querySelectorAll('.info-box').forEach(node => {
        observer.observe(node, { childList: true, subtree: true, characterData: true });
    });
})();

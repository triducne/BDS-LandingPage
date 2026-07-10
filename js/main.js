const BACKEND_LEAD_URL = 'https://script.google.com/macros/s/AKfycbxI_cz5SvBrRHsS8Vp-uPK0vt4sDP2unCk9ZVyF6NfZ1ysyhmQf_YZ-qjd09JxTLRVIyQ/exec';

const HEADER_HASHES = ['#news', '#projects', '#about', '#contact'];
const isHeaderAnchor = (hash) => HEADER_HASHES.includes(hash);

// Ensure returned visits (back/forward or bfcache) don't restore scroll to a previous anchor
window.addEventListener('pageshow', (event) => {
    try {
        const navEntries = performance && performance.getEntriesByType ? performance.getEntriesByType('navigation') : [];
        const navType = (navEntries && navEntries[0] && navEntries[0].type) || '';if (event.persisted || navType === 'back_forward') {
            if (window.history && typeof window.history.replaceState === 'function') {
                window.history.replaceState(null, '', window.location.pathname + window.location.search);
            }
            window.scrollTo(0, 0);
        }
    } catch (e) {
        // ignore — best-effort only
    }

    // Runtime handler: allow removing the Zalo checkbox option via the 'Bỏ' button
    try {
        const removeBtn = document.getElementById('removeZaloBtn');
        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const input = document.getElementById('contactByZalo');
                if (input) input.checked = false;
                const wrapper = removeBtn.closest('.form-check');
                if (wrapper) wrapper.remove();
            });
        }
    } catch (err) {
        console.error('removeZaloBtn handler error', err);
    }
});

// Also handle popstate (back/forward) to aggressively remove header anchors when they appear
window.addEventListener('popstate', () => {
    try {if (isHeaderAnchor(window.location.hash)) {
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
    }const loadHTMLIncludes = async () => {
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

    // Ensure checkbox rows in the lead form are clickable (defensive runtime fix)
    (function ensureLeadFormCheckboxesClickable(){
        const leadFormContainer = document.querySelector('#form .contact-form') || document.querySelector('#form');
        if (!leadFormContainer) return;
        const rows = leadFormContainer.querySelectorAll('.form-check.custom-check');
        rows.forEach(row => {
            try {
                row.style.pointerEvents = 'auto';
                if (!row.style.position) row.style.position = 'relative';
                row.style.zIndex = '9999';
                // make the whole row toggle the checkbox when clicked
                row.setAttribute('tabindex', '0');
                row.addEventListener('click', (e) => {
                    const input = row.querySelector('input[type="checkbox"]');
                    if (!input) return;
                    if (e.target === input) return; // let native behavior run
                    e.preventDefault();
                    input.checked = !input.checked;
                    input.dispatchEvent(new Event('change', { bubbles: true }));
                });
                // keyboard accessibility: Space or Enter toggles
                row.addEventListener('keydown', (e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        const input = row.querySelector('input[type="checkbox"]');
                        if (!input) return;
                        input.click();
                    }
                });
            } catch (err) {
                // defensive: don't break main script
                console.error('ensureLeadFormCheckboxesClickable error', err);
            }
        });
    })();

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

        const contactByZalo =
            document.getElementById("contactByZalo")?.checked ? 'yes' : 'no';

        const financeAdvice =
            document.getElementById("financeAdvice")?.checked ? 'yes' : 'no';

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
            const params = new URLSearchParams({
                name,
                phone,
                project,
                contactByZalo,
                financeAdvice
            });

            const response = await fetch(`${BACKEND_LEAD_URL}?${params.toString()}`, {
                method: 'GET',
                mode: 'cors'
            });

            const text = await response.text();
            let result = { success: response.ok };
            try {
                result = JSON.parse(text);
            } catch {
                result = { success: response.ok };
            }

            const success = response.ok && result && result.success !== false;
            const message = document.getElementById('message');

            if (!success) {
                const errorText = result?.error || 'Không thể gửi dữ liệu. Vui lòng thử lại sau.';
                if (message) {
                    message.innerHTML = `
                    <div class="alert alert-danger mt-3">
                        ❌ ${errorText}
                    </div>
                    `;
                }
                return;
            }

            if (message) {
                message.innerHTML = `
                <div class="alert alert-success mt-3">
                    ✅ Đăng ký thành công!<br>
                    Trí Đức Realty sẽ liên hệ với anh/chị trong thời gian sớm nhất.
                </div>
                `;
            }

            form.reset();
            const currentPage = window.location.pathname.split('/').pop() || 'index.html';
            try {
                sessionStorage.setItem('leadProject', project || '');
                sessionStorage.setItem('leadReturnUrl', currentPage);
            } catch (storageError) {
                console.warn('Unable to persist lead thank-you state', storageError);
            }
            window.location.href = '/thank-you.html';

        } catch (error) {

            console.error(error);

            const message = document.getElementById("message");

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

    const initSpecSelectors = () => {
        const specSelectors = document.querySelectorAll('.spec-selector');
        specSelectors.forEach(selector => {
            const dropdownToggle = selector.querySelector('.spec-dropdown-toggle');
            const layoutMenu = selector.querySelector('.spec-layout-menu');
            const layoutButtons = selector.querySelectorAll('.spec-layout-btn');
            const resultCard = selector.querySelector('.spec-result-card');
            const resultTitle = selector.querySelector('.spec-result-title');
            const resultSize = selector.querySelector('.spec-result-size');
            if (!dropdownToggle || !layoutMenu || !layoutButtons.length || !resultCard || !resultTitle || !resultSize) return;

            const layouts = Array.from(layoutButtons).map(btn => ({
                label: btn.dataset.label || btn.textContent.trim(),
                price: btn.dataset.price || btn.dataset.size || ''
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
                resultSize.textContent = layout.price;
                resultCard.style.display = 'block';
            };

            layoutButtons.forEach((btn, index) => {
                btn.addEventListener('click', () => {
                    dropdownToggle.setAttribute('aria-expanded', 'false');
                    layoutMenu.hidden = true;
                    showResult(index);
                });
            });
        });
    };

    initSpecSelectors();
    syncCarouselThumbnails('amenitiesCarousel');
    syncCarouselThumbnails('apartmentCarousel');
    syncCarouselThumbnails('paymentCarousel');
    syncCarouselThumbnails('scheduleCarousel');
    syncCarouselThumbnails('legalCarousel');

    syncCarouselTracker('amenitiesCarousel');
    syncCarouselTracker('apartmentCarousel');
    syncCarouselTracker('paymentCarousel');
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

// Init scrollable FAQ sidebar and interactions
function initFaqSidebar(){
    try{
        const faqSection = document.getElementById('faq');
        if(!faqSection) return;
        const details = Array.from(faqSection.querySelectorAll('.faq-list details'));
        const navList = document.getElementById('faq-nav-list');
        if(!navList || !details.length) return;

        navList.innerHTML = '';

        details.forEach((detail, idx) => {
            const summary = detail.querySelector('summary');
            const text = summary ? summary.textContent.trim() : `Câu hỏi ${idx+1}`;
            const li = document.createElement('li');
            li.textContent = text;
            li.tabIndex = 0;
            li.addEventListener('click', () => openDetail(idx));
            li.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDetail(idx); } });
            navList.appendChild(li);
        });

        function openDetail(index){
            details.forEach((d,i)=> d.open = (i===index));
            Array.from(navList.children).forEach((c,i)=> c.classList.toggle('active', i===index));
            const scrollEl = faqSection.querySelector('.faq-scroll');
            const target = details[index];
            if(scrollEl && target){
                const top = target.offsetTop - scrollEl.offsetTop - 12;
                scrollEl.scrollTo({ top, behavior: 'smooth' });
            } else if(target){
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        // Ensure only one open at a time and update active nav state
        details.forEach((detail, idx) => {
            detail.addEventListener('toggle', () => {
                if(detail.open){
                    details.forEach((d,i)=> { if(d !== detail) d.open = false; });
                    Array.from(navList.children).forEach((c,i)=> c.classList.toggle('active', i===idx));
                } else {
                    Array.from(navList.children).forEach((c,i)=> c.classList.remove('active'));
                }
            });
        });

    } catch (err){
        console.error('initFaqSidebar error', err);
    }
}

document.addEventListener('DOMContentLoaded', initFaqSidebar);

// FAQ scroll progress indicator
function initFaqProgress(){
    try{
        const faqSection = document.getElementById('faq');
        if(!faqSection) return;
        const scrollEl = faqSection.querySelector('.faq-scroll');
        const fill = faqSection.querySelector('.faq-progress-fill');
        if(!scrollEl || !fill) return;

        function update(){
            const scrollTop = scrollEl.scrollTop;
            const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
            const pct = scrollHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)) : 0;
            fill.style.width = pct + '%';
        }

        scrollEl.addEventListener('scroll', update, { passive: true });
        // update on resize and initial
        window.addEventListener('resize', update);
        update();
    }catch(err){ console.error('initFaqProgress', err); }
}

document.addEventListener('DOMContentLoaded', initFaqProgress);


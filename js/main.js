const SCRIPT_URL =
"https://script.google.com/macros/s/AKfycbybHD85YZ8EvpRLEGyGAkCYfBALElrH338ca5JwNN84HsFjNCQ4MAr5-NscEDFUkGxdjg/exec";

document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("leadForm");

    if (!form) return;

    const btn = form.querySelector("button");
    const originalText = btn.innerText;

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


    syncCarouselThumbnails('amenitiesCarousel');
    syncCarouselThumbnails('apartmentCarousel');
    syncCarouselThumbnails('paymentCarousel');

    syncCarouselTracker('amenitiesCarousel');
    syncCarouselTracker('apartmentCarousel');
    syncCarouselTracker('paymentCarousel');

    const initProjectsCarousel = () => {
        const section = document.getElementById('projects');
        if (!section) return;

        const track = section.querySelector('.project-carousel-track');
        const prev = section.querySelector('.carousel-nav-prev');
        const next = section.querySelector('.carousel-nav-next');
        const dotsContainer = section.querySelector('.carousel-dots');
        const cards = Array.from(section.querySelectorAll('.project-card-slide'));

        if (!track || !prev || !next || cards.length === 0) return;

        const groupSize = 2;
        const pages = Math.max(1, Math.ceil(cards.length / groupSize));
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
                card.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'start', block: 'nearest' });
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

        createDots();
        scrollToPage(0, false);
        updateButtons();
    };

    initProjectsCarousel();

    // init single-panel payment switcher
    initPaymentTabs();

});

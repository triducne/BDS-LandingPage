console.log("TRÍ ĐỨC REALTY READY");

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

    syncCarouselThumbnails('amenitiesCarousel');
    syncCarouselThumbnails('apartmentCarousel');

    syncCarouselTracker('amenitiesCarousel');
    syncCarouselTracker('apartmentCarousel');

});

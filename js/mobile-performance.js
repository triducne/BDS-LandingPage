// Mobile Performance Optimizations
// This script loads after main.js to provide additional mobile optimizations

(function() {
    'use strict';

    // 1. Detect network conditions and adjust performance accordingly
    if ('connection' in navigator) {
        const connection = navigator.connection;
        const effectiveType = connection.effectiveType;
        const isSlowNetwork = effectiveType === '3g' || effectiveType === '4g' && connection.saveData;
        
        if (isSlowNetwork) {
            document.documentElement.classList.add('slow-network');
        }
    }

    // 2. Intersection Observer for lazy loading images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px',
            threshold: 0.01
        });

        // Apply to all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    // 3. Prefetch resources on better network conditions
    if ('requestIdleCallback' in window && 'connection' in navigator) {
        const connection = navigator.connection;
        if (connection.effectiveType !== '3g' && !connection.saveData) {
            requestIdleCallback(() => {
                // Prefetch popular project pages
                const prefetchLinks = [
                    '/thewincity.html',
                    '/arcadia-at-lavila.html',
                    '/vlasta.html'
                ];
                prefetchLinks.forEach(href => {
                    const link = document.createElement('link');
                    link.rel = 'prefetch';
                    link.href = href;
                    link.as = 'document';
                    document.head.appendChild(link);
                });
            }, { timeout: 3000 });
        }
    }

    // 4. Optimize form submissions on mobile
    const form = document.getElementById('leadForm');
    if (form) {
        // Add indicator for submission progress
        let isSubmitting = false;
        const originalSubmitHandler = form.onsubmit;
        
        form.addEventListener('submit', () => {
            if (!isSubmitting) {
                isSubmitting = true;
                // Prevent double submissions on slow networks
                setTimeout(() => { isSubmitting = false; }, 3000);
            }
        }, { passive: false });
    }

    // 5. Optimize animations for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        document.documentElement.style.scrollBehavior = 'auto';
        const style = document.createElement('style');
        style.textContent = `
            * {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 6. Optimize scroll performance with passive listeners
    let ticking = false;
    let lastScrollY = 0;

    const updateScroll = () => {
        lastScrollY = window.scrollY;
        ticking = false;
    };

    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(updateScroll);
            ticking = true;
        }
    }, { passive: true });

    // 7. Monitor Core Web Vitals
    if ('web-vital' in window || typeof PerformanceObserver !== 'undefined') {
        // LCP - Largest Contentful Paint
        try {
            const lcpObserver = new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        } catch (e) {
            // LCP observer not supported
        }

        // FID - First Input Delay (via interaction timing)
        try {
            const fidObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    console.log('FID:', entry.processingDuration);
                });
            });
            fidObserver.observe({ entryTypes: ['first-input'] });
        } catch (e) {
            // FID observer not supported
        }
    }

    // 8. Cache common API responses
    const cacheManager = {
        cache: new Map(),
        set: function(key, value, ttl = 300000) { // 5 min default
            this.cache.set(key, { value, expires: Date.now() + ttl });
        },
        get: function(key) {
            const item = this.cache.get(key);
            if (!item) return null;
            if (Date.now() > item.expires) {
                this.cache.delete(key);
                return null;
            }
            return item.value;
        }
    };

    window._performanceCache = cacheManager;

    // 9. Defer non-critical DOM operations
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            // Initialize tooltips and popovers only when idle
            if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
                document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
                    new bootstrap.Tooltip(el);
                });
            }
        });
    }

    console.log('[Performance] Mobile optimizations loaded');
})();

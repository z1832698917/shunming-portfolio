/**
 * ?????? - Main JavaScript v2.0
 * Premium interactive portfolio with stunning animations
 */

(function() {
    'use strict';

    // ========================================
    // State
    // ========================================
    const state = {
        expandedCard: null,
        expandedCategory: null,
        expandedItem: null,
        lightboxImages: [],
        lightboxIndex: 0,
        isAnimating: false,
        mouseX: 0,
        mouseY: 0,
        cursorX: 0,
        cursorY: 0,
        ringX: 0,
        ringY: 0,
        currentBgColor: null,
        raf: null
    };

    // ========================================
    // DOM Cache
    // ========================================
    const dom = {
        nav: document.getElementById('mainNav'),
        dynamicBg: document.getElementById('dynamicBg'),
        lightbox: document.getElementById('lightbox'),
        lightboxImg: document.getElementById('lightboxImg'),
        lightboxClose: document.getElementById('lightboxClose'),
        lightboxPrev: document.getElementById('lightboxPrev'),
        lightboxNext: document.getElementById('lightboxNext'),
        lightboxCounter: document.getElementById('lightboxCounter'),
        backdrop: null,
        closeBtn: null,
        expandedContainer: null,
        cursorDot: null,
        cursorRing: null
    };

    // ========================================
    // Utility
    // ========================================
    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function debounce(fn, ms) {
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => fn(...args), ms);
        };
    }

    function hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    function colorToRgba(color, alpha) {
        // Handle hex
        if (color.startsWith('#')) {
            const rgb = hexToRgb(color);
            if (rgb) return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
        }
        // Handle rgb()
        const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${alpha})`;
        }
        return `rgba(201, 169, 98, ${alpha})`;
    }

    // ========================================
    // Custom Cursor
    // ========================================
    function initCursor() {
        dom.cursorDot = document.createElement('div');
        dom.cursorDot.className = 'cursor-dot';
        
        dom.cursorRing = document.createElement('div');
        dom.cursorRing.className = 'cursor-ring';
        
        document.body.appendChild(dom.cursorDot);
        document.body.appendChild(dom.cursorRing);

        document.addEventListener('mousemove', (e) => {
            state.mouseX = e.clientX;
            state.mouseY = e.clientY;
        });

        // Hover effects
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('a, button, .collection-card, .expanded-image, .nav-link');
            if (target) {
                dom.cursorRing.classList.add('hover');
            }
        });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('a, button, .collection-card, .expanded-image, .nav-link');
            if (target) {
                dom.cursorRing.classList.remove('hover');
            }
        });

        document.addEventListener('mousedown', () => {
            dom.cursorRing.classList.add('click');
        });

        document.addEventListener('mouseup', () => {
            dom.cursorRing.classList.remove('click');
        });

        animateCursor();
    }

    function animateCursor() {
        // Dot follows mouse directly
        dom.cursorDot.style.left = state.mouseX + 'px';
        dom.cursorDot.style.top = state.mouseY + 'px';

        // Ring follows with lag
        state.ringX = lerp(state.ringX, state.mouseX, 0.12);
        state.ringY = lerp(state.ringY, state.mouseY, 0.12);
        dom.cursorRing.style.left = state.ringX + 'px';
        dom.cursorRing.style.top = state.ringY + 'px';

        requestAnimationFrame(animateCursor);
    }

    // ========================================
    // Color Extraction & Background Transition
    // ========================================
    function extractDominantColor(imgEl) {
        return new Promise((resolve) => {
            try {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = 40;
                canvas.height = 40;

                const img = new Image();
                img.crossOrigin = 'Anonymous';
                img.onload = () => {
                    ctx.drawImage(img, 0, 0, 40, 40);
                    const data = ctx.getImageData(0, 0, 40, 40).data;
                    
                    let r = 0, g = 0, b = 0, count = 0;
                    for (let i = 0; i < data.length; i += 4) {
                        // Skip very dark or very light pixels
                        const brightness = (data[i] + data[i+1] + data[i+2]) / 3;
                        if (brightness > 20 && brightness < 235) {
                            r += data[i];
                            g += data[i+1];
                            b += data[i+2];
                            count++;
                        }
                    }
                    
                    if (count > 0) {
                        r = Math.round(r / count);
                        g = Math.round(g / count);
                        b = Math.round(b / count);
                        resolve(`rgb(${r}, ${g}, ${b})`);
                    } else {
                        resolve('rgb(201, 169, 98)');
                    }
                };
                img.onerror = () => resolve('rgb(201, 169, 98)');
                img.src = imgEl.src;
            } catch (e) {
                resolve('rgb(201, 169, 98)');
            }
        });
    }

    function applyBgColor(color) {
        if (!color) return;
        const tintColor = colorToRgba(color, 0.12);
        dom.dynamicBg.style.backgroundColor = tintColor;
        state.currentBgColor = color;
    }

    function resetBgColor() {
        dom.dynamicBg.style.backgroundColor = 'transparent';
        state.currentBgColor = null;
    }

    // ========================================
    // Portfolio Rendering
    // ========================================
    function renderPortfolio() {
        const categories = [
            { key: 'photography', gridId: 'photographyGrid' },
            { key: 'ecommerce', gridId: 'ecommerceGrid' },
            { key: 'typesetting', gridId: 'typesettingGrid' }
        ];

        categories.forEach(({ key, gridId }) => {
            const grid = document.getElementById(gridId);
            if (!grid || !PORTFOLIO_DATA[key]) return;

            grid.innerHTML = '';
            grid.classList.add('reveal-stagger');

            PORTFOLIO_DATA[key].forEach((item, index) => {
                const card = createCollectionCard(item, key, index);
                grid.appendChild(card);
            });
        });
    }

    function createCollectionCard(item, category, index) {
        const card = document.createElement('div');
        card.className = 'collection-card';
        card.dataset.id = item.id;
        card.dataset.category = category;
        card.dataset.index = index;

        // Cover
        const cover = document.createElement('div');
        cover.className = 'card-cover';

        const img = document.createElement('img');
        // ?????????
        const defaultImg = `https://picsum.photos/seed/${item.id}/800/1000`;
        img.src = item.cover || defaultImg;
        img.alt = item.title;
        img.loading = 'lazy';
        img.className = 'img-loading';
        
        // ????
        img.onload = () => img.classList.remove('img-loading');
        
        // ?????????????
        img.onerror = function() {
            img.classList.remove('img-loading');
            // ????????
            const color = item.images && item.images[0] && item.images[0].color 
                ? item.images[0].color.replace('#', '') 
                : '667eea';
            img.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='1000'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23${color};stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%23${color}99;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='800' height='1000'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Arial' font-size='24'%3E${item.title}%3C/text%3E%3C/svg%3E`;
        };
        
        cover.appendChild(img);

        // Hover hint icon
        const hint = document.createElement('div');
        hint.className = 'card-hover-hint';
        hint.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
            <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
        </svg>`;
        cover.appendChild(hint);

        // Info
        const info = document.createElement('div');
        info.className = 'card-info';
        info.innerHTML = `
            <h3 class="card-title">${item.title}</h3>
            <span class="card-count">${item.images.length} ????/span>
        `;

        card.appendChild(cover);
        card.appendChild(info);

        // Click to expand
        card.addEventListener('click', () => {
            if (state.isAnimating) return;
            expandCard(card, item, category);
        });

        return card;
    }

    // ========================================
    // Card Expansion
    // ========================================
    function createExpandedUI() {
        // Backdrop
        if (!dom.backdrop) {
            dom.backdrop = document.createElement('div');
            dom.backdrop.className = 'card-backdrop';
            document.body.appendChild(dom.backdrop);
        }

        // Close button
        if (!dom.closeBtn) {
            dom.closeBtn = document.createElement('button');
            dom.closeBtn.className = 'card-close-btn';
            dom.closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>`;
            document.body.appendChild(dom.closeBtn);
        }

        // Expanded container
        if (!dom.expandedContainer) {
            dom.expandedContainer = document.createElement('div');
            dom.expandedContainer.className = 'expanded-container';
            dom.expandedContainer.innerHTML = `
                <div class="expanded-title"></div>
                <div class="expanded-images-row"></div>
            `;
            document.body.appendChild(dom.expandedContainer);
        }
    }

    function expandCard(card, item, category) {
        if (state.isAnimating) return;
        state.isAnimating = true;
        state.expandedCard = card;
        state.expandedItem = item;
        state.expandedCategory = category;

        createExpandedUI();

        // Set title
        dom.expandedContainer.querySelector('.expanded-title').textContent = item.title;

        // Build images row
        const row = dom.expandedContainer.querySelector('.expanded-images-row');
        row.innerHTML = '';

        item.images.forEach((imgData, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'expanded-image';
            wrapper.dataset.index = index;

            const img = document.createElement('img');
            img.src = imgData.url;
            img.alt = `${item.title} - ${index + 1}`;
            img.loading = 'lazy';

            const expandIcon = document.createElement('div');
            expandIcon.className = 'expand-icon';
            expandIcon.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>
            </svg>`;

            wrapper.appendChild(img);
            wrapper.appendChild(expandIcon);
            row.appendChild(wrapper);

            // Color transition on hover
            wrapper.addEventListener('mouseenter', async () => {
                const color = imgData.color || await extractDominantColor(img);
                applyBgColor(color);
            });

            wrapper.addEventListener('mouseleave', () => {
                resetBgColor();
            });

            // Click to open lightbox
            wrapper.addEventListener('click', (e) => {
                e.stopPropagation();
                openLightbox(item.images, index);
            });
        });

        // Animate in
        requestAnimationFrame(() => {
            dom.backdrop.classList.add('active');
            dom.closeBtn.classList.add('active');
            dom.expandedContainer.classList.add('active');
            document.body.style.overflow = 'hidden';

            // Stagger images
            const images = row.querySelectorAll('.expanded-image');
            images.forEach((img, i) => {
                setTimeout(() => {
                    img.classList.add('visible');
                }, 80 + i * 60);
            });

            setTimeout(() => {
                state.isAnimating = false;
            }, 800);
        });

        // Close handlers
        const closeHandler = () => collapseCard();
        dom.backdrop.addEventListener('click', closeHandler, { once: true });
        dom.closeBtn.addEventListener('click', closeHandler, { once: true });

        // Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                collapseCard();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    function collapseCard() {
        if (!state.expandedCard || state.isAnimating) return;
        state.isAnimating = true;

        // Animate images out
        const images = dom.expandedContainer.querySelectorAll('.expanded-image');
        images.forEach((img, i) => {
            setTimeout(() => {
                img.classList.remove('visible');
            }, i * 40);
        });

        setTimeout(() => {
            dom.backdrop.classList.remove('active');
            dom.closeBtn.classList.remove('active');
            dom.expandedContainer.classList.remove('active');
            document.body.style.overflow = '';
            resetBgColor();

            state.expandedCard = null;
            state.expandedItem = null;
            state.expandedCategory = null;
            state.isAnimating = false;
        }, 400);
    }

    // ========================================
    // Lightbox
    // ========================================
    function openLightbox(images, startIndex = 0) {
        state.lightboxImages = images;
        state.lightboxIndex = startIndex;
        updateLightboxImage();
        dom.lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        dom.lightbox.classList.remove('active');
        document.body.style.overflow = state.expandedCard ? 'hidden' : '';
        state.lightboxImages = [];
        state.lightboxIndex = 0;
        resetBgColor();
    }

    function updateLightboxImage() {
        const image = state.lightboxImages[state.lightboxIndex];
        if (!image) return;

        dom.lightboxImg.style.opacity = '0';
        dom.lightboxImg.style.transform = 'scale(0.95)';

        setTimeout(() => {
            dom.lightboxImg.src = image.url;
            dom.lightboxImg.onload = () => {
                dom.lightboxImg.style.opacity = '1';
                dom.lightboxImg.style.transform = 'scale(1)';
            };
        }, 150);

        dom.lightboxCounter.textContent = `${state.lightboxIndex + 1} / ${state.lightboxImages.length}`;

        if (image.color) {
            applyBgColor(image.color);
        }
    }

    function navigateLightbox(dir) {
        state.lightboxIndex = (state.lightboxIndex + dir + state.lightboxImages.length) % state.lightboxImages.length;
        updateLightboxImage();
    }

    // ========================================
    // Navigation
    // ========================================
    function handleScroll() {
        const scrollY = window.scrollY;

        // Nav scroll state
        if (scrollY > 80) {
            dom.nav.classList.add('scrolled');
        } else {
            dom.nav.classList.remove('scrolled');
        }

        // Active nav link
        const sections = document.querySelectorAll('.portfolio-section');
        let current = '';

        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 300) {
                current = section.id;
            }
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
        });
    }

    // ========================================
    // Scroll Reveal
    // ========================================
    function initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        document.querySelectorAll('.reveal, .reveal-stagger, .section-header').forEach(el => {
            el.classList.add('reveal');
            observer.observe(el);
        });

        // Observe masonry grids
        document.querySelectorAll('.masonry-grid').forEach(grid => {
            grid.classList.add('reveal-stagger');
            observer.observe(grid);
        });
    }

    // ========================================
    // Event Listeners
    // ========================================
    function setupEventListeners() {
        // Scroll
        window.addEventListener('scroll', debounce(handleScroll, 10), { passive: true });

        // Lightbox
        dom.lightboxClose.addEventListener('click', closeLightbox);
        dom.lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
        dom.lightboxNext.addEventListener('click', () => navigateLightbox(1));

        dom.lightbox.addEventListener('click', (e) => {
            if (e.target === dom.lightbox) closeLightbox();
        });

        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (dom.lightbox.classList.contains('active')) {
                if (e.key === 'Escape') closeLightbox();
                if (e.key === 'ArrowLeft') navigateLightbox(-1);
                if (e.key === 'ArrowRight') navigateLightbox(1);
            }
        });

        // Smooth scroll nav
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        // Touch swipe for lightbox
        let touchStartX = 0;
        dom.lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        dom.lightbox.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                navigateLightbox(diff > 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    // ========================================
    // Initialize
    // ========================================
    function init() {
        // Render portfolio(????????)
        renderPortfolio();

        // ? Gitee ???????,????
        window.addEventListener('portfolioDataReady', () => renderPortfolio());
        window.addEventListener('portfolioDataUpdated', () => renderPortfolio());

        // Setup interactions
        setupEventListeners();
        initCursor();
        initScrollReveal();

        // Initial scroll check
        handleScroll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

(function() {
    'use strict';

    // ========== Banner & Premium Element Selectors ==========
    const BANNER_SELECTORS = [
        '.banner-wrapper',
        '[class*="InlineBanner_inline-banner"]',
        '[class*="PremiumBannerBlobWrapper"]',
        '[class*="PremiumPageClarificationBanner"]',
        '[class*="PremiumBannerHeader"]',
        '[class*="PremiumBannerBenefitsList"]',
        '[class*="PremiumBannerButtons"]',
        '[data-test-selector="modal-document-viewer-preview-message"]',
        '[data-test-selector="preview-banner-upgrade-first-cta"]',
        '[data-test-selector="preview-banner-upload-second-cta"]',
        '._95f5f1767857',
        '._3273140306b6',
        '._8690b6fc16a3',
        '._4d5ecd011027',
        '[class*="premium-banner-wrapper"]',
        '[class*="ViewerContainer_premium"]',
    ];

    // ========== Premium Badge Selectors ==========
    const PREMIUM_BADGE_SELECTORS = [
        '[class*="PremiumBadge"]',
        '[class*="premium-badge"]',
        '[class*="premiumBadge"]',
        '[class*="PremiumLabel"]',
        '[class*="premiumLabel"]',
        '[class*="premium-label"]',
        '[class*="PremiumTag"]',
        '[class*="premiumTag"]',
        '[class*="premium-tag"]',
        '[class*="premium_tag"]',
        '[class*="premium_badge"]',
        '[class*="PremiumIcon"]',
        '[class*="premiumIcon"]',
        '[class*="premium-icon"]',
        '[data-test-selector*="premium-badge"]',
        '[data-test-selector*="premium-tag"]',
        '[data-test-selector*="premium-label"]',
    ];

    // ========== Ad & AI-Toolbar Selectors ==========
    const AD_SELECTORS = [
        '[class*="AdsContainer"]',
        'r89-standalone',
        '[id^="r89-"]',
        '[id*="r89-"]',
        'iframe[id^="google_ads_iframe"]',
        'div[id^="google_ads_iframe"]',
        '[id^="div-gpt-ad"]',
        '[id*="gpt-ad"]',
        '[id*="adagio"]',
        '[class*="adagio"]',
        '[class*="Advertisement"]',
        '[class*="advertisement"]',
    ];

    const AI_TOOLBAR_SELECTORS = [
        '[class*="AIToolbar"]',
    ];

    function removeAdsAndAI() {
        AD_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                });
            } catch(e) {}
        });
        AI_TOOLBAR_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    el.style.setProperty('display', 'none', 'important');
                    el.style.setProperty('visibility', 'hidden', 'important');
                });
            } catch(e) {}
        });
    }

    // ========== Document Access Data (cached) ==========
    let _docAccessData = null;

    function getDocumentAccessData() {
        if (_docAccessData) return _docAccessData;
        try {
            const nextDataEl = document.querySelector('#__NEXT_DATA__');
            if (!nextDataEl) return null;
            const data = JSON.parse(nextDataEl.textContent);
            const da = data.props?.pageProps?.documentAccess;
            if (da && da.objectKey && da.signedQueryParams) {
                const doc = data.props?.pageProps?.document;
                _docAccessData = {
                    objectKey: da.objectKey,
                    pngParams: da.signedQueryParams.png || '',
                    blurredPageParams: da.signedQueryParams.blurredPage || '',
                    hasBlurredPages: da.hasBlurredPages || false,
                    pageCount: doc ? (doc.pageCount || 0) : 0,
                };
                return _docAccessData;
            }
        } catch(e) {}
        return null;
    }

    // ========== Lazy Load & Image Fix ==========

    let _lazyLoadDone = false;

    function triggerLazyLoadAndFixImages() {
        if (_lazyLoadDone) return;
        const accessData = getDocumentAccessData();
        if (!accessData || !accessData.pngParams) return;

        const pfs = document.querySelectorAll('.pf');
        if (pfs.length === 0) return;
        _lazyLoadDone = true;

        console.log('StudocuHack: Triggering lazy load for ' + pfs.length + ' pages');

        let scrollIdx = 0;
        const previewEnd = Math.min(7, pfs.length); 

        function scrollNext() {
            if (scrollIdx >= previewEnd) {
                setTimeout(fixAllPageImages, 1500);
                return;
            }
            pfs[scrollIdx].scrollIntoView({ behavior: 'instant' });
            scrollIdx++;
            setTimeout(scrollNext, 300);
        }

        const scrollContainer = document.getElementById('viewer-wrapper') ||
                                document.getElementById('document-wrapper') ||
                                document.scrollingElement || document.documentElement;
        const savedScrollTop = scrollContainer.scrollTop;

        scrollNext();

        function fixAllPageImages() {
            scrollContainer.scrollTop = savedScrollTop;

            const pngBase = 'https://doc-assets.studocu.com/' +
                accessData.objectKey + '/html/bg';
            const pngSuffix = '.png' + accessData.pngParams;

            pfs.forEach((pf, idx) => {
                const pageNum = idx + 1;
                const imgs = pf.querySelectorAll('img');
                const hasText = pf.querySelectorAll('span').length > 0;
                const hasContent = pf.innerHTML.length > 300;

                if (imgs.length > 0) {
                    imgs.forEach(img => {
                        if (img.naturalWidth === 0 && !img.complete) {
                            img.loading = 'eager';
                            const currentSrc = img.src;
                            if (currentSrc && currentSrc.includes('/html/bg')) {
                                img.src = '';
                                img.src = currentSrc;
                            } else {
                                img.src = pngBase + pageNum.toString(16) + pngSuffix;
                            }
                            img.dataset.shFixed = 'true';
                        }
                    });
                }

                if (!hasContent && imgs.length === 0) {
                    injectPageImage(pf, pageNum, pngBase, pngSuffix);
                }
            });

            console.log('StudocuHack: Image fix complete');
        }
    }

    function injectPageImage(pf, pageNum, pngBase, pngSuffix) {
        const testImg = new Image();
        const hexNum = pageNum.toString(16);
        const imgUrl = pngBase + hexNum + pngSuffix;

        testImg.onload = function() {
            const pageContent = pf.querySelector('.page-content') ||
                                pf.querySelector('[class*="page-content"]');

            if (pageContent) {
                pageContent.innerHTML = '';
                const img = document.createElement('img');
                img.src = imgUrl;
                img.className = 'bi x0 y0 w1 h1';
                img.alt = '';
                img.style.cssText = 'width:100%;height:auto;opacity:1;filter:none;visibility:visible;';
                img.loading = 'eager';
                img.dataset.shInjected = 'true';
                pageContent.appendChild(img);
                pageContent.style.display = 'block';
                pageContent.style.visibility = 'visible';
            } else {
                const wrapper = document.createElement('div');
                wrapper.className = 'page-content nofilter';
                wrapper.style.cssText = 'display:block;visibility:visible;filter:none;opacity:1;';
                const img = document.createElement('img');
                img.src = imgUrl;
                img.className = 'bi x0 y0 w1 h1';
                img.alt = '';
                img.style.cssText = 'width:100%;height:auto;opacity:1;filter:none;visibility:visible;';
                img.loading = 'eager';
                img.dataset.shInjected = 'true';
                wrapper.appendChild(img);

                const existingChildren = pf.querySelectorAll('div');
                existingChildren.forEach(child => {
                    if (child.innerHTML.trim().length < 50) {
                        child.remove();
                    }
                });
                pf.appendChild(wrapper);
            }

            pf.style.display = '';
            pf.style.visibility = 'visible';
            pf.style.opacity = '1';
            console.log('StudocuHack: Injected image for page ' + pageNum);
        };

        testImg.onerror = function() {
            // Image not accessible
        };

        testImg.src = imgUrl;
    }

    // ========== Core Functions ==========

    function removeBanners() {
        BANNER_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => el.remove());
            } catch(e) {}
        });

        const modal = document.querySelector('#modal-overlay');
        if (modal) modal.style.display = 'none';
    }

    function unblurImages() {
        const accessData = getDocumentAccessData();
        if (!accessData || !accessData.pngParams) return;

        document.querySelectorAll('.pf img').forEach(img => {
            if (img.dataset.shUnblurred) return;

            const src = img.src || img.getAttribute('src') || '';
            if (src.includes('/pages/blurred/') || src.includes('/blurred/page')) {
                const match = src.match(/page(\d+)\./);
                if (match) {
                    const pageNum = parseInt(match[1]);
                    const clearUrl = 'https://doc-assets.studocu.com/' +
                        accessData.objectKey + '/html/bg' + pageNum.toString(16) + '.png' +
                        accessData.pngParams;

                    const testImg = new Image();
                    testImg.onload = function() {
                        img.src = clearUrl;
                        img.style.filter = 'none';
                        img.style.opacity = '1';
                        img.dataset.shUnblurred = 'true';
                    };
                    testImg.onerror = function() {
                        img.style.filter = 'none';
                        img.style.opacity = '1';
                    };
                    testImg.src = clearUrl;
                }
            }
        });

        document.querySelectorAll('.pf img[data-src*="blurred"], .pf img[srcset*="blurred"]').forEach(img => {
            if (img.dataset.shUnblurred) return;
            const dataSrc = img.dataset.src || '';
            const match = dataSrc.match(/page(\d+)\./);
            if (match) {
                const pageNum = parseInt(match[1]);
                const clearUrl = 'https://doc-assets.studocu.com/' +
                    accessData.objectKey + '/html/bg' + pageNum.toString(16) + '.png' +
                    accessData.pngParams;
                img.dataset.src = clearUrl;
                img.removeAttribute('srcset');
                img.dataset.shUnblurred = 'true';
            }
        });
    }

    function removeBlur() {
        document.querySelectorAll('.pf').forEach(pf => {
            pf.style.filter = 'none';
            pf.style.webkitFilter = 'none';
            pf.style.opacity = '1';
            pf.style.userSelect = 'auto';
            pf.style.pointerEvents = 'auto';
            pf.style.clipPath = 'none';
            pf.style.webkitClipPath = 'none';
            pf.classList.add('nofilter');
            Array.from(pf.classList).forEach(cls => {
                if (cls.includes('blurred') || cls.includes('Blurred')) {
                    pf.classList.remove(cls);
                }
            });
        });

        document.querySelectorAll('.page-content').forEach(page => {
            page.style.filter = 'none';
            page.style.webkitFilter = 'none';
            page.style.opacity = '1';
            page.style.userSelect = 'auto';
            page.style.pointerEvents = 'auto';
            page.style.visibility = 'visible';
            page.style.clipPath = 'none';
            page.style.webkitClipPath = 'none';
            page.style.maskImage = 'none';
            page.style.webkitMaskImage = 'none';
            page.style.color = '';
            page.classList.add('nofilter');

            Array.from(page.classList).forEach(cls => {
                if (cls.includes('blurred') || cls.includes('Blurred')) {
                    page.classList.remove(cls);
                }
            });

            let ancestor = page.parentElement;
            let depth = 0;
            while (ancestor && ancestor.id !== 'page-container' && ancestor !== document.body && depth < 10) {
                const cs = getComputedStyle(ancestor);
                if (cs.filter !== 'none' || cs.opacity !== '1') {
                    ancestor.style.filter = 'none';
                    ancestor.style.webkitFilter = 'none';
                    ancestor.style.opacity = '1';
                }
                Array.from(ancestor.classList).forEach(cls => {
                    if (cls.includes('blurred') || cls.includes('Blurred')) {
                        ancestor.classList.remove(cls);
                    }
                });
                ancestor = ancestor.parentElement;
                depth++;
            }

            page.querySelectorAll('img').forEach(img => {
                img.style.width = '100%';
                img.style.height = 'auto';
                img.style.opacity = '1';
                img.style.filter = 'none';
                img.style.visibility = 'visible';
            });

            if (page.parentNode) {
                Array.from(page.parentNode.children).forEach(sibling => {
                    if (sibling !== page && sibling.className) {
                        const cn = typeof sibling.className === 'string' ? sibling.className : '';
                        if (cn.includes('PremiumPageClarification') ||
                            cn.includes('blurred') ||
                            cn.includes('Blurred') ||
                            cn.includes('premium-banner') ||
                            cn.includes('BlurredPage')) {
                            sibling.remove();
                        }
                    }
                });
            }
        });

        document.querySelectorAll('[class*="blurred-image-wrapper"], [class*="BlurredImage"], [class*="blurred-page"]').forEach(el => {
            el.style.filter = 'none';
            el.style.opacity = '1';
            el.style.visibility = 'visible';
            Array.from(el.classList).forEach(cls => {
                if (cls.includes('blurred') || cls.includes('Blurred')) {
                    el.classList.remove(cls);
                }
            });
        });

        document.querySelectorAll('.blurred-container').forEach(container => {
            container.classList.remove('blurred-container');
        });

        document.querySelectorAll('#modal-overlay, [class*="PremiumOverlay"], [class*="premium-overlay"]').forEach(el => {
            el.style.display = 'none';
        });

        unblurImages();
    }

    function removeStudocuDownloadButtons() {
        document.querySelectorAll('[data-test-selector="document-viewer-download-button-topbar"]').forEach(el => {
            if (!el.classList.contains('download-button-1') && !el.querySelector('.download-button-1')) {
                el.remove();
            }
        });

        document.querySelectorAll('button[class*="Button_button"], a[class*="Button_button"]').forEach(el => {
            if (el.classList.contains('download-button-1')) return;
            const text = el.textContent.trim().toLowerCase();
            if (text === 'scarica' || text === 'download') {
                el.remove();
            }
        });

        document.querySelectorAll('div.hidden-on-mobile, div.hidden-from-tablet').forEach(container => {
            container.querySelectorAll('button, a').forEach(el => {
                if (el.classList.contains('download-button-1')) return;
                const text = el.textContent.trim().toLowerCase();
                if (text === 'scarica' || text === 'download') {
                    el.remove();
                }
            });
        });
    }

    function removePremiumButton() {
        try {
            const premiumButton = document.querySelector('#header-position-handle')?.childNodes[0]?.childNodes[1]?.childNodes[0]?.childNodes[1];
            if (premiumButton) premiumButton.remove();
        } catch(e) {}

        document.querySelectorAll('a, button').forEach(el => {
            const text = el.textContent.trim().toLowerCase();
            if (text === 'upgrade' || text === 'get premium' || text === 'go premium') {
                const parent = el.closest('[class*="header"], [class*="Header"], #header-position-handle');
                if (parent) el.remove();
            }
        });
    }

    // ========== React State Patching ==========

    function patchReactBlurState() {
        document.querySelectorAll('.pf').forEach(pf => {
            try {
                const fiberKey = Object.keys(pf).find(k => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance'));
                if (!fiberKey) return;
                let fiber = pf[fiberKey];
                let depth = 0;
                while (fiber && depth < 10) {
                    if (fiber.memoizedProps && 'isBlurred' in fiber.memoizedProps) {
                        fiber.memoizedProps.isBlurred = false;
                        fiber.memoizedProps.hasBlurredImage = false;
                        break;
                    }
                    fiber = fiber.return;
                    depth++;
                }
            } catch(e) {}
        });
    }

    function patchNextData() {
        try {
            const nextDataEl = document.querySelector('#__NEXT_DATA__');
            if (!nextDataEl) return;
            const data = JSON.parse(nextDataEl.textContent);
            if (data.props?.pageProps?.documentAccess) {
                data.props.pageProps.documentAccess.hasBlurredPages = false;
            }
            nextDataEl.textContent = JSON.stringify(data);
        } catch(e) {}
    }

    function removeRecommendations() {
        try {
            const recommendations = document.querySelector('#viewer-recommendations');
            if (recommendations && recommendations.parentNode) {
                recommendations.parentNode.remove();
            }
        } catch(e) {}
    }

    function removePremiumBadges() {
        PREMIUM_BADGE_SELECTORS.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => el.remove());
            } catch(e) {}
        });

        document.querySelectorAll('h1, [class*="Title"], [class*="title"], [class*="DocumentTitle"], [class*="documentTitle"]').forEach(titleEl => {
            const parent = titleEl.parentElement;
            if (!parent) return;
            parent.querySelectorAll('span, div, a, badge, label').forEach(el => {
                const text = el.textContent.trim();
                if (text === 'Premium' || text === 'PREMIUM') {
                    if (el.offsetHeight < 60 || el.getBoundingClientRect().width < 200) {
                        el.remove();
                    }
                }
            });
        });

        document.querySelectorAll('span, div').forEach(el => {
            if (el.children.length <= 1 && el.textContent.trim() === 'Premium') {
                const rect = el.getBoundingClientRect();
                if (rect.width > 0 && rect.width < 200 && rect.height > 0 && rect.height < 50) {
                    const isInBanner = el.closest('[class*="PremiumBanner"], [class*="PremiumPageClarification"], [class*="InlineBanner"]');
                    if (!isInBanner) {
                        el.remove();
                    }
                }
            }
        });
    }

    // ========== Logo & Branding ==========

    function updateLogos() {
        const logoSelectors = [
            '[aria-label="StudeerSnel Logo"]',
            '[aria-label="StuDocu Logo"]',
            '[aria-label="Studocu Logo"]',
        ];

        logoSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(logo => {
                if (logo.closest('.studocuhack-logo-replaced')) return;
                const wrapper = document.createElement('div');
                wrapper.classList.add('studocuhack-logo-replaced');
                wrapper.style.cssText = 'display:inline-flex;align-items:center;gap:0;cursor:pointer;';
                wrapper.innerHTML = '<svg width="24" height="24" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0"><rect width="32" height="32" rx="6" fill="#4D8BF5"/><text x="16" y="23" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="20" fill="white">S</text></svg>'
                    + '<span style="margin-left:6px;font-weight:800;font-size:15px;white-space:nowrap;"><span style="color:inherit">STUDOCU</span><span style="color:#4D8BF5">DOWNLOADER</span></span>';
                wrapper.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });
                const parent = logo.parentElement;
                if (parent) parent.replaceChild(wrapper, logo);
            });
        });
    }

    // ========== Main Execution ==========

    let debounceTimer = null;
    function debouncedCleanup() {
        if (debounceTimer) return;
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            removeBanners();
            removeBlur();
            removePremiumBadges();
            removeStudocuDownloadButtons();
            removeAdsAndAI();
        }, 50);
    }

    function runAll() {
        removeBanners();
        removeBlur();
        removePremiumButton();
        removePremiumBadges();
        removeStudocuDownloadButtons();
        removeRecommendations();
        removeAdsAndAI();
        updateLogos();
        patchReactBlurState();
    }

    runAll();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            patchNextData();
            runAll();
        });
    } else {
        patchNextData();
    }

    window.addEventListener('load', runAll);

    const observer = new MutationObserver(mutations => {
        let hasNewBlurredContent = false;
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG' && (node.src || '').includes('blurred')) {
                            hasNewBlurredContent = true;
                            break;
                        }
                        if (node.querySelector && node.querySelector('img[src*="blurred"]')) {
                            hasNewBlurredContent = true;
                            break;
                        }
                        const cn = node.className?.toString?.() || '';
                        if (cn.includes('blurred') || cn.includes('Blurred') || cn.includes('PremiumBanner') || cn.includes('premium-banner')) {
                            hasNewBlurredContent = true;
                            break;
                        }
                    }
                }
            }
            if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                const target = mutation.target;
                if (target.tagName === 'IMG' && (target.src || '').includes('blurred')) {
                    hasNewBlurredContent = true;
                }
            }
            if (hasNewBlurredContent) break;
        }

        if (hasNewBlurredContent) {
            removeBlur();
            patchReactBlurState();
        }
        debouncedCleanup();
    });

    const observeTarget = document.body || document.documentElement;
    if (observeTarget) {
        observer.observe(observeTarget, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src', 'class', 'style'],
        });
    }

    let scrollDebounce = null;
    const scrollHandler = () => {
        if (scrollDebounce) return;
        scrollDebounce = setTimeout(() => {
            scrollDebounce = null;
            removeBlur();
            patchReactBlurState();
        }, 100);
    };

    const viewerWrapper = document.getElementById('viewer-wrapper');
    const documentWrapper = document.getElementById('document-wrapper');

    if (viewerWrapper) viewerWrapper.addEventListener('scroll', scrollHandler, { passive: true });
    if (documentWrapper) documentWrapper.addEventListener('scroll', scrollHandler, { passive: true });
    window.addEventListener('scroll', scrollHandler, { passive: true });

    document.addEventListener('DOMContentLoaded', () => {
        const vw = document.getElementById('viewer-wrapper');
        const dw = document.getElementById('document-wrapper');
        if (vw) vw.addEventListener('scroll', scrollHandler, { passive: true });
        if (dw) dw.addEventListener('scroll', scrollHandler, { passive: true });
    });

    const toggleButton = document.querySelector('[data-test-selector="content-sidebar-toggle"]');
    if (toggleButton) {
        toggleButton.addEventListener('click', updateLogos);
    }

    let periodicCount = 0;
    const periodicCheck = setInterval(() => {
        removeBlur();
        patchReactBlurState();
        periodicCount++;
        if (periodicCount >= 15) {
            clearInterval(periodicCheck);
            setInterval(() => {
                removeBlur();
                patchReactBlurState();
            }, 5000);
        }
    }, 2000);
})();

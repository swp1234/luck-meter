/* ===================================================
   LUCK METER - Main Application
   =================================================== */
(async function () {
    try {
        await i18n.loadTranslations(i18n.currentLang);
        await i18n.setLanguage(i18n.currentLang);
        init();
    } catch (e) {
        console.warn('i18n init failed, continuing with defaults:', e);
        init();
    }
})();

function init() {
    /* ---------- DOM ---------- */
    var loader = document.getElementById('app-loader');
    var themeToggle = document.getElementById('theme-toggle');
    var langToggle = document.getElementById('lang-toggle');
    var langMenu = document.getElementById('lang-menu');
    var measureBtn = document.getElementById('measure-btn');
    var measureSection = document.getElementById('measure-section');
    var resultSection = document.getElementById('result-section');
    var scoreCircle = document.getElementById('score-circle');
    var scoreNumber = document.getElementById('score-number');
    var scoreTier = document.getElementById('score-tier');
    var categoryList = document.getElementById('category-list');
    var luckyItem = document.getElementById('lucky-item');
    var luckyColorSwatch = document.getElementById('lucky-color-swatch');
    var luckyColorName = document.getElementById('lucky-color-name');
    var retryBtn = document.getElementById('retry-btn');
    var shareTwitter = document.getElementById('share-twitter');
    var shareCopy = document.getElementById('share-copy');
    var toast = document.getElementById('toast');

    /* ---------- HIDE LOADER ---------- */
    try {
        if (loader) {
            setTimeout(function () {
                loader.classList.add('hidden');
                setTimeout(function () { loader.style.display = 'none'; }, 400);
            }, 500);
        }
    } catch (e) { console.error('Loader error:', e); }

    /* ---------- THEME ---------- */
    var isDark = localStorage.getItem('theme') !== 'light';
    function applyTheme() {
        if (isDark) {
            document.documentElement.removeAttribute('data-theme');
            themeToggle.innerHTML = '\u{1F319}';
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            themeToggle.innerHTML = '\u2600\uFE0F';
        }
    }
    applyTheme();
    themeToggle.addEventListener('click', function () {
        isDark = !isDark;
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        applyTheme();
    });

    /* ---------- LANGUAGE ---------- */
    langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        langMenu.classList.toggle('hidden');
    });
    document.addEventListener('click', function () { langMenu.classList.add('hidden'); });
    langMenu.addEventListener('click', function (e) { e.stopPropagation(); });
    document.querySelectorAll('.lang-option').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var lang = this.getAttribute('data-lang');
            if (typeof i18n !== 'undefined' && i18n.setLanguage) {
                i18n.setLanguage(lang);
            }
            langMenu.classList.add('hidden');
        });
    });

    /* ---------- TRANSLATION HELPER ---------- */
    function t(key, fallback) {
        if (typeof i18n !== 'undefined' && i18n.t) {
            var val = i18n.t(key);
            return (val && val !== key) ? val : (fallback || key);
        }
        return fallback || key;
    }

    /* ---------- SEEDED RANDOM (date-based) ---------- */
    function dateSeed() {
        var d = new Date();
        return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
    }

    function seededRandom(seed) {
        // Simple mulberry32
        var t = seed + 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    function generateScore() {
        var seed = dateSeed();
        // Base from date, add small random variation (+/- 10)
        var base = Math.floor(seededRandom(seed) * 101);
        var variation = Math.floor(Math.random() * 21) - 10;
        var score = Math.max(0, Math.min(100, base + variation));
        return score;
    }

    function generateCategoryStars(mainScore) {
        var seed = dateSeed();
        var categories = ['love', 'money', 'health', 'career', 'social'];
        var results = {};
        categories.forEach(function (cat, idx) {
            var catSeed = seed + idx * 7919; // prime offset per category
            var baseStars = Math.floor(seededRandom(catSeed) * 5) + 1;
            // Slight random variation
            var shift = Math.random() < 0.3 ? (Math.random() < 0.5 ? 1 : -1) : 0;
            var stars = Math.max(1, Math.min(5, baseStars + shift));
            results[cat] = stars;
        });
        return results;
    }

    function generateLuckyItem() {
        var seed = dateSeed();
        var idx = Math.floor(seededRandom(seed + 42) * 10) + 1;
        return { key: 'items.i' + idx };
    }

    var COLOR_HEX = {
        c1: '#ef4444', c2: '#3b82f6', c3: '#22c55e', c4: '#eab308',
        c5: '#a855f7', c6: '#ec4899', c7: '#f97316', c8: '#94a3b8'
    };

    function generateLuckyColor() {
        var seed = dateSeed();
        var idx = Math.floor(seededRandom(seed + 99) * 8) + 1;
        var key = 'c' + idx;
        return { key: 'colors.' + key, hex: COLOR_HEX[key] };
    }

    function getTierClass(score) {
        if (score <= 20) return 'tier-1';
        if (score <= 40) return 'tier-2';
        if (score <= 60) return 'tier-3';
        if (score <= 80) return 'tier-4';
        return 'tier-5';
    }

    function getTierText(score) {
        if (score <= 20) return t('score.tier1', 'Very Unlucky...');
        if (score <= 40) return t('score.tier2', 'Below Average');
        if (score <= 60) return t('score.tier3', 'Average');
        if (score <= 80) return t('score.tier4', 'Lucky!');
        return t('score.tier5', 'Extremely Lucky!!');
    }

    /* ---------- RENDER STARS ---------- */
    function renderStars(count) {
        var html = '';
        for (var i = 0; i < 5; i++) {
            if (i < count) {
                html += '<span class="star-filled">\u2605</span>';
            } else {
                html += '<span class="star-empty">\u2606</span>';
            }
        }
        return html;
    }

    /* ---------- SPINNING ANIMATION ---------- */
    function animateScore(finalScore, callback) {
        var duration = 2000;
        var start = performance.now();
        var el = scoreNumber;

        function frame(now) {
            var elapsed = now - start;
            var progress = Math.min(elapsed / duration, 1);

            if (progress < 0.85) {
                // Fast random numbers
                el.textContent = Math.floor(Math.random() * 101);
            } else {
                // Ease towards final
                var eased = (progress - 0.85) / 0.15;
                var current = Math.round(finalScore * eased);
                el.textContent = current;
            }

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                el.textContent = finalScore;
                if (callback) callback();
            }
        }
        requestAnimationFrame(frame);
    }

    /* ---------- MEASURE LUCK ---------- */
    var currentScore = 0;

    function measureLuck() {
        var score = generateScore();
        currentScore = score;
        var categories = generateCategoryStars(score);
        var luckyItemData = generateLuckyItem();
        var luckyColorData = generateLuckyColor();
        var tierClass = getTierClass(score);

        // Show result section, hide measure
        resultSection.classList.remove('hidden');
        measureSection.classList.add('hidden');

        // Reset circle classes
        scoreCircle.className = 'score-circle';
        scoreTier.className = 'score-tier';
        scoreTier.textContent = '';
        scoreNumber.textContent = '0';

        // Start spinning animation
        measureBtn.classList.add('spinning');

        animateScore(score, function () {
            measureBtn.classList.remove('spinning');

            // Apply tier styling
            scoreCircle.classList.add(tierClass, 'reveal');
            scoreTier.classList.add(tierClass);
            scoreTier.textContent = getTierText(score);

            // Render categories
            categoryList.innerHTML = '';
            var catKeys = ['love', 'money', 'health', 'career', 'social'];
            catKeys.forEach(function (cat) {
                var row = document.createElement('div');
                row.className = 'category-row';
                row.innerHTML =
                    '<span class="category-name">' + t('categories.' + cat, cat) + '</span>' +
                    '<span class="category-stars">' + renderStars(categories[cat]) + '</span>';
                categoryList.appendChild(row);
            });

            // Lucky item
            luckyItem.textContent = t(luckyItemData.key, 'Four-leaf Clover');

            // Lucky color
            luckyColorSwatch.style.background = luckyColorData.hex;
            luckyColorName.textContent = t(luckyColorData.key, 'Green');
        });

        // GA4 event
        if (typeof gtag === 'function') {
            gtag('event', 'measure_luck', {
                event_category: 'luck_meter',
                event_label: 'score_' + score,
                value: score
            });
        }
    }

    /* ---------- EVENT LISTENERS ---------- */
    measureBtn.addEventListener('click', measureLuck);

    retryBtn.addEventListener('click', function () {
        resultSection.classList.add('hidden');
        measureSection.classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        if (typeof gtag === 'function') {
            gtag('event', 'retry', { event_category: 'luck_meter' });
        }
    });

    /* ---------- SHARING ---------- */
    var shareUrl = 'https://dopabrain.com/luck-meter/';

    shareTwitter.addEventListener('click', function () {
        var text = t('share.text', 'My luck score today is {score}!').replace('{score}', currentScore) + ' ' + shareUrl;
        window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text), '_blank');
        if (typeof gtag === 'function') gtag('event', 'share', { method: 'twitter', content_type: 'luck_score', item_id: String(currentScore) });
    });

    shareCopy.addEventListener('click', function () {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(shareUrl).then(function () { showToast(); });
        } else {
            var ta = document.createElement('textarea');
            ta.value = shareUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            showToast();
        }
        if (typeof gtag === 'function') gtag('event', 'share', { method: 'copy_link', content_type: 'luck_score' });
    });

    function showToast() {
        toast.classList.add('show');
        setTimeout(function () { toast.classList.remove('show'); }, 2000);
    }

    /* ---------- ADS ---------- */
    try {
        (adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) { /* ad blocker */ }
}

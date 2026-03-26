/**
 * Portfolio Data - 从 jsDelivr CDN 读取，本地缓存作备份
 */
(function() {
    'use strict';

    var CDN = 'https://cdn.jsdelivr.net/gh/z1832698917/shunming-portfolio@main';
    var DEFAULT_DATA = { photography: [], ecommerce: [], typesetting: [] };

    async function loadFromCDN() {
        try {
            var url = CDN + '/data/portfolio.json?t=' + Date.now();
            var res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch(e) { return null; }
    }

    function loadFromCache() {
        try {
            var saved = localStorage.getItem('portfolioData');
            return saved ? JSON.parse(saved) : null;
        } catch(e) { return null; }
    }

    async function init() {
        window.PORTFOLIO_DATA = loadFromCache() || DEFAULT_DATA;
        window.dispatchEvent(new CustomEvent('portfolioDataReady', { detail: window.PORTFOLIO_DATA }));
        var remote = await loadFromCDN();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    }

    window.refreshPortfolioData = async function() {
        var remote = await loadFromCDN();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    };

    window.addEventListener('storage', function(e) {
        if (e.key === 'portfolioData' && e.newValue) {
            try {
                window.PORTFOLIO_DATA = JSON.parse(e.newValue);
                window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: window.PORTFOLIO_DATA }));
            } catch(err) {}
        }
    });

    init();
})();

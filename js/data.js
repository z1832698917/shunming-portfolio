/**
 * Portfolio Data - 从 GitHub 读取，本地 localStorage 作为缓存
 */

(function () {
    'use strict';

    var GITEE = {
        username: 'z1832698917',
        repo: 'shunming-portfolio',
        branch: 'main'
    };

    var DEFAULT_DATA = {
        photography: [],
        ecommerce: [],
        typesetting: []
    };

    async function loadFromGitHub() {
        try {
            var url = 'https://raw.githubusercontent.com/' + GITEE.username + '/' + GITEE.repo + '/' + GITEE.branch + '/data/portfolio.json?t=' + Date.now();
            var res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    function loadFromCache() {
        try {
            var saved = localStorage.getItem('portfolioData');
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            return null;
        }
    }

    async function init() {
        window.PORTFOLIO_DATA = loadFromCache() || DEFAULT_DATA;
        window.dispatchEvent(new CustomEvent('portfolioDataReady', { detail: window.PORTFOLIO_DATA }));

        var remote = await loadFromGitHub();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    }

    window.refreshPortfolioData = async function () {
        var remote = await loadFromGitHub();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    };

    window.addEventListener('storage', function (e) {
        if (e.key === 'portfolioData' && e.newValue) {
            try {
                window.PORTFOLIO_DATA = JSON.parse(e.newValue);
                window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: window.PORTFOLIO_DATA }));
            } catch (err) {}
        }
    });

    init();
})();

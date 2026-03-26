/**
 * Portfolio Data - ? Gitee ??,????? Gitee,???? SM.MS ??
 */

(function () {
    'use strict';

    const GITEE = {
        username: 'z1832698917',
        repo: 'aming-web',
        branch: 'master'
    };

    const DEFAULT_DATA = {
        photography: [],
        ecommerce: [],
        typesetting: []
    };

    // ? Gitee ???? data/portfolio.json
    async function loadFromGitee() {
        try {
            const url = `https://gitee.com/${GITEE.username}/${GITEE.repo}/raw/${GITEE.branch}/data/portfolio.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    // ? localStorage ????
    function loadFromCache() {
        try {
            const saved = localStorage.getItem('portfolioData');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }

    // ???
    async function init() {
        window.PORTFOLIO_DATA = loadFromCache() || DEFAULT_DATA;
        window.dispatchEvent(new CustomEvent('portfolioDataReady', { detail: window.PORTFOLIO_DATA }));

        const remote = await loadFromGitee();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    }

    window.refreshPortfolioData = async function () {
        const remote = await loadFromGitee();
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
            } catch { /* ignore */ }
        }
    });

    init();
})();

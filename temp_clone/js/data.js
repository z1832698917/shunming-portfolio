/**
 * Portfolio Data - 从 Gitee 读取，数据保存在 Gitee，图片使用 SM.MS 图床
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

    // 从 Gitee 仓库读取 data/portfolio.json
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

    // 从 localStorage 读取缓存
    function loadFromCache() {
        try {
            const saved = localStorage.getItem('portfolioData');
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    }

    // 初始化
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

/**
 * Portfolio Data - 从 Gitee 仓库加载，本地 localStorage 作为缓存
 */

(function () {
    'use strict';

    const GITEE = {
        username: 'z1832698917',
        repo: 'aming-web',
        branch: 'master'
    };

    // 默认数据（首次访问 / 网络失败时使用）
    const DEFAULT_DATA = {
        photography: [],
        ecommerce: [],
        typesetting: []
    };

    // 从 Gitee 仓库读取 data/portfolio.json（通过 raw URL，避开 CORS）
    async function loadFromGitee() {
        try {
            // 用 raw URL 而不是 API，raw.giteeusercontent.com 支持 CORS
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

    // 初始化：先用缓存渲染，再用远端数据刷新
    async function init() {
        // 先用缓存（或默认数据）快速渲染
        window.PORTFOLIO_DATA = loadFromCache() || DEFAULT_DATA;
        window.dispatchEvent(new CustomEvent('portfolioDataReady', { detail: window.PORTFOLIO_DATA }));

        // 再从 Gitee 拉最新数据
        const remote = await loadFromGitee();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    }

    // 供管理后台调用：强制刷新
    window.refreshPortfolioData = async function () {
        const remote = await loadFromGitee();
        if (remote) {
            window.PORTFOLIO_DATA = remote;
            localStorage.setItem('portfolioData', JSON.stringify(remote));
            window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: remote }));
        }
    };

    // 监听管理后台同页面保存（同一浏览器）
    window.addEventListener('storage', function (e) {
        if (e.key === 'portfolioData' && e.newValue) {
            try {
                const newData = JSON.parse(e.newValue);
                window.PORTFOLIO_DATA = newData;
                window.dispatchEvent(new CustomEvent('portfolioDataUpdated', { detail: newData }));
            } catch { /* ignore */ }
        }
    });

    init();
})();

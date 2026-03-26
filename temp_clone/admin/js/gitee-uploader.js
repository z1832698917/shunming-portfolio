/**
 * SM.MS 免费图床上传 + Gitee 数据持久化
 * - 图片上传 → SM.MS（无需 token，公开直链，全世界可访问）
 * - 数据保存 → Gitee 仓库 data/portfolio.json
 */

(function () {
    'use strict';

    const GITEE = {
        username: 'z1832698917',
        repo: 'aming-web',
        branch: 'master'
    };

    // ── Gitee Token（仅用于保存数据到 Gitee）─────────────────────
    function getToken() {
        return localStorage.getItem('giteeToken') || '';
    }

    function saveToken(token) {
        localStorage.setItem('giteeToken', token.trim());
    }

    function isConfigured() {
        return !!getToken();
    }

    // ── 上传图片到 SM.MS（无需 token，公开直链）──────────────────
    async function upload(file) {
        const formData = new FormData();
        formData.append('smfile', file);

        try {
            const res = await fetch('https://sm.ms/api/v2/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();

            if (data.success) {
                return { success: true, url: data.data.url, message: '上传成功' };
            }
            if (data.code === 'image_repeated') {
                return { success: true, url: data.images, message: '图片已存在' };
            }
            return { success: false, url: '', message: data.message || '上传失败' };
        } catch (err) {
            return { success: false, url: '', message: err.message };
        }
    }

    // ── 批量上传 ──────────────────────────────────────────────────
    async function uploadMultiple(files, onProgress) {
        const results = [];
        for (let i = 0; i < files.length; i++) {
            if (onProgress) onProgress(i + 1, files.length, files[i].name);
            results.push({ name: files[i].name, ...(await upload(files[i])) });
            if (i < files.length - 1) await new Promise(r => setTimeout(r, 400));
        }
        return results;
    }

    // ── 读取 Gitee 上的 portfolio.json ───────────────────────────
    async function loadRemoteData() {
        try {
            const url = `https://gitee.com/${GITEE.username}/${GITEE.repo}/raw/${GITEE.branch}/data/portfolio.json?t=${Date.now()}`;
            const res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch {
            return null;
        }
    }

    // ── 保存 portfolio.json 到 Gitee ────────────────────────────
    async function saveRemoteData(portfolioData) {
        const token = getToken();
        if (!token) return { success: false, message: '请先填写 Gitee 令牌（用于保存数据）' };

        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));

            // 获取现有 SHA
            let sha = null;
            try {
                const check = await fetch(
                    `https://gitee.com/api/v5/repos/${GITEE.username}/${GITEE.repo}/contents/data/portfolio.json?access_token=${token}&ref=${GITEE.branch}`
                );
                if (check.ok) {
                    const info = await check.json();
                    sha = info.sha;
                }
            } catch {}

            const body = {
                access_token: token,
                message: 'Update portfolio data',
                content,
                branch: GITEE.branch
            };
            if (sha) body.sha = sha;

            const res = await fetch(
                `https://gitee.com/api/v5/repos/${GITEE.username}/${GITEE.repo}/contents/data/portfolio.json`,
                {
                    method: sha ? 'PUT' : 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                }
            );

            const data = await res.json();
            if (data.content) return { success: true, message: '已保存到 Gitee' };
            return { success: false, message: data.message || '保存失败' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    window.GiteeUploader = {
        upload,
        uploadMultiple,
        isConfigured,
        getToken,
        saveToken,
        loadRemoteData,
        saveRemoteData,
        config: GITEE
    };
})();

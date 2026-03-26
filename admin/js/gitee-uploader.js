/**
 * Gitee 图床 + 数据持久化模块
 * - 图片上传到 Gitee 仓库 images/ 目录
 * - 作品数据保存到 Gitee 仓库 data/portfolio.json
 */

(function () {
    'use strict';

    const GITEE = {
        username: 'z1832698917',
        repo: 'aming-web',
        branch: 'master'
    };

    // ── Token 管理 ──────────────────────────────────────────────
    function getToken() {
        return localStorage.getItem('giteeToken') || '';
    }

    function saveToken(token) {
        localStorage.setItem('giteeToken', token.trim());
    }

    function isConfigured() {
        return !!getToken();
    }

    // ── 工具函数 ─────────────────────────────────────────────────
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function apiUrl(path) {
        return `https://gitee.com/api/v5/repos/${GITEE.username}/${GITEE.repo}/contents/${path}`;
    }

    // ── 获取文件的 SHA（更新文件时需要）────────────────────────────
    async function getFileSha(path) {
        try {
            const res = await fetch(`${apiUrl(path)}?access_token=${getToken()}&ref=${GITEE.branch}`);
            if (!res.ok) return null;
            const data = await res.json();
            return data.sha || null;
        } catch {
            return null;
        }
    }

    // ── 上传单张图片 ──────────────────────────────────────────────
    async function upload(file) {
        const token = getToken();
        if (!token) {
            return { success: false, url: '', message: '请先在设置中填写 Gitee 私人令牌' };
        }

        try {
            const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
            const filename = `images/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
            const base64 = await fileToBase64(file);

            const res = await fetch(apiUrl(filename), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    access_token: token,
                    message: 'Upload image',
                    content: base64,
                    branch: GITEE.branch
                })
            });

            const data = await res.json();

            if (data.content && data.content.download_url) {
                return { success: true, url: data.content.download_url, message: '上传成功' };
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
            if (i < files.length - 1) await new Promise(r => setTimeout(r, 600));
        }
        return results;
    }

    // ── 读取远端 portfolio.json ───────────────────────────────────
    // 使用 raw URL 避免 CORS 问题（公开仓库无需 token）
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

    // ── 保存 portfolio.json 到仓库 ────────────────────────────────
    async function saveRemoteData(portfolioData) {
        const token = getToken();
        if (!token) return { success: false, message: '请先填写 Gitee 令牌' };

        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));
            const sha = await getFileSha('data/portfolio.json');

            const body = {
                access_token: token,
                message: 'Update portfolio data',
                content,
                branch: GITEE.branch
            };
            if (sha) body.sha = sha;

            const res = await fetch(apiUrl('data/portfolio.json'), {
                method: sha ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await res.json();
            if (data.content) {
                return { success: true, message: '数据已保存到 Gitee' };
            }
            return { success: false, message: data.message || '保存失败' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    // ── 导出 ──────────────────────────────────────────────────────
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

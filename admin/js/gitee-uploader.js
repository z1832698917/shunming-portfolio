/**
 * SM.MS ?????? + Gitee ?????
 * - ???? ? SM.MS(?? token,????,??????)
 * - ???? ? Gitee ?? data/portfolio.json
 */

(function () {
    'use strict';

    const GITEE = {
        username: 'z1832698917',
        repo: 'aming-web',
        branch: 'master'
    };

    // ?? Gitee Token(???????? Gitee)?????????????????????
    function getToken() {
        return localStorage.getItem('giteeToken') || '';
    }

    function saveToken(token) {
        localStorage.setItem('giteeToken', token.trim());
    }

    function isConfigured() {
        return !!getToken();
    }

    // ?? ????? SM.MS(?? token,????)??????????????????
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
                return { success: true, url: data.data.url, message: '????' };
            }
            if (data.code === 'image_repeated') {
                return { success: true, url: data.images, message: '?????' };
            }
            return { success: false, url: '', message: data.message || '????' };
        } catch (err) {
            return { success: false, url: '', message: err.message };
        }
    }

    // ?? ???? ??????????????????????????????????????????????????
    async function uploadMultiple(files, onProgress) {
        const results = [];
        for (let i = 0; i < files.length; i++) {
            if (onProgress) onProgress(i + 1, files.length, files[i].name);
            results.push({ name: files[i].name, ...(await upload(files[i])) });
            if (i < files.length - 1) await new Promise(r => setTimeout(r, 400));
        }
        return results;
    }

    // ?? ?? Gitee ?? portfolio.json ???????????????????????????
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

    // ?? ?? portfolio.json ? Gitee ????????????????????????????
    async function saveRemoteData(portfolioData) {
        const token = getToken();
        if (!token) return { success: false, message: '???? Gitee ??(??????)' };

        try {
            const content = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));

            // ???? SHA
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
            if (data.content) return { success: true, message: '???? Gitee' };
            return { success: false, message: data.message || '????' };
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

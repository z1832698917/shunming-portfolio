/**
 * SM.MS 免费图床上传 + GitHub 数据持久化
 */

(function () {
    'use strict';

    var GITEE = {
        username: 'z1832698917',
        repo: 'shunming-portfolio',
        branch: 'main'
    };

    function getToken() {
        return localStorage.getItem('giteeToken') || '';
    }

    function saveToken(token) {
        localStorage.setItem('giteeToken', token.trim());
    }

    function isConfigured() {
        return !!getToken();
    }

    function fileToBase64(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function() { resolve(reader.result.split(',')[1]); };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // 上传图片到 SM.MS
    async function upload(file) {
        var formData = new FormData();
        formData.append('smfile', file);

        try {
            var res = await fetch('https://sm.ms/api/v2/upload', {
                method: 'POST',
                body: formData
            });
            var data = await res.json();

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

    async function uploadMultiple(files, onProgress) {
        var results = [];
        for (var i = 0; i < files.length; i++) {
            if (onProgress) onProgress(i + 1, files.length, files[i].name);
            var r = await upload(files[i]);
            results.push({ name: files[i].name, success: r.success, url: r.url, message: r.message });
            if (i < files.length - 1) await new Promise(function(resolve) { setTimeout(resolve, 500); });
        }
        return results;
    }

    // 读取 GitHub 上的 portfolio.json
    async function loadRemoteData() {
        try {
            var url = 'https://raw.githubusercontent.com/' + GITEE.username + '/' + GITEE.repo + '/' + GITEE.branch + '/data/portfolio.json?t=' + Date.now();
            var res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            return null;
        }
    }

    // 保存 portfolio.json 到 GitHub
    async function saveRemoteData(portfolioData) {
        var token = getToken();
        if (!token) return { success: false, message: '请先填写 GitHub 令牌' };

        try {
            var content = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));

            // 获取现有 SHA
            var sha = null;
            try {
                var check = await fetch(
                    'https://api.github.com/repos/' + GITEE.username + '/' + GITEE.repo + '/contents/data/portfolio.json',
                    { headers: { 'Authorization': 'token ' + token } }
                );
                if (check.ok) {
                    var info = await check.json();
                    sha = info.sha;
                }
            } catch (e) {}

            var body = {
                message: 'Update portfolio data',
                content: content,
                branch: GITEE.branch
            };
            if (sha) body.sha = sha;

            var apiUrl = 'https://api.github.com/repos/' + GITEE.username + '/' + GITEE.repo + '/contents/data/portfolio.json';
            var res = await fetch(apiUrl, {
                method: sha ? 'PUT' : 'POST',
                headers: {
                    'Authorization': 'token ' + token,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            var data = await res.json();
            if (data.content) return { success: true, message: '已保存到 GitHub' };
            return { success: false, message: data.message || '保存失败' };
        } catch (err) {
            return { success: false, message: err.message };
        }
    }

    window.GiteeUploader = {
        upload: upload,
        uploadMultiple: uploadMultiple,
        isConfigured: isConfigured,
        getToken: getToken,
        saveToken: saveToken,
        loadRemoteData: loadRemoteData,
        saveRemoteData: saveRemoteData,
        config: GITEE
    };
})();

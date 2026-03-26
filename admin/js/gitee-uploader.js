/**
 * GitHub 图序 + jsDelivr CDN 加速
 * 图片URL: https://cdn.jsdelivr.net/gh/z1832698917/shunming-portfolio@main/images/文件名
 * 给图片加上时间前置。
 */
(function () {
    'use strict';

    var GITHUB = {
        owner: 'z1832698917',
        repo: 'shunming-portfolio',
        branch: 'main',
        cdn: 'https://cdn.jsdelivr.net/gh/z1832698917/shunming-portfolio@main',
        imagesPath: 'images'
    };

    var _token = '';

    function getToken() {
        if (_token) return _token;
        _token = localStorage.getItem('githubToken') || '';
        return _token;
    }

    function saveToken(token) {
        _token = token.trim();
        localStorage.setItem('githubToken', _token);
    }

    function isConfigured() {
        return !!getToken();
    }

    async function upload(file) {
        var token = getToken();
        if (!token) return { success: false, url: '', message: '请先填写 GitHub 令牌' };

        var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
        var filename = GITHUB.imagesPath + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
        var rawUrl = 'https://raw.githubusercontent.com/' + GITHUB.owner + '/' + GITHUB.repo + '/' + GITHUB.branch + '/' + filename;

        return new Promise(function(resolve) {
            var reader = new FileReader();
            reader.onload = function(e) {
                var base64 = e.target.result.split(',')[1];
                fetch(
                    'https://api.github.com/repos/' + GITHUB.owner + '/' + GITHUB.repo + '/contents/' + filename,
                    { headers: { 'Authorization': 'token ' + token } }
                ).then(function(r) { return r.ok ? r.json() : null; })
                .then(function(existing) {
                    var body = { message: 'Upload image: ' + file.name, content: base64 };
                    if (existing && existing.sha) body.sha = existing.sha;
                    fetch(
                        'https://api.github.com/repos/' + GITHUB.owner + '/' + GITHUB.repo + '/contents/' + filename,
                        {
                            method: 'PUT',
                            headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        }
                    ).then(function(r) { return r.json(); })
                    .then(function(data) {
                        if (data.content && data.content.download_url) {
                            var url = GITHUB.cdn + '/' + filename;
                            resolve({ success: true, url: url, message: '上传成功' });
                        } else {
                            resolve({ success: false, url: '', message: data.message || '上传失败' });
                        }
                    })
                    .catch(function(err) { resolve({ success: false, url: '', message: err.message }); });
                })
                .catch(function(err) { resolve({ success: false, url: '', message: err.message }); });
            };
            reader.onerror = function() { resolve({ success: false, url: '', message: '文件读取失败' }); };
            reader.readAsDataURL(file);
        });
    }

    async function uploadMultiple(files, onProgress) {
        var results = [];
        for (var i = 0; i < files.length; i++) {
            if (onProgress) onProgress(i + 1, files.length, files[i].name);
            var r = await upload(files[i]);
            results.push({ name: files[i].name, success: r.success, url: r.url, message: r.message });
            if (i < files.length - 1) await new Promise(function(res) { setTimeout(res, 800); });
        }
        return results;
    }

    async function loadRemoteData() {
        try {
            var url = GITHUB.cdn + '/data/portfolio.json?t=' + Date.now();
            var res = await fetch(url);
            if (!res.ok) return null;
            return await res.json();
        } catch (e) { return null; }
    }

    async function saveRemoteData(portfolioData) {
        var token = getToken();
        if (!token) return { success: false, message: '请先填写 GitHub 令牌' };
        try {
            var content = btoa(unescape(encodeURIComponent(JSON.stringify(portfolioData, null, 2))));
            var sha = null;
            try {
                var check = await fetch(
                    'https://api.github.com/repos/' + GITHUB.owner + '/' + GITHUB.repo + '/contents/data/portfolio.json',
                    { headers: { 'Authorization': 'token ' + token } }
                );
                if (check.ok) { var info = await check.json(); sha = info.sha; }
            } catch (e) {}
            var body = { message: 'Update portfolio data', content: content, branch: GITHUB.branch };
            if (sha) body.sha = sha;
            var res = await fetch(
                'https://api.github.com/repos/' + GITHUB.owner + '/' + GITHUB.repo + '/contents/data/portfolio.json',
                { method: sha ? 'PUT' : 'POST', headers: { 'Authorization': 'token ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
            );
            var data = await res.json();
            if (data.content) return { success: true, message: '已保存到 GitHub' };
            return { success: false, message: data.message || '保存失败' };
        } catch (err) { return { success: false, message: err.message }; }
    }

    window.GiteeUploader = {
        upload: upload, uploadMultiple: uploadMultiple,
        isConfigured: isConfigured, getToken: getToken, saveToken: saveToken,
        loadRemoteData: loadRemoteData, saveRemoteData: saveRemoteData, config: GITHUB
    };
})();

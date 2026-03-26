
(function() {
    'use strict';

    window.logout = function() {
        if (confirm('\u786e\u5b9a\u8981\u9000\u51fa\u767b\u5f55\u5417\uff1f')) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_remember');
            window.location.href = 'login.html';
        }
    };

    var portfolioData = JSON.parse(JSON.stringify(PORTFOLIO_DATA));
    var editingId = null;
    var editingCategory = null;
    var coverFile = null;
    var imageFiles = [];

    async function init() {
        setupEventListeners();
        showLoading(true);
        if (GiteeUploader.isConfigured()) {
            var remote = await GiteeUploader.loadRemoteData();
            if (remote) {
                portfolioData = remote;
                localStorage.setItem('portfolioData', JSON.stringify(remote));
            } else {
                loadFromStorage();
            }
        } else {
            loadFromStorage();
            setTimeout(function() { showTokenPrompt(); }, 500);
        }
        showLoading(false);
        renderAllCollections();
        updateStats();
    }

    function showLoading(on) {
        var el = document.getElementById('globalLoading');
        if (!el) {
            el = document.createElement('div');
            el.id = 'globalLoading';
            el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.9);display:flex;align-items:center;justify-content:center;z-index:9999;font-size:16px;color:#333;';
            el.textContent = '\u6b63\u5728\u52a0\u8f7d\u6570\u636e...';
            document.body.appendChild(el);
        }
        el.style.display = on ? 'flex' : 'none';
    }

    function showTokenPrompt() {
        var existing = GiteeUploader.getToken();
        var token = prompt(
            '\u8bf7\u8f93\u5165 GitHub \u79c1\u4eba\u4ee4\u724c\uff08\u53ea\u9700\u586b\u5199\u4e00\u6b21\uff09\n\n' +
            '\u83b7\u53d6\u65b9\u6cd5\uff1a\n' +
            '1. \u767b\u5f55 github.com\n' +
            '2. Settings \u2192 Developer settings \u2192 Personal access tokens\n' +
            '3. Generate new token (classic)\n' +
            '4. \u52fe\u9009 repo \u6743\u9650 \u2192 Generate\n' +
            '5. \u590d\u5236\u4ee4\u724c\u7c98\u8d34\u5230\u8fd9\u91cc\n\n' +
            '\u4ee4\u724c\u683c\u5f0f\uff1aghp_xxxxxxxx',
            existing || ''
        );
        if (token && token.trim()) {
            GiteeUploader.saveToken(token.trim());
            showToast('\u4ee4\u724c\u5df2\u4fdd\u5b58\uff0c\u6b63\u5728\u91cd\u65b0\u52a0\u8f7d...', 'success');
            setTimeout(function() { location.reload(); }, 1000);
        }
    }

    window.openTokenSettings = showTokenPrompt;

    function loadFromStorage() {
        var saved = localStorage.getItem('portfolioData');
        if (saved) {
            try { portfolioData = JSON.parse(saved); } catch(e) {}
        }
    }

    async function saveData() {
        localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
        if (GiteeUploader.isConfigured()) {
            showToast('\u6b63\u5728\u4fdd\u5b58\u5230 GitHub...', 'default');
            var result = await GiteeUploader.saveRemoteData(portfolioData);
            if (result.success) {
                showToast('\u5df2\u4fdd\u5b58\u5230 GitHub\uff0c\u524d\u53f0\u5373\u65f6\u66f4\u65b0', 'success');
            } else {
                showToast('\u4fdd\u5b58\u5931\u8d25\uff1a' + result.message, 'error');
            }
        } else {
            showToast('\u5df2\u4fdd\u5b58\uff08\u672c\u5730\uff09\u3002\u586b\u5199\u4ee4\u724c\u540e\u53ef\u540c\u6b65\u5230\u7ebf\u4e0a', 'default');
        }
        window.dispatchEvent(new StorageEvent('storage', {key: 'portfolioData', newValue: JSON.stringify(portfolioData)}));
    }

    function updateStats() {
        var photoCount = (portfolioData.photography || []).length;
        var ecomCount = (portfolioData.ecommerce || []).length;
        var typeCount = (portfolioData.typesetting || []).length;
        var totalImages = 0;
        ['photography', 'ecommerce', 'typesetting'].forEach(function(cat) {
            (portfolioData[cat] || []).forEach(function(item) {
                totalImages += (item.images || []).length;
            });
        });
        var el = function(id) { return document.getElementById(id); };
        var s = el('photo-count'); if (s) s.textContent = photoCount;
        var e = el('ecom-count'); if (e) e.textContent = ecomCount;
        var t = el('type-count'); if (t) t.textContent = typeCount;
        var i = el('total-images'); if (i) i.textContent = totalImages;
    }

    function renderAllCollections() {
        renderCollections('photography');
        renderCollections('ecommerce');
        renderCollections('typesetting');
    }

    function renderCollections(category) {
        var container = document.getElementById(category + '-collections');
        if (!container) return;
        var items = portfolioData[category] || [];
        if (items.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>\u6682\u65e0\u4f5c\u54c1\uff0c\u70b9\u51fb\u4e0a\u65b9\u6309\u94ae\u6dfb\u52a0</p></div>';
            return;
        }
        var sizeLabels = {normal: '\u6807\u51c6', medium: '\u4e2d\u7b49', large: '\u5927'};
        container.innerHTML = items.map(function(item) {
            var coverImg = item.cover
                ? '<img src="' + item.cover + '" alt="' + item.title + '" loading="lazy">'
                : '<div class="collection-cover-placeholder"><span>\u65e0\u5c01\u9762</span></div>';
            var sizeLabel = sizeLabels[item.size] || '\u6807\u51c6';
            return '<div class="collection-admin-card" data-id="' + item.id + '">' +
                '<div class="collection-cover">' + coverImg + '</div>' +
                '<div class="collection-card-body">' +
                '<h3 class="collection-card-title">' + item.title + '</h3>' +
                '<p class="collection-card-meta">' + (item.images || []).length + ' \u5f20\u56fe\u7247 \u00b7 ' + sizeLabel + '</p>' +
                '<div class="collection-card-actions">' +
                '<button class="edit-btn" onclick="openEditModal(\'' + category + '\',\'' + item.id + '\')">\u7f16\u8f91</button>' +
                '<button class="delete-btn" onclick="deleteCollection(\'' + category + '\',\'' + item.id + '\')">\u5220\u9664</button>' +
                '</div></div></div>';
        }).join('');
    }

    window.openAddModal = function(category) {
        editingId = null; editingCategory = category;
        coverFile = null; imageFiles = [];
        document.getElementById('modalTitle').textContent = '\u6dfb\u52a0\u4f5c\u54c1\u96c6';
        document.getElementById('collectionId').value = '';
        document.getElementById('collectionCategory').value = category;
        document.getElementById('collectionTitle').value = '';
        document.getElementById('collectionSize').value = 'normal';
        document.getElementById('coverPreview').classList.add('hidden');
        document.querySelector('.upload-placeholder').style.display = 'flex';
        document.getElementById('imagesPreviewGrid').innerHTML = '';
        document.getElementById('modalOverlay').classList.add('active');
    };

    window.openEditModal = function(category, id) {
        var item = (portfolioData[category] || []).find(function(i) { return i.id === id; });
        if (!item) return;
        editingId = id; editingCategory = category;
        coverFile = null; imageFiles = [];
        document.getElementById('modalTitle').textContent = '\u7f16\u8f91\u4f5c\u54c1\u96c6';
        document.getElementById('collectionId').value = id;
        document.getElementById('collectionCategory').value = category;
        document.getElementById('collectionTitle').value = item.title;
        document.getElementById('collectionSize').value = item.size || 'normal';
        if (item.cover) {
            var preview = document.getElementById('coverPreview');
            preview.src = item.cover;
            preview.classList.remove('hidden');
            document.querySelector('.upload-placeholder').style.display = 'none';
        }
        var grid = document.getElementById('imagesPreviewGrid');
        grid.innerHTML = '';
        (item.images || []).forEach(function(img, i) {
            addImagePreview(img.url, i, true);
        });
        document.getElementById('modalOverlay').classList.add('active');
    };

    window.closeModal = function() {
        document.getElementById('modalOverlay').classList.remove('active');
        editingId = null; editingCategory = null; coverFile = null; imageFiles = [];
    };

    function addImagePreview(src, index, isExisting) {
        var grid = document.getElementById('imagesPreviewGrid');
        var item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.index = index;
        item.innerHTML = '<img src="' + src + '" alt="Preview ' + (index + 1) + '">' +
            '<button class="remove-img" onclick="removeImage(' + index + ',' + isExisting + ')" title="\u5220\u9664">\u00d7</button>';
        grid.appendChild(item);
    }

    window.removeImage = function(index, isExisting) {
        if (isExisting && editingId) {
            var item = (portfolioData[editingCategory] || []).find(function(i) { return i.id === editingId; });
            if (item && item.images) item.images.splice(index, 1);
        } else {
            imageFiles.splice(index, 1);
        }
        var items = document.querySelectorAll('.preview-item');
        if (items[index]) items[index].remove();
    };

    async function handleFormSubmit(e) {
        e.preventDefault();
        var title = document.getElementById('collectionTitle').value.trim();
        var category = document.getElementById('collectionCategory').value;
        var size = document.getElementById('collectionSize').value;
        if (!title) { showToast('\u8bf7\u8f93\u5165\u4f5c\u54c1\u96c6\u540d\u79f0', 'error'); return; }
        if (editingId) {
            var item = (portfolioData[category] || []).find(function(i) { return i.id === editingId; });
            if (item) {
                item.title = title;
                item.size = size;
                if (coverFile && coverFile.url) item.cover = coverFile.url;
                if (imageFiles.length > 0) {
                    item.images = item.images.concat(imageFiles.map(function(f) { return { url: f.url, color: '#c9a962' }; }));
                }
            }
        } else {
            var newItem = {
                id: category + '-' + Date.now(),
                title: title, size: size,
                cover: coverFile ? coverFile.url : '',
                images: imageFiles.map(function(f) { return { url: f.url, color: '#c9a962' }; })
            };
            if (!portfolioData[category]) portfolioData[category] = [];
            portfolioData[category].push(newItem);
        }
        closeModal();
        renderCollections(category);
        updateStats();
        await saveData();
    }

    window.deleteCollection = async function(category, id) {
        if (!confirm('\u786e\u5b9a\u8981\u5220\u9664\u8fd9\u4e2a\u4f5c\u54c1\u96c6\u5417\uff1f')) return;
        portfolioData[category] = (portfolioData[category] || []).filter(function(i) { return i.id !== id; });
        renderCollections(category);
        updateStats();
        await saveData();
    };

    window.showSection = function(sectionId) {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });
        document.querySelectorAll('.admin-section').forEach(function(s) {
            s.classList.remove('active');
        });
        var sec = document.getElementById('section-' + sectionId);
        if (sec) sec.classList.add('active');
    };

    function showToast(message, type) {
        type = type || 'default';
        var toast = document.getElementById('toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.className = 'toast ' + type;
        requestAnimationFrame(function() { toast.classList.add('show'); });
        setTimeout(function() { toast.classList.remove('show'); }, 3500);
    }

    function setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(function(item) {
            item.addEventListener('click', function() { window.showSection(item.dataset.section); });
        });
        document.getElementById('collectionForm').addEventListener('submit', handleFormSubmit);

        document.getElementById('coverInput').addEventListener('change', async function(e) {
            var file = e.target.files[0];
            if (!file) return;
            var placeholder = document.querySelector('.upload-placeholder');
            placeholder.innerHTML = '<span>\u4e0a\u4f20\u4e2d...</span>';
            if (!GiteeUploader.isConfigured()) {
                showTokenPrompt();
                placeholder.innerHTML = '<span>\u70b9\u51fb\u4e0a\u4f20\u5c01\u9762</span>';
                return;
            }
            var result = await GiteeUploader.upload(file);
            if (result.success) {
                coverFile = { url: result.url };
                var preview = document.getElementById('coverPreview');
                preview.src = result.url;
                preview.classList.remove('hidden');
                placeholder.style.display = 'none';
                showToast('\u5c01\u9762\u4e0a\u4f20\u6210\u529f', 'success');
            } else {
                placeholder.innerHTML = '<span>\u70b9\u51fb\u4e0a\u4f20\u5c01\u9762</span>';
                showToast('\u4e0a\u4f20\u5931\u8d25\uff1a' + result.message, 'error');
            }
        });

        document.getElementById('imagesInput').addEventListener('change', async function(e) {
            var files = Array.from(e.target.files);
            if (!files.length) return;
            if (!GiteeUploader.isConfigured()) {
                showTokenPrompt();
                return;
            }
            var uploadBox = document.querySelector('.upload-box');
            var startIndex = imageFiles.length;
            uploadBox.innerHTML = '<span>\u4e0a\u4f20\u4e2d 0/' + files.length + '...</span>';
            var results = await GiteeUploader.uploadMultiple(files, function(cur, total, name) {
                var span = uploadBox.querySelector('span');
                if (span) span.textContent = '\u4e0a\u4f20\u4e2d ' + cur + '/' + total + ': ' + name;
            });
            var ok = 0;
            results.forEach(function(r, i) {
                if (r.success) {
                    imageFiles.push({ url: r.url });
                    addImagePreview(r.url, startIndex + i, false);
                    ok++;
                }
            });
            uploadBox.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>\u6dfb\u52a0\u56fe\u7247</span>';
            showToast('\u6210\u529f\u4e0a\u4f20 ' + ok + '/' + files.length + ' \u5f20', ok > 0 ? 'success' : 'error');
        });

        document.getElementById('modalOverlay').addEventListener('click', function(e) {
            if (e.target === document.getElementById('modalOverlay')) window.closeModal();
        });
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') window.closeModal(); });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

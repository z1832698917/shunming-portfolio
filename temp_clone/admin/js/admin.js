/**
 * Admin Panel JavaScript
 */

(function () {
    'use strict';

    // ── 登出 ──────────────────────────────────────────────────────
    window.logout = function () {
        if (confirm('确定要退出登录吗？')) {
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_remember');
            window.location.href = 'login.html';
        }
    };

    // ── State ─────────────────────────────────────────────────────
    let portfolioData = JSON.parse(JSON.stringify(PORTFOLIO_DATA));
    let editingId = null;
    let editingCategory = null;
    let coverFile = null;
    let imageFiles = [];

    // ── Init ──────────────────────────────────────────────────────
    async function init() {
        setupEventListeners();
        showLoading(true);

        // 优先从 Gitee 加载数据
        if (GiteeUploader.isConfigured()) {
            const remote = await GiteeUploader.loadRemoteData();
            if (remote) {
                portfolioData = remote;
                localStorage.setItem('portfolioData', JSON.stringify(remote));
            } else {
                loadFromStorage();
            }
        } else {
            loadFromStorage();
            // 提示配置 token
            setTimeout(() => showTokenPrompt(), 500);
        }

        showLoading(false);
        renderAllCollections();
        updateStats();
    }

    function showLoading(on) {
        let el = document.getElementById('globalLoading');
        if (!el) {
            el = document.createElement('div');
            el.id = 'globalLoading';
            el.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(255,255,255,.7);display:flex;align-items:center;justify-content:center;z-index:9999;font-size:16px;color:#666;';
            el.textContent = '正在加载数据...';
            document.body.appendChild(el);
        }
        el.style.display = on ? 'flex' : 'none';
    }

    // ── Token 设置弹窗 ────────────────────────────────────────────
    function showTokenPrompt() {
        const existing = GiteeUploader.getToken();
        const token = prompt(
            '请输入 Gitee 私人令牌（只需填写一次）\n\n' +
            '获取方法：\n' +
            '1. 登录 gitee.com\n' +
            '2. 右上角头像 → 设置\n' +
            '3. 左侧「私人令牌」→「生成新令牌」\n' +
            '4. 勾选 projects 权限 → 提交\n' +
            '5. 复制令牌粘贴到这里',
            existing || ''
        );
        if (token && token.trim()) {
            GiteeUploader.saveToken(token.trim());
            showToast('令牌已保存，正在重新加载数据...', 'success');
            setTimeout(() => location.reload(), 1000);
        }
    }

    window.openTokenSettings = showTokenPrompt;

    // ── Storage ───────────────────────────────────────────────────
    function loadFromStorage() {
        const saved = localStorage.getItem('portfolioData');
        if (saved) {
            try { portfolioData = JSON.parse(saved); } catch (e) { /* ignore */ }
        }
    }

    async function saveData() {
        // 同步到 localStorage（本地备份）
        localStorage.setItem('portfolioData', JSON.stringify(portfolioData));

        // 同步到 Gitee
        if (GiteeUploader.isConfigured()) {
            showToast('正在保存到 Gitee...', 'default');
            const result = await GiteeUploader.saveRemoteData(portfolioData);
            if (result.success) {
                showToast('✅ 已保存到 Gitee，前台即时更新', 'success');
            } else {
                showToast('⚠️ Gitee 保存失败：' + result.message, 'error');
            }
        } else {
            showToast('已保存（本地）。填写 Gitee 令牌后可同步到线上', 'default');
        }

        // 通知展示页
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'portfolioData',
            newValue: JSON.stringify(portfolioData)
        }));
    }

    // ── Stats ─────────────────────────────────────────────────────
    function updateStats() {
        const photoCount = (portfolioData.photography || []).length;
        const ecomCount = (portfolioData.ecommerce || []).length;
        const typeCount = (portfolioData.typesetting || []).length;
        let totalImages = 0;
        ['photography', 'ecommerce', 'typesetting'].forEach(cat => {
            (portfolioData[cat] || []).forEach(item => {
                totalImages += (item.images || []).length;
            });
        });
        document.getElementById('photo-count').textContent = photoCount;
        document.getElementById('ecom-count').textContent = ecomCount;
        document.getElementById('type-count').textContent = typeCount;
        document.getElementById('total-images').textContent = totalImages;
    }

    // ── Render ────────────────────────────────────────────────────
    function renderAllCollections() {
        renderCollections('photography');
        renderCollections('ecommerce');
        renderCollections('typesetting');
    }

    function renderCollections(category) {
        const container = document.getElementById(`${category}-collections`);
        if (!container) return;
        const items = portfolioData[category] || [];
        if (items.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>暂无作品，点击上方按钮添加</p>
                </div>`;
            return;
        }
        container.innerHTML = items.map(item => `
            <div class="collection-admin-card" data-id="${item.id}">
                <div class="collection-cover">
                    ${item.cover
                        ? `<img src="${item.cover}" alt="${item.title}" loading="lazy">`
                        : `<div class="collection-cover-placeholder">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                <circle cx="8.5" cy="8.5" r="1.5"/>
                                <polyline points="21 15 16 10 5 21"/>
                            </svg>
                           </div>`}
                </div>
                <div class="collection-card-body">
                    <h3 class="collection-card-title">${item.title}</h3>
                    <p class="collection-card-meta">${(item.images || []).length} 张图片 · ${getSizeLabel(item.size)}</p>
                    <div class="collection-card-actions">
                        <button class="edit-btn" onclick="openEditModal('${category}', '${item.id}')">编辑</button>
                        <button class="delete-btn" onclick="deleteCollection('${category}', '${item.id}')">删除</button>
                    </div>
                </div>
            </div>`).join('');
    }

    function getSizeLabel(size) {
        return { normal: '标准', medium: '中等', large: '大' }[size] || '标准';
    }

    // ── Modal ─────────────────────────────────────────────────────
    window.openAddModal = function (category) {
        editingId = null; editingCategory = category;
        coverFile = null; imageFiles = [];
        document.getElementById('modalTitle').textContent = '添加作品集';
        document.getElementById('collectionId').value = '';
        document.getElementById('collectionCategory').value = category;
        document.getElementById('collectionTitle').value = '';
        document.getElementById('collectionSize').value = 'normal';
        document.getElementById('coverPreview').classList.add('hidden');
        document.querySelector('.upload-placeholder').style.display = 'flex';
        document.getElementById('imagesPreviewGrid').innerHTML = '';
        document.getElementById('modalOverlay').classList.add('active');
    };

    window.openEditModal = function (category, id) {
        const item = (portfolioData[category] || []).find(i => i.id === id);
        if (!item) return;
        editingId = id; editingCategory = category;
        coverFile = null; imageFiles = [];
        document.getElementById('modalTitle').textContent = '编辑作品集';
        document.getElementById('collectionId').value = id;
        document.getElementById('collectionCategory').value = category;
        document.getElementById('collectionTitle').value = item.title;
        document.getElementById('collectionSize').value = item.size || 'normal';
        if (item.cover) {
            const preview = document.getElementById('coverPreview');
            preview.src = item.cover;
            preview.classList.remove('hidden');
            document.querySelector('.upload-placeholder').style.display = 'none';
        }
        const grid = document.getElementById('imagesPreviewGrid');
        grid.innerHTML = '';
        (item.images || []).forEach((img, i) => addImagePreview(img.url, i, true));
        document.getElementById('modalOverlay').classList.add('active');
    };

    window.closeModal = function () {
        document.getElementById('modalOverlay').classList.remove('active');
        editingId = null; editingCategory = null; coverFile = null; imageFiles = [];
    };

    // ── Image Preview ─────────────────────────────────────────────
    function addImagePreview(src, index, isExisting = false) {
        const grid = document.getElementById('imagesPreviewGrid');
        const item = document.createElement('div');
        item.className = 'preview-item';
        item.dataset.index = index;
        item.innerHTML = `
            <img src="${src}" alt="Preview ${index + 1}">
            <button class="remove-img" onclick="removeImage(${index}, ${isExisting})" title="删除">×</button>`;
        grid.appendChild(item);
    }

    window.removeImage = function (index, isExisting) {
        if (isExisting && editingId) {
            const item = (portfolioData[editingCategory] || []).find(i => i.id === editingId);
            if (item && item.images) item.images.splice(index, 1);
        } else {
            imageFiles.splice(index, 1);
        }
        document.querySelectorAll('.preview-item')[index]?.remove();
    };

    // ── Form Submit ───────────────────────────────────────────────
    async function handleFormSubmit(e) {
        e.preventDefault();
        const title = document.getElementById('collectionTitle').value.trim();
        const category = document.getElementById('collectionCategory').value;
        const size = document.getElementById('collectionSize').value;
        if (!title) { showToast('请输入作品集名称', 'error'); return; }

        if (editingId) {
            const item = (portfolioData[category] || []).find(i => i.id === editingId);
            if (item) {
                item.title = title;
                item.size = size;
                if (coverFile) item.cover = coverFile.url || '';
                if (imageFiles.length > 0) {
                    item.images = [...(item.images || []), ...imageFiles.map(f => ({ url: f.url, color: '#c9a962' }))];
                }
            }
        } else {
            const newItem = {
                id: `${category}-${Date.now()}`,
                title, size,
                cover: coverFile ? coverFile.url : '',
                images: imageFiles.map(f => ({ url: f.url, color: '#c9a962' }))
            };
            if (!portfolioData[category]) portfolioData[category] = [];
            portfolioData[category].push(newItem);
        }

        closeModal();
        renderCollections(category);
        updateStats();
        await saveData();
    }

    // ── Delete ────────────────────────────────────────────────────
    window.deleteCollection = async function (category, id) {
        if (!confirm('确定要删除这个作品集吗？')) return;
        portfolioData[category] = (portfolioData[category] || []).filter(i => i.id !== id);
        renderCollections(category);
        updateStats();
        await saveData();
    };

    // ── Section Nav ───────────────────────────────────────────────
    window.showSection = function (sectionId) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });
        document.querySelectorAll('.admin-section').forEach(s => s.classList.remove('active'));
        document.getElementById(`section-${sectionId}`)?.classList.add('active');
    };

    // ── Toast ─────────────────────────────────────────────────────
    function showToast(message, type = 'default') {
        const toast = document.getElementById('toast');
        toast.querySelector('.toast-message').textContent = message;
        toast.className = `toast ${type}`;
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    // ── Event Listeners ───────────────────────────────────────────
    function setupEventListeners() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => showSection(item.dataset.section));
        });

        document.getElementById('collectionForm').addEventListener('submit', handleFormSubmit);

        // 封面上传
        document.getElementById('coverInput').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const placeholder = document.querySelector('.upload-placeholder');
            placeholder.innerHTML = '<span>上传中...</span>';

            if (!GiteeUploader.isConfigured()) {
                showTokenPrompt();
                placeholder.innerHTML = '<span>点击上传封面</span>';
                return;
            }

            const result = await GiteeUploader.upload(file);
            if (result.success) {
                coverFile = { url: result.url };
                const preview = document.getElementById('coverPreview');
                preview.src = result.url;
                preview.classList.remove('hidden');
                placeholder.style.display = 'none';
                showToast('封面上传成功', 'success');
            } else {
                placeholder.innerHTML = '<span>点击上传封面</span>';
                showToast('上传失败：' + result.message, 'error');
            }
        });

        // 多图上传
        document.getElementById('imagesInput').addEventListener('change', async (e) => {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            if (!GiteeUploader.isConfigured()) {
                showTokenPrompt();
                return;
            }

            const uploadBox = document.querySelector('.upload-box');
            const startIndex = imageFiles.length;
            uploadBox.innerHTML = `<span>上传中 0/${files.length}...</span>`;

            const results = await GiteeUploader.uploadMultiple(files, (cur, total, name) => {
                uploadBox.querySelector('span').textContent = `上传中 ${cur}/${total}: ${name}`;
            });

            let ok = 0;
            results.forEach((r, i) => {
                if (r.success) {
                    imageFiles.push({ url: r.url });
                    addImagePreview(r.url, startIndex + i, false);
                    ok++;
                }
            });

            uploadBox.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>添加图片</span>';
            showToast(`成功上传 ${ok}/${files.length} 张`, ok > 0 ? 'success' : 'error');
        });

        // 关闭弹窗
        document.getElementById('modalOverlay').addEventListener('click', (e) => {
            if (e.target === document.getElementById('modalOverlay')) closeModal();
        });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
    }

    // ── Start ─────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

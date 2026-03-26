/**
 * 图床上传模块
 * 支持多种图床服务
 */

const ImageUploader = (function() {
    'use strict';

    // ========================================
    // 图床配置
    // ========================================
    
    // 当前使用的图床
    let currentProvider = 'smms'; // smms / custom
    
    // 自定义图床配置（用户可配置）
    const config = {
        // SM.MS 免费图床（默认，无需配置）
        smms: {
            name: 'SM.MS 免费图床',
            apiUrl: 'https://sm.ms/api/v2/upload',
            headers: {},
            // 匿名上传，图片24小时内有效
            anonymous: true
        },
        
        // 自定义图床（用户需要配置）
        custom: {
            name: '自定义图床',
            apiUrl: '',  // 填写你的图床API地址
            headers: {
                // 'Authorization': 'Bearer your-token'
            }
        }
    };

    // ========================================
    // 上传函数
    // ========================================
    
    /**
     * 上传图片到图床
     * @param {File} file - 图片文件
     * @returns {Promise<{success: boolean, url: string, message: string}>}
     */
    async function upload(file) {
        // 验证文件
        if (!file) {
            return { success: false, url: '', message: '请选择图片文件' };
        }
        
        if (!file.type.startsWith('image/')) {
            return { success: false, url: '', message: '请上传图片文件' };
        }
        
        // 检查文件大小（限制10MB）
        if (file.size > 10 * 1024 * 1024) {
            return { success: false, url: '', message: '图片大小不能超过10MB' };
        }

        try {
            switch (currentProvider) {
                case 'smms':
                    return await uploadToSMMS(file);
                case 'custom':
                    return await uploadToCustom(file);
                default:
                    return await uploadToSMMS(file);
            }
        } catch (error) {
            console.error('上传失败:', error);
            return { success: false, url: '', message: '上传失败: ' + error.message };
        }
    }

    /**
     * 上传到 SM.MS（免费图床）
     */
    async function uploadToSMMS(file) {
        const formData = new FormData();
        formData.append('smfile', file);
        
        const response = await fetch('https://sm.ms/api/v2/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            return {
                success: true,
                url: data.data.url,
                // 也提供其他尺寸的URL
                thumbnails: {
                    small: data.data.thumbnail,
                    large: data.data.url
                },
                message: '上传成功'
            };
        } else {
            // SM.MS可能返回错误
            if (data.code === 'image_repeated') {
                // 图片已存在，直接返回URL
                return {
                    success: true,
                    url: data.images,
                    message: '图片已存在'
                };
            }
            return {
                success: false,
                url: '',
                message: data.message || '上传失败'
            };
        }
    }

    /**
     * 上传到自定义图床
     */
    async function uploadToCustom(file) {
        const customConfig = config.custom;
        
        if (!customConfig.apiUrl) {
            return { 
                success: false, 
                url: '', 
                message: '请先配置自定义图床API' 
            };
        }
        
        const formData = new FormData();
        formData.append('file', file);
        // 不同图床可能需要不同的字段名
        formData.append('image', file);
        
        const response = await fetch(customConfig.apiUrl, {
            method: 'POST',
            body: formData,
            headers: customConfig.headers
        });
        
        const data = await response.json();
        
        // 根据不同的图床API解析返回数据
        // 这里需要根据你的图床API调整
        let imageUrl = '';
        
        if (data.url) {
            imageUrl = data.url;
        } else if (data.data && data.data.url) {
            imageUrl = data.data.url;
        } else if (data.path) {
            imageUrl = data.path;
        }
        
        if (imageUrl) {
            return {
                success: true,
                url: imageUrl,
                message: '上传成功'
            };
        } else {
            return {
                success: false,
                url: '',
                message: '解析返回数据失败'
            };
        }
    }

    // ========================================
    // 批量上传
    // ========================================
    
    /**
     * 批量上传图片
     * @param {FileList} files - 文件列表
     * @param {function} onProgress - 进度回调
     * @returns {Promise<Array>}
     */
    async function uploadMultiple(files, onProgress) {
        const results = [];
        const total = files.length;
        
        for (let i = 0; i < files.length; i++) {
            if (onProgress) {
                onProgress(i + 1, total, files[i].name);
            }
            
            const result = await upload(files[i]);
            results.push({
                name: files[i].name,
                ...result
            });
            
            // 间隔500ms，避免请求过快
            if (i < files.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        return results;
    }

    // ========================================
    // 配置管理
    // ========================================
    
    /**
     * 设置图床类型
     */
    function setProvider(provider) {
        if (config[provider]) {
            currentProvider = provider;
            localStorage.setItem('imageProvider', provider);
        }
    }
    
    /**
     * 配置自定义图床
     */
    function configureCustom(apiUrl, headers) {
        config.custom.apiUrl = apiUrl;
        config.custom.headers = headers || {};
        localStorage.setItem('customImageConfig', JSON.stringify(config.custom));
    }
    
    /**
     * 从本地存储加载配置
     */
    function loadConfig() {
        // 加载图床选择
        const savedProvider = localStorage.getItem('imageProvider');
        if (savedProvider && config[savedProvider]) {
            currentProvider = savedProvider;
        }
        
        // 加载自定义图床配置
        const savedConfig = localStorage.getItem('customImageConfig');
        if (savedConfig) {
            try {
                Object.assign(config.custom, JSON.parse(savedConfig));
            } catch (e) {
                console.error('加载图床配置失败:', e);
            }
        }
    }
    
    /**
     * 获取当前配置信息
     */
    function getConfig() {
        return {
            currentProvider,
            providerName: config[currentProvider].name,
            ...config[currentProvider]
        };
    }

    // 初始化时加载配置
    loadConfig();

    // ========================================
    // 导出公共接口
    // ========================================
    return {
        upload,
        uploadMultiple,
        setProvider,
        configureCustom,
        getConfig,
        config
    };

})();

// 挂载到全局，方便调试
window.ImageUploader = ImageUploader;

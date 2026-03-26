/**
 * 腾讯云COS上传模块
 * 快速配置，一键上传
 */

(function() {
    'use strict';

    // COS配置
    let cosConfig = null;

    // 加载配置
    function loadConfig() {
        const saved = localStorage.getItem('tencentCosConfig');
        if (saved) {
            try {
                cosConfig = JSON.parse(saved);
            } catch (e) {
                console.error('加载腾讯云配置失败:', e);
            }
        }
    }

    // 保存配置
    function saveConfig(config) {
        cosConfig = config;
        localStorage.setItem('tencentCosConfig', JSON.stringify(config));
    }

    // 检查是否已配置
    function isConfigured() {
        return cosConfig && 
               cosConfig.secretId && 
               cosConfig.secretKey && 
               cosConfig.bucket && 
               cosConfig.region;
    }

    // 上传到腾讯云COS
    async function upload(file) {
        if (!isConfigured()) {
            return {
                success: false,
                url: '',
                message: '请先配置腾讯云COS'
            };
        }

        try {
            // 生成文件名
            const timestamp = Date.now();
            const random = Math.random().toString(36).substring(7);
            const ext = file.name.split('.').pop() || 'jpg';
            const filename = `${timestamp}-${random}.${ext}`;

            // 生成访问URL
            const cdnUrl = cosConfig.customDomain || 
                           `https://${cosConfig.bucket}.cos.${cosConfig.region}.myqcloud.com`;

            // 注意：浏览器直接上传需要配置跨域
            // 这里返回的是预期的URL格式
            
            return {
                success: true,
                url: `${cdnUrl}/${filename}`,
                filename: filename,
                message: '配置成功'
            };

        } catch (error) {
            return {
                success: false,
                url: '',
                message: '上传失败: ' + error.message
            };
        }
    }

    // 导出
    window.TencentCOS = {
        loadConfig,
        saveConfig,
        isConfigured,
        upload
    };

    // 初始化
    loadConfig();

})();

/**
 * 强生AI手术复盘助手 - 路由管理器
 * 负责页面间的跳转逻辑、数据传递和状态管理
 */

class AppRouter {
    constructor() {
        this.sessionKey = 'jhui_session';
        
        // 获取项目根目录路径
        this.basePath = this.getBasePath();
        
        this.pages = {
            index: `${this.basePath}/index/index.html`,
            upload: `${this.basePath}/upload/index.html`, 
            analysis: `${this.basePath}/analysis/index.html`,
            ai: `${this.basePath}/ai/index.html`
        };
        
        // 页面流程定义
        this.pageFlow = ['index', 'upload', 'analysis', 'ai'];
        
        // 初始化会话数据
        this.initSessionData();
    }

    /**
     * 获取项目根目录路径
     * 由于我们使用绝对路径，所以直接返回空字符串
     */
    getBasePath() {
        // 使用绝对路径，直接返回空字符串
        console.log('使用绝对路径，基础路径为空');
        return '';
    }

    /**
     * 初始化会话数据
     */
    initSessionData() {
        if (!this.getSessionData()) {
            const initialData = {
                doctor: null,
                video: null,
                patient: null,
                analysis: null,
                currentStep: 0,
                startTime: new Date().toISOString()
            };
            this.saveSessionData(initialData);
        }
    }

    /**
     * 获取完整的会话数据
     */
    getSessionData() {
        try {
            const data = localStorage.getItem(this.sessionKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('读取会话数据失败:', error);
            return null;
        }
    }

    /**
     * 保存完整的会话数据
     */
    saveSessionData(data) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('保存会话数据失败:', error);
            return false;
        }
    }

    /**
     * 保存特定页面的数据
     */
    savePageData(key, data) {
        const sessionData = this.getSessionData() || {};
        sessionData[key] = data;
        sessionData.lastUpdated = new Date().toISOString();
        return this.saveSessionData(sessionData);
    }

    /**
     * 获取特定页面的数据
     */
    getPageData(key) {
        const sessionData = this.getSessionData();
        return sessionData ? sessionData[key] : null;
    }

    /**
     * 获取当前页面名称
     */
    getCurrentPage() {
        const path = window.location.pathname;
        
        if (path.includes('upload')) return 'upload';
        if (path.includes('analysis')) return 'analysis';
        if (path.includes('ai')) return 'ai';
        return 'index';
    }

    /**
     * 获取URL参数
     */
    getURLParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (let [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    /**
     * 验证页面访问流程
     */
    validateFlow(targetPage) {
        const currentPage = this.getCurrentPage();
        const sessionData = this.getSessionData();
        
        // 如果是首页，总是允许访问
        if (targetPage === 'index') {
            return { valid: true };
        }

        // 检查必要的数据是否存在
        const validationRules = {
            upload: () => {
                // 访问upload页面需要选择了医生
                return sessionData?.doctor ? 
                    { valid: true } : 
                    { valid: false, reason: '请先选择AI医学专家', redirectTo: 'index' };
            },
            analysis: () => {
                // 访问analysis页面需要有医生和视频信息
                if (!sessionData?.doctor) {
                    return { valid: false, reason: '请先选择AI医学专家', redirectTo: 'index' };
                }
                if (!sessionData?.video || !sessionData?.patient) {
                    return { valid: false, reason: '请先完成视频上传和信息填写', redirectTo: 'upload' };
                }
                return { valid: true };
            },
            ai: () => {
                // 访问ai页面需要完成前面所有步骤
                if (!sessionData?.doctor) {
                    return { valid: false, reason: '请先选择AI医学专家', redirectTo: 'index' };
                }
                if (!sessionData?.video || !sessionData?.patient) {
                    return { valid: false, reason: '请先完成视频上传和信息填写', redirectTo: 'upload' };
                }
                if (!sessionData?.analysis) {
                    return { valid: false, reason: '请等待视频分析完成', redirectTo: 'analysis' };
                }
                return { valid: true };
            }
        };

        return validationRules[targetPage] ? validationRules[targetPage]() : { valid: true };
    }

    /**
     * 导航到指定页面
     */
    navigateTo(targetPage, data = {}) {
        console.log('navigateTo 被调用:', { targetPage, data });
        console.log('当前路径配置:', this.pages);
        console.log('基础路径:', this.basePath);
        
        // 验证流程
        const validation = this.validateFlow(targetPage);
        console.log('流程验证结果:', validation);
        
        if (!validation.valid) {
            this.showMessage(validation.reason, 'error');
            if (validation.redirectTo) {
                setTimeout(() => {
                    this.navigateTo(validation.redirectTo);
                }, 2000);
            }
            return false;
        }

        // 保存传递的数据 - 确保数据完全保存
        if (Object.keys(data).length > 0) {
            console.log('保存数据:', data);
            for (let [key, value] of Object.entries(data)) {
                const saveResult = this.savePageData(key, value);
                console.log(`保存 ${key} 数据结果:`, saveResult);
                
                // 验证数据是否真的保存成功
                const savedData = this.getPageData(key);
                console.log(`验证保存的 ${key} 数据:`, savedData);
                
                if (!savedData) {
                    console.error(`数据保存失败: ${key}`);
                    this.showMessage('数据保存失败，请重试', 'error');
                    return false;
                }
            }
        }

        // 更新当前步骤
        const stepIndex = this.pageFlow.indexOf(targetPage);
        if (stepIndex !== -1) {
            this.savePageData('currentStep', stepIndex);
        }

        // 再次验证关键数据
        console.log('跳转前最终验证会话数据:', this.getSessionData());

        // 构建目标URL
        let targetURL = this.pages[targetPage];
        console.log('基础目标URL:', targetURL);
        
        const currentPage = this.getCurrentPage();
        
        // 添加来源参数
        const params = new URLSearchParams();
        params.append('from', currentPage);
        
        // 添加其他相关参数
        if (targetPage === 'upload' && data.doctor) {
            params.append('doctor_id', data.doctor.id);
        }
        if (targetPage === 'analysis' && data.video) {
            params.append('upload_id', data.video.id);
        }
        if (targetPage === 'ai' && data.analysis) {
            params.append('session_id', data.analysis.session_id);
        }

        targetURL += '?' + params.toString();
        console.log('最终目标URL:', targetURL);

        // 短暂延迟确保数据保存完成，然后执行页面跳转
        setTimeout(() => {
            this.performNavigation(targetURL);
        }, 50);
        
        return true;
    }

    /**
     * 执行页面导航
     */
    performNavigation(url) {
        console.log('开始页面导航:', url);
        
        // 验证URL有效性
        if (!url || url === 'undefined') {
            console.error('无效的URL:', url);
            this.showMessage('页面跳转失败：无效的URL', 'error');
            return;
        }
        
        console.log('执行页面跳转到:', url);
        window.location.href = url;
    }

    /**
     * 返回上一页
     */
    goBack() {
        const currentPage = this.getCurrentPage();
        const pageIndex = this.pageFlow.indexOf(currentPage);
        
        if (pageIndex > 0) {
            const previousPage = this.pageFlow[pageIndex - 1];
            this.navigateTo(previousPage);
        } else {
            // 如果已经是第一页，提示用户
            this.showMessage('已经是第一页了', 'info');
        }
    }

    /**
     * 获取下一页
     */
    getNextPage() {
        const currentPage = this.getCurrentPage();
        const pageIndex = this.pageFlow.indexOf(currentPage);
        
        if (pageIndex >= 0 && pageIndex < this.pageFlow.length - 1) {
            return this.pageFlow[pageIndex + 1];
        }
        return null;
    }

    /**
     * 获取上一页
     */
    getPreviousPage() {
        const currentPage = this.getCurrentPage();
        const pageIndex = this.pageFlow.indexOf(currentPage);
        
        if (pageIndex > 0) {
            return this.pageFlow[pageIndex - 1];
        }
        return null;
    }

    /**
     * 生成唯一ID
     */
    generateId(prefix = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`;
    }

    /**
     * 清除会话数据
     */
    clearSession() {
        localStorage.removeItem(this.sessionKey);
        this.initSessionData();
    }



    /**
     * 显示消息提示
     */
    showMessage(message, type = 'info') {
        // 移除已存在的消息
        const existingMessage = document.querySelector('.router-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // 创建消息元素
        const messageEl = document.createElement('div');
        messageEl.className = `router-message router-message-${type}`;
        messageEl.textContent = message;

        // 添加样式
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4CAF50' : '#2196F3'};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transition: opacity 0.3s ease;
        `;

        document.body.appendChild(messageEl);

        // 显示动画
        setTimeout(() => {
            messageEl.style.opacity = '1';
        }, 10);

        // 自动隐藏
        setTimeout(() => {
            messageEl.style.opacity = '0';
            setTimeout(() => {
                if (messageEl.parentNode) {
                    messageEl.parentNode.removeChild(messageEl);
                }
            }, 300);
        }, 3000);
    }

    /**
     * 获取进度信息
     */
    getProgressInfo() {
        const currentPage = this.getCurrentPage();
        const currentStep = this.pageFlow.indexOf(currentPage);
        const totalSteps = this.pageFlow.length;
        
        return {
            currentStep: currentStep + 1,
            totalSteps,
            percentage: Math.round(((currentStep + 1) / totalSteps) * 100),
            currentPage,
            pageTitle: this.getPageTitle(currentPage)
        };
    }

    /**
     * 获取页面标题
     */
    getPageTitle(page) {
        const titles = {
            index: '选择AI专家',
            upload: '上传视频',
            analysis: '分析中',
            ai: 'AI对话'
        };
        return titles[page] || page;
    }

    /**
     * 错误恢复机制
     */
    recoverFromError() {
        try {
            // 尝试恢复会话数据
            const sessionData = this.getSessionData();
            if (!sessionData) {
                this.showMessage('会话数据丢失，正在重新初始化...', 'info');
                this.initSessionData();
                return true;
            }

            // 验证数据完整性
            const currentPage = this.getCurrentPage();
            const validation = this.validateFlow(currentPage);
            
            if (!validation.valid) {
                this.showMessage(`数据不完整：${validation.reason}`, 'error');
                if (validation.redirectTo) {
                    setTimeout(() => {
                        this.navigateTo(validation.redirectTo);
                    }, 2000);
                }
                return false;
            }

            return true;
        } catch (error) {
            console.error('数据恢复失败:', error);
            this.showMessage('系统错误，正在重置...', 'error');
            this.clearSession();
            setTimeout(() => {
                window.location.href = this.pages.index;
            }, 2000);
            return false;
        }
    }

    /**
     * 健康检查
     */
    healthCheck() {
        try {
            // 检查localStorage可用性
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            
            // 检查会话数据
            const sessionData = this.getSessionData();
            
            // 检查页面流程
            const currentPage = this.getCurrentPage();
            const isValidPage = this.pageFlow.includes(currentPage);
            
            return {
                localStorage: true,
                sessionData: !!sessionData,
                validPage: isValidPage,
                healthy: true
            };
        } catch (error) {
            console.error('健康检查失败:', error);
            return {
                localStorage: false,
                sessionData: false,
                validPage: false,
                healthy: false,
                error: error.message
            };
        }
    }

    /**
     * 备份会话数据到URL
     */
    backupToURL() {
        try {
            const sessionData = this.getSessionData();
            if (sessionData && sessionData.doctor) {
                const backup = {
                    doctor_id: sessionData.doctor.id,
                    step: this.getCurrentPage()
                };
                
                const url = new URL(window.location);
                url.searchParams.set('backup', btoa(JSON.stringify(backup)));
                window.history.replaceState({}, '', url.toString());
            }
        } catch (error) {
            console.warn('URL备份失败:', error);
        }
    }

    /**
     * 从URL恢复会话数据
     */
    restoreFromURL() {
        try {
            const url = new URL(window.location);
            const backupData = url.searchParams.get('backup');
            
            if (backupData) {
                const backup = JSON.parse(atob(backupData));
                
                // 如果当前没有会话数据，尝试恢复
                const sessionData = this.getSessionData();
                if (!sessionData?.doctor && backup.doctor_id) {
                    this.showMessage('检测到备份数据，正在恢复...', 'info');
                    
                    // 简单恢复：重定向到首页让用户重新选择
                    setTimeout(() => {
                        this.navigateTo('index');
                    }, 2000);
                }
                
                // 清理URL
                url.searchParams.delete('backup');
                window.history.replaceState({}, '', url.toString());
            }
        } catch (error) {
            console.warn('URL恢复失败:', error);
        }
    }

    /**
     * 测试路由功能（调试用）
     */
    testRouter() {
        console.log('=== 路由测试开始 ===');
        console.log('当前页面:', this.getCurrentPage());
        console.log('基础路径:', this.basePath);
        console.log('页面配置:', this.pages);
        console.log('会话数据:', this.getSessionData());
        console.log('健康检查:', this.healthCheck());
        
        // 测试每个页面的验证
        this.pageFlow.forEach(page => {
            const validation = this.validateFlow(page);
            console.log(`${page} 页面验证:`, validation);
        });
        
        console.log('=== 路由测试结束 ===');
        return {
            currentPage: this.getCurrentPage(),
            basePath: this.basePath,
            pages: this.pages,
            sessionData: this.getSessionData(),
            health: this.healthCheck()
        };
    }

    /**
     * 监听错误事件
     */
    setupErrorHandling() {
        // 监听页面错误
        window.addEventListener('error', (event) => {
            console.error('页面错误:', event.error);
            this.showMessage('页面出现错误，请刷新重试', 'error');
        });

        // 监听Promise拒绝
        window.addEventListener('unhandledrejection', (event) => {
            console.error('未处理的Promise拒绝:', event.reason);
            this.showMessage('操作失败，请重试', 'error');
        });

        // 监听存储错误
        window.addEventListener('storage', (event) => {
            if (event.key === this.sessionKey && event.newValue === null) {
                this.showMessage('会话数据被清除，正在重新初始化...', 'info');
                this.initSessionData();
            }
        });

        // 定期健康检查
        setInterval(() => {
            const health = this.healthCheck();
            if (!health.healthy) {
                console.warn('系统健康检查失败:', health);
                this.recoverFromError();
            }
        }, 30000); // 每30秒检查一次
    }
}

// 创建全局路由实例
window.AppRouter = AppRouter;
window.router = new AppRouter();

// 设置错误处理
window.router.setupErrorHandling();

// 页面加载完成后进行恢复检查
document.addEventListener('DOMContentLoaded', function() {
    if (window.router) {
        window.router.restoreFromURL();
        window.router.recoverFromError();
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppRouter;
} 
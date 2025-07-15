/**
 * 进度指示器组件
 * 显示用户在整个流程中的当前位置
 */

class ProgressIndicator {
    constructor() {
        this.steps = [
            { id: 'index', label: '选择专家', icon: '1' },
            { id: 'upload', label: '上传视频', icon: '2' },
            { id: 'analysis', label: '分析中', icon: '3' },
            { id: 'ai', label: 'AI对话', icon: '4' }
        ];
        
        this.currentPage = null;
        this.init();
    }

    init() {
        this.createProgressBar();
        this.updateProgress();
        
        // 监听路由变化
        if (window.router) {
            this.currentPage = window.router.getCurrentPage();
        }
    }

    createProgressBar() {
        // 检查是否已存在进度条
        if (document.querySelector('.progress-indicator')) {
            return;
        }

        const progressHTML = `
            <div class="progress-indicator">
                <div class="progress-steps">
                    ${this.steps.map((step, index) => `
                        <div class="progress-step">
                            <div class="step-circle" data-step="${step.id}">
                                <span>${step.icon}</span>
                            </div>
                            <div class="step-label" data-step="${step.id}">${step.label}</div>
                            ${index < this.steps.length - 1 ? '<div class="step-connector" data-connector="' + index + '"></div>' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        // 插入到页面顶部
        document.body.insertAdjacentHTML('afterbegin', progressHTML);
        
        // 为页面主体添加顶部边距
        document.body.classList.add('page-with-progress');
    }

    updateProgress() {
        if (!window.router) return;

        const currentPage = window.router.getCurrentPage();
        const currentIndex = this.steps.findIndex(step => step.id === currentPage);

        // 更新步骤状态
        this.steps.forEach((step, index) => {
            const circle = document.querySelector(`.step-circle[data-step="${step.id}"]`);
            const label = document.querySelector(`.step-label[data-step="${step.id}"]`);
            const connector = document.querySelector(`.step-connector[data-connector="${index}"]`);

            if (!circle || !label) return;

            // 重置所有状态
            circle.classList.remove('completed', 'current', 'pending');
            label.classList.remove('completed', 'current', 'pending');
            
            if (connector) {
                connector.classList.remove('completed');
            }

            // 设置新状态
            if (index < currentIndex) {
                // 已完成的步骤
                circle.classList.add('completed');
                label.classList.add('completed');
                if (connector) {
                    connector.classList.add('completed');
                }
            } else if (index === currentIndex) {
                // 当前步骤
                circle.classList.add('current');
                label.classList.add('current');
            } else {
                // 待完成的步骤
                circle.classList.add('pending');
                label.classList.add('pending');
            }
        });

        this.currentPage = currentPage;
    }

    getProgressPercentage() {
        if (!window.router) return 0;
        
        const currentPage = window.router.getCurrentPage();
        const currentIndex = this.steps.findIndex(step => step.id === currentPage);
        
        return Math.round(((currentIndex + 1) / this.steps.length) * 100);
    }

    getCurrentStepInfo() {
        if (!window.router) return null;
        
        const currentPage = window.router.getCurrentPage();
        const currentStep = this.steps.find(step => step.id === currentPage);
        const currentIndex = this.steps.findIndex(step => step.id === currentPage);
        
        return {
            step: currentStep,
            index: currentIndex + 1,
            total: this.steps.length,
            percentage: this.getProgressPercentage()
        };
    }

    show() {
        const indicator = document.querySelector('.progress-indicator');
        if (indicator) {
            indicator.style.display = 'block';
            document.body.classList.add('page-with-progress');
        }
    }

    hide() {
        const indicator = document.querySelector('.progress-indicator');
        if (indicator) {
            indicator.style.display = 'none';
            document.body.classList.remove('page-with-progress');
        }
    }

    destroy() {
        const indicator = document.querySelector('.progress-indicator');
        if (indicator) {
            indicator.remove();
            document.body.classList.remove('page-with-progress');
        }
    }

    // 动画效果：高亮当前步骤
    highlightCurrentStep() {
        const currentPage = window.router?.getCurrentPage();
        if (!currentPage) return;

        const circle = document.querySelector(`.step-circle[data-step="${currentPage}"]`);
        if (circle) {
            circle.style.transform = 'scale(1.1)';
            setTimeout(() => {
                circle.style.transform = 'scale(1)';
            }, 300);
        }
    }

    // 添加步骤点击事件（可选功能）
    addStepClickHandlers() {
        const circles = document.querySelectorAll('.step-circle');
        circles.forEach(circle => {
            circle.addEventListener('click', (e) => {
                const stepId = e.target.closest('.step-circle').dataset.step;
                const currentPage = window.router?.getCurrentPage();
                const currentIndex = this.steps.findIndex(step => step.id === currentPage);
                const targetIndex = this.steps.findIndex(step => step.id === stepId);

                // 只允许访问已完成的步骤或当前步骤
                if (targetIndex <= currentIndex && window.router) {
                    window.router.navigateTo(stepId);
                } else {
                    window.router?.showMessage('请按顺序完成各个步骤', 'info');
                }
            });
        });
    }
}

// 自动初始化进度指示器
document.addEventListener('DOMContentLoaded', function() {
    // 等待路由器初始化
    setTimeout(() => {
        if (window.router) {
            window.progressIndicator = new ProgressIndicator();
            // 可选：添加步骤点击功能
            // window.progressIndicator.addStepClickHandlers();
        }
    }, 100);
});

// 页面可见性变化时更新进度
document.addEventListener('visibilitychange', function() {
    if (!document.hidden && window.progressIndicator) {
        setTimeout(() => {
            window.progressIndicator.updateProgress();
        }, 100);
    }
});

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressIndicator;
} 
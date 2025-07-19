// AI手术复盘助手 - 首页交互逻辑

document.addEventListener('DOMContentLoaded', function() {
    // 获取所有AI助手卡片
    const aiCards = document.querySelectorAll('.ai-card');
    
    // 医生信息数据
    const doctorData = {
        wangzhiruo: {
            id: 'wangzhiruo',  // 添加id字段，确保与后端配置中的key一致
            name: '王专家',
            specialty: '普外科',
            expertise: '术后并发症分析',
            description: '精于普外科手术全流程复盘，擅长发现术中遗漏与术后风险隐患。'
        },
        chenguodong: {
            id: 'chenguodong',  // 添加id字段，确保与后端配置中的key一致
            name: '陈专家',
            specialty: '内科',
            expertise: '复杂病例复盘',
            description: '经验丰富的内科复盘专家AI，帮助识别复杂手术中的关键改进点。'
        }
    };

    // 为每个卡片添加点击事件
    aiCards.forEach(card => {
        // 添加点击事件
        card.addEventListener('click', function() {
            const doctorId = this.getAttribute('data-doctor');
            const doctor = doctorData[doctorId];
            
            if (doctor) {
                handleDoctorSelection(doctor, doctorId);
            }
        });

        // 添加触摸反馈效果
        card.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(-1px) scale(0.98)';
        });

        card.addEventListener('touchend', function() {
            this.style.transform = '';
        });

        // 添加鼠标悬停效果增强
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-4px)';
            
            // 添加轻微的发光效果
            this.style.boxShadow = `
                -4px 8px 20px 0px rgba(145, 145, 145, 0.1),
                -14px 34px 36px 0px rgba(145, 145, 145, 0.08),
                -30px 74px 48px 0px rgba(145, 145, 145, 0.06),
                -54px 132px 58px 0px rgba(145, 145, 145, 0.04),
                -84px 206px 62px 0px rgba(145, 145, 145, 0.02),
                0 0 40px rgba(235, 23, 0, 0.1)
            `;
        });

        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.boxShadow = '';
        });
    });

    // 处理医生选择
    function handleDoctorSelection(doctor, doctorId) {
        console.log('handleDoctorSelection 被调用:', { doctor, doctorId });
        
        // 显示选择反馈
        showSelectionFeedback(doctor);
        
        // 保存医生信息并跳转到upload页面
        const doctorData = {
            id: doctorId,
            name: doctor.name,
            specialty: doctor.specialty,
            expertise: doctor.expertise,
            description: doctor.description,
            selectedAt: new Date().toISOString()
        };
        
        console.log(`选择了${doctor.name} - ${doctor.specialty}专家，数据:`, doctorData);
        
        // 使用路由管理器跳转
        setTimeout(() => {
            if (window.router) {
                console.log('准备跳转到upload页面，医生数据:', doctorData);
                
                // 先手动保存数据，确保保存成功
                const saveResult = window.router.savePageData('doctor', doctorData);
                console.log('手动保存医生数据结果:', saveResult);
                
                // 验证保存是否成功
                const verifyData = window.router.getPageData('doctor');
                console.log('验证保存的医生数据:', verifyData);
                
                if (verifyData) {
                    // 数据保存成功，执行跳转
                    window.router.navigateTo('upload', { doctor: doctorData });
                } else {
                    console.error('医生数据保存失败');
                    alert('数据保存失败，请重试');
                }
            } else {
                console.error('路由管理器未初始化');
                alert('页面加载异常，请刷新页面重试');
            }
        }, 1500); // 等待反馈动画完成
    }

    // 显示选择反馈动画
    function showSelectionFeedback(doctor) {
        // 创建反馈提示
        const feedback = document.createElement('div');
        feedback.className = 'selection-feedback';
        feedback.innerHTML = `
            <div class="feedback-content">
                <div class="feedback-icon">✓</div>
                <div class="feedback-text">已选择 ${doctor.name}</div>
            </div>
        `;
        
        // 添加CSS样式
        feedback.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(235, 23, 0, 0.95);
            color: white;
            padding: 20px 30px;
            border-radius: 16px;
            z-index: 1000;
            opacity: 0;
            transition: opacity 0.3s ease;
            backdrop-filter: blur(10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(feedback);
        
        // 显示动画
        setTimeout(() => {
            feedback.style.opacity = '1';
        }, 10);
        
        // 隐藏动画
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                document.body.removeChild(feedback);
            }, 300);
        }, 1500);
    }

    // 添加页面加载动画
    function initPageAnimations() {
        const elements = [
            '.welcome-section',
            '.ai-card:nth-child(1)',
            '.ai-card:nth-child(2)',
            '.ai-card:nth-child(3)'
        ];

        elements.forEach((selector, index) => {
            const element = document.querySelector(selector);
            if (element) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(30px)';
                element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, 200 * (index + 1));
            }
        });
    }

    // 初始化页面动画
    initPageAnimations();

    // 添加滚动视差效果（如果内容超出屏幕）
    function initParallaxEffect() {
        const backgroundDecoration = document.querySelector('.background-decoration');
        
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            
            if (backgroundDecoration) {
                backgroundDecoration.style.transform = `translateY(${rate}px)`;
            }
        });
    }

    // 初始化视差效果
    initParallaxEffect();

    // 添加键盘导航支持
    document.addEventListener('keydown', function(e) {
        const focusedCard = document.activeElement;
        
        if (e.key === 'Enter' || e.key === ' ') {
            if (focusedCard && focusedCard.classList.contains('ai-card')) {
                e.preventDefault();
                focusedCard.click();
            }
        }
    });

    // 为卡片添加焦点支持
    aiCards.forEach((card, index) => {
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `选择${card.querySelector('.doctor-name').textContent}医生AI助手`);
    });

    // 添加触摸滑动支持（移动端）
    let touchStartY = 0;
    let touchEndY = 0;

    document.addEventListener('touchstart', function(e) {
        touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', function(e) {
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartY - touchEndY;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // 向上滑动
                console.log('向上滑动 - 可以添加更多内容或刷新功能');
            } else {
                // 向下滑动
                console.log('向下滑动 - 可以添加返回或刷新功能');
            }
        }
    }

    // 添加性能监控和错误处理
    window.addEventListener('error', function(e) {
        console.error('页面错误:', e.error);
    });

    // 页面性能监控
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.timing;
                const loadTime = perfData.loadEventEnd - perfData.navigationStart;
                console.log(`页面加载时间: ${loadTime}ms`);
            }, 0);
        });
    }
});

// 添加反馈样式到head
const feedbackStyles = document.createElement('style');
feedbackStyles.textContent = `
    .feedback-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .feedback-icon {
        width: 24px;
        height: 24px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
    }
    
    .feedback-text {
        font-size: 16px;
        font-weight: 500;
    }
`;

document.head.appendChild(feedbackStyles); 
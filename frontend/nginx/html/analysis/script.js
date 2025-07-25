// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化路由器
    if (!window.router && typeof AppRouter !== 'undefined') {
        window.router = new AppRouter();
        console.log('Router initialized');
    }
    
    initializePage();
});

// 在window完全加载后再次尝试更新医生头像
window.addEventListener('load', function() {
    console.log('页面完全加载，再次尝试更新医生头像');
    // 延迟300毫秒，确保所有资源都已加载完成
    setTimeout(updateDoctorAvatar, 300);
});

// 初始化页面
function initializePage() {
    console.log('初始化分析页面');
    
    // 验证数据并显示分析信息
    if (window.router) {
        const validation = window.router.validateFlow('analysis');
        console.log('路由验证结果:', validation);
        
        if (!validation.valid) {
            window.router.showMessage(validation.reason, 'error');
            if (validation.redirectTo) {
                setTimeout(() => {
                    window.router.navigateTo(validation.redirectTo);
                }, 2000);
            }
            return;
        }
        
        // 尝试从URL参数获取医生信息
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const doctorParam = urlParams.get('doctor');
            
            if (doctorParam) {
                console.log('从URL参数中获取到医生数据:', doctorParam);
                try {
                    // 尝试解析JSON
                    const doctorData = JSON.parse(decodeURIComponent(doctorParam));
                    console.log('解析后的医生数据:', doctorData);
                    
                    // 如果router中没有医生数据，则使用URL参数中的数据
                    if (!window.router.getPageData('doctor')) {
                        console.log('保存从URL获取的医生数据到router');
                        window.router.savePageData('doctor', doctorData);
                    }
                } catch (e) {
                    console.error('解析URL医生参数失败:', e);
                }
            }
        } catch (e) {
            console.error('处理URL参数时出错:', e);
        }
        
        // 显示分析的视频信息
        displayAnalysisInfo();
        
        // 更新医生头像
        updateDoctorAvatar();
    } else {
        console.error('Router未初始化');
    }
    
    // 启动进度条动画
    animateProgressBar();
    
    // 添加卡片点击事件
    addCardClickEvents();
    
    // 模拟分析进度更新
    simulateAnalysisProgress();
}

// 更新医生头像
function updateDoctorAvatar() {
    console.log('开始更新医生头像');
    const doctorData = window.router.getPageData('doctor');
    console.log('获取到的医生数据:', doctorData);
    
    if (!doctorData) {
        console.warn('未找到医生数据，无法更新头像');
        return;
    }
    
    // 尝试通过类选择器和ID选择器查找元素
    let doctorAvatar = document.querySelector('.doctor-avatar');
    if (!doctorAvatar) {
        doctorAvatar = document.getElementById('doctorAvatar');
    }
    
    console.log('找到的医生头像元素:', doctorAvatar);
    
    if (doctorAvatar) {
        let imagePath;
        
        if (doctorData.id === 'wang' || (doctorData.name && doctorData.name.includes('王'))) {
            console.log('选择了王医生，更新头像为doctor1.png');
            imagePath = './images/doctor1.png';
        } else if (doctorData.id === 'chen' || (doctorData.name && doctorData.name.includes('陈'))) {
            console.log('选择了陈医生，更新头像为doctor3.png');
            imagePath = './images/doctor3.png';
        } else {
            console.warn('未识别的医生ID:', doctorData.id);
            return;
        }
        
        // 设置新的图片路径
        doctorAvatar.src = imagePath;
        
        // 验证图片是否加载成功
        doctorAvatar.onload = () => {
            console.log('医生头像加载成功:', imagePath);
        };
        
        doctorAvatar.onerror = () => {
            console.error('医生头像加载失败:', imagePath);
            // 尝试使用绝对路径
            if (imagePath.startsWith('./')) {
                const absolutePath = imagePath.replace('./', '/analysis/');
                console.log('尝试使用绝对路径:', absolutePath);
                doctorAvatar.src = absolutePath;
            }
        };
    } else {
        console.error('未找到医生头像元素，无法更新头像');
    }
}

// 显示正在分析的信息
function displayAnalysisInfo() {
    const doctorData = window.router.getPageData('doctor');
    const videoData = window.router.getPageData('video');
    
    if (doctorData && videoData) {
        const titleSection = document.querySelector('.title-section h1');
        if (titleSection) {
            titleSection.innerHTML = `
                视频上传成功！<br>
                正在为您进行深入手术复盘分析，<br>
                请稍候…
                <div style="margin-top: 16px; font-size: 14px; opacity: 0.8; font-weight: normal;">
                    分析视频：${videoData.name} | AI专家：${doctorData.name}
                </div>
            `;
        }
    }
}

// 返回按钮功能
function goBack() {
    // 添加点击动画效果
    const backButton = document.querySelector('.back-button');
    backButton.style.transform = 'scale(0.9)';
    
    setTimeout(() => {
        backButton.style.transform = 'scale(1)';
        
        if (window.router) {
            window.router.goBack();
        } else {
            // 降级处理
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '../upload/index.html';
            }
        }
    }, 150);
}

// 进度条动画
function animateProgressBar() {
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    
    // 初始设置为0
    progressFill.style.width = '0%';
    progressText.textContent = '0%';
    
    // 延迟开始动画
    setTimeout(() => {
        progressFill.style.width = '68%';
        
        // 数字递增动画
        animateNumber(progressText, 0, 68, 800);
    }, 500);
}

// 数字递增动画
function animateNumber(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateNumber(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.round(start + (end - start) * easeOutQuart);
        
        element.textContent = currentValue + '%';
        
        if (progress < 1) {
            requestAnimationFrame(updateNumber);
        }
    }
    
    requestAnimationFrame(updateNumber);
}

// 添加卡片点击事件
function addCardClickEvents() {
    const cards = document.querySelectorAll('.card');
    
    cards.forEach((card, index) => {
        card.addEventListener('click', function() {
            handleCardClick(this, index);
        });
        
        // 添加触摸效果
        card.addEventListener('touchstart', function() {
            this.style.transform = 'translateY(-2px) scale(0.98)';
        });
        
        card.addEventListener('touchend', function() {
            this.style.transform = 'translateY(-2px) scale(1)';
        });
    });
}

// 处理卡片点击
function handleCardClick(card, index) {
    const cardTexts = [
        '识别术中关键步骤',
        '分析手术操作路径', 
        '生成个性化改进建议',
        '检测风险与并发症征兆',
        '对比最佳实践案例'
    ];
    
    // 添加点击动画
    card.style.transform = 'translateY(-2px) scale(0.95)';
    
    setTimeout(() => {
        card.style.transform = 'translateY(-2px) scale(1)';
    }, 150);
    
    // 显示提示信息
    showTooltip(`正在${cardTexts[index]}...`, card);
    
    // 这里可以添加具体的功能逻辑
    console.log(`点击了：${cardTexts[index]}`);
}

// 显示提示信息
function showTooltip(message, targetElement) {
    // 移除已存在的提示
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) {
        existingTooltip.remove();
    }
    
    // 创建新的提示元素
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    
    // 添加样式
    tooltip.style.cssText = `
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        pointer-events: none;
    `;
    
    // 定位提示
    const rect = targetElement.getBoundingClientRect();
    const containerRect = document.querySelector('.container').getBoundingClientRect();
    
    tooltip.style.left = (rect.left - containerRect.left + rect.width / 2) + 'px';
    tooltip.style.top = (rect.bottom - containerRect.top + 10) + 'px';
    tooltip.style.transform = 'translateX(-50%) translateY(10px)';
    
    // 添加到容器
    document.querySelector('.container').appendChild(tooltip);
    
    // 显示动画
    setTimeout(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateX(-50%) translateY(0)';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateX(-50%) translateY(-10px)';
        setTimeout(() => tooltip.remove(), 300);
    }, 2000);
}

// 模拟分析进度更新
function simulateAnalysisProgress() {
    const progressSteps = [68, 72, 78, 85, 92, 96, 100];
    let currentStep = 0;
    
    const updateProgress = () => {
        if (currentStep < progressSteps.length) {
            const progressFill = document.querySelector('.progress-fill');
            const progressText = document.querySelector('.progress-text');
            const newProgress = progressSteps[currentStep];
            
            progressFill.style.width = newProgress + '%';
            
            // 平滑数字更新
            const currentValue = parseInt(progressText.textContent);
            animateNumber(progressText, currentValue, newProgress, 500);
            
            currentStep++;
            
            // 如果达到100%，显示完成信息
            if (newProgress === 100) {
                setTimeout(() => {
                    showCompletionMessage();
                }, 1000);
            }
        }
    };
    
    // 定期更新进度
    const progressInterval = setInterval(() => {
        updateProgress();
        
        if (currentStep >= progressSteps.length) {
            clearInterval(progressInterval);
        }
    }, 3000);
}

// 显示完成信息
function showCompletionMessage() {
    const completionMessage = document.createElement('div');
    completionMessage.className = 'completion-message';
    completionMessage.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">✓</div>
            <div class="completion-text">分析完成！</div>
            <button class="completion-button" onclick="viewResults()">查看结果</button>
        </div>
    `;
    
    completionMessage.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    // 添加完成内容样式
    const style = document.createElement('style');
    style.textContent = `
        .completion-content {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            max-width: 300px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        
        .completion-icon {
            font-size: 48px;
            color: #4CAF50;
            margin-bottom: 16px;
        }
        
        .completion-text {
            font-size: 18px;
            font-weight: 500;
            color: #333;
            margin-bottom: 24px;
        }
        
        .completion-button {
            background: linear-gradient(90deg, #FB7C6E 0%, #EB1701 100%);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: transform 0.2s ease;
        }
        
        .completion-button:hover {
            transform: translateY(-2px);
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(completionMessage);
    
    // 显示动画
    setTimeout(() => {
        completionMessage.style.opacity = '1';
    }, 10);
}

// 查看结果功能
function viewResults() {
    if (window.router) {
        // 生成分析结果数据
        const sessionId = window.router.generateId('session_');
        const analysisData = {
            progress: 100,
            completed_at: new Date().toISOString(),
            session_id: sessionId
        };
        
        // 保存分析结果
        window.router.savePageData('analysis', analysisData);
        
        // 跳转到AI对话页面
        window.router.navigateTo('ai', { analysis: analysisData });
    } else {
        // 降级处理
        alert('系统错误，请刷新页面重试');
    }
}

// 添加键盘事件支持
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // ESC键返回
        goBack();
    }
});

// 添加手势支持（移动端）
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', function(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
});

document.addEventListener('touchend', function(event) {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndY = event.changedTouches[0].clientY;
    
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    
    // 右滑返回
    if (deltaX > 100 && Math.abs(deltaY) < 100) {
        goBack();
    }
}); 
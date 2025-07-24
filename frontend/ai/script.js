// 初始化页面
function initializePage() {
    if (window.router) {
        // 验证访问权限
        const validation = window.router.validateFlow('ai');
        if (!validation.valid) {
            window.router.showMessage(validation.reason, 'error');
            if (validation.redirectTo) {
                setTimeout(() => {
                    window.router.navigateTo(validation.redirectTo);
                }, 2000);
            }
            return;
        }
        
        // 显示综合信息
        displaySessionInfo();
    }
    
    // 加载建议问题
    loadSuggestedQuestions();
}

// 全局变量
let isWaitingForResponse = false;
let chatMessages;
// 添加变量以跟踪最后一条AI消息的引用
let lastAiMessage = null;

// 创建消息元素
function createMessage(content, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    const avatarImg = document.createElement('img');
    
    // 获取医生数据
    const doctorData = window.router ? window.router.getPageData('doctor') : null;
    
    if (isUser) {
        avatarImg.src = '/ai/images/user_avatar.png';
        avatarImg.alt = '用户';
    } else {
        // 根据医生类型选择头像
        if (doctorData && (doctorData.id === 'wang' || doctorData.name.includes('王'))) {
            avatarImg.src = '/ai/images/doctor1.png';
        } else {
            avatarImg.src = '/ai/images/doctor3.png';
        }
        avatarImg.alt = 'AI助手';
    }
    
    avatar.appendChild(avatarImg);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    
    if (isUser) {
        messageText.textContent = content;
    } else {
        messageText.innerHTML = renderMarkdown(content);
    }
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(messageContent);
    
    return messageDiv;
}

// 显示输入状态指示器
function showTypingIndicator() {
    const typingDiv = document.createElement('div');
    typingDiv.className = 'typing-indicator';
    typingDiv.id = 'typing-indicator';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    const avatarImg = document.createElement('img');
    
    // 获取医生数据
    const doctorData = window.router ? window.router.getPageData('doctor') : null;
    
    // 根据医生类型选择头像
    if (doctorData && (doctorData.id === 'wang' || doctorData.name.includes('王'))) {
        avatarImg.src = '/ai/images/doctor1.png';
    } else {
        avatarImg.src = '/ai/images/doctor3.png';
    }
    
    avatarImg.alt = 'AI助手';
    avatar.appendChild(avatarImg);
    
    const typingDots = document.createElement('div');
    typingDots.className = 'typing-dots';
    
    for (let i = 0; i < 3; i++) {
        const dot = document.createElement('div');
        dot.className = 'typing-dot';
        typingDots.appendChild(dot);
    }
    
    typingDiv.appendChild(avatar);
    typingDiv.appendChild(typingDots);
    chatMessages.appendChild(typingDiv);
    
    // 显示动画
    setTimeout(() => {
        typingDiv.classList.add('show');
    }, 10);
    
    scrollToBottom();
}

// 隐藏输入状态指示器
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// 滚动到底部
function scrollToBottom() {
    setTimeout(() => {
        const container = document.querySelector('.app-container');
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, 100);
}

// 禁用状态管理
function updateInputState() {
    const askButton = document.querySelector('.ask-button');
    const questionInput = document.querySelector('.question-input');
    if (askButton && questionInput) {
        askButton.disabled = isWaitingForResponse;
        questionInput.disabled = isWaitingForResponse;
        if (isWaitingForResponse) {
            askButton.style.opacity = '0.5';
            questionInput.placeholder = 'AI正在思考中...';
        } else {
            askButton.style.opacity = '1';
            questionInput.placeholder = '输入您的问题...';
        }
    }
}

// 显示或隐藏建议问题部分
function toggleSuggestedQuestions(show = true) {
    const suggestedQuestionsCard = document.querySelector('.suggested-questions');
    if (suggestedQuestionsCard) {
        if (show) {
            suggestedQuestionsCard.style.display = 'block';
        } else {
            suggestedQuestionsCard.style.display = 'none';
        }
    }
}

// 将建议问题移动到最新AI消息下方
function moveSuggestedQuestionsAfterLastMessage() {
    const suggestedQuestionsCard = document.querySelector('.suggested-questions');
    if (suggestedQuestionsCard && lastAiMessage) {
        // 从原位置移除
        suggestedQuestionsCard.remove();
        // 插入到最后一条AI消息后面
        lastAiMessage.after(suggestedQuestionsCard);
        // 确保显示
        suggestedQuestionsCard.style.display = 'block';
    }
}

// Markdown渲染函数
function renderMarkdown(text) {
    // 使用marked.js库进行markdown渲染（如果可用）
    if (typeof marked !== 'undefined') {
        // 配置marked.js选项
        marked.setOptions({
            breaks: true,
            gfm: true,
            sanitize: false
        });
        return marked.parse(text);
    } else {
        // 降级到简单的markdown渲染器
        let html = text;
        
        // 标题
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // 粗体和斜体
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 代码块
        html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        html = html.replace(/`(.*?)`/g, '<code>$1</code>');
        
        // 链接
        html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // 引用
        html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
        
        // 无序列表
        html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
        html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
        
        // 有序列表
        html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
        
        // 换行处理
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/\n/g, '<br>');
        
        // 包装段落
        if (!html.includes('<h') && !html.includes('<ul') && !html.includes('<ol') && !html.includes('<blockquote')) {
            html = '<p>' + html + '</p>';
        }
        
        return html;
    }
}

// 显示会话信息
function displaySessionInfo() {
    const doctorData = window.router.getPageData('doctor');
    const videoData = window.router.getPageData('video');
    const patientData = window.router.getPageData('patient');
    const analysisData = window.router.getPageData('analysis');
    
    // 更新基本信息区域
    if (videoData && patientData) {
        updateBasicInfo(videoData, patientData);
    }
    
    // 更新页面标题
    if (doctorData) {
        updatePageTitle(doctorData);
        // 更新分析内容
        updateAnalysisContent(doctorData);
        // 更新医生头像
        updateDoctorAvatar(doctorData);
    }
    
    console.log('会话数据已加载:', { doctorData, videoData, patientData, analysisData });
}

// 更新医生头像
function updateDoctorAvatar(doctorData) {
    if (!doctorData) return;
    
    // 更新背景装饰中的头像
    const doctorAvatar = document.querySelector('.doctor-avatar');
    if (doctorAvatar) {
        if (doctorData.id === 'wang' || doctorData.name.includes('王')) {
            doctorAvatar.src = '/ai/images/doctor1.png';
        } else if (doctorData.id === 'chen' || doctorData.name.includes('陈')) {
            doctorAvatar.src = '/ai/images/doctor3.png';
        }
    }
    
    // 更新聊天消息中使用的头像
    const aiAvatars = document.querySelectorAll('.message.ai .message-avatar img');
    if (aiAvatars.length > 0) {
        const aiAvatarSrc = (doctorData.id === 'wang' || doctorData.name.includes('王')) 
            ? '/ai/images/doctor1.png' 
            : '/ai/images/doctor3.png';
        
        aiAvatars.forEach(avatar => {
            avatar.src = aiAvatarSrc;
        });
    }
}

// 更新分析内容
function updateAnalysisContent(doctorData) {
    const analysisContent = document.querySelector('.analysis-content');
    if (!analysisContent || !doctorData) return;
    
    let content = '';
    
    // 根据医生ID或名称显示不同的分析内容
    if (doctorData.id === 'chen' || doctorData.name.includes('陈')) {
        // 陈专家的分析
        content = `<p>胸外--陈专家<br>
            手术术式：胸腔镜右上肺叶切除术<br>
            手术时间：150min<br>
            手术总出血量：68ml<br>
            使用器械：腔镜电凝钳、穿刺器、内视镜<br>
            单肺通气时间：120min<br>
            术中胸腔引流量：约50ml</p>`;
    } else if (doctorData.id === 'wang' || doctorData.name.includes('王')) {
        // 王专家的分析
        content = `<p>普外--王专家<br>
            手术术式：腹腔镜右半结肠切除术<br>
            手术时间：117min<br>
            手术总出血量：80ml<br>
            使用器械：超声刀、双极电凝<br>
            肠道准备情况：术前48小时清肠完成，无残渣<br>
            吻合方式：机械吻合，端侧回肠-结肠吻合</p>`;
    } else {
        // 默认分析内容
        content = `<p>暂无该专家的分析内容</p>`;
    }
    
    analysisContent.innerHTML = content;
}

// 更新基本信息
function updateBasicInfo(videoData, patientData) {
    const basicInfoText = document.querySelector('.basic-info-text');
    if (basicInfoText) {
        let content = '';
        
        // 如果有上传日期，显示日期
        if (videoData && videoData.uploadTime) {
            const uploadDate = videoData.uploadTime.split('上传于 ')[1] || videoData.uploadTime;
            content += `<p>日期：${uploadDate}</p>`;
        }
        
        // 显示术式
        if (patientData && patientData.surgery) {
            content += `<p>术式：${patientData.surgery}</p>`;
        }
        
        // 显示医院
        if (patientData && patientData.hospital) {
            content += `<p>医院：${patientData.hospital}</p>`;
        }
        
        // 显示医生
        if (patientData && patientData.doctor) {
            content += `<p>医生：${patientData.doctor}</p>`;
        }
        
        // 显示患者年龄和性别
        if (patientData) {
            let patientInfo = '';
            if (patientData.age) {
                patientInfo += `${patientData.age}岁`;
            }
            if (patientData.gender) {
                patientInfo += patientInfo ? `，${patientData.gender}` : patientData.gender;
            }
            if (patientInfo) {
                content += `<p>患者：${patientInfo}</p>`;
            }
        }
        
        // 显示BMI
        if (patientData && patientData.bmi) {
            content += `<p>BMI：${patientData.bmi}</p>`;
        }
        
        // 显示出血量
        if (patientData && patientData.bleeding) {
            content += `<p>出血量：${patientData.bleeding}ml</p>`;
        }
        
        // 更新内容
        basicInfoText.innerHTML = content || '<p>暂无手术信息</p>';
    }
}

// 更新页面标题
function updatePageTitle(doctorData) {
    const introText = document.querySelector('.intro-text');
    if (introText) {
        introText.innerHTML = `
            <h2>以下是您本次手术的AI复盘</h2>
            <p>由${doctorData.name}（${doctorData.specialty}）为您提供专业分析与建议</p>
        `;
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // 初始化路由器
    if (!window.router && typeof AppRouter !== 'undefined') {
        window.router = new AppRouter();
        console.log('Router initialized');
    }
    
    // 初始化页面数据
    initializePage();
    
    // 返回按钮功能
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            if (window.router) {
                window.router.goBack();
            } else {
                window.history.back();
            }
        });
    }

    // 初始化视频播放器
    initializeVideoPlayer();

    // 播放按钮功能
    const playBtn = document.querySelector('.play-btn');
    let isPlaying = false;

    if (playBtn) {
        playBtn.addEventListener('click', function() {
            isPlaying = !isPlaying;
            const playIcon = playBtn.querySelector('img');
            
            if (isPlaying) {
                // 切换到暂停图标 (可以用Unicode字符或更换图片)
                playIcon.style.display = 'none';
                playBtn.innerHTML = '<span style="color: white; font-size: 20px;">⏸</span>';
            } else {
                // 切换回播放图标
                playBtn.innerHTML = '<img src="images/play_arrow.svg" alt="播放" style="width: 20px; height: 20px; filter: invert(1);">';
            }
        });
    }

    // 控制按钮功能
    const volumeBtn = document.querySelector('.volume-btn');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    const moreBtn = document.querySelector('.more-btn');

    if (volumeBtn) {
        volumeBtn.addEventListener('click', function() {
            console.log('音量控制');
            // 这里可以添加音量控制功能
        });
    }

    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            console.log('全屏模式');
            // 这里可以添加全屏功能
        });
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', function() {
            console.log('更多选项');
            // 这里可以添加更多选项菜单
        });
    }

    // 对话功能相关变量
    chatMessages = document.getElementById('chat-messages');
    const askButton = document.querySelector('.ask-button');
    const questionInput = document.querySelector('.question-input');
    
    // 确保建议问题最初显示在主内容区域，且可见
    const suggestedQuestions = document.querySelector('.suggested-questions');
    if (suggestedQuestions) {
        suggestedQuestions.style.display = 'block';
    }
    
    // 提问按钮功能
    if (askButton && questionInput) {
        askButton.addEventListener('click', function() {
            const message = questionInput.value.trim();
            if (message) {
                sendMessage(message);
                questionInput.value = '';
            }
        });

        // 回车键提交
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const message = questionInput.value.trim();
                if (message) {
                    sendMessage(message);
                    questionInput.value = '';
                }
            }
        });
        
        // 初始化输入状态
        updateInputState();
    }

    // 生成报告按钮功能
    const generateReportBtn = document.querySelector('.generate-report-btn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            console.log('生成PDF报告');
            
            // 显示加载状态
            const originalText = generateReportBtn.innerHTML;
            generateReportBtn.innerHTML = '<span style="margin-right: 8px;">⏳</span>正在生成...';
            generateReportBtn.disabled = true;
            
            // 模拟生成过程
            setTimeout(() => {
                generateReportBtn.innerHTML = originalText;
                generateReportBtn.disabled = false;
                alert('报告生成完成！');
            }, 2000);
        });
    }

    // 学习视频播放功能
    const learningVideos = document.querySelectorAll('.learning-video');
    learningVideos.forEach(video => {
        video.addEventListener('click', function() {
            const title = video.parentElement.querySelector('.learning-title').textContent;
            console.log('播放学习视频:', title);
            alert(`开始播放: ${title}`);
        });
    });

    // 进度条拖拽功能
    const progressTrack = document.querySelector('.progress-track');
    const progressFill = document.querySelector('.progress-fill');
    const progressKnob = document.querySelector('.progress-knob');

    if (progressTrack && progressFill && progressKnob) {
        let isDragging = false;

        progressTrack.addEventListener('mousedown', startDrag);
        progressTrack.addEventListener('touchstart', startDrag);

        function startDrag(e) {
            isDragging = true;
            updateProgress(e);
        }

        document.addEventListener('mousemove', function(e) {
            if (isDragging) {
                updateProgress(e);
            }
        });

        document.addEventListener('touchmove', function(e) {
            if (isDragging) {
                updateProgress(e);
            }
        });

        document.addEventListener('mouseup', stopDrag);
        document.addEventListener('touchend', stopDrag);

        function stopDrag() {
            isDragging = false;
        }

        function updateProgress(e) {
            const rect = progressTrack.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
            
            progressFill.style.width = percentage + '%';
            progressKnob.style.left = percentage + '%';
        }
    }

    // 页面滚动时的视觉效果
    let lastScrollTop = 0;
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        lastScrollTop = scrollTop;
    });

    // 添加一些动画效果
    function addEntranceAnimations() {
        const cards = document.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }

    // 页面加载完成后添加动画
    addEntranceAnimations();

    // 时间轴标记点击功能
    const timelineMarkers = document.querySelectorAll('.timeline-marker');
    timelineMarkers.forEach(marker => {
        marker.addEventListener('click', function() {
            const time = marker.textContent;
            console.log('跳转到时间点:', time);
            
            // 更新当前时间指示器
            const indicator = document.querySelector('.current-time-indicator');
            if (indicator) {
                const markerRect = marker.getBoundingClientRect();
                const timelineRect = document.querySelector('.timeline').getBoundingClientRect();
                const percentage = ((markerRect.left - timelineRect.left) / timelineRect.width) * 100;
                
                indicator.style.left = percentage + '%';
                indicator.querySelector('.time-badge').textContent = time;
            }
        });
    });

    // 手术阶段点击功能
    const phaseItems = document.querySelectorAll('.phase-item');
    phaseItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除其他高亮
            phaseItems.forEach(phase => phase.classList.remove('highlight'));
            
            // 添加当前高亮
            item.classList.add('highlight');
            
            const phaseName = item.querySelector('.phase-label').textContent;
            console.log('选择手术阶段:', phaseName);
        });
    });

    console.log('AI手术复盘助手页面已加载完成');
}); 

// 发送消息
async function sendMessage(message) {
    if (!message.trim() || isWaitingForResponse) return;
    
    isWaitingForResponse = true;
    updateInputState(); // 立即更新输入状态
    
    // 在接收AI消息期间隐藏建议问题部分
    toggleSuggestedQuestions(false);
    
    // 添加用户消息
    const userMessage = createMessage(message, true);
    chatMessages.appendChild(userMessage);
    scrollToBottom();
    
    // 显示输入状态
    showTypingIndicator();
    
    try {
        // 调用后端API进行流式聊天
        await streamChatWithAPI(message);
    } catch (error) {
        console.error('聊天请求失败:', error);
        hideTypingIndicator();
        
        // 显示错误消息
        const errorMessage = createMessage('抱歉，AI助手暂时无法回应。请稍后再试。', false);
        chatMessages.appendChild(errorMessage);
        lastAiMessage = errorMessage;
        
        // 在错误消息后显示建议问题
        moveSuggestedQuestionsAfterLastMessage();
    } finally {
        isWaitingForResponse = false;
        updateInputState(); // 重新启用输入框
        scrollToBottom();
    }
}

// 流式聊天API调用
async function streamChatWithAPI(message) {
    const API_BASE_URL = 'http://120.55.79.77:8000';
    
    // 从会话数据中获取医生类型
    const doctorData = window.router ? window.router.getPageData('doctor') : null;
    const doctorType = doctorData?.id; // 获取医生ID作为类型标识
    
    console.log('使用医生配置:', doctorType || '默认');
    
    const requestData = {
        message: message,
        user_id: 'web_user_' + Date.now(),
        conversation_id: getCurrentConversationId(),
        stream: true,
        doctor_type: doctorType
    };

    const response = await fetch(`${API_BASE_URL}/api/chat/stream`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    hideTypingIndicator();
    
    // 创建AI消息容器
    const aiMessageDiv = document.createElement('div');
    aiMessageDiv.className = 'message ai';
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    const avatarImg = document.createElement('img');
    
    // 根据医生类型选择头像
    if (doctorData && (doctorData.id === 'wang' || doctorData.name.includes('王'))) {
        avatarImg.src = '/ai/images/doctor1.png';
    } else {
        avatarImg.src = '/ai/images/doctor3.png';
    }
    
    avatarImg.alt = 'AI助手';
    avatar.appendChild(avatarImg);
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    // 初始化空文本，用于收集流式内容
    messageText.dataset.fullContent = '';
    
    // 添加打字动画效果样式
    messageText.classList.add('typing-animation');
    
    const messageTime = document.createElement('div');
    messageTime.className = 'message-time';
    messageTime.textContent = new Date().toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageContent.appendChild(messageText);
    messageContent.appendChild(messageTime);
    aiMessageDiv.appendChild(avatar);
    aiMessageDiv.appendChild(messageContent);
    
    chatMessages.appendChild(aiMessageDiv);
    // 更新最后一条AI消息引用
    lastAiMessage = aiMessageDiv;
    
    try {
        let buffer = ''; // 用于处理不完整的JSON
        let lastUpdateTime = Date.now();
        const minUpdateInterval = 50; // 最小更新间隔（毫秒）
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // 处理可能包含多个或不完整事件的缓冲区
            const lines = buffer.split('\n\n');
            // 保留最后一行，可能是不完整的
            buffer = lines.pop() || '';
            
            for (const line of lines) {
                if (line.trim() && line.startsWith('data: ')) {
                    try {
                        const dataString = line.slice(6).trim();
                        if (dataString) {
                            console.log('收到流式数据:', dataString);
                            const data = JSON.parse(dataString);
                            console.log('解析后的数据:', data);
                            
                            // 处理流式响应
                            if (data.type === 'message' && data.content) {
                                const now = Date.now();
                                const prevContent = messageText.dataset.fullContent || '';
                                const fullContent = prevContent + data.content;
                                messageText.dataset.fullContent = fullContent;
                                
                                // 限制UI更新频率，避免过于频繁的DOM更新
                                if (now - lastUpdateTime >= minUpdateInterval) {
                                    // 立即渲染最新内容到UI
                                    messageText.innerHTML = renderMarkdown(fullContent);
                                    scrollToBottom();
                                    lastUpdateTime = now;
                                }
                            } else if (data.type === 'init') {
                                console.log('流式连接初始化成功:', data.message);
                            } else if (data.type === 'error') {
                                messageText.classList.remove('typing-animation');
                                messageText.innerHTML = `<span style="color: #ff6b6b;">AI回复出现错误: ${data.error}</span>`;
                                isWaitingForResponse = false;
                                updateInputState();
                                // 在错误消息后显示建议问题
                                moveSuggestedQuestionsAfterLastMessage();
                            } else if (data.type === 'follow_up') {
                                console.log('收到建议问题:', data.follow_up_questions);
                                
                                // 处理从Coze API返回的建议问题
                                if (data.follow_up_questions && Array.isArray(data.follow_up_questions) && data.follow_up_questions.length > 0) {
                                    // 只取前3个问题，将建议问题转换为前端需要的格式
                                    const limitedQuestions = data.follow_up_questions.slice(0, 3);
                                    const formattedQuestions = limitedQuestions.map((question, index) => ({
                                        id: Date.now() + index,
                                        text: question
                                    }));
                                    
                                    // 显示建议问题
                                    displaySuggestedQuestions(formattedQuestions);
                                    moveSuggestedQuestionsAfterLastMessage();
                                }
                            } else if (data.type === 'complete' || data.done) {
                                console.log('流式响应完成');
                                
                                // 确保显示完整的最终内容
                                const fullContent = messageText.dataset.fullContent || '';
                                if (fullContent) {
                                    messageText.innerHTML = renderMarkdown(fullContent);
                                }
                                
                                // 移除打字动画效果
                                messageText.classList.remove('typing-animation');
                                
                                isWaitingForResponse = false;
                                updateInputState();
                                
                                // 检查是否有建议问题需要显示
                                if (data.follow_up_questions && Array.isArray(data.follow_up_questions) && data.follow_up_questions.length > 0) {
                                    // 只取前3个问题，将建议问题转换为前端需要的格式
                                    const limitedQuestions = data.follow_up_questions.slice(0, 3);
                                    const formattedQuestions = limitedQuestions.map((question, index) => ({
                                        id: Date.now() + index,
                                        text: question
                                    }));
                                    
                                    // 显示建议问题
                                    displaySuggestedQuestions(formattedQuestions);
                                } else {
                                    // 如果没有从API返回建议问题，显示默认的建议问题
                                    loadSuggestedQuestions();
                                }
                                
                                // 在AI回复完成后，在对话气泡下方显示建议问题
                                moveSuggestedQuestionsAfterLastMessage();
                                
                                scrollToBottom();
                            }
                        }
                    } catch (e) {
                        console.warn('解析流式数据失败:', e, '原始数据:', line);
                    }
                }
            }
            
            // 更新最终内容显示，确保即使在事件之间也有更新
            const now = Date.now();
            if (now - lastUpdateTime >= minUpdateInterval) {
                const fullContent = messageText.dataset.fullContent || '';
                messageText.innerHTML = renderMarkdown(fullContent);
                scrollToBottom();
                lastUpdateTime = now;
            }
        }
        
        // 移除打字动画效果
        messageText.classList.remove('typing-animation');
        
        // 确保建议问题显示在最后一条消息下方
        moveSuggestedQuestionsAfterLastMessage();
        
    } catch (error) {
        console.error('读取流式响应失败:', error);
        messageText.classList.remove('typing-animation');
        messageText.innerHTML = '连接中断，请重试。';
        isWaitingForResponse = false;
        updateInputState();
        // 在错误消息后显示建议问题
        moveSuggestedQuestionsAfterLastMessage();
    }
}

// 获取当前对话ID（支持会话持续）
function getCurrentConversationId() {
    if (!window.conversationId) {
        window.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    return window.conversationId;
}

// 模拟AI回复
function generateAIResponse(userMessage) {
    const responses = [
        `根据您提到的"${userMessage}"，我来为您分析相关的手术要点：

## 技术要点分析

**操作建议：**
- 保持手术野清晰
- 严格按照操作规范执行
- 注意监测各项生理指标

**风险控制：**
- 及时发现并处理异常情况
- 确保患者安全
- 遵循最佳实践指南

如需更详细的分析，请告诉我具体的关注点。`,
        
        `关于"${userMessage}"这个问题，我建议从以下几个方面考虑：

### 1. 术前准备
- 充分评估患者状态
- 制定详细手术计划
- 准备必要的器械设备

### 2. 术中管理
- **监测要点**：生命体征、出血情况
- **操作要点**：精准切除、完整止血
- **团队协作**：与麻醉师密切配合

### 3. 术后观察
- 密切观察恢复情况
- 及时处理并发症
- 做好后续随访

有什么具体问题需要深入讨论吗？`,
        
        `针对您的问题"${userMessage}"，让我分享一些临床经验：

> 在实际操作中，这种情况需要特别注意以下几点：

1. **技术层面**
   - 选择合适的入路方式
   - 控制操作力度和速度
   - 确保充分的暴露视野

2. **安全考虑**
   - 避免损伤重要结构
   - 及时识别解剖变异
   - 保持无菌操作原则

3. **优化建议**
   - 根据患者个体差异调整策略
   - 借鉴同行的成功经验
   - 持续学习新技术发展

希望这些信息对您有帮助。`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
}

// 初始化视频播放器功能
function initializeVideoPlayer() {
    // 获取视频播放器元素
    const videoElement = document.getElementById('surgery-video');
    const playBtn = document.querySelector('.play-btn');
    const timeDisplay = document.querySelector('.time-display');
    const progressFill = document.querySelector('.progress-fill');
    const progressKnob = document.querySelector('.progress-knob');
    const progressTrack = document.querySelector('.progress-track');
    const volumeBtn = document.querySelector('.volume-btn');
    const fullscreenBtn = document.querySelector('.fullscreen-btn');
    
    // 如果没有视频元素，退出
    if (!videoElement) return;
    
    // 从会话数据中获取视频信息
    if (window.router) {
        const videoData = window.router.getPageData('video');
        if (videoData && videoData.id) {
            console.log('找到视频数据:', videoData);
            
            // 如果是预设视频，从API获取
            if (videoData.isPresetVideo) {
                loadPresetVideo(videoData.id, videoElement, timeDisplay);
            } else {
                // 兼容旧版本：从localStorage获取视频数据
                const videoSource = localStorage.getItem(videoData.dataKey);
                if (videoSource) {
                    console.log('从localStorage加载视频');
                    videoElement.src = videoSource;
                    
                    // 视频元数据加载完成后更新时间显示
                    videoElement.onloadedmetadata = function() {
                        timeDisplay.textContent = `0:00 / ${formatTime(videoElement.duration)}`;
                    };
                } else {
                    console.warn('没有找到视频数据');
                    showMessage('没有找到视频数据，使用默认视频', 'warning');
                    // 加载默认视频
                    loadPresetVideo('video_001', videoElement, timeDisplay);
                }
            }
        } else {
            console.warn('视频数据不完整，使用默认视频');
            loadPresetVideo('video_001', videoElement, timeDisplay);
        }
    } else {
        console.warn('路由器未初始化，使用默认视频');
        loadPresetVideo('video_001', videoElement, timeDisplay);
    }
    
    // 播放/暂停按钮点击事件
    let isPlaying = false;
    if (playBtn) {
        playBtn.addEventListener('click', function() {
            if (videoElement.paused) {
                videoElement.play();
                isPlaying = true;
                // 切换到暂停图标
                playBtn.innerHTML = '<span style="color: white; font-size: 20px;">⏸</span>';
                // 添加playing类以隐藏控件
                videoElement.parentElement.classList.add('playing');
            } else {
                videoElement.pause();
                isPlaying = false;
                // 切换回播放图标
                playBtn.innerHTML = '<img src="/ai/images/play_arrow.svg" alt="播放" style="width: 20px; height: 20px; filter: invert(1);">';
                // 移除playing类以显示控件
                videoElement.parentElement.classList.remove('playing');
            }
        });
    }
    
    // 视频时间更新事件
    videoElement.addEventListener('timeupdate', function() {
        // 更新时间显示
        if (timeDisplay) {
            timeDisplay.textContent = `${formatTime(videoElement.currentTime)} / ${formatTime(videoElement.duration)}`;
        }
        
        // 更新进度条
        if (progressFill && progressKnob) {
            const progress = (videoElement.currentTime / videoElement.duration) * 100;
            progressFill.style.width = `${progress}%`;
            progressKnob.style.left = `${progress}%`;
        }
    });
    
    // 视频结束事件
    videoElement.addEventListener('ended', function() {
        isPlaying = false;
        // 切换回播放图标
        if (playBtn) {
            playBtn.innerHTML = '<img src="/ai/images/play_arrow.svg" alt="播放" style="width: 20px; height: 20px; filter: invert(1);">';
        }
        // 移除playing类以显示控件
        videoElement.parentElement.classList.remove('playing');
    });
    
    // 点击视频内容区域播放/暂停
    const videoContent = videoElement.parentElement;
    if (videoContent) {
        videoContent.addEventListener('click', function(e) {
            // 避免点击控件时触发
            if (e.target === videoElement || e.target === videoContent) {
                if (videoElement.paused) {
                    videoElement.play();
                    isPlaying = true;
                    // 切换到暂停图标
                    if (playBtn) playBtn.innerHTML = '<span style="color: white; font-size: 20px;">⏸</span>';
                    // 添加playing类以隐藏控件
                    videoContent.classList.add('playing');
                } else {
                    videoElement.pause();
                    isPlaying = false;
                    // 切换回播放图标
                    if (playBtn) playBtn.innerHTML = '<img src="/ai/images/play_arrow.svg" alt="播放" style="width: 20px; height: 20px; filter: invert(1);">';
                    // 移除playing类以显示控件
                    videoContent.classList.remove('playing');
                }
            }
        });
        
        // 添加视频事件监听器确保按钮状态与视频状态同步
        videoElement.addEventListener('play', function() {
            isPlaying = true;
            if (playBtn) playBtn.innerHTML = '<span style="color: white; font-size: 20px;">⏸</span>';
            videoContent.classList.add('playing');
        });
        
        videoElement.addEventListener('pause', function() {
            isPlaying = false;
            if (playBtn) playBtn.innerHTML = '<img src="/ai/images/play_arrow.svg" alt="播放" style="width: 20px; height: 20px; filter: invert(1);">';
            videoContent.classList.remove('playing');
        });
    }
    
    // 进度条拖拽功能
    if (progressTrack) {
        progressTrack.addEventListener('click', function(e) {
            const rect = progressTrack.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            videoElement.currentTime = pos * videoElement.duration;
        });
    }
    
    // 静音按钮功能
    if (volumeBtn) {
        volumeBtn.addEventListener('click', function() {
            videoElement.muted = !videoElement.muted;
            volumeBtn.textContent = videoElement.muted ? '🔇' : '🔊';
        });
    }
    
    // 全屏按钮功能
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', function() {
            if (videoElement.requestFullscreen) {
                videoElement.requestFullscreen();
            } else if (videoElement.webkitRequestFullscreen) { /* Safari */
                videoElement.webkitRequestFullscreen();
            } else if (videoElement.msRequestFullscreen) { /* IE11 */
                videoElement.msRequestFullscreen();
            }
        });
    }
}

// 从API加载预设视频
async function loadPresetVideo(videoId, videoElement, timeDisplay) {
    try {
        console.log(`加载预设视频: ${videoId}`);
        showMessage(`加载预设视频中，请稍候...`, 'info');
        
        // 预设的视频列表
        const fallbackVideos = {
            'video_001': 'http://120.55.79.77:5000/stream/demo.mp4'
        };
        
        // 直接使用预设视频，不再尝试从API获取视频URL
        videoElement.src = fallbackVideos[videoId] || fallbackVideos['video_001'];
        
        // 视频元数据加载完成后更新时间显示
        videoElement.onloadedmetadata = function() {
            if (timeDisplay) {
                timeDisplay.textContent = `0:00 / ${formatTime(videoElement.duration)}`;
            }
            showMessage('视频加载完成', 'success');
        };
        
        // 视频加载错误处理
        videoElement.onerror = function() {
            console.error('视频加载失败');
            showMessage('视频加载失败，请检查网络连接', 'error');
            
            // 加载备用视频
            videoElement.src = fallbackVideos['video_001'];
        };
        
    } catch (error) {
        console.error('加载预设视频失败:', error);
        showMessage('加载视频失败，使用备用视频', 'warning');
        
        // 使用备用视频
        videoElement.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    }
}

// 格式化视频时间
function formatTime(seconds) {
    seconds = Math.floor(seconds);
    const minutes = Math.floor(seconds / 60);
    seconds = seconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-toast ${type}`;
    messageDiv.textContent = message;
    
    // 添加样式
    messageDiv.style.cssText = `
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        padding: 10px 20px;
        background: ${type === 'error' ? '#ff5252' : type === 'warning' ? '#ffb74d' : '#4caf50'};
        color: white;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 3px 6px rgba(0,0,0,0.16);
        transition: opacity 0.3s, transform 0.3s;
        opacity: 0;
    `;
    
    // 添加到页面
    document.body.appendChild(messageDiv);
    
    // 触发动画
    setTimeout(() => {
        messageDiv.style.opacity = '1';
        messageDiv.style.transform = 'translateX(-50%) translateY(10px)';
    }, 10);
    
    // 自动移除
    setTimeout(() => {
        messageDiv.style.opacity = '0';
        messageDiv.style.transform = 'translateX(-50%) translateY(0)';
        
        setTimeout(() => {
            document.body.removeChild(messageDiv);
        }, 300);
    }, 3000);
} 

// 加载建议问题
function loadSuggestedQuestions() {
    fetch('/ai/questions.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('获取建议问题数据失败');
            }
            return response.json();
        })
        .then(data => {
            // 获取当前专家类型
            const doctorType = window.router && window.router.doctor_type ? window.router.doctor_type : 'default';
            
            // 根据专家类型选择对应的问题
            let questionsData;
            if (data[doctorType] && data[doctorType].suggestedQuestions) {
                questionsData = data[doctorType].suggestedQuestions;
            } else if (data.default && data.default.suggestedQuestions) {
                questionsData = data.default.suggestedQuestions;
            } else if (data.suggestedQuestions) {
                // 兼容旧格式
                questionsData = data.suggestedQuestions;
            }
            
            if (questionsData && Array.isArray(questionsData)) {
                displaySuggestedQuestions(questionsData);
            } else {
                console.error('建议问题数据格式不正确');
            }
        })
        .catch(error => {
            console.error('加载建议问题失败:', error);
        });
}

// 显示建议问题
function displaySuggestedQuestions(questions) {
    const questionsContainer = document.getElementById('questions-container');
    if (!questionsContainer) return;
    
    questionsContainer.innerHTML = '';
    
    // 如果问题较多，只显示前3个
    const displayQuestions = questions.slice(0, 3);
    
    displayQuestions.forEach(question => {
        const questionItem = document.createElement('div');
        questionItem.className = 'question-item';
        
        const questionText = document.createElement('p');
        questionText.className = 'question-text';
        questionText.textContent = question.text;
        
        questionItem.appendChild(questionText);
        questionsContainer.appendChild(questionItem);
        
        // 添加点击事件
        questionItem.addEventListener('click', function() {
            const text = question.text;
            if (text && !isWaitingForResponse) {
                sendMessage(text);
            }
        });
    });
}
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
    }
    
    console.log('会话数据已加载:', { doctorData, videoData, patientData, analysisData });
}

// 更新基本信息
function updateBasicInfo(videoData, patientData) {
    const infoGrid = document.querySelector('.info-grid');
    if (infoGrid) {
        infoGrid.innerHTML = `
            <div class="info-item">
                <span class="info-label">视频</span>
                <span class="info-value">${videoData.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">术式</span>
                <span class="info-value">${patientData.surgery}</span>
            </div>
            <div class="info-item">
                <span class="info-label">医院</span>
                <span class="info-value">${patientData.hospital}</span>
            </div>
            <div class="info-item">
                <span class="info-label">医生</span>
                <span class="info-value">${patientData.doctor}</span>
            </div>
            <div class="info-item">
                <span class="info-label">患者年龄</span>
                <span class="info-value">${patientData.age}岁</span>
            </div>
            <div class="info-item">
                <span class="info-label">BMI</span>
                <span class="info-value">${patientData.bmi}</span>
            </div>
        `;
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
    const chatMessages = document.getElementById('chat-messages');
    const askButton = document.querySelector('.ask-button');
    const questionInput = document.querySelector('.question-input');
    let isWaitingForResponse = false;

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

    // 创建消息元素
    function createMessage(content, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${isUser ? 'user' : 'ai'}`;
        
        const avatar = document.createElement('div');
        avatar.className = 'message-avatar';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = isUser ? 'images/user_avatar.png' : 'images/doctor3.png';
        avatarImg.alt = isUser ? '用户' : 'AI助手';
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
        avatarImg.src = 'images/doctor3.png';
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

    // 发送消息
    async function sendMessage(message) {
        if (!message.trim() || isWaitingForResponse) return;
        
        isWaitingForResponse = true;
        updateInputState(); // 立即更新输入状态
        
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
        } finally {
            isWaitingForResponse = false;
            updateInputState(); // 重新启用输入框
            scrollToBottom();
        }
    }

    // 流式聊天API调用
    async function streamChatWithAPI(message) {
        const API_BASE_URL = 'http://localhost:8000';
        
        const requestData = {
            message: message,
            user_id: 'web_user_' + Date.now(),
            conversation_id: getCurrentConversationId(),
            stream: true
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
        avatarImg.src = 'images/doctor3.png';
        avatarImg.alt = 'AI助手';
        avatar.appendChild(avatarImg);
        
        const messageContent = document.createElement('div');
        messageContent.className = 'message-content';
        
        const messageText = document.createElement('div');
        messageText.className = 'message-text';
        
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
        
        let accumulatedContent = '';
        
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const dataString = line.slice(6).trim();
                            if (dataString) {
                                console.log('收到流式数据:', dataString);
                                const data = JSON.parse(dataString);
                                console.log('解析后的数据:', data);
                                await handleStreamResponse(data, messageText, accumulatedContent);
                                
                                if (data.type === 'message' && data.content) {
                                    accumulatedContent += data.content;
                                }
                                
                                if (data.done) {
                                    console.log('流式响应完成');
                                    return;
                                }
                            }
                        } catch (e) {
                            console.warn('解析流式数据失败:', e, '原始数据:', line);
                        }
                    }
                }
                
                scrollToBottom();
            }
        } catch (error) {
            console.error('读取流式响应失败:', error);
            messageText.innerHTML = '连接中断，请重试。';
        }
    }

    // 处理流式响应
    async function handleStreamResponse(data, messageElement, accumulatedContent) {
        console.log('处理流式响应:', data.type, data);
        
        switch (data.type) {
            case 'init':
                console.log('流式连接初始化成功:', data.message);
                break;
                
            case 'message':
                if (data.content) {
                    const fullContent = accumulatedContent + data.content;
                    messageElement.innerHTML = renderMarkdown(fullContent);
                    console.log('更新消息内容，当前长度:', fullContent.length);
                }
                break;
                
            case 'complete':
                console.log('聊天完成，使用统计:', data.usage);
                // 重新启用输入框
                isWaitingForResponse = false;
                if (typeof updateInputState === 'function') {
                    updateInputState();
                }
                break;
                
            case 'error':
                console.error('AI响应错误:', data.error);
                messageElement.innerHTML = '<span style="color: #ff6b6b;">AI回复出现错误，请重试。</span>';
                // 错误时也要重新启用输入框
                isWaitingForResponse = false;
                if (typeof updateInputState === 'function') {
                    updateInputState();
                }
                break;
                
            default:
                console.warn('未知的流式事件类型:', data.type, data);
                break;
        }
    }

    // 获取当前对话ID（支持会话持续）
    function getCurrentConversationId() {
        if (!window.conversationId) {
            window.conversationId = 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        return window.conversationId;
    }

    // 禁用状态管理
    function updateInputState() {
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
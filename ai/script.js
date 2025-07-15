document.addEventListener('DOMContentLoaded', function() {
    // 返回按钮功能
    const backButton = document.querySelector('.back-button');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.history.back();
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
    function sendMessage(message) {
        if (!message.trim() || isWaitingForResponse) return;
        
        isWaitingForResponse = true;
        
        // 添加用户消息
        const userMessage = createMessage(message, true);
        chatMessages.appendChild(userMessage);
        scrollToBottom();
        
        // 显示输入状态
        showTypingIndicator();
        
        // 模拟AI回复延迟
        setTimeout(() => {
            hideTypingIndicator();
            
            // 生成AI回复
            const aiResponse = generateAIResponse(message);
            const aiMessage = createMessage(aiResponse, false);
            chatMessages.appendChild(aiMessage);
            
            isWaitingForResponse = false;
            scrollToBottom();
        }, 1500 + Math.random() * 1000); // 1.5-2.5秒随机延迟
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
        
        // 禁用状态管理
        function updateInputState() {
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
        
        // 监听等待状态变化
        const originalSendMessage = sendMessage;
        sendMessage = function(message) {
            originalSendMessage(message);
            updateInputState();
            
            // 在AI回复后重新启用输入
            setTimeout(() => {
                updateInputState();
            }, 3000);
        };
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
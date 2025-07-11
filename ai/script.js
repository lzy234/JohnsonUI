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

    // 提问按钮功能
    const askButton = document.querySelector('.ask-button');
    const questionInput = document.querySelector('.question-input');

    if (askButton && questionInput) {
        askButton.addEventListener('click', function() {
            const question = questionInput.value.trim();
            if (question) {
                handleNewQuestion(question);
                questionInput.value = '';
            }
        });

        // 回车键提交
        questionInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const question = questionInput.value.trim();
                if (question) {
                    handleNewQuestion(question);
                    questionInput.value = '';
                }
            }
        });
    }

    // 处理新问题的函数
    function handleNewQuestion(question) {
        console.log('新问题:', question);
        
        // 创建新的问题卡片
        const newQuestionCard = createQuestionCard(question);
        
        // 插入到顶部
        const questionSection = document.querySelector('.question-section');
        if (questionSection) {
            questionSection.innerHTML = '';
            questionSection.appendChild(newQuestionCard);
        }

        // 模拟AI回答（这里可以接入真实的AI API）
        setTimeout(() => {
            addAIResponse(generateMockResponse(question));
        }, 1000);
    }

    // 创建问题卡片
    function createQuestionCard(question) {
        const questionCard = document.createElement('div');
        questionCard.className = 'question-card';
        
        const questionText = document.createElement('p');
        questionText.className = 'question-text';
        questionText.textContent = question;
        
        questionCard.appendChild(questionText);
        return questionCard;
    }

    // 添加AI回答
    function addAIResponse(response) {
        const existingAnswer = document.querySelector('.ai-answer-section');
        if (existingAnswer) {
            // 更新现有回答
            const answerText = existingAnswer.querySelector('.answer-text');
            if (answerText) {
                const paragraphs = answerText.querySelectorAll('p');
                paragraphs.forEach(p => p.remove());
                
                response.split('\n\n').forEach(paragraph => {
                    if (paragraph.trim()) {
                        const p = document.createElement('p');
                        p.innerHTML = paragraph.trim();
                        answerText.appendChild(p);
                    }
                });
            }
        }
    }

    // 生成模拟回答
    function generateMockResponse(question) {
        const responses = {
            '术中出血': '术中出血的控制需要及时止血，使用电凝或结扎等方法。重要的是保持手术野清晰，避免盲目操作。',
            '中心静脉压': '中心静脉压的控制对于肝切除手术非常重要，建议维持在0-5 cmH₂O范围内以减少出血。',
            '手术时间': '手术时间的控制需要平衡手术质量和患者安全，过长的手术时间可能增加并发症风险。',
            '麻醉管理': '肝切除手术的麻醉管理需要注意肝功能状态，选择合适的麻醉药物和监测方案。'
        };

        // 简单的关键词匹配
        for (const [keyword, response] of Object.entries(responses)) {
            if (question.includes(keyword)) {
                return response;
            }
        }

        return '感谢您的提问。根据您的问题，我建议参考相关医学文献和临床指南，结合具体患者情况进行个体化处理。如需更详细的建议，请咨询专业医师。';
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
        const questionSection = document.querySelector('.question-section');
        
        if (questionSection) {
            if (scrollTop > lastScrollTop) {
                // 向下滚动
                questionSection.style.transform = 'translateY(-10px)';
                questionSection.style.opacity = '0.9';
            } else {
                // 向上滚动
                questionSection.style.transform = 'translateY(0)';
                questionSection.style.opacity = '1';
            }
        }
        
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
// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    // 初始化路由器
    if (!window.router && typeof AppRouter !== 'undefined') {
        window.router = new AppRouter();
        console.log('Router initialized');
    }
    
    initializePage();
    loadPresetVideos(); // 加载预设视频列表
    loadSurgicalProcedures(); // 加载手术术式选项
    initializeGenderSelection();
    initializeFormValidation();
    initializeSubmitButton();
});

// 加载预设视频列表
function loadPresetVideos() {
    // 获取视频列表容器
    const videoList = document.querySelector('.video-list');
    if (!videoList) return;
    
    // 清空视频列表
    videoList.innerHTML = '';
    
    // 显示加载中状态
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-videos';
    loadingDiv.style.cssText = 'text-align: center; padding: 20px; color: #666;';
    loadingDiv.innerHTML = '<div class="loading-spinner" style="margin: 0 auto;"></div><p>加载视频列表中...</p>';
    videoList.appendChild(loadingDiv);
    
    // 从API获取预设视频
    fetchPresetVideos()
        .then(videos => {
            // 移除加载状态
            videoList.removeChild(loadingDiv);
            
            // 添加视频到列表
            if (videos && videos.length > 0) {
                videos.forEach((video, index) => {
                    addPresetVideoToList(video, index === 0); // 第一个视频默认选中
                });
            } else {
                showNoVideosMessage(videoList);
            }
        })
        .catch(error => {
            console.error('加载预设视频失败:', error);
            videoList.removeChild(loadingDiv);
            showNoVideosMessage(videoList, true);
        });
}

// 从API获取预设视频
async function fetchPresetVideos() {
    try {
        // 判断开发环境还是生产环境
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const baseUrl = isDev ? 'http://localhost:8000' : '';
        
        const response = await fetch(`${baseUrl}/api/videos/preset`);
        
        if (!response.ok) {
            throw new Error(`API响应错误: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('获取预设视频失败:', error);
        
        // 如果API请求失败，返回本地模拟数据
        return [
            {
                "id": "video_001",
                "name": "左肝切除术_07-06",
                "description": "肝脏手术示范视频",
                "duration": "01:28:49",
                "size": "204 MB",
                "upload_time": "2025-07-06T10:32:00"
            },
            {
                "id": "video_002",
                "name": "左肝切除术_07-05",
                "description": "肝脏手术视频第二版",
                "duration": "01:22:37",
                "size": "198 MB",
                "upload_time": "2025-07-05T13:32:00"
            },
            {
                "id": "video_003",
                "name": "左肝切除术_07-04",
                "description": "复杂肝脏手术案例",
                "duration": "01:35:12",
                "size": "340 MB",
                "upload_time": "2025-07-04T16:00:00"
            }
        ];
    }
}

// 显示无视频消息
function showNoVideosMessage(container, isError = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'no-videos-message';
    messageDiv.style.cssText = 'text-align: center; padding: 30px; color: #666;';
    
    if (isError) {
        messageDiv.innerHTML = '<p>加载视频列表失败，请刷新页面重试</p>';
    } else {
        messageDiv.innerHTML = '<p>暂无可用的手术视频</p>';
    }
    
    container.appendChild(messageDiv);
}

// 将预设视频添加到列表
function addPresetVideoToList(video, isSelected = false) {
    const videoList = document.querySelector('.video-list');
    if (!videoList) return;
    
    // 格式化上传时间
    const uploadDate = new Date(video.upload_time);
    const formattedDate = `${uploadDate.getFullYear()}年${uploadDate.getMonth() + 1}月${uploadDate.getDate()}日 ${uploadDate.getHours()}:${String(uploadDate.getMinutes()).padStart(2, '0')}`;
    
    // 创建视频项
    const videoItem = document.createElement('div');
    videoItem.className = `video-item${isSelected ? ' selected' : ''}`;
    videoItem.dataset.videoId = video.id;
    
    videoItem.innerHTML = `
        <div class="video-thumbnail">
            <div class="play-btn">
                <img src="images/play_arrow.svg" alt="播放">
            </div>
        </div>
        <div class="video-info">
            <h3>${video.name}</h3>
            <p class="upload-time">上传于 ${formattedDate}</p>
            <p class="file-info">${video.size}｜${video.duration}</p>
        </div>
        <div class="check-icon${isSelected ? ' selected' : ''}">
            <img src="images/check_circle.svg" alt="${isSelected ? '已选择' : '选择'}">
        </div>
    `;
    
    // 添加点击事件
    videoItem.addEventListener('click', function() {
        const videoItems = document.querySelectorAll('.video-item');
        
        videoItems.forEach(item => {
            item.classList.remove('selected');
            const checkIcon = item.querySelector('.check-icon');
            if (checkIcon) checkIcon.classList.remove('selected');
        });
        
        this.classList.add('selected');
        const checkIcon = this.querySelector('.check-icon');
        if (checkIcon) checkIcon.classList.add('selected');
    });
    
    // 添加到列表
    videoList.appendChild(videoItem);
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(0)) + ' ' + sizes[i];
}

// 格式化视频时长
function formatVideoDuration(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    let result = '';
    if (hrs > 0) {
        result += `${hrs}:${mins < 10 ? '0' : ''}`;
    }
    
    result += `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    return result;
}

// 加载手术术式选项
function loadSurgicalProcedures() {
    const procedureSelect = document.querySelector('.input-wrapper select');
    if (!procedureSelect) return;
    
    // 保留默认选项
    const defaultOption = procedureSelect.querySelector('option[value=""]');
    procedureSelect.innerHTML = '';
    if (defaultOption) {
        procedureSelect.appendChild(defaultOption);
    }
    
    // 判断开发环境还是生产环境
    const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isDev ? '' : '';
    
    // 从JSON文件加载术式数据
    fetch(`${baseUrl}/upload/procedures.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`加载术式数据失败: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data && data.procedures && data.procedures.length > 0) {
                // 添加术式选项
                data.procedures.forEach(procedure => {
                    const option = document.createElement('option');
                    option.value = procedure.value;
                    option.textContent = procedure.label;
                    procedureSelect.appendChild(option);
                });
            } else {
                console.error('术式数据为空或格式不正确');
            }
        })
        .catch(error => {
            console.error('加载术式数据失败:', error);
            // 加载失败时使用静态备份数据
            const fallbackProcedures = [
                {value: "左肝切除术", label: "左肝切除术"},
                {value: "右肝切除术", label: "右肝切除术"},
                {value: "肝段切除术", label: "肝段切除术"},
                {value: "肝楔形切除术", label: "肝楔形切除术"},
                {value: "肝移植术", label: "肝移植术"},
                {value: "胆囊切除术", label: "胆囊切除术"},
                {value: "胆管切除术", label: "胆管切除术"},
                {value: "其他", label: "其他"}
            ];
            
            fallbackProcedures.forEach(procedure => {
                const option = document.createElement('option');
                option.value = procedure.value;
                option.textContent = procedure.label;
                procedureSelect.appendChild(option);
            });
        });
}

// 初始化页面，显示选择的医生信息
function initializePage() {
    if (!window.router) {
        console.log('路由器未加载，稍后重试');
        setTimeout(initializePage, 100);
        return;
    }

    console.log('upload页面初始化开始');
    
    // 多次尝试获取医生数据，解决时序问题
    let attempts = 0;
    const maxAttempts = 10;
    
    function checkDoctorData() {
        attempts++;
        const doctorData = window.router.getPageData('doctor');
        console.log(`尝试第${attempts}次获取医生数据:`, doctorData);
        
        if (doctorData) {
            console.log('找到医生数据，显示信息');
            displaySelectedDoctor(doctorData);
        } else if (attempts < maxAttempts) {
            console.log('医生数据未找到，100ms后重试');
            setTimeout(checkDoctorData, 100);
                 } else {
             console.log('多次尝试后仍未找到医生数据，尝试从URL恢复');
             // 检查URL参数中是否有doctor_id
             const urlParams = window.router.getURLParams();
             if (urlParams.doctor_id) {
                 console.log('URL中有doctor_id，尝试恢复基本医生信息');
                 
                 // 创建基本的医生数据（备用方案）
                 const basicDoctorData = {
                     id: urlParams.doctor_id,
                     name: urlParams.doctor_id === 'wangzhiruo' ? '王专家' : '陈专家',
                     specialty: urlParams.doctor_id === 'wangzhiruo' ? '普外科' : '内科',
                     expertise: urlParams.doctor_id === 'wangzhiruo' ? '术后并发症分析' : '复杂病例复盘',
                     restored: true // 标记这是恢复的数据
                 };
                 
                 console.log('恢复的医生数据:', basicDoctorData);
                 
                 // 保存恢复的数据
                 window.router.savePageData('doctor', basicDoctorData);
                 
                 // 显示恢复提示并展示医生信息
                 showMessage('已从URL恢复医生信息', 'info');
                 displaySelectedDoctor(basicDoctorData);
             } else {
                 console.log('URL中也没有医生信息，跳转回首页');
                 showMessage('请先选择AI医学专家', 'error');
                 
                 setTimeout(() => {
                     window.router.navigateTo('index');
                 }, 2000);
             }
         }
    }
    
    // 开始检查
    checkDoctorData();
}

// 显示选择的医生信息
function displaySelectedDoctor(doctor) {
    // 可以在页面顶部添加一个显示选择医生的区域
    const titleSection = document.querySelector('.title-section');
    if (titleSection && !document.querySelector('.selected-doctor-info')) {
        const doctorInfo = document.createElement('div');
        doctorInfo.className = 'selected-doctor-info';
        doctorInfo.innerHTML = `
            <div style="background: linear-gradient(90deg, #FB7C6E 0%, #EB1701 100%); 
                        color: white; padding: 12px 20px; border-radius: 8px; margin-bottom: 16px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="font-size: 14px; opacity: 0.9;">已选择AI专家：</div>
                    <div style="font-weight: 500;">${doctor.name} - ${doctor.specialty}</div>
                </div>
            </div>
        `;
        titleSection.appendChild(doctorInfo);
    }
}

// 视频选择功能
function initializeVideoSelection() {
    const videoItems = document.querySelectorAll('.video-item');
    
    videoItems.forEach(item => {
        item.addEventListener('click', function() {
            // 移除所有视频项的选中状态
            videoItems.forEach(video => {
                video.classList.remove('selected');
                const checkIcon = video.querySelector('.check-icon');
                checkIcon.classList.remove('selected');
            });
            
            // 添加当前视频项的选中状态
            this.classList.add('selected');
            const checkIcon = this.querySelector('.check-icon');
            checkIcon.classList.add('selected');
        });
    });
}

// 性别选择功能
function initializeGenderSelection() {
    const genderOptions = document.querySelectorAll('.gender-option');
    
    genderOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 移除所有性别选项的选中状态
            genderOptions.forEach(gender => {
                gender.classList.remove('selected');
            });
            
            // 添加当前选项的选中状态
            this.classList.add('selected');
        });
    });
}

// 表单验证功能
function initializeFormValidation() {
    const requiredFields = document.querySelectorAll('input[type="text"]:not([readonly])');
    const surgerySelect = document.querySelector('.input-wrapper select');
    
    // 为文本输入字段添加验证
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            validateField(this);
        });
        
        field.addEventListener('input', function() {
            if (this.classList.contains('error')) {
                validateField(this);
            }
        });
    });
    
    // 为下拉选择框添加验证
    if (surgerySelect) {
        surgerySelect.addEventListener('change', function() {
            const wrapper = this.closest('.input-wrapper');
            wrapper.classList.remove('error');
            this.classList.remove('error');
        });
        
        surgerySelect.addEventListener('blur', function() {
            if (!this.value) {
                const wrapper = this.closest('.input-wrapper');
                wrapper.classList.add('error');
                this.classList.add('error');
            }
        });
    }
}

// 验证单个字段
function validateField(field) {
    const value = field.value.trim();
    const wrapper = field.closest('.input-wrapper');
    const label = wrapper.querySelector('label');
    const isRequired = label.innerHTML.includes('*');
    
    // 移除之前的错误状态
    wrapper.classList.remove('error');
    field.classList.remove('error');
    
    // 如果是必填字段且为空，显示错误
    if (isRequired && !value) {
        wrapper.classList.add('error');
        field.classList.add('error');
        return false;
    }
    
    return true;
}

// 验证所有表单
function validateAllFields() {
    let isValid = true;
    
    // 获取所有必填输入字段（使用更兼容的选择方式）
    const allInputs = document.querySelectorAll('.input-wrapper input[type="text"]:not([readonly])');
    const requiredInputs = [];
    
    // 筛选出带有必填标记的输入字段
    allInputs.forEach(input => {
        const wrapper = input.closest('.input-wrapper');
        const label = wrapper.querySelector('label');
        if (label && label.innerHTML.includes('*')) {
            requiredInputs.push(input);
        }
    });
    
    const surgerySelect = document.querySelector('.input-wrapper select');
    
    // 创建字段标签映射
    const fieldLabels = {
        0: '医生',
        1: '医院'
    };
    
    // 验证是否选择了视频
    const selectedVideo = document.querySelector('.video-item.selected');
    if (!selectedVideo) {
        showMessage('请选择一个手术视频', 'error');
        return false;
    }
    
    // 验证每个必填文本输入字段
    for (let i = 0; i < requiredInputs.length; i++) {
        if (!validateField(requiredInputs[i])) {
            showMessage(`请填写${fieldLabels[i]}信息`, 'error');
            return false;
        }
    }
    
    // 验证手术类型选择
    if (surgerySelect && !surgerySelect.value) {
        showMessage('请选择手术类型', 'error');
        return false;
    }
    
    // 性别不再是必填项，无需验证
    
    return true;
}

// 提交按钮功能
function initializeSubmitButton() {
    const submitBtn = document.querySelector('.submit-btn');
    
    submitBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        if (validateAllFields()) {
            handleSubmit();
        }
    });
}

// 处理表单提交
function handleSubmit() {
    const submitBtn = document.querySelector('.submit-btn');
    
    // 显示加载状态
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="loading-spinner"></div>正在提交...';
    
    // 收集表单数据
    const formData = collectFormData();
    
    // 保存数据并跳转到analysis页面
    setTimeout(() => {
        console.log('提交的数据:', formData);
        
        if (window.router) {
            // 获取选中的视频项
            const selectedVideoItem = document.querySelector('.video-item.selected');
            let videoId;
            
            if (selectedVideoItem && selectedVideoItem.dataset.videoId) {
                // 使用选中的预设视频ID
                videoId = selectedVideoItem.dataset.videoId;
                
                // 将视频信息添加到表单数据
                formData.video = {
                    ...formData.video,
                    id: videoId,
                    isPresetVideo: true
                };
            } else {
                // 如果没有选中的视频，使用默认ID
                videoId = "video_001";
                formData.video = {
                    ...formData.video,
                    id: videoId,
                    isPresetVideo: true
                };
            }
            
            const uploadId = window.router.generateId('upload_');
            
            window.router.savePageData('video', {
                id: videoId,
                ...formData.video
            });
            
            window.router.savePageData('patient', formData.patient);
            
            showMessage('提交成功！开始分析手术视频...', 'success');
            
            // 跳转到analysis页面
            setTimeout(() => {
                window.router.navigateTo('analysis', { 
                    video: { id: videoId, ...formData.video },
                    upload_id: uploadId 
                });
            }, 1500);
        } else {
            showMessage('系统错误，请刷新页面重试', 'error');
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<img src="images/tab_search.svg" alt="搜索">提交并开始分析';
        }
    }, 1000);
}

// 收集表单数据
function collectFormData() {
    const selectedVideo = document.querySelector('.video-item.selected');
    const selectedGender = document.querySelector('.gender-option.selected');
    
    // 获取所有输入框的值
    const inputs = document.querySelectorAll('.input-wrapper input');
    const select = document.querySelector('.input-wrapper select');
    
    const data = {
        video: {
            name: selectedVideo ? selectedVideo.querySelector('h3').textContent : '未选择',
            uploadTime: selectedVideo ? selectedVideo.querySelector('.upload-time').textContent : '',
            fileInfo: selectedVideo ? selectedVideo.querySelector('.file-info').textContent : ''
        },
        patient: {
            doctor: inputs[0] ? inputs[0].value || '未填写' : '未填写',
            hospital: inputs[1] ? inputs[1].value || '未填写' : '未填写', 
            surgery: select ? select.value || '未选择' : '未选择',
            bleeding: inputs[2] ? inputs[2].value || '未填写' : '未填写',
            bmi: inputs[3] ? inputs[3].value || '未填写' : '未填写',
            age: inputs[4] ? inputs[4].value || '未填写' : '未填写',
            gender: selectedGender ? selectedGender.querySelector('span').textContent : '未选择'
        }
    };
    
    return data;
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.message-toast');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // 创建消息元素
    const messageEl = document.createElement('div');
    messageEl.className = `message-toast ${type}`;
    messageEl.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageEl);
    
    // 显示动画
    setTimeout(() => {
        messageEl.classList.add('show');
    }, 100);
    
    // 自动隐藏
    setTimeout(() => {
        messageEl.classList.remove('show');
        setTimeout(() => {
            messageEl.remove();
        }, 300);
    }, 3000);
}

// 返回按钮功能
document.querySelector('.back-btn').addEventListener('click', function() {
    if (window.router) {
        window.router.goBack();
    } else {
        window.history.back();
    }
});

// 查看全部视频按钮功能
document.querySelector('.view-all-btn').addEventListener('click', function() {
    showMessage('查看全部历史视频功能开发中...', 'info');
}); 
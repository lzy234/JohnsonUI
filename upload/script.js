// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializePage();
    initializeVideoSelection();
    initializeGenderSelection();
    initializeFormValidation();
    initializeSubmitButton();
});

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
    const requiredFields = document.querySelectorAll('input[type="text"]:not([readonly])');
    
    requiredFields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    // 验证是否选择了视频
    const selectedVideo = document.querySelector('.video-item.selected');
    if (!selectedVideo) {
        showMessage('请选择一个手术视频', 'error');
        isValid = false;
    }
    
    // 验证是否选择了性别
    const selectedGender = document.querySelector('.gender-option.selected');
    if (!selectedGender) {
        showMessage('请选择性别', 'error');
        isValid = false;
    }
    
    return isValid;
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
            // 保存视频和患者信息
            const videoId = window.router.generateId('video_');
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
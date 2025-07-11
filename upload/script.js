// DOM 加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeVideoSelection();
    initializeGenderSelection();
    initializeFormValidation();
    initializeSubmitButton();
});

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
    submitBtn.innerHTML = '<div class="loading-spinner"></div>正在分析...';
    
    // 收集表单数据
    const formData = collectFormData();
    
    // 模拟提交过程
    setTimeout(() => {
        console.log('提交的数据:', formData);
        showMessage('提交成功！开始分析手术视频...', 'success');
        
        // 恢复按钮状态
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<img src="images/tab_search.svg" alt="搜索">提交并开始分析';
    }, 2000);
}

// 收集表单数据
function collectFormData() {
    const selectedVideo = document.querySelector('.video-item.selected');
    const selectedGender = document.querySelector('.gender-option.selected');
    
    const data = {
        video: {
            name: selectedVideo.querySelector('h3').textContent,
            uploadTime: selectedVideo.querySelector('.upload-time').textContent,
            fileInfo: selectedVideo.querySelector('.file-info').textContent
        },
        doctor: document.querySelector('input[value="Dr.Wang"]').value,
        hospital: document.querySelector('input[value="复旦大学附属中山医院"]').value,
        surgery: document.querySelector('select').value,
        bleeding: document.querySelector('input[placeholder="医生"]').value,
        bmi: document.querySelector('input[value="37.5"]').value,
        age: document.querySelector('input[value="47"]').value,
        gender: selectedGender.querySelector('span').textContent
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
    // 可以添加页面跳转逻辑
    window.history.back();
});

// 查看全部视频按钮功能
document.querySelector('.view-all-btn').addEventListener('click', function() {
    showMessage('查看全部历史视频功能开发中...', 'info');
}); 
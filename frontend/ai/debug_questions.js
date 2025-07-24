// 前端建议问题调试脚本
// 在浏览器控制台中运行此脚本来诊断问题

function debugSuggestedQuestions() {
    console.log('=== 开始调试建议问题显示问题 ===');
    
    // 1. 检查DOM元素是否存在
    console.log('\n1. 检查DOM元素:');
    const questionsContainer = document.getElementById('questions-container');
    const suggestedQuestionsCard = document.querySelector('.suggested-questions');
    
    console.log('questions-container元素:', questionsContainer);
    console.log('suggested-questions卡片:', suggestedQuestionsCard);
    
    if (!questionsContainer) {
        console.error('❌ questions-container元素不存在！');
        return;
    }
    
    if (!suggestedQuestionsCard) {
        console.error('❌ suggested-questions卡片不存在！');
        return;
    }
    
    // 2. 检查CSS样式
    console.log('\n2. 检查CSS样式:');
    const containerStyles = window.getComputedStyle(questionsContainer);
    const cardStyles = window.getComputedStyle(suggestedQuestionsCard);
    
    console.log('questions-container样式:');
    console.log('  display:', containerStyles.display);
    console.log('  visibility:', containerStyles.visibility);
    console.log('  opacity:', containerStyles.opacity);
    console.log('  height:', containerStyles.height);
    
    console.log('suggested-questions卡片样式:');
    console.log('  display:', cardStyles.display);
    console.log('  visibility:', cardStyles.visibility);
    console.log('  opacity:', cardStyles.opacity);
    console.log('  height:', cardStyles.height);
    
    // 3. 检查内容
    console.log('\n3. 检查内容:');
    console.log('questions-container内容:', questionsContainer.innerHTML);
    console.log('questions-container子元素数量:', questionsContainer.children.length);
    
    // 4. 检查全局变量
    console.log('\n4. 检查全局变量:');
    console.log('lastAiMessage:', window.lastAiMessage || 'undefined');
    console.log('isWaitingForResponse:', window.isWaitingForResponse || 'undefined');
    
    // 5. 测试显示函数
    console.log('\n5. 测试显示函数:');
    const testQuestions = [
        { id: 1, text: '测试问题1：这是一个测试问题' },
        { id: 2, text: '测试问题2：这是另一个测试问题' },
        { id: 3, text: '测试问题3：这是第三个测试问题' }
    ];
    
    try {
        if (typeof displaySuggestedQuestions === 'function') {
            console.log('✅ displaySuggestedQuestions函数存在，尝试调用...');
            displaySuggestedQuestions(testQuestions);
            console.log('✅ displaySuggestedQuestions调用成功');
            
            // 检查调用后的状态
            setTimeout(() => {
                console.log('调用后questions-container内容:', questionsContainer.innerHTML);
                console.log('调用后子元素数量:', questionsContainer.children.length);
            }, 100);
        } else {
            console.error('❌ displaySuggestedQuestions函数不存在！');
        }
    } catch (error) {
        console.error('❌ displaySuggestedQuestions调用失败:', error);
    }
    
    // 6. 检查loadSuggestedQuestions函数
    console.log('\n6. 检查loadSuggestedQuestions函数:');
    try {
        if (typeof loadSuggestedQuestions === 'function') {
            console.log('✅ loadSuggestedQuestions函数存在，尝试调用...');
            loadSuggestedQuestions();
            console.log('✅ loadSuggestedQuestions调用成功');
        } else {
            console.error('❌ loadSuggestedQuestions函数不存在！');
        }
    } catch (error) {
        console.error('❌ loadSuggestedQuestions调用失败:', error);
    }
    
    // 7. 检查网络请求
    console.log('\n7. 检查questions.json加载:');
    fetch('/ai/questions.json')
        .then(response => {
            console.log('questions.json响应状态:', response.status);
            return response.json();
        })
        .then(data => {
            console.log('✅ questions.json加载成功:', data);
        })
        .catch(error => {
            console.error('❌ questions.json加载失败:', error);
        });
    
    // 8. 强制显示建议问题卡片
    console.log('\n8. 强制显示建议问题卡片:');
    if (suggestedQuestionsCard) {
        suggestedQuestionsCard.style.display = 'block';
        suggestedQuestionsCard.style.visibility = 'visible';
        suggestedQuestionsCard.style.opacity = '1';
        console.log('✅ 已强制设置建议问题卡片为可见');
    }
    
    console.log('\n=== 调试完成 ===');
}

// 自动运行调试
debugSuggestedQuestions();

// 导出到全局作用域，方便手动调用
window.debugSuggestedQuestions = debugSuggestedQuestions;

console.log('\n💡 提示：可以在控制台中运行 debugSuggestedQuestions() 来重新执行调试');
console.log('💡 提示：可以在控制台中运行 displaySuggestedQuestions([{id:1,text:"测试"}]) 来测试显示功能');
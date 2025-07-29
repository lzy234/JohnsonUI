# 强生AI手术复盘助手 - 页面路由实现计划

## 概述

本文档详细描述了如何为强生AI手术复盘助手实现完整的页面路由转发功能，实现 index → upload → analysis → ai 的用户流程。

## 技术方案

### 1. 路由实现方式
采用 **URL参数 + localStorage** 的混合方案：
- URL参数：传递页面流程状态和关键标识符
- localStorage：存储完整的用户数据和会话信息
- 支持浏览器前进/后退功能
- 保证数据在页面刷新后不丢失

### 2. 数据流设计

```
index页面 → upload页面 → analysis页面 → ai页面
    ↓           ↓              ↓           ↓
选择AI专家   → 上传视频+填表  → 分析进度   → AI对话
    ↓           ↓              ↓           ↓
doctor_id   → video_info   → analysis_id → session_id
```

## 实现步骤

### 阶段一：创建路由管理器 (Router.js)

创建统一的路由管理器，负责：
- 页面跳转逻辑
- 数据传递和存储
- 页面状态管理
- 错误处理

**核心功能：**
```javascript
class AppRouter {
    // 页面跳转
    navigateTo(page, data = {})
    
    // 数据存储和获取
    savePageData(key, data)
    getPageData(key)
    
    // 流程验证
    validateFlow(currentPage)
    
    // 返回上一页
    goBack()
}
```

### 阶段二：修改各页面的跳转逻辑

#### 2.1 index页面修改
- **触发事件**：点击AI专家卡片
- **执行动作**：
  1. 保存选择的医生信息到localStorage
  2. 跳转到upload页面，携带doctor_id参数
  3. 添加页面切换动画

**关键代码位置**：`index/script.js` 的 `handleDoctorSelection` 函数

#### 2.2 upload页面修改
- **页面初始化**：从localStorage读取医生信息，显示在页面上
- **触发事件**：点击"提交并开始分析"按钮
- **执行动作**：
  1. 验证表单完整性
  2. 保存视频和患者信息到localStorage
  3. 跳转到analysis页面，携带upload_id参数
- **返回按钮**：返回到index页面

**关键代码位置**：`upload/script.js` 的 `handleSubmit` 函数

#### 2.3 analysis页面修改
- **页面初始化**：显示正在分析的视频信息
- **进度完成**：自动跳转到ai页面
- **触发事件**：进度达到100%时
- **执行动作**：
  1. 生成session_id
  2. 跳转到ai页面，携带session_id参数
- **返回按钮**：返回到upload页面

**关键代码位置**：`analysis/script.js` 的 `showCompletionMessage` 函数

#### 2.4 ai页面修改
- **页面初始化**：从localStorage读取所有之前的数据，显示完整信息
- **返回按钮**：返回到analysis页面

### 阶段三：数据结构设计

#### 3.1 localStorage数据结构
```javascript
{
    "jhui_session": {
        "doctor": {
            "id": "wang",
            "name": "王专家",
            "specialty": "普外科",
            "expertise": "术后并发症分析"
        },
        "video": {
            "id": "left_hepatectomy_07_06",
            "name": "左肝切除术_07-06",
            "size": "204 M",
            "duration": "01:28:49",
            "uploadTime": "2025年7月6日 10:32"
        },
        "patient": {
            "doctor": "Dr.Wang",
            "hospital": "复旦大学附属中山医院",
            "surgery": "左肝切除术",
            "bleeding": "150ml",
            "bmi": "37.5",
            "age": "47",
            "gender": "男"
        },
        "analysis": {
            "progress": 100,
            "completed_at": "2025-01-27T10:30:00Z",
            "session_id": "session_20250127_103000"
        }
    }
}
```

#### 3.2 URL参数设计
- index页面：`index.html`
- upload页面：`upload/index.html?from=index&doctor_id=wang`
- analysis页面：`analysis/index.html?from=upload&upload_id=xxx`
- ai页面：`ai/index.html?from=analysis&session_id=xxx`

### 阶段四：用户体验优化

#### 4.1 页面过渡动画
- 添加页面切换时的淡入淡出效果
- 实现页面间的滑动过渡动画
- 保持品牌视觉的一致性

#### 4.2 进度指示器
在每个页面顶部添加进度条：
```
[●]─[○]─[○]─[○]  index页面
[●]─[●]─[○]─[○]  upload页面  
[●]─[●]─[●]─[○]  analysis页面
[●]─[●]─[●]─[●]  ai页面
```

#### 4.3 错误处理
- 用户直接访问中间页面时，引导回到首页
- 数据丢失时的恢复机制
- 网络错误时的友好提示

## 后续扩展计划

1. **添加页面缓存机制**：提高页面切换速度
2. **实现深度链接支持**：支持直接分享特定步骤的链接
3. **添加数据同步功能**：与后端API集成，实现数据云端同步
4. **优化移动端体验**：针对移动设备进行专门优化 
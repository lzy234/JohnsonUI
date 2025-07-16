# 医学手术复盘AI Agent - 后端实现计划

## 项目概述
基于Coze API开发医学手术复盘AI Agent的后端服务，实现与现有前端页面的对接。

## 需求分析总结
1. **后端核心要求**：
   - 对接Coze API进行AI对话
   - 使用JSON配置文件管理API配置
   - 支持流式聊天接口
   - 提供RESTful API供前端调用

2. **前端对接要求**：
   - 与现有的index、upload、analysis、ai四个页面对接
   - 重点实现ai对话页面的后端支持

## 技术架构设计

### 1. 后端技术栈
- **框架**: Flask/FastAPI (推荐FastAPI，支持异步和自动文档生成)
- **HTTP客户端**: httpx (异步支持)
- **配置管理**: JSON文件 + pydantic模型
- **日志**: Python logging
- **CORS**: 支持跨域请求

### 2. 目录结构
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI应用入口
│   ├── models/
│   │   ├── __init__.py
│   │   ├── chat.py          # 聊天相关数据模型
│   │   └── config.py        # 配置数据模型
│   ├── api/
│   │   ├── __init__.py
│   │   ├── chat.py          # 聊天API路由
│   │   └── health.py        # 健康检查API
│   ├── services/
│   │   ├── __init__.py
│   │   ├── coze_service.py  # Coze API服务
│   │   └── config_service.py # 配置管理服务
│   └── utils/
│       ├── __init__.py
│       └── logger.py        # 日志工具
├── config/
│   └── coze_config.json     # Coze API配置文件
├── requirements.txt         # 依赖包
└── README.md               # 项目说明
```

## 详细实现计划

### 阶段一：基础架构搭建 (1-2天)

#### 1.1 创建项目结构
- 创建backend目录和子目录
- 初始化Python虚拟环境
- 创建requirements.txt文件

#### 1.2 配置文件设计
**config/coze_config.json**:
```json
{
  "coze": {
    "api_token": "pat_BabxcQ99cMx3ziABhpRshfsvXBP0HXgke1wVigzquPehrOshql7Fr61kXhex1S4b",
    "base_url": "https://api.coze.cn",
    "bot_id": "7519906707460898851",
    "default_user_id": "123456789",
    "timeout": 30,
    "max_retries": 3
  },
  "server": {
    "host": "localhost",
    "port": 8000,
    "debug": true,
    "cors_origins": ["http://localhost:3000", "http://127.0.0.1:5500"]
  }
}
```

#### 1.3 数据模型定义
- 定义聊天请求/响应模型
- 定义配置模型
- 定义错误响应模型

### 阶段二：核心服务开发 (2-3天)

#### 2.1 Coze服务封装
- 封装Coze SDK调用
- 实现流式聊天功能
- 添加错误处理和重试机制
- 实现消息格式转换

#### 2.2 配置管理服务
- 实现配置文件读取
- 支持配置热重载
- 配置验证和默认值处理

#### 2.3 API路由实现
**核心API接口**:
```
POST /api/chat/stream          # 流式聊天
POST /api/chat/message         # 单次聊天
GET  /api/health              # 健康检查
GET  /api/config/bot-info     # 获取机器人信息
```

### 阶段三：API接口开发 (2天)

#### 3.1 聊天API实现
- **流式聊天接口**: 支持Server-Sent Events (SSE)
- **单次聊天接口**: 返回完整响应
- **消息历史管理**: 支持上下文对话

#### 3.2 请求/响应格式设计
**聊天请求格式**:
```json
{
  "message": "请分析这个手术案例...",
  "user_id": "user123",
  "conversation_id": "conv456",
  "context": [
    {
      "role": "user",
      "content": "之前的对话内容"
    }
  ]
}
```

**流式响应格式**:
```
data: {"type": "message", "content": "正在分析", "done": false}
data: {"type": "message", "content": "手术案例", "done": false}
data: {"type": "complete", "usage": {"token_count": 150}, "done": true}
```

### 阶段四：前端对接 (1-2天)

#### 4.1 分析现有前端结构
- 检查ai文件夹中的JavaScript代码
- 确定现有的UI组件和交互逻辑
- 识别需要对接的API调用点

#### 4.2 前端适配
- 修改前端JavaScript，调用后端API
- 实现流式响应处理
- 添加错误处理和加载状态
- 测试用户交互流程

### 阶段五：测试和优化 (1天)

#### 5.1 功能测试
- API接口测试
- 流式聊天测试
- 错误处理测试
- 性能测试

#### 5.2 前后端集成测试
- 完整对话流程测试
- 多用户并发测试
- 异常情况处理测试

## 具体实现要点

### 1. 流式聊天实现
```python
@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    async def generate():
        try:
            for event in coze.chat.stream(
                bot_id=config.bot_id,
                user_id=request.user_id,
                additional_messages=[
                    Message.build_user_question_text(request.message)
                ]
            ):
                if event.event == ChatEventType.CONVERSATION_MESSAGE_DELTA:
                    yield f"data: {json.dumps({'type': 'message', 'content': event.message.content, 'done': False})}\n\n"
                
                if event.event == ChatEventType.CONVERSATION_CHAT_COMPLETED:
                    yield f"data: {json.dumps({'type': 'complete', 'usage': event.chat.usage.token_count, 'done': True})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(generate(), media_type="text/plain")
```

### 2. 配置管理
```python
class CozeConfig(BaseModel):
    api_token: str
    base_url: str = "https://api.coze.cn"
    bot_id: str
    default_user_id: str = "default_user"
    timeout: int = 30
    max_retries: int = 3

def load_config() -> CozeConfig:
    with open("config/coze_config.json", "r", encoding="utf-8") as f:
        config_data = json.load(f)
    return CozeConfig(**config_data["coze"])
```

### 3. 前端JavaScript适配示例
```javascript
// ai/script.js 中的修改示例
async function sendMessage(message) {
    const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: message,
            user_id: 'web_user',
            conversation_id: getCurrentConversationId()
        })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        
        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = JSON.parse(line.slice(6));
                handleStreamResponse(data);
            }
        }
    }
}
```

## 预期交付物
1. 完整的后端API服务
2. 配置文件模板
3. 修改后的前端代码（主要是ai页面）
4. API文档
5. 部署说明文档
6. 测试用例

## 风险点和解决方案
1. **API调用失败**: 实现重试机制和降级策略
2. **流式响应中断**: 添加断线重连和状态恢复
3. **配置文件安全**: 敏感信息环境变量化
4. **并发处理**: 使用异步框架和连接池
5. **前端兼容**: 确保跨浏览器兼容性

## 时间安排
- **总工期**: 7-10天
- **关键里程碑**:
  - Day 3: 基础架构和核心服务完成
  - Day 6: API接口开发完成
  - Day 8: 前后端对接完成
  - Day 10: 测试和优化完成

## 后续扩展计划
1. 支持多机器人配置
2. 添加用户会话管理
3. 实现聊天记录持久化
4. 添加监控和日志分析
5. 支持文件上传和处理 
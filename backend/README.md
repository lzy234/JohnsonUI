# 医学手术复盘AI Agent - 后端服务

基于Coze API开发的医学手术复盘AI智能助手后端服务。

## 功能特性

- 🤖 集成Coze AI对话能力
- 🌊 支持流式聊天响应
- ⚙️ JSON配置文件管理
- 📝 完整的日志记录
- 🔄 配置热重载
- 🌐 CORS跨域支持
- 📖 自动API文档生成

## 技术栈

- **框架**: FastAPI (异步Web框架)
- **AI服务**: Coze SDK
- **数据验证**: Pydantic
- **日志**: Loguru
- **ASGI服务器**: Uvicorn

## 目录结构

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI应用入口
│   ├── models/
│   │   ├── chat.py          # 聊天相关数据模型
│   │   └── config.py        # 配置数据模型
│   ├── api/
│   │   ├── chat.py          # 聊天API路由
│   │   └── health.py        # 健康检查API
│   ├── services/
│   │   ├── coze_service.py  # Coze API服务
│   │   └── config_service.py # 配置管理服务
│   └── utils/
│       └── logger.py        # 日志工具
├── config/
│   └── coze_config.json     # Coze API配置文件
├── requirements.txt         # 依赖包
└── README.md               # 项目说明
```

## 快速开始

### 1. 安装依赖

```bash
# 创建虚拟环境（推荐）
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt
```

### 2. 配置设置

编辑 `config/coze_config.json` 文件：

```json
{
  "coze": {
    "api_token": "你的Coze API Token",
    "base_url": "https://api.coze.cn",
    "bot_id": "你的机器人ID",
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

### 3. 启动服务

```bash
# 开发模式启动
cd backend
python -m app.main

# 或使用uvicorn直接启动
uvicorn app.main:app --host localhost --port 8000 --reload
```

### 4. 访问API

- **API文档**: http://localhost:8000/docs
- **健康检查**: http://localhost:8000/api/health
- **根路径**: http://localhost:8000/

## API接口

### 健康检查

```http
GET /api/health
```

### 流式聊天

```http
POST /api/chat/stream
Content-Type: application/json

{
  "message": "请分析这个手术案例...",
  "user_id": "user123",
  "conversation_id": "conv456"
}
```

### 单次聊天

```http
POST /api/chat/message
Content-Type: application/json

{
  "message": "请分析这个手术案例...",
  "user_id": "user123",
  "stream": false
}
```

### 获取机器人信息

```http
GET /api/chat/bot-info
```

### 重新加载配置

```http
POST /api/chat/reload-config
```

## 配置说明

### Coze配置

- `api_token`: Coze API访问令牌
- `base_url`: Coze API基础URL（默认：https://api.coze.cn）
- `bot_id`: 机器人ID
- `default_user_id`: 默认用户ID
- `timeout`: 请求超时时间（秒）
- `max_retries`: 最大重试次数

### 服务器配置

- `host`: 服务器主机（默认：localhost）
- `port`: 服务器端口（默认：8000）
- `debug`: 调试模式（默认：false）
- `cors_origins`: 允许的跨域源列表

## 开发说明

### 日志配置

系统使用Loguru进行日志管理，支持：
- 彩色控制台输出
- 文件日志轮转
- 结构化日志格式

### 错误处理

- 完整的异常捕获和日志记录
- 友好的错误响应格式
- 重试机制

### 性能优化

- 异步IO处理
- 连接池复用
- 流式响应减少内存占用

## 部署建议

### 生产环境

```bash
# 使用Gunicorn + Uvicorn Workers
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

### Docker部署

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 故障排除

### 常见问题

1. **配置文件不存在**
   - 确保 `config/coze_config.json` 文件存在且格式正确

2. **Coze API调用失败**
   - 检查API Token是否有效
   - 确认机器人ID是否正确
   - 验证网络连接

3. **CORS错误**
   - 检查 `cors_origins` 配置
   - 确保前端域名在允许列表中

### 日志查看

```bash
# 查看实时日志
tail -f logs/app.log

# 查看错误日志
grep "ERROR" logs/app.log
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License 
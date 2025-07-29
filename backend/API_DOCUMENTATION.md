# 医学手术复盘AI Agent API文档

## 基本信息
- **API基础URL**: `http://服务器地址:8000`
- **版本**: 1.0.0
- **Swagger文档**: `/docs`

## 1. 健康检查

### 1.1 健康状态检查
- **URL**: `/api/health`
- **方法**: `GET`
- **描述**: 检查API服务是否正常运行
- **响应**:
  ```json
  {
    "status": "healthy",
    "version": "1.0.0",
    "timestamp": "2023-07-24T10:43:55.806"
  }
  ```

## 2. 聊天API

### 2.1 流式聊天
- **URL**: `/api/chat/stream`
- **方法**: `POST`
- **描述**: 与AI医生进行流式对话，支持持续的消息流传输
- **请求体**:
  ```json
  {
    "message": "患者术后恢复情况如何？",
    "user_id": "user123",
    "conversation_id": "conv456",
    "doctor_type": "wang",
    "stream": true
  }
  ```
  | 参数 | 类型 | 必需 | 描述 |
  |------|------|------|------|
  | message | string | 是 | 用户发送的消息内容 |
  | user_id | string | 是 | 用户标识符 |
  | conversation_id | string | 否 | 对话标识符，用于继续之前的对话 |
  | doctor_type | string | 否 | 医生类型，如'wang'(普外科)或'chen'(内科) |
  | stream | boolean | 否 | 是否启用流式响应，默认为true |

- **响应**: 
  - 类型: `text/event-stream`
  - 数据格式: 服务器发送事件(SSE)格式的JSON对象
  - 事件类型:
    - `init`: 连接初始化事件
    - `message`: 消息内容事件
    - `follow_up`: 建议跟进问题事件
    - `complete`: 完成事件
    - `error`: 错误事件

  示例事件:
  ```
  data: {"type":"message","content":"患者术后恢复良好...","done":false,"request_id":"stream_user123_1626912345"}
  
  data: {"type":"follow_up","follow_up_questions":["术后需要注意哪些事项？","何时可以恢复正常饮食？"],"done":false,"request_id":"stream_user123_1626912345"}
  
  data: {"type":"complete","done":true,"usage":{"tokens":256},"request_id":"stream_user123_1626912345"}
  ```

### 2.2 单次聊天
- **URL**: `/api/chat/message`
- **方法**: `POST`
- **描述**: 与AI医生进行单次对话，返回完整回复
- **请求体**: 与流式聊天相同，但`stream`参数设置为`false`
- **响应**:
  ```json
  {
    "content": "患者术后恢复良好，各项指标稳定...",
    "conversation_id": "conv456",
    "user_id": "user123",
    "usage": {
      "tokens": 256
    },
    "error": null
  }
  ```

### 2.3 获取机器人信息
- **URL**: `/api/chat/bot-info`
- **方法**: `GET`
- **描述**: 获取AI医生机器人的信息
- **查询参数**:
  | 参数 | 类型 | 必需 | 描述 |
  |------|------|------|------|
  | doctor_type | string | 否 | 医生类型，如'wang'或'chen' |
- **响应**:
  ```json
  {
    "success": true,
    "data": {
      "bot_id": "7519906707460898851",
      "name": "王专家",
      "description": "普外科手术复盘AI"
    }
  }
  ```

### 2.4 获取可用医生列表
- **URL**: `/api/chat/doctors`
- **方法**: `GET`
- **描述**: 获取系统中所有可用的AI医生列表
- **响应**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "wang",
        "name": "王专家",
        "specialty": "普外科",
        "description": "普外科手术复盘AI"
      },
      {
        "id": "chen",
        "name": "陈专家",
        "specialty": "内科",
        "description": "内科复杂病例复盘AI"
      }
    ]
  }
  ```

### 2.5 重新加载配置
- **URL**: `/api/chat/reload-config`
- **方法**: `POST`
- **描述**: 重新加载系统配置，包括医生配置和Coze客户端
- **响应**:
  ```json
  {
    "success": true,
    "message": "配置重新加载成功"
  }
  ```

## 3. 视频API

### 3.1 获取预设视频列表
- **URL**: `/api/videos/preset`
- **方法**: `GET`
- **描述**: 获取所有可用的预设视频信息
- **响应**:
  ```json
  [
    {
      "id": "video1",
      "title": "腹腔镜手术视频",
      "description": "展示腹腔镜手术的完整流程",
      "url": "/videos/demo.mp4",
      "thumbnail": "/images/thumbnail1.jpg"
    },
    {
      "id": "video2",
      "title": "内镜检查视频",
      "description": "内镜检查技术展示",
      "url": "/videos/endoscopy.mp4",
      "thumbnail": "/images/thumbnail2.jpg"
    }
  ]
  ```

### 3.2 获取特定视频信息
- **URL**: `/api/videos/{video_id}`
- **方法**: `GET`
- **描述**: 根据ID获取特定视频的详细信息
- **路径参数**:
  | 参数 | 类型 | 描述 |
  |------|------|------|
  | video_id | string | 视频ID |
- **响应**: 视频详细信息对象，格式同上

### 3.3 获取视频流URL
- **URL**: `/api/videos/stream/{video_id}`
- **方法**: `GET`
- **描述**: 获取特定视频的流媒体URL
- **路径参数**:
  | 参数 | 类型 | 描述 |
  |------|------|------|
  | video_id | string | 视频ID |
- **响应**:
  ```json
  {
    "url": "/videos/demo.mp4"
  }
  ```

## 4. 静态资源

### 4.1 视频文件
- **基础URL**: `/videos/`
- **方法**: `GET`
- **描述**: 提供视频文件的直接访问
- **示例**: `/videos/demo.mp4`

## 5. 错误处理
所有API都可能返回以下错误响应:

```json
{
  "error": "内部服务器错误",
  "message": "处理请求时发生错误",
  "detail": "详细错误信息",
  "code": 500
}
```

常见HTTP状态码:
- 200: 请求成功
- 400: 请求参数错误
- 404: 资源未找到
- 500: 服务器内部错误

## 6. 注意事项
1. 流式聊天API使用SSE(Server-Sent Events)技术，前端需要使用`EventSource`或兼容库处理
2. 所有请求和响应的编码均为UTF-8
3. 文档中的所有示例URL需要加上基础URL前缀 
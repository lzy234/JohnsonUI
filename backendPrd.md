# 医学手术复盘AI Agent - 产品需求文档

## 项目目标
实现一个医学手术复盘的AI Agent，理想的最终功能是，能够上传一个手术视频，agent把视频解析为文本，然后再根据解析文本，医生能够与AI对话。

## 需求分析
1、后端要求：只需对接cozeAPI，并把例程的配置单独放到配置文件中，以便修改，使用Json文件进行API的配置管理；
2、前端要求：一个LLM对话框，能够渲染Markdown格式，具体的设计需要参考figma设计文件链接；
3、视频上传功能：不需要真的去实现上传功能，只需要做一个假的视频上传成功的显示，但是需要预留出后端接口；
4、视频解析功能：不需要实现，只需要在视频上传成功后，在前端UI界面直接显示给定的文本就好，这段文本也放到配置文件中以便修改；最后不要忘了显示解析成功，当然也是假的，同样预留出后端接口。

总结：后端需要对接CozeAPI；前端需要参照我给你的figma设计

## 后端例程如下：
现在有一个coze例程如下：

"""
This example is about how to use the streaming interface to start a chat request
and handle chat events
"""

import os
# Our official coze sdk for Python [cozepy](https://github.com/coze-dev/coze-py)
from cozepy import COZE_CN_BASE_URL

# Get an access_token through personal access token or oauth.
coze_api_token = 'pat_BabxcQ99cMx3ziABhpRshfsvXBP0HXgke1wVigzquPehrOshql7Fr61kXhex1S4b'
# The default access is api.coze.com, but if you need to access api.coze.cn,
# please use base_url to configure the api endpoint to access
coze_api_base = COZE_CN_BASE_URL

from cozepy import Coze, TokenAuth, Message, ChatStatus, MessageContentType, ChatEventType  # noqa

# Init the Coze client through the access_token.
coze = Coze(auth=TokenAuth(token=coze_api_token), base_url=coze_api_base)

# Create a bot instance in Coze, copy the last number from the web link as the bot's ID.
bot_id = '7519906707460898851'
# The user id identifies the identity of a user. Developers can use a custom business ID
# or a random string.
user_id = '123456789'

# Call the coze.chat.stream method to create a chat. The create method is a streaming
# chat and will return a Chat Iterator. Developers should iterate the iterator to get
# chat event and handle them.
for event in coze.chat.stream(
    bot_id=bot_id,
    user_id=user_id,
    additional_messages=[
        Message.build_user_question_text("Tell a 500-word story."),
    ],
):
    if event.event == ChatEventType.CONVERSATION_MESSAGE_DELTA:
        print(event.message.content, end="", flush=True)

    if event.event == ChatEventType.CONVERSATION_CHAT_COMPLETED:
        print()
        print("token usage:", event.chat.usage.token_count)


---

## 需求理解分析

### 项目概述
本项目旨在构建一个医学手术复盘AI助手，通过AI技术帮助医生分析和回顾手术过程，提升医疗质量和教学效果。

### 核心功能模块

#### 1. 视频处理模块
- **当前阶段**：模拟实现，不涉及真实的视频处理
- **功能**：
  - 提供视频上传界面（仅UI展示）
  - 模拟上传成功状态
  - 模拟视频解析过程
  - 展示预设的解析文本结果
- **技术要求**：
  - 前端：文件上传组件（无实际上传功能）
  - 后端：预留视频上传和解析API接口
  - 配置：解析结果文本存储在配置文件中

#### 2. AI对话模块
- **核心功能**：与Coze AI进行流式对话
- **技术实现**：
  - 集成Coze API进行自然语言对话
  - 支持流式响应，实时显示AI回复
  - 基于手术解析文本进行专业医学对话
- **配置管理**：
  - API配置（token、base_url、bot_id等）存储在JSON配置文件
  - 便于环境切换和参数调整

#### 3. 前端界面模块
- **设计规范**：严格按照提供的Figma设计实现
- **界面结构**：
  1. **首页**：项目介绍和导航
  2. **上传页面**：视频和相关信息上传界面
  3. **分析页面**：显示处理进度和状态
  4. **结果页面**：展示解析结果并提供AI对话功能
- **技术要求**：
  - 支持Markdown渲染
  - 响应式设计
  - 流畅的用户交互体验

### 技术架构

#### 后端架构
- **主要职责**：
  - Coze API集成和管理
  - 配置文件管理
  - API接口预留（视频上传、解析）
- **技术栈**：Python + Coze SDK
- **配置管理**：JSON文件存储API配置和预设文本

#### 前端架构
- **主要职责**：
  - 用户界面展示
  - 与后端API交互
  - Markdown内容渲染
  - 文件上传界面（模拟）
- **设计实现**：基于Figma设计稿

### 实现优先级

#### 第一阶段（MVP）
1. 后端Coze API集成
2. 配置文件管理系统
3. 基础前端界面实现
4. 模拟视频上传和解析流程

#### 第二阶段（扩展）
1. 真实视频上传功能
2. 视频解析算法集成
3. 更丰富的AI对话功能
4. 用户管理和历史记录

### 配置文件结构建议

```json
{
  "coze_config": {
    "api_token": "pat_xxx",
    "base_url": "https://api.coze.cn",
    "bot_id": "7519906707460898851",
    "user_id": "123456789"
  },
  "mock_data": {
    "analysis_result": "这里存放模拟的视频解析结果文本..."
  },
  "api_endpoints": {
    "video_upload": "/api/upload",
    "video_analysis": "/api/analysis",
    "chat": "/api/chat"
  }
}
```

### 关键技术点
1. **流式对话处理**：使用Coze SDK的stream接口实现实时对话
2. **配置文件管理**：JSON配置便于部署和维护
3. **模拟数据处理**：合理的假数据展示完整用户流程
4. **接口预留**：为后续真实功能实现做好架构准备
5. **UI/UX一致性**：严格按照Figma设计实现界面
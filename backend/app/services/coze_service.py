"""
Coze API服务封装
"""

import asyncio
import json
from typing import AsyncGenerator, Optional, Dict, Any
from uuid import uuid4

from cozepy import Coze, TokenAuth, Message, MessageContentType, COZE_CN_BASE_URL, ChatEventType

from ..models.chat import ChatRequest, ChatResponse, StreamEvent, StreamEventType, MessageRole
from ..models.config import CozeConfig
from ..services.config_service import config_service
from ..utils.logger import get_logger

logger = get_logger("coze_service")


class CozeService:
    """Coze API服务"""
    
    def __init__(self):
        """初始化Coze服务"""
        self._coze_client: Optional[Coze] = None
        self._config: Optional[CozeConfig] = None
        
    def _get_client(self) -> Coze:
        """
        获取Coze客户端实例
        
        Returns:
            Coze客户端
        """
        if self._coze_client is None:
            self._config = config_service.get_coze_config()
            
            # 创建Coze客户端
            self._coze_client = Coze(
                auth=TokenAuth(token=self._config.api_token),
                base_url=self._config.base_url
            )
            logger.info("Coze客户端初始化完成")
            
        return self._coze_client
    
    def _get_config(self) -> CozeConfig:
        """
        获取Coze配置
        
        Returns:
            Coze配置对象
        """
        if self._config is None:
            self._config = config_service.get_coze_config()
        return self._config
    
    async def chat_stream(self, request: ChatRequest) -> AsyncGenerator[StreamEvent, None]:
        """
        流式聊天
        
        Args:
            request: 聊天请求
            
        Yields:
            StreamEvent: 流式事件
        """
        try:
            client = self._get_client()
            config = self._get_config()
            
            # 构建消息列表
            additional_messages = [Message.build_user_question_text(request.message)]
            
            # 如果有上下文，添加到消息中
            if request.context:
                context_messages = []
                for msg in request.context:
                    if msg.role == MessageRole.USER:
                        context_messages.append(Message.build_user_question_text(msg.content))
                    elif msg.role == MessageRole.ASSISTANT:
                        # 注意：Coze SDK可能不直接支持添加助手消息，这里可能需要调整
                        pass
                
                additional_messages = context_messages + additional_messages
            
            conversation_id = request.conversation_id or str(uuid4())
            logger.info(f"开始流式聊天 - 用户: {request.user_id}, 对话: {conversation_id}")
            
            # 调用Coze流式聊天API
            stream_response = client.chat.stream(
                bot_id=config.bot_id,
                user_id=request.user_id or config.default_user_id,
                additional_messages=additional_messages,
            )
            
            # 处理流式响应
            for event in stream_response:
                try:
                    logger.debug(f"收到流式事件: {event}")
                    
                    # 检查事件类型
                    if hasattr(event, 'event'):
                        # 处理消息增量事件
                        if event.event == ChatEventType.CONVERSATION_MESSAGE_DELTA:
                            content = ""
                            if hasattr(event, 'message') and hasattr(event.message, 'content'):
                                content = event.message.content
                            elif hasattr(event, 'data') and hasattr(event.data, 'content'):
                                content = event.data.content
                            
                            if content:
                                yield StreamEvent(
                                    type=StreamEventType.MESSAGE,
                                    content=content,
                                    done=False
                                )
                        
                        # 处理对话完成事件
                        elif event.event == ChatEventType.CONVERSATION_CHAT_COMPLETED:
                            usage_info = None
                            if hasattr(event, 'chat') and hasattr(event.chat, 'usage'):
                                usage_info = {
                                    "token_count": getattr(event.chat.usage, 'token_count', 0),
                                    "input_count": getattr(event.chat.usage, 'input_count', 0),
                                    "output_count": getattr(event.chat.usage, 'output_count', 0)
                                }
                            elif hasattr(event, 'data') and hasattr(event.data, 'usage'):
                                usage_info = {
                                    "token_count": getattr(event.data.usage, 'token_count', 0),
                                    "input_count": getattr(event.data.usage, 'input_count', 0),
                                    "output_count": getattr(event.data.usage, 'output_count', 0)
                                }
                            
                            yield StreamEvent(
                                type=StreamEventType.COMPLETE,
                                done=True,
                                usage=usage_info
                            )
                            logger.info(f"流式聊天完成 - 对话: {conversation_id}")
                            break
                    else:
                        # 处理其他类型的事件或直接访问content
                        content = ""
                        if hasattr(event, 'content'):
                            content = event.content
                        elif hasattr(event, 'message') and hasattr(event.message, 'content'):
                            content = event.message.content
                        
                        if content:
                            yield StreamEvent(
                                type=StreamEventType.MESSAGE,
                                content=content,
                                done=False
                            )
                except Exception as event_error:
                    logger.warning(f"处理单个流式事件时出错: {event_error}, 事件: {event}")
                    continue
                    
        except Exception as e:
            logger.error(f"流式聊天错误: {e}")
            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=str(e),
                done=True
            )
    
    async def chat_single(self, request: ChatRequest) -> ChatResponse:
        """
        单次聊天（非流式）
        
        Args:
            request: 聊天请求
            
        Returns:
            ChatResponse: 聊天响应
        """
        try:
            client = self._get_client()
            config = self._get_config()
            
            conversation_id = request.conversation_id or str(uuid4())
            
            # 构建消息
            additional_messages = [Message.build_user_question_text(request.message)]
            
            logger.info(f"开始单次聊天 - 用户: {request.user_id}, 对话: {conversation_id}")
            
            # 调用Coze聊天API
            chat_response = client.chat.create(
                bot_id=config.bot_id,
                user_id=request.user_id or config.default_user_id,
                additional_messages=additional_messages,
            )
            
            # 等待聊天完成
            while hasattr(chat_response, 'status') and chat_response.status in ["in_progress", "created"]:
                await asyncio.sleep(1)
                chat_response = client.chat.retrieve(
                    conversation_id=chat_response.conversation_id,
                    chat_id=chat_response.id
                )
            
            if hasattr(chat_response, 'status') and chat_response.status == "completed":
                # 获取聊天消息
                try:
                    messages = client.chat.message.list(
                        conversation_id=chat_response.conversation_id,
                        chat_id=chat_response.id
                    )
                    
                    # 提取助手回复
                    content = ""
                    for message in messages:
                        if message.role == "assistant" and message.type == MessageContentType.TEXT:
                            content += message.content
                except Exception as e:
                    logger.warning(f"获取消息列表失败: {e}")
                    # 使用流式方式获取内容
                    content = await self._get_content_from_stream(client, config, additional_messages, request.user_id)
                
                usage_info = None
                if hasattr(chat_response, 'usage') and chat_response.usage:
                    usage_info = {
                        "token_count": getattr(chat_response.usage, 'token_count', 0),
                        "input_count": getattr(chat_response.usage, 'input_count', 0),
                        "output_count": getattr(chat_response.usage, 'output_count', 0)
                    }
                
                logger.info(f"单次聊天完成 - 对话: {conversation_id}")
                
                return ChatResponse(
                    content=content,
                    conversation_id=conversation_id,
                    user_id=request.user_id,
                    usage=usage_info
                )
            else:
                # 使用流式方式作为后备
                content = await self._get_content_from_stream(client, config, additional_messages, request.user_id)
                return ChatResponse(
                    content=content,
                    conversation_id=conversation_id,
                    user_id=request.user_id
                )
                
        except Exception as e:
            logger.error(f"单次聊天错误: {e}")
            return ChatResponse(
                content="",
                conversation_id=request.conversation_id or str(uuid4()),
                user_id=request.user_id,
                error=str(e)
            )
    
    async def get_bot_info(self) -> Dict[str, Any]:
        """
        获取机器人信息
        
        Returns:
            机器人信息
        """
        try:
            client = self._get_client()
            config = self._get_config()
            
            # 注意：这里可能需要根据实际的Coze SDK API调整
            # 当前版本可能不直接支持获取机器人信息
            logger.info(f"获取机器人信息 - Bot ID: {config.bot_id}")
            
            return {
                "bot_id": config.bot_id,
                "base_url": config.base_url,
                "status": "active"
            }
            
        except Exception as e:
            logger.error(f"获取机器人信息错误: {e}")
            raise Exception(f"获取机器人信息失败: {e}")
    
    async def _get_content_from_stream(self, client, config, additional_messages, user_id):
        """使用流式方式获取内容"""
        content = ""
        try:
            stream_response = client.chat.stream(
                bot_id=config.bot_id,
                user_id=user_id or config.default_user_id,
                additional_messages=additional_messages,
            )
            
            for event in stream_response:
                if hasattr(event, 'event'):
                    if event.event == "conversation.message.delta":
                        if hasattr(event, 'data') and hasattr(event.data, 'content'):
                            content += event.data.content
                    elif event.event == "conversation.chat.completed":
                        break
                else:
                    if hasattr(event, 'content'):
                        content += event.content
        except Exception as e:
            logger.error(f"流式获取内容失败: {e}")
            content = "抱歉，AI暂时无法回应。"
        
        return content

    def reload_client(self) -> None:
        """重新加载客户端（当配置更新时）"""
        logger.info("重新加载Coze客户端")
        self._coze_client = None
        self._config = None


# 全局Coze服务实例
coze_service = CozeService() 
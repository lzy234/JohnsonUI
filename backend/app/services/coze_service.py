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
        self._coze_clients = {}
        self._configs = {}
        
    def _get_client(self, doctor_type: Optional[str] = None) -> Coze:
        """
        获取Coze客户端实例
        
        Args:
            doctor_type: 医生类型，如'wangzhiruo'或'chenguodong'
        
        Returns:
            Coze客户端
        """
        if doctor_type not in self._coze_clients:
            config = config_service.get_coze_config(doctor_type)
            self._configs[doctor_type] = config
            
            # 创建Coze客户端
            self._coze_clients[doctor_type] = Coze(
                auth=TokenAuth(token=config.api_token),
                base_url=config.base_url
            )
            logger.info(f"Coze客户端初始化完成: {doctor_type or 'default'}")
            
        return self._coze_clients[doctor_type]
    
    def _get_config(self, doctor_type: Optional[str] = None) -> CozeConfig:
        """
        获取Coze配置
        
        Args:
            doctor_type: 医生类型，如'wangzhiruo'或'chenguodong'
        
        Returns:
            Coze配置对象
        """
        if doctor_type not in self._configs:
            self._configs[doctor_type] = config_service.get_coze_config(doctor_type)
        return self._configs[doctor_type]
    
    async def chat_stream(self, request: ChatRequest) -> AsyncGenerator[StreamEvent, None]:
        """
        流式聊天
        
        Args:
            request: 聊天请求
            
        Yields:
            StreamEvent: 流式事件
        """
        try:
            doctor_type = request.doctor_type
            client = self._get_client(doctor_type)
            config = self._get_config(doctor_type)
            
            logger.info(f"使用医生配置: {doctor_type or 'default'}")
            
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
            doctor_type = request.doctor_type
            client = self._get_client(doctor_type)
            config = self._get_config(doctor_type)
            
            logger.info(f"使用医生配置: {doctor_type or 'default'}")
            
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
                error=str(e)
            )
    
    async def get_bot_info(self, doctor_type: Optional[str] = None) -> Dict[str, Any]:
        """
        获取机器人信息
        
        Args:
            doctor_type: 医生类型，如'wangzhiruo'或'chenguodong'
            
        Returns:
            机器人信息
        """
        try:
            client = self._get_client(doctor_type)
            config = self._get_config(doctor_type)
            
            bot_info = client.bot.retrieve(bot_id=config.bot_id)
            
            # 提取关键信息
            result = {
                "bot_id": bot_info.id,
                "name": bot_info.name if hasattr(bot_info, 'name') else "未知",
                "description": bot_info.description if hasattr(bot_info, 'description') else "",
                "created_at": bot_info.created_at if hasattr(bot_info, 'created_at') else None
            }
            
            return result
            
        except Exception as e:
            logger.error(f"获取机器人信息错误: {e}")
            return {
                "error": str(e)
            }
    
    async def _get_content_from_stream(self, client, config, additional_messages, user_id):
        """获取流式内容作为后备方案"""
        try:
            stream_response = client.chat.stream(
                bot_id=config.bot_id,
                user_id=user_id or config.default_user_id,
                additional_messages=additional_messages,
            )
            
            content = ""
            for event in stream_response:
                if hasattr(event, 'message') and hasattr(event.message, 'content'):
                    content += event.message.content
                elif hasattr(event, 'content'):
                    content += event.content
            return content
        except Exception as e:
            logger.error(f"流式获取内容错误: {e}")
            return "无法获取回复内容，请重试。"
    
    def reload_client(self) -> None:
        """重新加载客户端"""
        self._coze_clients = {}
        self._configs = {}
        logger.info("Coze客户端已重置")


# 全局服务实例
coze_service = CozeService() 
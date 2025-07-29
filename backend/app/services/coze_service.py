"""
Coze API服务封装
"""

import asyncio
import json
import re
from typing import AsyncGenerator, Optional, Dict, Any, Tuple, List
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
        self._references_cache = {}  # 用于缓存引用文本
        
    def _get_client(self, doctor_type: Optional[str] = None) -> Coze:
        """
        获取Coze客户端实例
        
        Args:
            doctor_type: 医生类型，如'wang'或'chen'
        
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
            doctor_type: 医生类型，如'wang'或'chen'
        
        Returns:
            Coze配置对象
        """
        if doctor_type not in self._configs:
            self._configs[doctor_type] = config_service.get_coze_config(doctor_type)
        return self._configs[doctor_type]
        
    def _extract_references(self, text: str) -> Tuple[str, str]:
        """
        从文本中提取引用部分
        
        Args:
            text: 原始文本
            
        Returns:
            Tuple[str, str]: (主体内容, 引用文本)
        """
        # 匹配形如 [1] [标题](URL) 的引用模式
        reference_pattern = r'\n\n(\[\d+\].*?)($|\n\n)'
        
        # 查找所有引用
        matches = list(re.finditer(reference_pattern, text, re.DOTALL))
        
        if not matches:
            # 没有找到引用，返回原文本和空引用
            return text, ""
            
        # 找到第一个引用的起始位置
        first_match = matches[0]
        start_pos = first_match.start()
        
        # 分割主体内容和引用部分
        main_content = text[:start_pos].strip()
        references = text[start_pos:].strip()
        
        return main_content, references
        
    async def chat_stream(self, request: ChatRequest) -> AsyncGenerator[StreamEvent, None]:
        """
        流式聊天
        
        Args:
            request: 聊天请求
            
        Yields:
            StreamEvent: 流式事件
        """
        from ..utils.logger import get_request_id, StreamLogger
        
        # 获取当前请求ID并创建流日志记录器
        request_id = get_request_id()
        stream_logger = StreamLogger("coze_stream")
        
        try:
            doctor_type = request.doctor_type
            client = self._get_client(doctor_type)
            config = self._get_config(doctor_type)
            
            logger.info(f"[{request_id}] 使用医生配置: {doctor_type or 'default'}, bot_id: {config.bot_id}")
            
            # 构建消息列表
            additional_messages = [Message.build_user_question_text(request.message)]
            
            # 如果有上下文，添加到消息中
            if request.context:
                context_messages = []
                for msg in request.context:
                    if msg.role == MessageRole.USER:
                        context_messages.append(Message.build_user_question_text(msg.content))
                    elif msg.role == MessageRole.ASSISTANT:
                        # 注意：某些SDK可能不直接支持添加助手消息
                        pass
                
                additional_messages = context_messages + additional_messages
            
            conversation_id = request.conversation_id or str(uuid4())
            logger.info(f"[{request_id}] 开始流式聊天 - 用户: {request.user_id}, 对话: {conversation_id}")
            
            # 添加日志记录请求详情
            logger.debug(f"[{request_id}] 流式聊天请求详情 - bot_id: {config.bot_id}, user_id: {request.user_id or config.default_user_id}")
            
            try:
                # 设置超时并添加重试
                timeout_seconds = config.timeout or 30
                retries = config.max_retries or 3
                retry_count = 0
                
                while True:
                    try:
                        # 调用Coze流式聊天API
                        stream_response = client.chat.stream(
                            bot_id=config.bot_id,
                            user_id=request.user_id or config.default_user_id,
                            additional_messages=additional_messages,
                        )
                        break  # 成功获取响应流，跳出重试循环
                    except Exception as retry_error:
                        retry_count += 1
                        if retry_count > retries:
                            logger.error(f"[{request_id}] 重试次数超过上限 ({retries}次)，放弃请求", exc_info=True)
                            raise
                        
                        logger.warning(f"[{request_id}] 流式请求失败，尝试重试 ({retry_count}/{retries}): {retry_error}")
                        await asyncio.sleep(1)  # 重试前等待1秒
                
                # 使用异步模式处理流式响应
                content_accumulator = ""
                event_count = 0
                follow_up_questions = []  # 收集建议问题
                
                # 初始化事件发送计时器和超时检测
                last_event_time = asyncio.get_event_loop().time()
                start_time = last_event_time
                
                # 异步处理流式响应
                for event in stream_response:
                    event_count += 1
                    current_time = asyncio.get_event_loop().time()
                    time_since_last = current_time - last_event_time
                    
                    # 检测事件超时
                    if time_since_last > timeout_seconds:
                        logger.warning(f"[{request_id}] 流式事件接收超时 ({time_since_last:.1f}秒 > {timeout_seconds}秒)")
                    
                    stream_logger.log_event("received", metadata={"event_type": getattr(event, 'event', 'unknown')})
                    logger.debug(f"[{request_id}] 收到原始流式事件 #{event_count}, 间隔: {time_since_last:.3f}秒")
                    
                    # 提取内容
                    content = None
                    is_complete = False
                    usage_info = None
                    follow_up_content = None
                    
                    # 根据事件类型处理
                    if hasattr(event, 'event'):
                        # 处理具有event字段的事件
                        event_type = getattr(event, 'event', None)
                        
                        if event_type == ChatEventType.CONVERSATION_MESSAGE_DELTA:
                            # 消息增量事件 - 从各种可能的属性中提取内容
                            if hasattr(event, 'message') and hasattr(event.message, 'content'):
                                content = event.message.content
                            elif hasattr(event, 'data') and hasattr(event.data, 'content'):
                                content = event.data.content
                            elif hasattr(event, 'delta') and hasattr(event.delta, 'content'):
                                content = event.delta.content
                            elif hasattr(event, 'content'):
                                content = event.content
                                
                        elif event_type == ChatEventType.CONVERSATION_MESSAGE_COMPLETED:
                            # 消息完成事件 - 检查是否为follow_up类型
                            if hasattr(event, 'message') and hasattr(event.message, 'type'):
                                msg_type = getattr(event.message, 'type', None)
                                if msg_type == 'follow_up' and hasattr(event.message, 'content'):
                                    follow_up_content = event.message.content
                                    follow_up_questions.append(follow_up_content)
                                    logger.debug(f"[{request_id}] 收集到建议问题: {follow_up_content}")
                            elif hasattr(event, 'data') and hasattr(event.data, 'type'):
                                msg_type = getattr(event.data, 'type', None)
                                if msg_type == 'follow_up' and hasattr(event.data, 'content'):
                                    follow_up_content = event.data.content
                                    follow_up_questions.append(follow_up_content)
                                    logger.debug(f"[{request_id}] 收集到建议问题: {follow_up_content}")
                            # 检查原始事件数据中的type字段
                            elif hasattr(event, 'type') and event.type == 'follow_up':
                                if hasattr(event, 'content'):
                                    follow_up_content = event.content
                                    follow_up_questions.append(follow_up_content)
                                    logger.debug(f"[{request_id}] 收集到建议问题: {follow_up_content}")
                                    
                        elif event_type == ChatEventType.CONVERSATION_CHAT_COMPLETED:
                            # 对话完成事件 - 提取使用统计
                            is_complete = True
                            stream_logger.log_event("complete")
                            
                            # 尝试从各种可能的属性中提取使用统计
                            for attr_path in ['chat.usage', 'data.usage', 'usage']:
                                parts = attr_path.split('.')
                                obj = event
                                found = True
                                
                                for part in parts:
                                    if hasattr(obj, part):
                                        obj = getattr(obj, part)
                                    else:
                                        found = False
                                        break
                                
                                if found and obj:
                                    usage_info = {
                                        "token_count": getattr(obj, 'token_count', 0),
                                        "input_count": getattr(obj, 'input_count', 0),
                                        "output_count": getattr(obj, 'output_count', 0)
                                    }
                                    break
                                    
                    else:
                        # 处理没有event字段的事件
                        # 尝试直接访问内容属性
                        for attr_name in ['content', 'message.content', 'delta.content']:
                            parts = attr_name.split('.')
                            obj = event
                            found = True
                            
                            for part in parts:
                                if hasattr(obj, part):
                                    obj = getattr(obj, part)
                                else:
                                    found = False
                                    break
                            
                            if found and isinstance(obj, str):
                                content = obj
                                break
                    
                    # 处理提取的内容
                    if content:
                        content_accumulator += content
                        stream_logger.log_event("content", content=content)
                        
                        # 发送消息事件
                        yield StreamEvent(
                            type=StreamEventType.MESSAGE,
                            content=content,
                            done=False
                        )
                        # 重置内容累积器
                        content_accumulator = ""
                    
                    # 如果是完成事件，发送完成通知
                    if is_complete:
                        # 发送任何剩余的内容
                        if content_accumulator:
                            yield StreamEvent(
                                type=StreamEventType.MESSAGE,
                                content=content_accumulator,
                                done=False
                            )
                            content_accumulator = ""
                        
                        # 发送完成事件，包含建议问题
                        yield StreamEvent(
                            type=StreamEventType.COMPLETE,
                            done=True,
                            usage=usage_info,
                            follow_up_questions=follow_up_questions if follow_up_questions else None
                        )
                        elapsed = current_time - start_time
                        stream_logger.log_summary("完成")
                        logger.info(f"[{request_id}] 流式聊天完成 - 对话: {conversation_id}, 共处理 {event_count} 个事件，总耗时: {elapsed:.2f}秒")
                        break
                    
                    # 更新最后事件时间
                    last_event_time = current_time
                
                # 确保任何剩余的内容都被发送
                if content_accumulator:
                    yield StreamEvent(
                        type=StreamEventType.MESSAGE,
                        content=content_accumulator,
                        done=False
                    )
                    
                    # 发送完成事件（如果之前没有明确完成），包含建议问题
                    yield StreamEvent(
                        type=StreamEventType.COMPLETE,
                        done=True,
                        follow_up_questions=follow_up_questions if follow_up_questions else None
                    )
                    elapsed = asyncio.get_event_loop().time() - start_time
                    stream_logger.log_summary("完成(隐式)")
                    logger.info(f"[{request_id}] 流式聊天完成(隐式) - 对话: {conversation_id}, 共处理 {event_count} 个事件，总耗时: {elapsed:.2f}秒")
                
            except Exception as stream_error:
                elapsed = asyncio.get_event_loop().time() - start_time if 'start_time' in locals() else 0
                logger.error(f"[{request_id}] 流式处理过程中发生错误 (耗时: {elapsed:.2f}秒): {stream_error}", exc_info=True)
                stream_logger.log_summary("失败", str(stream_error))
                
                yield StreamEvent(
                    type=StreamEventType.ERROR,
                    error=f"流式处理错误: {stream_error}",
                    done=True
                )
                    
        except Exception as e:
            logger.error(f"[{request_id}] 流式聊天初始化错误: {e}", exc_info=True)
            if 'stream_logger' in locals():
                stream_logger.log_summary("初始化失败", str(e))
                
            yield StreamEvent(
                type=StreamEventType.ERROR,
                error=str(e),
                done=True
            )
    
    async def chat_stream_without_references(self, request: ChatRequest) -> AsyncGenerator[StreamEvent, None]:
        """
        流式聊天，但不包含引用文献部分
        
        Args:
            request: 聊天请求
            
        Yields:
            StreamEvent: 流式事件
        """
        from ..utils.logger import get_request_id
        request_id = get_request_id()
        logger.info(f"[{request_id}] 开始无引用流式聊天")
        
        # 使用状态标志跟踪是否进入了引用部分
        in_reference_section = False
        references_content = ""
        conversation_id = request.conversation_id or str(uuid4())
        
        # 获取原始的流式回复
        async for event in self.chat_stream(request):
            if event.type == StreamEventType.MESSAGE:
                content = event.content
                
                # 检查是否遇到引用的开始标记
                if not in_reference_section and re.search(r'\n\n\[\d+\]', content):
                    # 找到引用的开始位置
                    ref_start = content.find('\n\n[')
                    if ref_start >= 0:
                        # 分割当前块为引用前和引用部分
                        before_ref = content[:ref_start]
                        ref_part = content[ref_start:]
                        
                        # 将引用部分添加到引用累积器
                        references_content += ref_part
                        in_reference_section = True
                        
                        # 只发送引用前的部分
                        if before_ref:
                            yield StreamEvent(
                                type=StreamEventType.MESSAGE,
                                content=before_ref,
                                done=False
                            )
                        continue  # 跳过原始事件的发送
                elif in_reference_section:
                    # 已经在引用部分，继续累积引用内容
                    references_content += content
                    continue  # 不发送给前端
                else:
                    # 正常的内容，直接发送
                    yield event
                    
            elif event.type == StreamEventType.COMPLETE:
                # 存储累积的引用内容
                if references_content:
                    self._references_cache[conversation_id] = references_content.strip()
                    logger.info(f"[{request_id}] 缓存引用文本，长度:{len(references_content)}")
                
                # 发送完成事件
                yield event
            else:
                # 其他事件类型直接传递
                yield event
    
    async def get_references(self, conversation_id: str) -> Dict[str, Any]:
        """
        获取特定对话的引用文献
        
        Args:
            conversation_id: 对话ID
            
        Returns:
            引用文献内容
        """
        try:
            references = self._references_cache.get(conversation_id, "")
            
            return {
                "conversation_id": conversation_id,
                "references": references,
                "success": True
            }
        except Exception as e:
            logger.error(f"获取引用文献错误: {e}")
            return {
                "conversation_id": conversation_id,
                "references": "",
                "success": False,
                "error": str(e)
            }
    
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
    
    async def chat_single_without_references(self, request: ChatRequest) -> ChatResponse:
        """
        单次聊天（非流式）- 不包含引用
        
        Args:
            request: 聊天请求
            
        Returns:
            ChatResponse: 聊天响应，不包含引用部分
        """
        response = await self.chat_single(request)
        
        if response.content and not response.error:
            # 分割内容和引用
            main_content, references = self._extract_references(response.content)
            
            # 缓存引用文本
            conversation_id = response.conversation_id
            if conversation_id:
                self._references_cache[conversation_id] = references
            
            # 更新响应内容，只包含主体部分
            response.content = main_content
            
        return response
    
    async def get_bot_info(self, doctor_type: Optional[str] = None) -> Dict[str, Any]:
        """
        获取机器人信息
        
        Args:
            doctor_type: 医生类型，如'wang'或'chen'
            
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
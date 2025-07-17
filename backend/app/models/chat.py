"""
聊天相关数据模型
"""

from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field
from enum import Enum


class MessageRole(str, Enum):
    """消息角色"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class ChatMessage(BaseModel):
    """聊天消息"""
    role: MessageRole = Field(..., description="消息角色")
    content: str = Field(..., description="消息内容")
    timestamp: Optional[str] = Field(default=None, description="时间戳")


class ChatRequest(BaseModel):
    """聊天请求"""
    message: str = Field(..., description="用户消息", min_length=1)
    user_id: str = Field(..., description="用户ID")
    conversation_id: Optional[str] = Field(default=None, description="对话ID")
    context: Optional[List[ChatMessage]] = Field(default=None, description="对话上下文")
    stream: bool = Field(default=True, description="是否流式响应")
    doctor_type: Optional[str] = Field(default=None, description="医生类型，如'wangzhiruo'或'chenguodong'")


class ChatResponse(BaseModel):
    """聊天响应"""
    content: str = Field(..., description="回复内容")
    conversation_id: str = Field(..., description="对话ID")
    user_id: str = Field(..., description="用户ID")
    usage: Optional[Dict[str, Any]] = Field(default=None, description="使用统计")
    error: Optional[str] = Field(default=None, description="错误信息")


class StreamEventType(str, Enum):
    """流式事件类型"""
    MESSAGE = "message"
    COMPLETE = "complete"
    ERROR = "error"


class StreamEvent(BaseModel):
    """流式事件"""
    type: StreamEventType = Field(..., description="事件类型")
    content: Optional[str] = Field(default=None, description="内容")
    done: bool = Field(default=False, description="是否完成")
    usage: Optional[Dict[str, Any]] = Field(default=None, description="使用统计")
    error: Optional[str] = Field(default=None, description="错误信息")


class HealthResponse(BaseModel):
    """健康检查响应"""
    status: str = Field(..., description="服务状态")
    version: str = Field(..., description="版本号")
    timestamp: str = Field(..., description="时间戳")


class ErrorResponse(BaseModel):
    """错误响应"""
    error: str = Field(..., description="错误类型")
    message: str = Field(..., description="错误消息")
    detail: Optional[str] = Field(default=None, description="详细信息")
    code: Optional[int] = Field(default=None, description="错误代码") 
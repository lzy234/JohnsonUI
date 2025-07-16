"""
配置数据模型
"""

from typing import List
from pydantic import BaseModel, Field


class CozeConfig(BaseModel):
    """Coze API配置"""
    api_token: str = Field(..., description="Coze API访问令牌")
    base_url: str = Field(default="https://api.coze.cn", description="Coze API基础URL")
    bot_id: str = Field(..., description="机器人ID")
    default_user_id: str = Field(default="default_user", description="默认用户ID")
    timeout: int = Field(default=30, description="请求超时时间(秒)")
    max_retries: int = Field(default=3, description="最大重试次数")


class ServerConfig(BaseModel):
    """服务器配置"""
    host: str = Field(default="localhost", description="服务器主机")
    port: int = Field(default=8000, description="服务器端口")
    debug: bool = Field(default=False, description="调试模式")
    cors_origins: List[str] = Field(default_factory=list, description="允许的跨域源")


class AppConfig(BaseModel):
    """应用配置"""
    coze: CozeConfig
    server: ServerConfig 
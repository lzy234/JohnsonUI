"""
配置数据模型
"""

from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field


class CozeConfig(BaseModel):
    """Coze API配置"""
    api_token: str = Field(..., description="Coze API访问令牌")
    base_url: str = Field(default="https://api.coze.cn", description="Coze API基础URL")
    bot_id: str = Field(..., description="机器人ID")
    default_user_id: str = Field(default="default_user", description="默认用户ID")
    timeout: int = Field(default=30, description="请求超时时间(秒)")
    max_retries: int = Field(default=3, description="最大重试次数")
    description: Optional[str] = Field(default=None, description="配置描述")


class CozeConfigs(BaseModel):
    """多个Coze配置"""
    default: CozeConfig
    wang: Optional[CozeConfig] = None
    chen: Optional[CozeConfig] = None
    
    def get_config(self, doctor_type: Optional[str] = None) -> CozeConfig:
        """
        根据医生类型获取对应的配置
        
        Args:
            doctor_type: 医生类型，如wang或chen
            
        Returns:
            对应的Coze配置
        """
        if doctor_type and hasattr(self, doctor_type):
            config = getattr(self, doctor_type)
            if config:
                return config
        return self.default


class ServerConfig(BaseModel):
    """服务器配置"""
    host: str = Field(default="localhost", description="服务器主机")
    port: int = Field(default=8000, description="服务器端口")
    debug: bool = Field(default=False, description="调试模式")
    cors_origins: List[str] = Field(default_factory=list, description="允许的跨域源")


class AppConfig(BaseModel):
    """应用配置"""
    coze: CozeConfigs
    server: ServerConfig 
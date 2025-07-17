"""
配置管理服务
"""

import json
import os
from typing import Optional
from pathlib import Path

from ..models.config import AppConfig, CozeConfig, ServerConfig
from ..utils.logger import get_logger

logger = get_logger("config_service")


class ConfigService:
    """配置管理服务"""
    
    def __init__(self, config_file: str = "config/coze_config.json"):
        """
        初始化配置服务
        
        Args:
            config_file: 配置文件路径
        """
        self.config_file = config_file
        self._config: Optional[AppConfig] = None
        self._base_path = Path(__file__).parent.parent.parent  # backend目录
        
    def load_config(self) -> AppConfig:
        """
        加载配置文件
        
        Returns:
            应用配置对象
            
        Raises:
            FileNotFoundError: 配置文件不存在
            ValueError: 配置格式错误
        """
        config_path = self._base_path / self.config_file
        
        if not config_path.exists():
            raise FileNotFoundError(f"配置文件不存在: {config_path}")
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config_data = json.load(f)
            
            # 验证配置结构
            self._config = AppConfig(**config_data)
            logger.info(f"配置文件加载成功: {config_path}")
            return self._config
            
        except json.JSONDecodeError as e:
            logger.error(f"配置文件JSON格式错误: {e}")
            raise ValueError(f"配置文件格式错误: {e}")
        except Exception as e:
            logger.error(f"配置文件加载失败: {e}")
            raise ValueError(f"配置验证失败: {e}")
    
    def get_config(self) -> AppConfig:
        """
        获取配置对象
        
        Returns:
            应用配置对象
        """
        if self._config is None:
            self._config = self.load_config()
        return self._config
    
    def reload_config(self) -> AppConfig:
        """
        重新加载配置文件
        
        Returns:
            应用配置对象
        """
        logger.info("重新加载配置文件")
        self._config = None
        return self.load_config()
    
    def get_coze_config(self, doctor_type: Optional[str] = None) -> CozeConfig:
        """
        获取Coze配置
        
        Args:
            doctor_type: 医生类型，如'wangzhiruo'或'chenguodong'
        
        Returns:
            Coze配置对象
        """
        config = self.get_config()
        return config.coze.get_config(doctor_type)
    
    def get_server_config(self) -> ServerConfig:
        """
        获取服务器配置
        
        Returns:
            服务器配置对象
        """
        return self.get_config().server
    
    def save_config(self, config: AppConfig) -> None:
        """
        保存配置到文件
        
        Args:
            config: 应用配置对象
        """
        config_path = self._base_path / self.config_file
        
        try:
            # 确保目录存在
            config_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 转换为字典并保存
            config_dict = config.dict()
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config_dict, f, indent=2, ensure_ascii=False)
            
            self._config = config
            logger.info(f"配置已保存到: {config_path}")
            
        except Exception as e:
            logger.error(f"保存配置文件失败: {e}")
            raise ValueError(f"保存配置失败: {e}")


# 全局配置服务实例
config_service = ConfigService() 
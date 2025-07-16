"""
日志工具类
"""

import sys
from loguru import logger
from typing import Optional


def setup_logger(
    level: str = "INFO",
    log_file: Optional[str] = None,
    rotation: str = "1 day",
    retention: str = "30 days"
) -> None:
    """
    设置日志记录器
    
    Args:
        level: 日志级别
        log_file: 日志文件路径
        rotation: 日志轮转
        retention: 日志保留时间
    """
    # 清除默认处理器
    logger.remove()
    
    # 添加控制台输出
    logger.add(
        sys.stderr,
        level=level,
        format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | "
               "<level>{level: <8}</level> | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
               "<level>{message}</level>",
        colorize=True
    )
    
    # 如果指定了日志文件，添加文件输出
    if log_file:
        logger.add(
            log_file,
            level=level,
            format="{time:YYYY-MM-DD HH:mm:ss} | {level: <8} | {name}:{function}:{line} - {message}",
            rotation=rotation,
            retention=retention,
            encoding="utf-8"
        )
    
    logger.info(f"日志记录器已设置，级别: {level}")


def get_logger(name: str = None):
    """
    获取日志记录器
    
    Args:
        name: 日志记录器名称
        
    Returns:
        日志记录器实例
    """
    if name:
        return logger.bind(name=name)
    return logger


# 默认日志记录器
app_logger = get_logger("medical_ai") 
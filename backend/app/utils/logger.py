"""
日志工具类
"""

import sys
import os
import uuid
import time
from loguru import logger
from typing import Optional, Dict, Any
from contextvars import ContextVar

# 请求上下文ID变量
request_id_var: ContextVar[str] = ContextVar('request_id', default='')


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
        format="<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
               "<level>{level: <8}</level> | "
               "{extra[request_id]} | "
               "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
               "<level>{message}</level>",
        colorize=True,
        backtrace=True,  # 显示异常追溯
        diagnose=True,   # 显示诊断信息
    )
    
    # 如果指定了日志文件，添加文件输出
    if log_file:
        # 确保日志目录存在
        log_dir = os.path.dirname(log_file)
        if log_dir and not os.path.exists(log_dir):
            os.makedirs(log_dir)
            
        logger.add(
            log_file,
            level=level,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {extra[request_id]} | {name}:{function}:{line} - {message}",
            rotation=rotation,
            retention=retention,
            encoding="utf-8",
            enqueue=True,  # 启用队列模式，确保线程安全
        )
    
    # 单独的流式日志
    stream_log_file = None
    if log_file:
        stream_log_file = log_file.replace('.log', '_stream.log')
        logger.add(
            stream_log_file,
            level=level,
            format="{time:YYYY-MM-DD HH:mm:ss.SSS} | {level: <8} | {extra[request_id]} | STREAM - {message}",
            filter=lambda record: "stream" in record["name"],
            rotation=rotation,
            retention=retention,
            encoding="utf-8",
            enqueue=True,
        )
    
    logger.info(f"日志记录器已设置，级别: {level}, 主日志: {log_file or 'stdout'}, 流日志: {stream_log_file or 'None'}")


def set_request_id(request_id: Optional[str] = None) -> str:
    """
    为当前请求设置请求ID
    
    Args:
        request_id: 自定义请求ID
        
    Returns:
        设置的请求ID
    """
    if not request_id:
        request_id = f"req_{uuid.uuid4().hex[:8]}_{int(time.time())}"
    request_id_var.set(request_id)
    return request_id


def get_request_id() -> str:
    """
    获取当前请求ID
    
    Returns:
        当前请求ID，如果不存在则返回空字符串
    """
    return request_id_var.get()


def get_logger(name: str = None):
    """
    获取日志记录器
    
    Args:
        name: 日志记录器名称
        
    Returns:
        日志记录器实例
    """
    log = logger.bind(name=name if name else "app")
    
    # 总是添加请求ID
    def request_context_filter(record):
        record["extra"]["request_id"] = get_request_id() or "-"
        return True
    
    logger.configure(patcher=request_context_filter)
    
    return log


class StreamLogger:
    """流式日志记录器，用于记录流式传输的内容"""
    
    def __init__(self, logger_name: str = "stream"):
        self.logger = get_logger(logger_name)
        self.event_count = 0
        self.start_time = time.time()
        
    def log_event(self, event_type: str, content: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        """记录流式事件"""
        self.event_count += 1
        elapsed = time.time() - self.start_time
        
        if content and len(content) > 100:
            # 对于长内容，只记录摘要
            content_summary = f"{content[:50]}...{content[-50:]}"
        else:
            content_summary = content
            
        log_message = f"[{elapsed:.2f}s] 事件 #{self.event_count} | 类型: {event_type}"
        
        if content_summary:
            log_message += f" | 内容: {content_summary}"
            
        if metadata:
            log_message += f" | 元数据: {metadata}"
            
        self.logger.debug(log_message)
        
    def log_summary(self, status: str = "完成", error: Optional[str] = None):
        """记录流式传输摘要"""
        elapsed = time.time() - self.start_time
        log_message = f"流式传输{status}，共处理 {self.event_count} 个事件，耗时 {elapsed:.2f}秒"
        
        if error:
            log_message += f"，错误: {error}"
            self.logger.error(log_message)
        else:
            self.logger.info(log_message)


# 默认日志记录器
app_logger = get_logger("medical_ai") 
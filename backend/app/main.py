"""
FastAPI主应用
"""

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from starlette.middleware.base import BaseHTTPMiddleware
import os
import time
import asyncio

from .api import chat, health, videos
from .services.config_service import config_service
from .utils.logger import setup_logger, get_logger, set_request_id


# 请求日志中间件
class RequestLoggerMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 生成请求ID
        request_id = set_request_id()
        
        # 获取日志记录器
        logger = get_logger("http")
        
        # 记录请求开始
        start_time = time.time()
        client_host = request.client.host if request.client else "unknown"
        logger.info(f"[{request_id}] 开始请求: {request.method} {request.url.path} - 客户端: {client_host}")
        
        try:
            # 调用下一个中间件或路由处理函数
            response = await call_next(request)
            
            # 计算处理时间
            process_time = time.time() - start_time
            
            # 记录请求结果
            logger.info(
                f"[{request_id}] 完成请求: {request.method} {request.url.path} "
                f"- 状态码: {response.status_code} - 耗时: {process_time:.3f}秒"
            )
            
            # 添加请求ID到响应头
            response.headers["X-Request-ID"] = request_id
            return response
            
        except Exception as e:
            # 记录异常
            process_time = time.time() - start_time
            logger.error(
                f"[{request_id}] 请求异常: {request.method} {request.url.path} "
                f"- 错误: {str(e)} - 耗时: {process_time:.3f}秒"
            )
            raise


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时的初始化
    # 设置日志系统
    log_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "logs")
    os.makedirs(log_dir, exist_ok=True)
    log_file = os.path.join(log_dir, "app.log")
    
    # 初始化日志
    setup_logger(level="DEBUG", log_file=log_file)
    logger = get_logger("app")
    
    try:
        # 加载配置
        config = config_service.load_config()
        
        # 设置合适的日志级别
        log_level = "DEBUG" if config.server.debug else "INFO"
        setup_logger(level=log_level, log_file=log_file)
        
        logger.info("="*50)
        logger.info("应用启动中...")
        logger.info(f"日志级别: {log_level}, 日志文件: {log_file}")
        logger.info(f"服务器配置: {config.server.host}:{config.server.port}")
        logger.info(f"机器人ID: {config.coze.get_config().bot_id}")
        logger.info(f"调试模式: {'启用' if config.server.debug else '禁用'}")
        logger.info("应用启动完成")
        logger.info("="*50)
        
        yield
        
    except Exception as e:
        logger.error(f"应用启动失败: {e}", exc_info=True)
        raise
    
    # 关闭时的清理
    logger.info("应用正在关闭...")
    logger.info("="*50)


# 创建FastAPI应用
app = FastAPI(
    title="医学手术复盘AI Agent",
    description="基于Coze API的医学手术复盘AI智能助手",
    version="1.0.0",
    lifespan=lifespan
)

# 添加请求日志中间件
app.add_middleware(RequestLoggerMiddleware)

# 获取配置
try:
    server_config = config_service.get_server_config()
    cors_origins = server_config.cors_origins
except Exception:
    # 如果配置加载失败，使用默认值
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:5500", "http://localhost:5500"]

# 添加localhost:8000到CORS源列表（用于前端开发）
cors_origins.extend(["http://localhost:8000", "http://127.0.0.1:8000"])
# 允许所有源访问
cors_origins.append("*")
# 添加对文件系统访问的支持
cors_origins.append("null")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,  # 当支持null origin和通配符origin时，需要设置为False
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],  # 暴露请求ID头部
)

# 注册路由
app.include_router(health.router)
app.include_router(chat.router)
app.include_router(videos.router, prefix="/api/videos", tags=["videos"])

# 创建视频目录（如果不存在）
videos_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "videos")
if not os.path.exists(videos_dir):
    os.makedirs(videos_dir, exist_ok=True)
    
# 添加静态文件服务
app.mount("/videos", StaticFiles(directory=videos_dir), name="videos")


@app.get("/")
async def root():
    """根路径"""
    return {
        "message": "医学手术复盘AI Agent API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn
    
    # 获取服务器配置
    try:
        server_config = config_service.get_server_config()
        host = server_config.host
        port = server_config.port
        debug = server_config.debug
    except Exception:
        # 如果配置加载失败，使用默认值
        host = "localhost"
        port = 8000
        debug = True
    
    log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "default": {
                "fmt": "%(asctime)s | %(levelname)s | %(name)s | %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "default": {
                "formatter": "default",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stderr",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO"},
            "uvicorn.error": {"handlers": ["default"], "level": "INFO"},
            "uvicorn.access": {"handlers": ["default"], "level": "INFO"},
        },
    }
    
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info" if not debug else "debug",
        log_config=log_config,
    ) 
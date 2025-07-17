"""
FastAPI主应用
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import os

from .api import chat, health, videos
from .services.config_service import config_service
from .utils.logger import setup_logger, get_logger


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期管理"""
    # 启动时的初始化
    logger = get_logger("app")
    
    try:
        # 设置日志
        setup_logger(level="INFO")
        
        # 加载配置
        config = config_service.load_config()
        logger.info("应用启动完成")
        logger.info(f"服务器配置: {config.server.host}:{config.server.port}")
        logger.info(f"机器人ID: {config.coze.bot_id}")
        
        yield
        
    except Exception as e:
        logger.error(f"应用启动失败: {e}")
        raise
    
    # 关闭时的清理
    logger.info("应用正在关闭...")


# 创建FastAPI应用
app = FastAPI(
    title="医学手术复盘AI Agent",
    description="基于Coze API的医学手术复盘AI智能助手",
    version="1.0.0",
    lifespan=lifespan
)

# 获取配置
try:
    server_config = config_service.get_server_config()
    cors_origins = server_config.cors_origins
except Exception:
    # 如果配置加载失败，使用默认值
    cors_origins = ["http://localhost:3000", "http://127.0.0.1:5500", "http://localhost:5500"]

# 添加localhost:8000到CORS源列表（用于前端开发）
cors_origins.extend(["http://localhost:8000", "http://127.0.0.1:8000"])
# 添加对文件系统访问的支持
cors_origins.append("null")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=False,  # 当支持null origin时，需要设置为False
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
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
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=debug,
        log_level="info"
    ) 
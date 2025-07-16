"""
健康检查API
"""

from datetime import datetime
from fastapi import APIRouter

from ..models.chat import HealthResponse
from ..utils.logger import get_logger

logger = get_logger("health_api")

router = APIRouter(prefix="/api", tags=["健康检查"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    健康检查接口
    
    Returns:
        HealthResponse: 健康状态信息
    """
    logger.info("健康检查请求")
    
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        timestamp=datetime.now().isoformat()
    ) 
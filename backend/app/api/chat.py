"""
聊天API
"""

import json
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response

from ..models.chat import ChatRequest, ChatResponse, ErrorResponse
from ..services.coze_service import coze_service
from ..services.config_service import config_service
from ..utils.logger import get_logger

logger = get_logger("chat_api")

router = APIRouter(prefix="/api/chat", tags=["聊天"])


@router.options("/stream")
async def options_stream():
    """处理流式聊天的OPTIONS预检请求"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.post("/stream")
async def stream_chat(request: ChatRequest):
    """
    流式聊天接口
    
    Args:
        request: 聊天请求
        
    Returns:
        StreamingResponse: 流式响应
    """
    logger.info(f"收到流式聊天请求 - 用户: {request.user_id}, 医生类型: {request.doctor_type}, 消息长度: {len(request.message)}")
    
    async def generate_stream():
        """生成流式响应"""
        try:
            logger.info("开始生成流式响应")
            
            # 发送初始化事件
            init_event = {
                "type": "init",
                "message": "连接成功",
                "done": False
            }
            yield f"data: {json.dumps(init_event, ensure_ascii=False)}\n\n"
            
            event_count = 0
            async for event in coze_service.chat_stream(request):
                event_count += 1
                # 转换为SSE格式
                event_data = event.dict()
                logger.debug(f"发送流式事件 #{event_count}: {event_data}")
                yield f"data: {json.dumps(event_data, ensure_ascii=False)}\n\n"
                
                # 如果是完成或错误事件，结束流
                if event.done:
                    logger.info(f"流式聊天结束，共发送 {event_count} 个事件")
                    break
                    
        except Exception as e:
            logger.error(f"流式聊天生成错误: {e}")
            error_event = {
                "type": "error",
                "error": str(e),
                "done": True
            }
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.post("/message", response_model=ChatResponse)
async def single_chat(request: ChatRequest):
    """
    单次聊天接口
    
    Args:
        request: 聊天请求
        
    Returns:
        ChatResponse: 聊天响应
    """
    logger.info(f"收到单次聊天请求 - 用户: {request.user_id}, 医生类型: {request.doctor_type}, 消息长度: {len(request.message)}")
    
    try:
        # 强制设置为非流式
        request.stream = False
        
        response = await coze_service.chat_single(request)
        
        if response.error:
            logger.error(f"聊天错误: {response.error}")
            raise HTTPException(status_code=500, detail=response.error)
        
        logger.info(f"单次聊天完成 - 对话: {response.conversation_id}")
        return response
        
    except Exception as e:
        logger.error(f"单次聊天接口错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bot-info")
async def get_bot_info(doctor_type: str = None) -> Dict[str, Any]:
    """
    获取机器人信息
    
    Args:
        doctor_type: 医生类型，如'wangzhiruo'或'chenguodong'
    
    Returns:
        机器人信息
    """
    logger.info(f"获取机器人信息请求 - 医生类型: {doctor_type}")
    
    try:
        bot_info = await coze_service.get_bot_info(doctor_type)
        return {
            "success": True,
            "data": bot_info
        }
        
    except Exception as e:
        logger.error(f"获取机器人信息错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/doctors")
async def get_doctors() -> Dict[str, Any]:
    """
    获取可用的医生配置列表
    
    Returns:
        医生配置列表
    """
    logger.info("获取可用医生配置列表请求")
    
    try:
        config = config_service.get_config()
        doctors = []
        
        # 处理王专家配置
        if hasattr(config.coze, "wangzhiruo") and config.coze.wangzhiruo:
            doctors.append({
                "id": "wangzhiruo",
                "name": "王专家",
                "specialty": "普外科",
                "description": config.coze.wangzhiruo.description or "普外科手术复盘AI"
            })
            
        # 处理陈专家配置
        if hasattr(config.coze, "chenguodong") and config.coze.chenguodong:
            doctors.append({
                "id": "chenguodong",
                "name": "陈专家",
                "specialty": "内科",
                "description": config.coze.chenguodong.description or "内科复杂病例复盘AI"
            })
            
        return {
            "success": True,
            "data": doctors
        }
        
    except Exception as e:
        logger.error(f"获取可用医生配置列表错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reload-config")
async def reload_config():
    """
    重新加载配置
    
    Returns:
        重载结果
    """
    logger.info("重新加载配置请求")
    
    try:
        # 重新加载配置服务
        config_service.reload_config()
        
        # 重新加载Coze客户端
        coze_service.reload_client()
        
        return {
            "success": True,
            "message": "配置重新加载成功"
        }
        
    except Exception as e:
        logger.error(f"重新加载配置错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))
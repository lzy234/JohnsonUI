"""
聊天API
"""

import json
import asyncio
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse, Response

from ..models.chat import ChatRequest, ChatResponse, ErrorResponse
from ..services.coze_service import coze_service
from ..services.config_service import config_service
from ..utils.logger import get_logger, set_request_id, StreamLogger

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
async def stream_chat(request: ChatRequest, req: Request = None):
    """
    流式聊天接口
    
    Args:
        request: 聊天请求
        req: FastAPI请求对象
        
    Returns:
        StreamingResponse: 流式响应
    """
    # 生成并设置请求ID
    request_id = set_request_id(f"stream_{request.user_id}_{int(asyncio.get_event_loop().time())}")
    
    # 创建流日志记录器
    stream_logger = StreamLogger("chat_stream")
    
    logger.info(f"[{request_id}] 收到流式聊天请求 - 用户: {request.user_id}, 医生类型: {request.doctor_type}, 消息长度: {len(request.message)}")
    
    # 记录请求来源信息
    if req:
        client_host = req.client.host if req.client else "unknown"
        user_agent = req.headers.get("user-agent", "unknown")
        logger.debug(f"[{request_id}] 客户端信息 - IP: {client_host}, UA: {user_agent}")
    
    # 确保请求设为流式
    request.stream = True
    
    async def generate_stream():
        """生成流式响应"""
        
        # TODO: 发送建议问题到前端
        try:
            logger.info(f"[{request_id}] 开始生成流式响应")
            
            # 发送初始化事件，确保连接立即建立
            init_event = {
                "type": "init",
                "message": "连接成功",
                "done": False,
                "request_id": request_id
            }
            stream_logger.log_event("init", metadata=init_event)
            yield f"data: {json.dumps(init_event, ensure_ascii=False)}\n\n"
            
            # 计数器和时间记录器
            event_count = 0
            start_time = asyncio.get_event_loop().time()
            last_event_time = start_time
            
            # 通过异步迭代器获取服务层生成的流式事件
            async for event in coze_service.chat_stream(request):
                event_count += 1
                current_time = asyncio.get_event_loop().time()
                time_since_last = current_time - last_event_time
                
                # 转换为SSE格式
                event_data = event.dict()
                # 添加请求ID用于追踪
                event_data["request_id"] = request_id
                
                # 记录事件信息，根据类型记录详细程度
                if event.type == "message":
                    stream_logger.log_event("message", content=event_data.get("content", ""))
                    logger.debug(f"[{request_id}] 发送流式消息事件 #{event_count}, 间隔: {time_since_last:.3f}秒")
                elif event.type == "follow_up":
                    stream_logger.log_event("follow_up", metadata=event_data)
                    logger.info(f"[{request_id}] 发送建议问题事件 #{event_count}, 问题数量: {len(event.follow_up_questions) if event.follow_up_questions else 0}")
                else:
                    stream_logger.log_event(event.type, metadata=event_data)
                    logger.info(f"[{request_id}] 发送流式{event.type}事件 #{event_count}")
                
                # 确保每个事件都以正确的格式输出，包含双换行符作为分隔
                sse_message = f"data: {json.dumps(event_data, ensure_ascii=False)}\n\n"
                yield sse_message
                
                # 更新最后事件时间
                last_event_time = current_time
                
                # 如果是完成或错误事件，结束流
                if event.done:
                    elapsed = current_time - start_time
                    stream_logger.log_summary("完成")
                    logger.info(f"[{request_id}] 流式聊天结束，共发送 {event_count} 个事件，总耗时: {elapsed:.2f}秒")
                    break
                
                # 如果事件间隔过长，发送心跳保持连接
                if time_since_last > 10:  # 10秒没有消息时发送心跳
                    heartbeat = f": heartbeat {int(current_time)}\n\n"
                    logger.debug(f"[{request_id}] 发送心跳，距上次事件: {time_since_last:.1f}秒")
                    yield heartbeat
            
            # 确保总是发送一个最终心跳
            yield f": end-of-stream {int(asyncio.get_event_loop().time())}\n\n"
                    
        except Exception as e:
            logger.error(f"[{request_id}] 流式聊天生成错误: {e}", exc_info=True)
            stream_logger.log_summary("失败", str(e))
            
            error_event = {
                "type": "error",
                "error": str(e),
                "done": True,
                "request_id": request_id
            }
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"
    
    
    # 返回流式响应，设置合适的响应头
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
            "Transfer-Encoding": "chunked",  # 使用分块编码
            "Content-Type": "text/event-stream; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Request-ID": request_id  # 添加请求ID用于追踪
        }
    )


@router.options("/stream-without-references")
async def options_stream_without_references():
    """处理无引用流式聊天的OPTIONS预检请求"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.post("/stream-without-references")
async def stream_chat_without_references(request: ChatRequest, req: Request = None):
    """
    流式聊天接口(不包含引用文献)
    
    Args:
        request: 聊天请求
        req: FastAPI请求对象
        
    Returns:
        StreamingResponse: 流式响应，不包含引用文献部分
    """
    # 生成并设置请求ID
    request_id = set_request_id(f"stream_noref_{request.user_id}_{int(asyncio.get_event_loop().time())}")
    
    # 创建流日志记录器
    stream_logger = StreamLogger("chat_stream_noref")
    
    logger.info(f"[{request_id}] 收到无引用流式聊天请求 - 用户: {request.user_id}, 医生类型: {request.doctor_type}, 消息长度: {len(request.message)}")
    
    # 处理表单数据，如果存在则拼接到消息前面
    original_message = request.message
    if request.form_data:
        try:
            # 将表单数据转换为格式化的JSON字符串
            form_str = json.dumps(request.form_data, ensure_ascii=False, indent=2)
            # 拼接到消息前面
            request.message = f"表单数据:\n{form_str}\n\n用户问题:\n{request.message}"
            logger.info(f"[{request_id}] 拼接表单数据到消息，原始长度: {len(original_message)}，新长度: {len(request.message)}")
        except Exception as e:
            logger.error(f"[{request_id}] 处理表单数据失败: {e}", exc_info=True)
            # 如果处理失败，恢复原始消息
            request.message = original_message
    
    # 记录请求来源信息
    if req:
        client_host = req.client.host if req.client else "unknown"
        user_agent = req.headers.get("user-agent", "unknown")
        logger.debug(f"[{request_id}] 客户端信息 - IP: {client_host}, UA: {user_agent}")
    
    # 确保请求设为流式
    request.stream = True
    
    async def generate_stream():
        """生成流式响应"""
        
        try:
            logger.info(f"[{request_id}] 开始生成无引用流式响应")
            
            # 发送初始化事件，确保连接立即建立
            init_event = {
                "type": "init",
                "message": "连接成功",
                "done": False,
                "request_id": request_id
            }
            stream_logger.log_event("init", metadata=init_event)
            yield f"data: {json.dumps(init_event, ensure_ascii=False)}\n\n"
            
            # 计数器和时间记录器
            event_count = 0
            start_time = asyncio.get_event_loop().time()
            last_event_time = start_time
            
            # 使用无引用的流式聊天服务
            async for event in coze_service.chat_stream_without_references(request):
                event_count += 1
                current_time = asyncio.get_event_loop().time()
                time_since_last = current_time - last_event_time
                
                # 转换为SSE格式
                event_data = event.dict()
                # 添加请求ID用于追踪
                event_data["request_id"] = request_id
                
                # 记录事件信息，根据类型记录详细程度
                if event.type == "message":
                    stream_logger.log_event("message", content=event_data.get("content", ""))
                    logger.debug(f"[{request_id}] 发送流式消息事件 #{event_count}, 间隔: {time_since_last:.3f}秒")
                elif event.type == "follow_up":
                    stream_logger.log_event("follow_up", metadata=event_data)
                    logger.info(f"[{request_id}] 发送建议问题事件 #{event_count}, 问题数量: {len(event.follow_up_questions) if event.follow_up_questions else 0}")
                else:
                    stream_logger.log_event(event.type, metadata=event_data)
                    logger.info(f"[{request_id}] 发送流式{event.type}事件 #{event_count}")
                
                # 确保每个事件都以正确的格式输出，包含双换行符作为分隔
                sse_message = f"data: {json.dumps(event_data, ensure_ascii=False)}\n\n"
                yield sse_message
                
                # 更新最后事件时间
                last_event_time = current_time
                
                # 如果是完成或错误事件，结束流
                if event.done:
                    elapsed = current_time - start_time
                    stream_logger.log_summary("完成")
                    logger.info(f"[{request_id}] 无引用流式聊天结束，共发送 {event_count} 个事件，总耗时: {elapsed:.2f}秒")
                    break
                
                # 如果事件间隔过长，发送心跳保持连接
                if time_since_last > 10:  # 10秒没有消息时发送心跳
                    heartbeat = f": heartbeat {int(current_time)}\n\n"
                    logger.debug(f"[{request_id}] 发送心跳，距上次事件: {time_since_last:.1f}秒")
                    yield heartbeat
            
            # 确保总是发送一个最终心跳
            yield f": end-of-stream {int(asyncio.get_event_loop().time())}\n\n"
                    
        except Exception as e:
            logger.error(f"[{request_id}] 无引用流式聊天生成错误: {e}", exc_info=True)
            stream_logger.log_summary("失败", str(e))
            
            error_event = {
                "type": "error",
                "error": str(e),
                "done": True,
                "request_id": request_id
            }
            yield f"data: {json.dumps(error_event, ensure_ascii=False)}\n\n"
    
    
    # 返回流式响应，设置合适的响应头
    return StreamingResponse(
        generate_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # 禁用Nginx缓冲
            "Transfer-Encoding": "chunked",  # 使用分块编码
            "Content-Type": "text/event-stream; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "*",
            "X-Request-ID": request_id  # 添加请求ID用于追踪
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


@router.options("/message-without-references")
async def options_message_without_references():
    """处理无引用单次聊天的OPTIONS预检请求"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.post("/message-without-references", response_model=ChatResponse)
async def single_chat_without_references(request: ChatRequest):
    """
    单次聊天接口(不包含引用文献)
    
    Args:
        request: 聊天请求
        
    Returns:
        ChatResponse: 聊天响应，不包含引用文献部分
    """
    logger.info(f"收到无引用单次聊天请求 - 用户: {request.user_id}, 医生类型: {request.doctor_type}, 消息长度: {len(request.message)}")
    
    # 处理表单数据，如果存在则拼接到消息前面
    original_message = request.message
    if request.form_data:
        try:
            # 将表单数据转换为格式化的JSON字符串
            form_str = json.dumps(request.form_data, ensure_ascii=False, indent=2)
            # 拼接到消息前面
            request.message = f"表单数据:\n{form_str}\n\n用户问题:\n{request.message}"
            logger.info(f"拼接表单数据到消息，原始长度: {len(original_message)}，新长度: {len(request.message)}")
        except Exception as e:
            logger.error(f"处理表单数据失败: {e}", exc_info=True)
            # 如果处理失败，恢复原始消息
            request.message = original_message
    
    try:
        # 强制设置为非流式
        request.stream = False
        
        response = await coze_service.chat_single_without_references(request)
        
        if response.error:
            logger.error(f"聊天错误: {response.error}")
            raise HTTPException(status_code=500, detail=response.error)
        
        logger.info(f"无引用单次聊天完成 - 对话: {response.conversation_id}")
        return response
        
    except Exception as e:
        logger.error(f"无引用单次聊天接口错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.options("/references/{conversation_id}")
async def options_references():
    """处理获取引用文献的OPTIONS预检请求"""
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "*",
        }
    )


@router.get("/references/{conversation_id}")
async def get_references(conversation_id: str):
    """
    获取特定对话的引用文献
    
    Args:
        conversation_id: 对话ID
        
    Returns:
        Dict: 包含引用文献的字典
    """
    logger.info(f"获取引用文献请求 - 对话ID: {conversation_id}")
    
    try:
        result = await coze_service.get_references(conversation_id)
        return result
    except Exception as e:
        logger.error(f"获取引用文献错误: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bot-info")
async def get_bot_info(doctor_type: str = None) -> Dict[str, Any]:
    """
    获取机器人信息
    
    Args:
        doctor_type: 医生类型，如'wang'或'chen'
    
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
        if hasattr(config.coze, "wang") and config.coze.wang:
            doctors.append({
                "id": "wang",
                "name": "王专家",
                "specialty": "普外科",
                "description": config.coze.wang.description or "普外科手术复盘AI"
            })
            
        # 处理陈专家配置
        if hasattr(config.coze, "chen") and config.coze.chen:
            doctors.append({
                "id": "chen",
                "name": "陈专家",
                "specialty": "内科",
                "description": config.coze.chen.description or "内科复杂病例复盘AI"
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
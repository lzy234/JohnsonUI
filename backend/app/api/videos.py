from fastapi import APIRouter, HTTPException
import os
import json
from typing import List, Dict, Any

router = APIRouter()

# 读取视频配置文件
def get_videos_config():
    try:
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                  "config", "videos_config.json")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"无法读取视频配置: {str(e)}")

# 读取建议问题配置文件
def get_suggested_questions_config():
    try:
        config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                                  "config", "suggested_questions_config.json")
        
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"无法读取建议问题配置: {str(e)}")

@router.get("/preset", response_model=List[Dict[str, Any]])
async def get_preset_videos():
    """
    获取所有预设视频信息
    """
    try:
        config = get_videos_config()
        return config.get("preset_videos", [])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取预设视频失败: {str(e)}")

@router.get("/{video_id}")
async def get_video_by_id(video_id: str):
    """
    根据ID获取特定视频信息
    """
    try:
        config = get_videos_config()
        for video in config.get("preset_videos", []):
            if video.get("id") == video_id:
                return video
        raise HTTPException(status_code=404, detail=f"未找到ID为 {video_id} 的视频")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取视频信息失败: {str(e)}")

@router.get("/stream/{video_id}")
async def get_video_stream_url(video_id: str):
    """
    获取视频流URL
    """
    try:
        video = await get_video_by_id(video_id)
        return {"url": video.get("url")}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取视频流URL失败: {str(e)}")

@router.get("/suggested-questions")
async def get_suggested_questions(doctor_type: str = None):
    """
    获取建议问题列表
    
    Args:
        doctor_type: 医生类型，如'wang'或'chen'
    
    Returns:
        建议问题列表
    """
    try:
        config = get_suggested_questions_config()
        
        if not doctor_type:
            # 没有指定医生类型，返回默认问题
            return {"questions": config.get("defaultQuestions", [])}
        
        # 获取特定医生类型的问题，如果没有则返回默认问题
        doctor_questions = config.get("questionsByDoctor", {}).get(doctor_type)
        if doctor_questions:
            return {"questions": doctor_questions}
        else:
            return {"questions": config.get("defaultQuestions", [])}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"获取建议问题失败: {str(e)}") 
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
#!/usr/bin/env python
"""
下载示例视频文件到后端目录
"""

import os
import json
import requests
import sys
import time

# 示例视频URL
SAMPLE_VIDEOS = {
    "video_001": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    "video_002": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    "video_003": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
}

# 构建视频目录路径
def get_videos_dir():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.dirname(current_dir)
    videos_dir = os.path.join(backend_dir, "videos")
    
    # 创建videos目录（如果不存在）
    if not os.path.exists(videos_dir):
        os.makedirs(videos_dir, exist_ok=True)
    
    return videos_dir

# 下载视频文件
def download_video(video_id, url, videos_dir):
    video_path = os.path.join(videos_dir, f"{video_id}.mp4")
    
    # 如果文件已存在，检查大小
    if os.path.exists(video_path):
        size_mb = os.path.getsize(video_path) / (1024 * 1024)
        print(f"视频 {video_id} 已存在 ({size_mb:.2f} MB)")
        return video_path
    
    print(f"开始下载 {video_id} 从 {url}")
    
    # 重试次数
    max_retries = 3
    retry_count = 0
    
    while retry_count < max_retries:
        try:
            # 使用流式下载以处理大文件，设置较长的超时时间
            with requests.get(url, stream=True, timeout=30) as r:
                r.raise_for_status()
                total_size = int(r.headers.get('content-length', 0))
                downloaded = 0
                
                with open(video_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            downloaded += len(chunk)
                            
                            # 显示下载进度
                            progress = downloaded / total_size * 100
                            sys.stdout.write(f"\r下载进度: {progress:.2f}% ({downloaded/(1024*1024):.2f} MB / {total_size/(1024*1024):.2f} MB)")
                            sys.stdout.flush()
                
                print(f"\n{video_id} 下载完成")
                return video_path
                
        except Exception as e:
            retry_count += 1
            print(f"\n下载 {video_id} 失败 (尝试 {retry_count}/{max_retries}): {e}")
            if retry_count < max_retries:
                print(f"等待 5 秒后重试...")
                time.sleep(5)
            else:
                print(f"达到最大重试次数，跳过该视频")
                if os.path.exists(video_path):
                    os.remove(video_path)
                return None

# 更新配置文件
def update_config(downloaded_videos):
    config_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "config")
    if not os.path.exists(config_dir):
        os.makedirs(config_dir, exist_ok=True)
    
    config_path = os.path.join(config_dir, "videos_config.json")
    
    try:
        # 读取现有配置或创建新配置
        if os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
        else:
            config = {"preset_videos": []}
        
        # 确保preset_videos字段存在
        if "preset_videos" not in config:
            config["preset_videos"] = []
        
        # 更新本地路径
        for video_id, video_path in downloaded_videos.items():
            # 查找是否已存在该视频配置
            video_found = False
            for video in config["preset_videos"]:
                if video.get("id") == video_id:
                    video["local_path"] = f"videos/{video_id}.mp4"
                    video_found = True
                    break
            
            # 如果不存在，则添加新配置
            if not video_found:
                config["preset_videos"].append({
                    "id": video_id,
                    "title": f"示例视频 {video_id}",
                    "local_path": f"videos/{video_id}.mp4"
                })
        
        # 保存更新后的配置
        with open(config_path, 'w', encoding='utf-8') as f:
            json.dump(config, f, ensure_ascii=False, indent=2)
            
        print("配置文件更新完成")
    except Exception as e:
        print(f"更新配置文件失败: {e}")

def main():
    videos_dir = get_videos_dir()
    print(f"视频将保存到: {videos_dir}")
    
    downloaded_videos = {}
    
    for video_id, url in SAMPLE_VIDEOS.items():
        video_path = download_video(video_id, url, videos_dir)
        if video_path:
            downloaded_videos[video_id] = video_path
    
    if downloaded_videos:
        update_config(downloaded_videos)
        print("所有视频下载完成")
    else:
        print("没有视频被下载")

if __name__ == "__main__":
    main() 
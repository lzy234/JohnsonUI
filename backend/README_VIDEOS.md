# 手术视频播放系统使用说明

## 概述

本系统提供了一个打桩视频播放功能，允许前端播放后台预设的视频文件。系统主要包含以下部分：

1. 视频配置文件：`config/videos_config.json`
2. 视频静态文件服务：通过FastAPI提供
3. 视频API：用于前端获取视频信息
4. 下载脚本：用于获取示例视频

## 设置步骤

### 1. 安装依赖

确保已安装所有必要的依赖：

```bash
pip install -r requirements.txt
```

### 2. 下载示例视频

执行下载脚本获取示例视频：

```bash
cd backend
python scripts/download_sample_videos.py
```

此脚本会：
- 创建 `videos` 目录（如果不存在）
- 下载示例视频到该目录
- 更新 `config/videos_config.json` 中的本地路径

### 3. 启动后端服务

```bash
cd backend
python start_server.py
```

## 系统结构

### 视频配置

视频配置文件位于 `config/videos_config.json`，包含预设视频的元数据：

```json
{
  "preset_videos": [
    {
      "id": "video_001",
      "name": "左肝切除术_07-06",
      "description": "肝脏手术示范视频",
      "duration": "01:28:49",
      "size": "204 MB",
      "upload_time": "2025-07-06T10:32:00",
      "url": "https://example.com/videos/liver_surgery_01.mp4",
      "local_path": "videos/video_001.mp4"
    },
    ...
  ]
}
```

### API接口

系统提供以下API接口：

1. **获取所有预设视频**
   - 端点：`GET /api/videos/preset`
   - 返回：所有预设视频的数组

2. **获取特定视频信息**
   - 端点：`GET /api/videos/{video_id}`
   - 返回：指定ID的视频信息

3. **获取视频流URL**
   - 端点：`GET /api/videos/stream/{video_id}`
   - 返回：视频流URL

### 前端集成

前端通过以下方式与后端交互：

1. 上传页面显示预设视频列表
2. 用户选择一个视频并提交表单
3. AI页面加载并播放选中的预设视频

## 添加自定义视频

要添加自定义视频，请：

1. 将视频文件放入 `backend/videos` 目录
2. 在 `config/videos_config.json` 中添加视频信息，确保：
   - 提供唯一的 `id`
   - 设置正确的 `local_path`（格式为 `videos/文件名.mp4`）

## 故障排除

如果视频无法播放：

1. 确认后端服务正在运行
2. 检查视频文件是否存在于 `backend/videos` 目录
3. 验证 `config/videos_config.json` 中的路径是否正确
4. 检查浏览器控制台是否有错误消息

对于生产环境，建议：
- 使用更可靠的存储解决方案（如CDN或云存储）
- 优化视频格式和比特率以提高加载速度
- 实现视频流媒体服务器以支持更高效的视频传输 
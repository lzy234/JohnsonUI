from flask import Flask, Response, send_from_directory, jsonify
import os
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log')
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

VIDEO_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos")

# 确保视频文件夹存在
os.makedirs(VIDEO_FOLDER, exist_ok=True)
logger.info(f"视频目录路径: {VIDEO_FOLDER}")
logger.info(f"视频文件列表: {os.listdir(VIDEO_FOLDER) if os.path.exists(VIDEO_FOLDER) else '目录不存在'}")

@app.route('/health')
def health():
    """健康检查端点"""
    videos = []
    try:
        if os.path.exists(VIDEO_FOLDER):
            videos = [f for f in os.listdir(VIDEO_FOLDER) if os.path.isfile(os.path.join(VIDEO_FOLDER, f))]
        return jsonify({
            "status": "ok",
            "videos_count": len(videos),
            "videos": videos
        })
    except Exception as e:
        logger.error(f"健康检查失败: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/')
def index():
    """返回简单的HTML页面，显示可用视频列表"""
    logger.info("访问主页")
    try:
        videos = [f for f in os.listdir(VIDEO_FOLDER) if os.path.isfile(os.path.join(VIDEO_FOLDER, f))]
        logger.info(f"找到 {len(videos)} 个视频文件")
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>视频服务器</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                h1 { color: #333; }
                ul { list-style-type: none; padding: 0; }
                li { margin: 10px 0; padding: 10px; background-color: #f5f5f5; border-radius: 4px; }
                a { color: #0066cc; text-decoration: none; display: block; }
                a:hover { text-decoration: underline; }
            </style>
        </head>
        <body>
            <h1>可用视频</h1>
            <ul>
        """
        
        for video in videos:
            html += f'<li><a href="/video/{video}">{video}</a></li>'
        
        html += """
            </ul>
        </body>
        </html>
        """
        return html
    except Exception as e:
        logger.error(f"主页渲染失败: {str(e)}")
        return f"发生错误: {str(e)}", 500

@app.route('/video/<filename>')
def video_page(filename):
    """返回包含视频播放器的HTML页面"""
    logger.info(f"请求视频页面: {filename}")
    try:
        video_path = os.path.join(VIDEO_FOLDER, filename)
        if not os.path.exists(video_path):
            logger.warning(f"视频文件不存在: {filename}")
            return "视频不存在", 404
            
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>{filename}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }}
                h1 {{ color: #333; }}
                video {{ width: 100%; }}
                .back {{ margin-bottom: 20px; }}
                a {{ color: #0066cc; text-decoration: none; }}
                a:hover {{ text-decoration: underline; }}
            </style>
        </head>
        <body>
            <div class="back"><a href="/">&larr; 返回视频列表</a></div>
            <h1>{filename}</h1>
            <video controls>
                <source src="/stream/{filename}" type="video/mp4">
                您的浏览器不支持视频标签。
            </video>
        </body>
        </html>
        """
    except Exception as e:
        logger.error(f"视频页面渲染失败: {filename}, 错误: {str(e)}")
        return f"发生错误: {str(e)}", 500

@app.route('/stream/<filename>')
def stream_video(filename):
    """流式传输视频文件"""
    logger.info(f"请求流式传输: {filename}")
    try:
        video_path = os.path.join(VIDEO_FOLDER, filename)
        if not os.path.exists(video_path):
            logger.warning(f"视频流不存在: {filename}")
            return "视频不存在", 404
        
        logger.info(f"开始流式传输视频: {filename}")
        return send_from_directory(VIDEO_FOLDER, filename)
    except Exception as e:
        logger.error(f"视频流传输失败: {filename}, 错误: {str(e)}")
        return f"发生错误: {str(e)}", 500

if __name__ == '__main__':
    logger.info("启动视频服务器...")
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True) 
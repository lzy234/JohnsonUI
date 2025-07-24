from flask import Flask, Response, send_from_directory
import os

app = Flask(__name__)

VIDEO_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "videos")

# 确保视频文件夹存在
os.makedirs(VIDEO_FOLDER, exist_ok=True)

@app.route('/')
def index():
    """返回简单的HTML页面，显示可用视频列表"""
    videos = [f for f in os.listdir(VIDEO_FOLDER) if os.path.isfile(os.path.join(VIDEO_FOLDER, f))]
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>视频服务器</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            ul { list-style-type: none; padding: 0; }
            li { margin: 10px 0; }
            a { color: #0066cc; text-decoration: none; }
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

@app.route('/video/<filename>')
def video_page(filename):
    """返回包含视频播放器的HTML页面"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{filename}</title>
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

@app.route('/stream/<filename>')
def stream_video(filename):
    """流式传输视频文件"""
    video_path = os.path.join(VIDEO_FOLDER, filename)
    if not os.path.exists(video_path):
        return "视频不存在", 404
    
    return send_from_directory(VIDEO_FOLDER, filename)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 
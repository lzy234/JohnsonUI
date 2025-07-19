FROM python:3.9-slim

WORKDIR /app

# 安装依赖
COPY requirements.txt .
# 使用国内镜像源安装依赖
RUN pip install --no-cache-dir -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple

# 复制应用代码
COPY . .

# 下载示例视频
RUN python scripts/download_sample_videos.py || echo "视频下载失败，但将继续部署"

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["python", "start_server.py"] 
#!/bin/bash
#
# JohnsonUI 后端服务 Docker 部署一键启动脚本
# 适用于 Linux 系统
#

set -e

# 显示横幅
echo "=================================================="
echo "  JohnsonUI 后端服务 Docker 部署脚本"
echo "  适用于 Linux 系统"
echo "=================================================="

# 检查 Docker 是否已安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    echo "可参考官方文档: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "✅ 检测到 Docker 已安装"

# 确保当前目录是后端目录
if [ ! -f "start_server.py" ] || [ ! -f "Dockerfile" ]; then
    echo "❌ 当前目录不是后端目录，请在 backend 目录下运行此脚本"
    exit 1
fi

# 构建 Docker 镜像
echo "🔨 正在构建 Docker 镜像..."
docker build -t johnsonui-backend:latest .

# 检查是否有旧容器在运行
if docker ps -a --filter "name=johnsonui-backend" --format "{{.ID}}" | grep -q .; then
    echo "🔄 检测到旧容器，正在停止并删除..."
    docker stop johnsonui-backend 2>/dev/null || true
    docker rm johnsonui-backend 2>/dev/null || true
fi

# 确保视频和配置目录存在
mkdir -p ./videos
mkdir -p ./config

# 启动 Docker 容器
echo "🚀 正在启动后端服务容器..."
docker run -d \
    --name johnsonui-backend \
    -p 8000:8000 \
    -v "$(pwd)/videos:/app/videos" \
    -v "$(pwd)/config:/app/config" \
    -e PYTHONUNBUFFERED=1 \
    --restart always \
    johnsonui-backend:latest

# 检查容器是否成功启动
if docker ps --filter "name=johnsonui-backend" --format "{{.ID}}" | grep -q .; then
    echo "✅ 后端服务容器已成功启动"
    
    # 获取主机 IP
    HOST_IP=$(hostname -I | awk '{print $1}')
    
    echo ""
    echo "📋 服务信息:"
    echo "--------------------------------------------"
    echo "🔗 API 文档: http://$HOST_IP:8000/docs"
    echo "🏥 健康检查: http://$HOST_IP:8000/api/health"
    echo "💬 聊天 API: http://$HOST_IP:8000/api/chat/stream"
    echo ""
    echo "📊 查看日志: docker logs -f johnsonui-backend"
    echo "🛑 停止服务: docker stop johnsonui-backend"
    echo "▶️ 重启服务: docker restart johnsonui-backend"
    echo "--------------------------------------------"
else
    echo "❌ 容器启动失败，请检查日志:"
    echo "docker logs johnsonui-backend"
fi 
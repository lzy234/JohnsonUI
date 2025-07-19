#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 设置变量
NETWORK_NAME="johnsonui-network"
BACKEND_IMAGE="johnsonui-backend:latest"
FRONTEND_IMAGE="johnsonui-frontend:latest"
BACKEND_CONTAINER="johnsonui-backend"
FRONTEND_CONTAINER="johnsonui-frontend"

echo -e "${GREEN}===== JohnsonUI Docker 部署脚本 (无Docker Compose) =====${NC}"

# 检查Docker是否安装
echo -e "${BLUE}正在检查Docker环境...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${YELLOW}未安装Docker，请先安装Docker${NC}"; exit 1; }

# 检查Docker服务是否运行
docker info >/dev/null 2>&1 || { echo -e "${YELLOW}Docker服务未运行，请先启动Docker服务${NC}"; exit 1; }

# 创建自定义网络（如果不存在）
echo -e "${BLUE}正在创建Docker网络...${NC}"
docker network inspect $NETWORK_NAME >/dev/null 2>&1 || docker network create --driver bridge $NETWORK_NAME

# 停止并移除旧容器（如果存在）
echo -e "${BLUE}正在清理旧容器...${NC}"
docker stop $BACKEND_CONTAINER >/dev/null 2>&1 || true
docker stop $FRONTEND_CONTAINER >/dev/null 2>&1 || true
docker rm $BACKEND_CONTAINER >/dev/null 2>&1 || true
docker rm $FRONTEND_CONTAINER >/dev/null 2>&1 || true

# 构建后端镜像
echo -e "${BLUE}正在构建后端镜像...${NC}"
docker build -t $BACKEND_IMAGE ./backend

# 构建前端镜像
echo -e "${BLUE}正在构建前端镜像...${NC}"
docker build -t $FRONTEND_IMAGE -f Dockerfile.frontend .

# 启动后端容器
echo -e "${BLUE}正在启动后端容器...${NC}"
docker run -d \
  --name $BACKEND_CONTAINER \
  --network $NETWORK_NAME \
  -v "$(pwd)/backend/videos:/app/videos" \
  -v "$(pwd)/backend/config:/app/config" \
  -e PYTHONUNBUFFERED=1 \
  --restart always \
  $BACKEND_IMAGE

# 启动前端容器
echo -e "${BLUE}正在启动前端容器...${NC}"
docker run -d \
  --name $FRONTEND_CONTAINER \
  --network $NETWORK_NAME \
  -p 80:80 \
  --restart always \
  $FRONTEND_IMAGE

# 检查容器是否正常启动
echo -e "${BLUE}正在检查容器状态...${NC}"
if docker ps | grep -q $BACKEND_CONTAINER && docker ps | grep -q $FRONTEND_CONTAINER; then
    echo -e "${GREEN}JohnsonUI 服务已成功启动！${NC}"
    echo -e "${GREEN}前端地址: http://localhost${NC}"
    
    # 显示容器状态
    echo -e "${BLUE}容器状态:${NC}"
    docker ps --filter "name=johnsonui"
else
    echo -e "${YELLOW}服务启动失败，请检查日志${NC}"
    docker logs $BACKEND_CONTAINER
    docker logs $FRONTEND_CONTAINER
    exit 1
fi

echo -e "${GREEN}部署完成！使用以下命令管理服务:${NC}"
echo -e "  查看后端日志: ${BLUE}docker logs -f $BACKEND_CONTAINER${NC}"
echo -e "  查看前端日志: ${BLUE}docker logs -f $FRONTEND_CONTAINER${NC}"
echo -e "  重启服务: ${BLUE}docker restart $BACKEND_CONTAINER $FRONTEND_CONTAINER${NC}"
echo -e "  停止服务: ${BLUE}docker stop $BACKEND_CONTAINER $FRONTEND_CONTAINER${NC}" 
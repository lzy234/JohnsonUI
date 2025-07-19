#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 设置变量
NETWORK_NAME="johnsonui-network"
BACKEND_CONTAINER="johnsonui-backend"
FRONTEND_CONTAINER="johnsonui-frontend"

echo -e "${BLUE}===== JohnsonUI Docker 清理脚本 =====${NC}"

# 停止并删除容器
echo -e "${BLUE}正在停止和删除容器...${NC}"
docker stop $BACKEND_CONTAINER >/dev/null 2>&1 && echo -e "${GREEN}已停止后端容器${NC}" || echo -e "${YELLOW}后端容器不存在或已停止${NC}"
docker stop $FRONTEND_CONTAINER >/dev/null 2>&1 && echo -e "${GREEN}已停止前端容器${NC}" || echo -e "${YELLOW}前端容器不存在或已停止${NC}"

docker rm $BACKEND_CONTAINER >/dev/null 2>&1 && echo -e "${GREEN}已删除后端容器${NC}" || echo -e "${YELLOW}后端容器不存在或已删除${NC}"
docker rm $FRONTEND_CONTAINER >/dev/null 2>&1 && echo -e "${GREEN}已删除前端容器${NC}" || echo -e "${YELLOW}前端容器不存在或已删除${NC}"

# 询问是否删除镜像
read -p "是否删除Docker镜像? (y/n): " DELETE_IMAGES
if [[ $DELETE_IMAGES =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}正在删除Docker镜像...${NC}"
    docker rmi johnsonui-backend:latest >/dev/null 2>&1 && echo -e "${GREEN}已删除后端镜像${NC}" || echo -e "${YELLOW}后端镜像不存在或已删除${NC}"
    docker rmi johnsonui-frontend:latest >/dev/null 2>&1 && echo -e "${GREEN}已删除前端镜像${NC}" || echo -e "${YELLOW}前端镜像不存在或已删除${NC}"
fi

# 询问是否删除网络
read -p "是否删除Docker网络? (y/n): " DELETE_NETWORK
if [[ $DELETE_NETWORK =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}正在删除Docker网络...${NC}"
    docker network rm $NETWORK_NAME >/dev/null 2>&1 && echo -e "${GREEN}已删除网络${NC}" || echo -e "${YELLOW}网络不存在或已删除${NC}"
fi

echo -e "${GREEN}清理完成！${NC}" 
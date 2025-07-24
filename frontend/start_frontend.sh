#!/bin/bash
#
# 医学手术复盘AI Agent - 前端Docker一键启动脚本
# 适用于Linux系统
#

# 颜色变量
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # 重置颜色

# 设置容器名称和镜像名称
CONTAINER_NAME="johnsonui-frontend"
IMAGE_NAME="johnsonui-frontend:latest"
HOST_PORT=3000

# 显示欢迎消息
echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}   医学手术复盘AI Agent - 前端部署脚本   ${NC}"
echo -e "${GREEN}===========================================${NC}"
echo ""

# 检查Docker是否已安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误：Docker未安装！${NC}"
    echo "请先安装Docker，然后再运行此脚本。"
    echo "可以通过以下命令安装Docker："
    echo -e "${YELLOW}curl -fsSL https://get.docker.com | sh${NC}"
    exit 1
fi

# 检查Docker是否在运行
if ! docker info &> /dev/null; then
    echo -e "${RED}错误：Docker未运行！${NC}"
    echo "请启动Docker服务后再运行此脚本。"
    echo "可以通过以下命令启动Docker："
    echo -e "${YELLOW}sudo systemctl start docker${NC}"
    exit 1
fi

echo "检查Docker状态...正常"

# 检查是否存在旧的容器并停止和删除
if docker ps -a | grep -q ${CONTAINER_NAME}; then
    echo -e "${YELLOW}发现已存在的容器，正在停止并删除...${NC}"
    docker stop ${CONTAINER_NAME} &> /dev/null
    docker rm ${CONTAINER_NAME} &> /dev/null
fi

echo "构建Docker镜像..."
cd "$(dirname "$0")" # 进入脚本所在目录
docker build -t ${IMAGE_NAME} . || {
    echo -e "${RED}错误：构建Docker镜像失败！${NC}"
    exit 1
}

echo -e "${GREEN}镜像构建成功！${NC}"

# 启动容器
echo "启动前端容器..."
docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${HOST_PORT}:80 \
    --restart unless-stopped \
    ${IMAGE_NAME} || {
    echo -e "${RED}错误：启动容器失败！${NC}"
    exit 1
}

echo -e "${GREEN}===========================================${NC}"
echo -e "${GREEN}✅ 前端服务已成功启动！${NC}"
echo -e "${YELLOW}访问地址：http://localhost:${HOST_PORT}${NC}"
echo ""
echo "容器管理命令："
echo -e "${YELLOW}查看日志：${NC}docker logs ${CONTAINER_NAME}"
echo -e "${YELLOW}停止服务：${NC}docker stop ${CONTAINER_NAME}"
echo -e "${YELLOW}重启服务：${NC}docker restart ${CONTAINER_NAME}"
echo -e "${GREEN}===========================================${NC}" 
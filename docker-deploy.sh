#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== JohnsonUI Docker 部署脚本 =====${NC}"

# 检查Docker是否安装
echo -e "${BLUE}正在检查Docker环境...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${YELLOW}未安装Docker，请先安装Docker${NC}"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${YELLOW}未安装Docker Compose，请先安装Docker Compose${NC}"; exit 1; }

# 检查Docker服务是否运行
docker info >/dev/null 2>&1 || { echo -e "${YELLOW}Docker服务未运行，请先启动Docker服务${NC}"; exit 1; }

# 构建并启动服务
echo -e "${BLUE}正在构建并启动服务...${NC}"
docker-compose up -d --build

# 检查服务是否正常启动
if [ $? -eq 0 ]; then
    echo -e "${GREEN}JohnsonUI 服务已成功启动！${NC}"
    echo -e "${GREEN}前端地址: http://localhost${NC}"
    
    # 显示容器状态
    echo -e "${BLUE}容器状态:${NC}"
    docker-compose ps
else
    echo -e "${YELLOW}服务启动失败，请检查日志${NC}"
    docker-compose logs
    exit 1
fi

echo -e "${GREEN}部署完成！使用以下命令管理服务:${NC}"
echo -e "  查看日志: ${BLUE}docker-compose logs -f${NC}"
echo -e "  重启服务: ${BLUE}docker-compose restart${NC}"
echo -e "  停止服务: ${BLUE}docker-compose down${NC}" 
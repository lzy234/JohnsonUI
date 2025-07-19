#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== JohnsonUI 项目一键部署脚本 =====${NC}"

# 检查是否安装了必要的工具
echo -e "${BLUE}正在检查必要的工具...${NC}"
command -v python3 >/dev/null 2>&1 || { echo -e "${YELLOW}未安装 Python3，请先安装 Python3${NC}"; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo -e "${YELLOW}未安装 pip3，请先安装 pip3${NC}"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo -e "${YELLOW}警告: 未安装 npm，只能启动后端服务${NC}"; }

# 创建Python虚拟环境
echo -e "${BLUE}正在创建Python虚拟环境...${NC}"
python3 -m venv venv || { echo -e "${YELLOW}创建虚拟环境失败${NC}"; exit 1; }
source venv/bin/activate || { echo -e "${YELLOW}激活虚拟环境失败${NC}"; exit 1; }

# 安装后端依赖
echo -e "${BLUE}正在安装后端依赖...${NC}"
pip3 install -r backend/requirements.txt || { echo -e "${YELLOW}安装后端依赖失败${NC}"; exit 1; }

# 下载示例视频（如果需要）
echo -e "${BLUE}正在下载示例视频...${NC}"
python3 backend/scripts/download_sample_videos.py || { echo -e "${YELLOW}下载示例视频失败，但将继续部署${NC}"; }

# 启动后端服务（在后台运行）
echo -e "${BLUE}正在启动后端服务...${NC}"
python3 backend/start_server.py &
BACKEND_PID=$!
echo -e "${GREEN}后端服务已启动，PID: $BACKEND_PID${NC}"

# 启动前端服务
echo -e "${BLUE}正在启动前端HTTP服务...${NC}"
if command -v python3 -m http.server >/dev/null 2>&1; then
    # 使用Python的HTTP服务器
    cd "$(dirname "$0")" || exit
    echo -e "${GREEN}前端服务已启动，访问 http://localhost:8000${NC}"
    python3 -m http.server 8000
else
    echo -e "${YELLOW}警告: 无法启动前端服务${NC}"
fi

# 清理函数（用于捕获SIGINT信号）
cleanup() {
    echo -e "${BLUE}正在关闭服务...${NC}"
    kill $BACKEND_PID
    echo -e "${GREEN}服务已关闭${NC}"
    exit 0
}

# 捕获SIGINT信号（Ctrl+C）
trap cleanup SIGINT

# 等待用户按Ctrl+C
echo -e "${BLUE}服务已启动，按 Ctrl+C 停止服务${NC}"
wait 
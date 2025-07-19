#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== JohnsonUI 后端部署脚本 =====${NC}"

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}请使用sudo运行此脚本${NC}"
  exit 1
fi

# 设置变量
PROJECT_ROOT=$(pwd)
SERVICE_NAME="johnsonui"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"
VENV_PATH="${PROJECT_ROOT}/venv"

# 检查是否安装了必要的工具
echo -e "${BLUE}正在检查必要的工具...${NC}"
command -v python3 >/dev/null 2>&1 || { echo -e "${YELLOW}未安装 Python3，请先安装 Python3${NC}"; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo -e "${YELLOW}未安装 pip3，请先安装 pip3${NC}"; exit 1; }

# 创建Python虚拟环境
echo -e "${BLUE}正在创建Python虚拟环境...${NC}"
python3 -m venv $VENV_PATH || { echo -e "${YELLOW}创建虚拟环境失败${NC}"; exit 1; }
source $VENV_PATH/bin/activate || { echo -e "${YELLOW}激活虚拟环境失败${NC}"; exit 1; }

# 安装后端依赖
echo -e "${BLUE}正在安装后端依赖...${NC}"
pip3 install -r ${PROJECT_ROOT}/backend/requirements.txt || { echo -e "${YELLOW}安装后端依赖失败${NC}"; exit 1; }

# 下载示例视频（如果需要）
echo -e "${BLUE}正在下载示例视频...${NC}"
python3 ${PROJECT_ROOT}/backend/scripts/download_sample_videos.py || { echo -e "${YELLOW}下载示例视频失败，但将继续部署${NC}"; }

# 创建systemd服务文件
echo -e "${BLUE}正在创建systemd服务文件...${NC}"
cat > $SERVICE_FILE << EOF
[Unit]
Description=JohnsonUI Backend Service
After=network.target

[Service]
User=$(whoami)
WorkingDirectory=${PROJECT_ROOT}/backend
Environment="PATH=${VENV_PATH}/bin"
ExecStart=${VENV_PATH}/bin/python start_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 重新加载systemd配置
echo -e "${BLUE}正在重新加载systemd配置...${NC}"
systemctl daemon-reload

# 启用并启动服务
echo -e "${BLUE}正在启用并启动服务...${NC}"
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# 检查服务状态
echo -e "${BLUE}正在检查服务状态...${NC}"
if systemctl is-active --quiet $SERVICE_NAME; then
    echo -e "${GREEN}后端服务已成功启动！${NC}"
    echo -e "${GREEN}服务状态:${NC}"
    systemctl status $SERVICE_NAME --no-pager
else
    echo -e "${YELLOW}后端服务启动失败，请检查日志:${NC}"
    journalctl -u $SERVICE_NAME -n 20
    exit 1
fi

echo -e "${GREEN}部署完成！使用以下命令管理服务:${NC}"
echo -e "  查看日志: ${BLUE}journalctl -u $SERVICE_NAME -f${NC}"
echo -e "  重启服务: ${BLUE}systemctl restart $SERVICE_NAME${NC}"
echo -e "  停止服务: ${BLUE}systemctl stop $SERVICE_NAME${NC}" 
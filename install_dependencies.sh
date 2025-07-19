#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== JohnsonUI 依赖安装脚本 =====${NC}"

# 检查是否以root运行
if [ "$EUID" -ne 0 ]; then
  echo -e "${YELLOW}请使用sudo运行此脚本${NC}"
  exit 1
fi

# 检测Linux发行版
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    echo -e "${BLUE}检测到操作系统: $OS${NC}"
else
    echo -e "${YELLOW}无法检测操作系统类型，将尝试使用apt安装包${NC}"
    OS="debian"
fi

# 安装依赖
echo -e "${BLUE}正在安装系统依赖...${NC}"

install_debian_deps() {
    echo -e "${BLUE}更新软件包列表...${NC}"
    apt update

    echo -e "${BLUE}安装基础依赖...${NC}"
    apt install -y python3 python3-pip python3-venv nginx curl wget
}

install_rhel_deps() {
    echo -e "${BLUE}更新软件包列表...${NC}"
    yum update -y

    echo -e "${BLUE}安装EPEL仓库...${NC}"
    yum install -y epel-release

    echo -e "${BLUE}安装基础依赖...${NC}"
    yum install -y python3 python3-pip nginx curl wget
}

install_arch_deps() {
    echo -e "${BLUE}更新软件包列表...${NC}"
    pacman -Sy

    echo -e "${BLUE}安装基础依赖...${NC}"
    pacman -S --noconfirm python python-pip nginx curl wget
}

# 根据不同的Linux发行版安装依赖
case $OS in
    "debian"|"ubuntu"|"linuxmint"|"pop"|"elementary")
        install_debian_deps
        ;;
    "fedora"|"rhel"|"centos"|"rocky"|"almalinux"|"ol")
        install_rhel_deps
        ;;
    "arch"|"manjaro")
        install_arch_deps
        ;;
    *)
        echo -e "${YELLOW}未识别的Linux发行版，将尝试使用apt安装包${NC}"
        install_debian_deps
        ;;
esac

# 确保Python和Pip可用
echo -e "${BLUE}检查Python和Pip是否可用...${NC}"
command -v python3 >/dev/null 2>&1 || { echo -e "${YELLOW}安装Python3失败${NC}"; exit 1; }
command -v pip3 >/dev/null 2>&1 || { echo -e "${YELLOW}安装pip3失败${NC}"; exit 1; }
command -v nginx >/dev/null 2>&1 || { echo -e "${YELLOW}警告: 安装nginx失败，但将继续安装${NC}"; }

# 确保Nginx服务启动
if command -v systemctl >/dev/null 2>&1; then
    echo -e "${BLUE}启动Nginx服务...${NC}"
    systemctl enable nginx
    systemctl start nginx
fi

echo -e "${GREEN}系统依赖安装完成！${NC}"
echo -e "${GREEN}现在您可以运行以下脚本:${NC}"
echo -e "  开发环境: ${BLUE}./deploy.sh${NC}"
echo -e "  生产环境后端: ${BLUE}sudo ./deploy_backend.sh${NC}"
echo -e "  生产环境前端: ${BLUE}sudo ./deploy_frontend.sh${NC}" 
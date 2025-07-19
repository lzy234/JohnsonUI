#!/bin/bash

# 设置颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== JohnsonUI 前端部署脚本 =====${NC}"

# 检查是否安装了必要的工具
echo -e "${BLUE}正在检查必要的工具...${NC}"
command -v nginx >/dev/null 2>&1 || { echo -e "${YELLOW}未安装 Nginx，请先安装 Nginx${NC}"; exit 1; }

# 设置变量
NGINX_CONF="/etc/nginx/sites-available/johnsonui"
NGINX_ENABLED="/etc/nginx/sites-enabled/johnsonui"
PROJECT_ROOT=$(pwd)

# 创建Nginx配置文件
echo -e "${BLUE}正在创建Nginx配置...${NC}"
sudo tee $NGINX_CONF > /dev/null << EOF
server {
    listen 80;
    server_name localhost;

    root $PROJECT_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index/index.html;
    }

    location /ai/ {
        try_files \$uri \$uri/ /ai/index.html;
    }

    location /analysis/ {
        try_files \$uri \$uri/ /analysis/index.html;
    }

    location /upload/ {
        try_files \$uri \$uri/ /upload/index.html;
    }

    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

# 启用站点配置
echo -e "${BLUE}正在启用Nginx站点...${NC}"
sudo ln -sf $NGINX_CONF $NGINX_ENABLED

# 测试Nginx配置
echo -e "${BLUE}正在测试Nginx配置...${NC}"
sudo nginx -t

if [ $? -eq 0 ]; then
    # 重新加载Nginx
    echo -e "${BLUE}正在重新加载Nginx...${NC}"
    sudo systemctl reload nginx
    echo -e "${GREEN}前端已成功部署！访问 http://localhost 查看${NC}"
else
    echo -e "${YELLOW}Nginx配置测试失败，请检查配置${NC}"
    exit 1
fi 
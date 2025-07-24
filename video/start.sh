#!/bin/bash
# 安装依赖
pip install -r requirements.txt

# 创建日志目录
mkdir -p logs

# 在后台启动服务器，并将输出重定向到日志文件
nohup python app.py > logs/server.log 2>&1 &

# 输出成功信息
echo "服务器已在后台启动，日志保存在 logs/server.log"
echo "使用 'ps -ef | grep python' 可以查看进程" 
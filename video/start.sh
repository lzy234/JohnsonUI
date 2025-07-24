#!/bin/bash
# 安装依赖
pip install -r requirements.txt

# 创建日志目录
mkdir -p logs

# 检查端口是否被占用，如果被占用则杀掉进程
pid=$(netstat -tulpn 2>/dev/null | grep ":5000" | awk '{print $7}' | cut -d'/' -f1)
if [ ! -z "$pid" ]; then
  echo "端口5000已被进程 $pid 占用，尝试终止..."
  kill -9 $pid
  sleep 2
fi

# 使用gunicorn在后台启动服务器
echo "使用gunicorn启动服务器..."
nohup gunicorn --bind 0.0.0.0:5000 --workers 4 --threads 2 --timeout 120 --access-logfile logs/access.log --error-logfile logs/error.log --log-level info app:app > logs/server.log 2>&1 &

# 检查服务是否正常启动
sleep 3
if curl -s http://localhost:5000/health | grep -q "status.*ok"; then
  echo "服务器已在后台成功启动，访问 http://公网IP:5000"
  echo "日志文件位置:"
  echo "  - 主日志: logs/server.log"
  echo "  - 访问日志: logs/access.log"
  echo "  - 错误日志: logs/error.log"
else
  echo "服务器可能未正常启动，请检查日志文件 logs/server.log"
fi

# 显示运行中的进程
echo "运行中的进程:"
ps -ef | grep gunicorn | grep -v grep 
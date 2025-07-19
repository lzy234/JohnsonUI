@echo off
REM
REM JohnsonUI 后端服务 Docker 部署一键启动脚本
REM 适用于 Windows 系统
REM

echo ==================================================
echo   JohnsonUI 后端服务 Docker 部署脚本
echo   适用于 Windows 系统
echo ==================================================

REM 检查 Docker 是否已安装
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo ❌ Docker 未安装，请先安装 Docker
    echo 可参考官方文档: https://docs.docker.com/engine/install/
    exit /b 1
)

echo ✅ 检测到 Docker 已安装

REM 确保当前目录是后端目录
if not exist "start_server.py" (
    echo ❌ 当前目录不是后端目录，请在 backend 目录下运行此脚本
    exit /b 1
)

REM 构建 Docker 镜像
echo 🔨 正在构建 Docker 镜像...
docker build -t johnsonui-backend:latest .

REM 检查是否有旧容器在运行
docker ps -a --filter "name=johnsonui-backend" --format "{{.ID}}" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo 🔄 检测到旧容器，正在停止并删除...
    docker stop johnsonui-backend 2>nul
    docker rm johnsonui-backend 2>nul
)

REM 确保视频和配置目录存在
if not exist ".\videos" mkdir .\videos
if not exist ".\config" mkdir .\config

REM 启动 Docker 容器
echo 🚀 正在启动后端服务容器...
docker run -d ^
    --name johnsonui-backend ^
    -p 8000:8000 ^
    -v "%cd%\videos:/app/videos" ^
    -v "%cd%\config:/app/config" ^
    -e PYTHONUNBUFFERED=1 ^
    --restart always ^
    johnsonui-backend:latest

REM 检查容器是否成功启动
docker ps --filter "name=johnsonui-backend" --format "{{.ID}}" >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo ✅ 后端服务容器已成功启动
    
    REM 获取主机 IP (这在Windows中可能不总是准确)
    for /f "tokens=1* delims=: " %%A in ('ipconfig ^| find "IPv4" ^| find /v "127.0.0.1"') do set HOST_IP=%%B
    
    echo.
    echo 📋 服务信息:
    echo --------------------------------------------
    echo 🔗 API 文档: http://%HOST_IP%:8000/docs
    echo 🏥 健康检查: http://%HOST_IP%:8000/api/health
    echo 💬 聊天 API: http://%HOST_IP%:8000/api/chat/stream
    echo.
    echo 📊 查看日志: docker logs -f johnsonui-backend
    echo 🛑 停止服务: docker stop johnsonui-backend
    echo ▶️ 重启服务: docker restart johnsonui-backend
    echo --------------------------------------------
) else (
    echo ❌ 容器启动失败，请检查日志:
    echo docker logs johnsonui-backend
) 
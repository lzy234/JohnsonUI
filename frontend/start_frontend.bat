@echo off
echo ===========================================
echo    医学手术复盘AI Agent - 前端部署脚本
echo ===========================================
echo.

REM 检查Docker是否已安装
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误：Docker未安装！
    echo 请先安装Docker Desktop，然后再运行此脚本。
    echo 可以从 https://www.docker.com/products/docker-desktop/ 下载安装。
    exit /b 1
)

REM 检查Docker是否在运行
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 错误：Docker未运行！
    echo 请启动Docker Desktop后再运行此脚本。
    exit /b 1
)

echo 检查Docker状态...正常

REM 设置容器名称和镜像名称
set CONTAINER_NAME=johnsonui-frontend
set IMAGE_NAME=johnsonui-frontend:latest
set HOST_PORT=3000

REM 检查是否存在旧的容器并停止和删除
docker ps -a | findstr %CONTAINER_NAME% >nul
if %ERRORLEVEL% equ 0 (
    echo 发现已存在的容器，正在停止并删除...
    docker stop %CONTAINER_NAME% >nul 2>nul
    docker rm %CONTAINER_NAME% >nul 2>nul
)

echo 构建Docker镜像...
cd %~dp0
docker build -t %IMAGE_NAME% .
if %ERRORLEVEL% neq 0 (
    echo 错误：构建Docker镜像失败！
    exit /b 1
)

echo 镜像构建成功！

REM 启动容器
echo 启动前端容器...
docker run -d --name %CONTAINER_NAME% -p %HOST_PORT%:80 --restart unless-stopped %IMAGE_NAME%
if %ERRORLEVEL% neq 0 (
    echo 错误：启动容器失败！
    exit /b 1
)

echo ===========================================
echo ✅ 前端服务已成功启动！
echo 访问地址：http://localhost:%HOST_PORT%
echo.
echo 容器管理命令：
echo 查看日志：docker logs %CONTAINER_NAME%
echo 停止服务：docker stop %CONTAINER_NAME%
echo 重启服务：docker restart %CONTAINER_NAME%
echo =========================================== 
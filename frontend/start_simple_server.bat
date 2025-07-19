@echo off
echo ===========================================
echo    医学手术复盘AI Agent - 前端服务器
echo ===========================================
echo.

REM 检查Python是否已安装
where python >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo 正在检查Python3...
    where python3 >nul 2>nul
    if %ERRORLEVEL% neq 0 (
        echo 错误：未找到Python！
        echo 请安装Python，然后再运行此脚本。
        echo 可以从 https://www.python.org/downloads/ 下载安装。
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
    )
) else (
    set PYTHON_CMD=python
)

echo 已检测到Python，正在启动HTTP服务器...
echo.
echo 使用%PYTHON_CMD%启动HTTP服务器...

REM 启动简单的HTTP服务器
cd %~dp0
echo 当前工作目录: %cd%
echo.
echo 服务器启动成功! 请访问: http://localhost:8000
echo 按Ctrl+C可停止服务器
echo ===========================================

%PYTHON_CMD% -m http.server 8000 
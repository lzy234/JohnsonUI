# JohnsonUI 部署指南

本文档提供了在 Linux 系统上部署 JohnsonUI 项目的详细说明。

## 前提条件

确保您的系统满足以下要求：
- Linux 操作系统（支持 Debian/Ubuntu、RHEL/CentOS/Fedora、Arch Linux）
- 有 root 权限或 sudo 访问权限
- 基础的命令行知识

## 快速开始

### 1. 开发环境部署

如果您想快速在开发环境中运行项目，请执行以下命令：

```bash
# 下载项目（如果尚未克隆）
git clone <项目仓库URL> JohnsonUI
cd JohnsonUI

# 添加执行权限
chmod +x *.sh

# 运行部署脚本
./deploy.sh
```

这将启动一个后台 Python 服务器和一个前端 HTTP 服务器，您可以通过浏览器访问 `http://localhost:8000` 查看项目。

### 2. 生产环境部署

对于生产环境，建议按照以下步骤部署：

```bash
# 下载项目（如果尚未克隆）
git clone <项目仓库URL> JohnsonUI
cd JohnsonUI

# 添加执行权限
chmod +x *.sh

# 安装依赖
sudo ./install_dependencies.sh

# 部署后端
sudo ./deploy_backend.sh

# 部署前端
sudo ./deploy_frontend.sh
```

完成后，您可以通过浏览器访问 `http://localhost` 查看项目。

## 脚本说明

### install_dependencies.sh

此脚本会自动检测您的 Linux 发行版并安装必要的依赖：
- Python 3
- pip3
- nginx
- curl
- wget

### deploy.sh

用于开发环境的快速部署脚本，它会：
1. 创建 Python 虚拟环境
2. 安装后端依赖
3. 下载示例视频
4. 启动后端服务（后台运行）
5. 启动前端 HTTP 服务器（前台运行）

使用 Ctrl+C 可以停止服务。

### deploy_backend.sh

用于生产环境部署后端服务，它会：
1. 创建 Python 虚拟环境
2. 安装后端依赖
3. 下载示例视频
4. 创建 systemd 服务并启动
5. 提供服务管理指令

### deploy_frontend.sh

用于生产环境部署前端静态文件，它会：
1. 创建 Nginx 配置文件
2. 配置网站路由
3. 启用站点配置
4. 重新加载 Nginx

## 服务管理

### 后端服务

```bash
# 查看服务状态
systemctl status johnsonui

# 重启服务
systemctl restart johnsonui

# 停止服务
systemctl stop johnsonui

# 查看日志
journalctl -u johnsonui -f
```

### Nginx 服务

```bash
# 查看服务状态
systemctl status nginx

# 重新加载配置
systemctl reload nginx

# 重启服务
systemctl restart nginx

# 停止服务
systemctl stop nginx
```

## 故障排除

### 端口冲突

如果遇到端口冲突，请修改 `deploy.sh` 中的端口号，或者检查并停止占用端口的服务。

### 权限问题

确保运行生产环境部署脚本时使用 `sudo`，并且项目目录有适当的权限。

### 日志查看

如果服务未能启动，请查看日志以获取更多信息：
```bash
journalctl -u johnsonui -n 50
```

## 自定义配置

### 修改后端端口

编辑 `backend/app/main.py` 文件，修改 FastAPI 的端口配置。

### 修改 Nginx 配置

编辑 `/etc/nginx/sites-available/johnsonui` 文件，根据需要自定义 Nginx 配置。

## 安全建议

1. 在生产环境中，建议配置 HTTPS
2. 限制敏感 API 的访问权限
3. 定期更新依赖包以修补安全漏洞 
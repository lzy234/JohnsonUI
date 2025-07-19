# JohnsonUI Docker 部署指南

本文档提供了使用 Docker 在 Linux 系统上部署 JohnsonUI 项目的详细说明。

## 前提条件

确保您的系统满足以下要求：
- 已安装 Docker (v20.10+)
- 已安装 Docker Compose (v2.0+)
- 有 root 权限或 sudo 访问权限
- 基础的命令行知识

## 快速开始

### 1. 克隆项目

```bash
# 下载项目（如果尚未克隆）
git clone <项目仓库URL> JohnsonUI
cd JohnsonUI
```

### 2. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f
```

完成后，您可以通过浏览器访问 `http://localhost` 查看项目。

## 服务说明

Docker Compose 配置包含以下服务：

### 1. backend

后端 API 服务，基于 Python FastAPI 构建：
- 端口：内部 8000（不对外暴露）
- 挂载卷：
  - `./backend/videos` - 视频文件存储
  - `./backend/config` - 配置文件

### 2. frontend

前端静态文件服务，基于 Nginx 构建：
- 端口：80（对外暴露）
- 提供静态文件服务
- 反向代理后端 API 请求

## 常用操作

### 服务管理

```bash
# 启动所有服务
docker-compose up -d

# 停止所有服务
docker-compose down

# 重建并启动服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看服务日志
docker-compose logs -f           # 所有服务
docker-compose logs -f backend   # 仅后端服务
docker-compose logs -f frontend  # 仅前端服务
```

### 容器操作

```bash
# 进入后端容器
docker exec -it johnsonui-backend bash

# 进入前端容器
docker exec -it johnsonui-frontend sh
```

## 自定义配置

### 修改后端配置

1. 编辑 `backend/config` 目录中的配置文件
2. 重启后端服务：
   ```bash
   docker-compose restart backend
   ```

### 修改前端配置

1. 编辑 `nginx.conf` 文件
2. 重建并重启前端服务：
   ```bash
   docker-compose up -d --build frontend
   ```

## 数据持久化

项目使用以下卷进行数据持久化：
- `./backend/videos` - 存储视频文件
- `./backend/config` - 存储配置文件

这些目录会自动挂载到容器内部，确保数据在容器重启后不会丢失。

## 生产环境建议

对于生产环境部署，建议：
1. 配置 HTTPS - 通过 Nginx 或使用外部代理如 Traefik
2. 设置身份验证 - 保护敏感 API 端点
3. 监控和日志管理 - 集成如 Prometheus 和 Grafana
4. 使用外部数据库 - 如果需要，连接到外部数据库服务

## 故障排除

### 端口冲突

如果遇到端口冲突，请修改 `docker-compose.yml` 中的端口映射：
```yaml
ports:
  - "8080:80"  # 将主机端口从 80 更改为 8080
```

### 容器无法启动

检查日志以获取更多信息：
```bash
docker-compose logs backend
```

### 网络问题

如果服务之间无法通信，请检查网络配置：
```bash
docker network inspect johnsonui-network
``` 
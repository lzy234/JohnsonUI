# JohnsonUI Docker 部署指南 (不使用 Docker Compose)

本文档提供了使用纯 Docker 命令（不依赖 Docker Compose）在 Linux 系统上部署 JohnsonUI 项目的详细说明。

## 前提条件

确保您的系统满足以下要求：
- 已安装 Docker (v20.10+)
- 有 root 权限或 sudo 访问权限
- 基础的命令行知识

## 快速开始

### 1. 克隆项目

```bash
# 下载项目（如果尚未克隆）
git clone <项目仓库URL> JohnsonUI
cd JohnsonUI
```

### 2. 使用脚本部署

```bash
# 添加执行权限
chmod +x docker-deploy-no-compose.sh

# 运行部署脚本
./docker-deploy-no-compose.sh
```

完成后，您可以通过浏览器访问 `http://localhost` 查看项目。

### 3. 手动部署步骤

如果您希望手动执行部署步骤，可以按照以下命令操作：

```bash
# 创建网络
docker network create --driver bridge johnsonui-network

# 构建后端镜像
docker build -t johnsonui-backend:latest ./backend

# 构建前端镜像
docker build -t johnsonui-frontend:latest -f Dockerfile.frontend .

# 启动后端容器
docker run -d \
  --name johnsonui-backend \
  --network johnsonui-network \
  -v "$(pwd)/backend/videos:/app/videos" \
  -v "$(pwd)/backend/config:/app/config" \
  -e PYTHONUNBUFFERED=1 \
  --restart always \
  johnsonui-backend:latest

# 启动前端容器
docker run -d \
  --name johnsonui-frontend \
  --network johnsonui-network \
  -p 80:80 \
  --restart always \
  johnsonui-frontend:latest
```

## 服务管理

### 查看容器状态

```bash
docker ps --filter "name=johnsonui"
```

### 查看容器日志

```bash
# 查看后端日志
docker logs -f johnsonui-backend

# 查看前端日志
docker logs -f johnsonui-frontend
```

### 重启服务

```bash
# 重启后端
docker restart johnsonui-backend

# 重启前端
docker restart johnsonui-frontend

# 重启所有服务
docker restart johnsonui-backend johnsonui-frontend
```

### 停止服务

```bash
# 停止后端
docker stop johnsonui-backend

# 停止前端
docker stop johnsonui-frontend

# 停止所有服务
docker stop johnsonui-backend johnsonui-frontend
```

### 清理服务

您可以使用提供的脚本清理所有资源：

```bash
chmod +x docker-cleanup.sh
./docker-cleanup.sh
```

或者手动执行以下命令：

```bash
# 停止并删除容器
docker stop johnsonui-backend johnsonui-frontend
docker rm johnsonui-backend johnsonui-frontend

# 删除镜像（如果需要）
docker rmi johnsonui-backend:latest johnsonui-frontend:latest

# 删除网络（如果需要）
docker network rm johnsonui-network
```

## 自定义配置

### 修改后端配置

1. 停止后端容器：`docker stop johnsonui-backend`
2. 编辑 `backend/config` 目录中的配置文件
3. 重新启动后端容器：`docker start johnsonui-backend`

### 修改前端配置

1. 修改 `nginx.conf` 文件
2. 重新构建前端镜像：`docker build -t johnsonui-frontend:latest -f Dockerfile.frontend .`
3. 停止并删除旧的前端容器：
   ```bash
   docker stop johnsonui-frontend
   docker rm johnsonui-frontend
   ```
4. 启动新的前端容器：
   ```bash
   docker run -d \
     --name johnsonui-frontend \
     --network johnsonui-network \
     -p 80:80 \
     --restart always \
     johnsonui-frontend:latest
   ```

## 故障排除

### 端口冲突

如果遇到端口冲突，请修改端口映射：
```bash
docker run -d \
  --name johnsonui-frontend \
  --network johnsonui-network \
  -p 8080:80 \  # 将主机端口从 80 更改为 8080
  --restart always \
  johnsonui-frontend:latest
```

### 容器无法启动

检查日志以获取更多信息：
```bash
docker logs johnsonui-backend
docker logs johnsonui-frontend
```

### 网络问题

如果服务之间无法通信，请检查网络配置：
```bash
docker network inspect johnsonui-network
```

### 数据持久性问题

确保卷挂载正确：
```bash
docker inspect johnsonui-backend -f '{{ .Mounts }}'
``` 
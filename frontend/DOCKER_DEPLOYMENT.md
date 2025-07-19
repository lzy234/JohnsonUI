# 前端Docker部署指南

本文档介绍如何使用Docker部署医学手术复盘AI Agent的前端应用。

## 部署要求

- Linux操作系统
- 已安装Docker (版本 20.10.0 或更高)
- 互联网连接 (用于拉取基础镜像)

## 快速部署

### 方法一：使用一键部署脚本（推荐）

1. 将前端代码复制到服务器

2. 进入前端目录
   ```bash
   cd frontend
   ```

3. 为脚本添加执行权限
   ```bash
   chmod +x start_frontend.sh
   ```

4. 运行部署脚本
   ```bash
   ./start_frontend.sh
   ```

5. 部署完成后，可通过 `http://服务器IP:3000` 访问前端应用

### 方法二：手动部署

1. 进入前端目录
   ```bash
   cd frontend
   ```

2. 构建Docker镜像
   ```bash
   docker build -t johnsonui-frontend:latest .
   ```

3. 运行Docker容器
   ```bash
   docker run -d --name johnsonui-frontend -p 3000:80 --restart unless-stopped johnsonui-frontend:latest
   ```

4. 部署完成后，可通过 `http://服务器IP:3000` 访问前端应用

## 容器管理

- 查看容器日志：
  ```bash
  docker logs johnsonui-frontend
  ```

- 停止容器：
  ```bash
  docker stop johnsonui-frontend
  ```

- 重启容器：
  ```bash
  docker restart johnsonui-frontend
  ```

- 删除容器：
  ```bash
  docker rm -f johnsonui-frontend
  ```

## 自定义配置

如需修改端口或其他配置，请编辑 `start_frontend.sh` 脚本中的相应变量：

```bash
# 设置容器名称和镜像名称
CONTAINER_NAME="johnsonui-frontend"
IMAGE_NAME="johnsonui-frontend:latest"
HOST_PORT=3000  # 修改此处可更改映射端口
```

## 故障排除

1. 如果出现"端口已被占用"错误，可修改脚本中的 `HOST_PORT` 变量为其他可用端口

2. 如果构建失败，请检查是否有足够的磁盘空间和内存

3. 如果访问失败，请检查服务器防火墙设置，确保已开放相应端口 
# 简易视频流服务器

这是一个基于Flask和Gunicorn的简单视频流服务器，可以通过Web浏览器播放存储在服务器上的视频文件。

## 功能特点

- 自动列出videos目录中的所有视频文件
- 提供简洁的视频播放界面
- 支持通过URL直接访问视频流
- 支持公网访问
- 支持后台运行
- 使用Gunicorn提高性能和稳定性

## 使用方法

### 安装依赖

```bash
pip install -r requirements.txt
```

### 运行服务器

```bash
# 前台运行（不推荐用于生产环境）
python app.py

# 后台运行（推荐）
bash start.sh
```

### 访问服务器

1. 在浏览器中访问 http://服务器公网IP:5000
2. 点击视频名称即可播放视频
3. 健康检查: http://服务器公网IP:5000/health

### 添加视频文件

将视频文件放入 `videos` 目录中即可自动识别。

## 公网访问说明

本服务器绑定到 `0.0.0.0`，这意味着它会监听所有可用的网络接口，包括公网IP。确保以下几点：

1. 服务器的5000端口已在防火墙中开放
   ```bash
   # 检查防火墙状态
   sudo ufw status
   
   # 如需开放端口
   sudo ufw allow 5000/tcp
   ```
   
2. 如果在云服务器上运行，需要在云平台控制台中开放5000端口
3. 访问时使用服务器的公网IP地址，例如：`http://123.45.67.89:5000`

## 后台运行

使用 `start.sh` 脚本启动服务器时，程序会使用Gunicorn在后台运行，并将日志保存在 `logs` 目录中。

- 查看运行状态：`ps -ef | grep gunicorn`
- 查看主日志：`tail -f logs/server.log`
- 查看访问日志：`tail -f logs/access.log`
- 查看错误日志：`tail -f logs/error.log`
- 停止服务器：`pkill -f "gunicorn"`

## 常见问题排查

### 访问服务器一直卡住

1. **检查服务器是否正常运行**

   ```bash
   # 检查进程
   ps -ef | grep gunicorn
   
   # 检查端口是否在监听
   netstat -tulpn | grep 5000
   ```

2. **检查网络连接和防火墙设置**

   ```bash
   # 测试本地连接
   curl http://localhost:5000/health
   
   # 检查防火墙状态
   sudo ufw status
   ```

3. **查看日志文件**

   ```bash
   # 查看错误日志
   tail -n 50 logs/error.log
   
   # 查看访问日志
   tail -n 50 logs/access.log
   ```

4. **尝试重启服务**

   ```bash
   # 停止当前服务
   pkill -f "gunicorn"
   
   # 重新启动
   bash start.sh
   ```

5. **检查视频文件权限**

   ```bash
   # 确保视频文件有正确的读取权限
   chmod -R 755 videos/
   ```

## 注意事项

- 默认端口为5000，可以在启动脚本中修改
- 使用gunicorn作为WSGI服务器，更适合生产环境
- 服务器需要能够读取视频文件的权限 
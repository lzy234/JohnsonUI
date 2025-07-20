#!/usr/bin/env python3
"""
启动医学手术复盘AI Agent后端服务
"""

import uvicorn

if __name__ == "__main__":
    print("🚀 启动医学手术复盘AI Agent后端服务")
    print("=" * 50)
    print("📖 API文档: http://0.0.0.0:8000/docs")
    print("🏥 健康检查: http://0.0.0.0:8000/api/health")
    print("💬 聊天API: http://0.0.0.0:8000/api/chat/stream")
    print("\n按 Ctrl+C 停止服务器")
    print("-" * 50)
    
    try:
        uvicorn.run(
            "app.main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=["app"],
            log_level="info"
        )
    except KeyboardInterrupt:
        print("\n👋 服务器已停止")
    except Exception as e:
        print(f"\n❌ 服务器启动失败: {e}")
        print("请检查配置文件和依赖是否正确安装") 
#!/usr/bin/env python3
"""
简单的后端服务测试脚本
"""

import asyncio
import uvicorn
from app.main import app

async def test_import():
    """测试模块导入"""
    try:
        from app.services.config_service import config_service
        config = config_service.load_config()
        print(f"✅ 配置加载成功")
        print(f"  - Bot ID: {config.coze.bot_id}")
        print(f"  - 服务器: {config.server.host}:{config.server.port}")
        
        from app.services.coze_service import coze_service
        print(f"✅ Coze服务加载成功")
        
        return True
    except Exception as e:
        print(f"❌ 导入测试失败: {e}")
        return False

def run_server():
    """启动服务器"""
    print("🚀 启动FastAPI服务器...")
    print("📖 API文档: http://localhost:8000/docs")
    print("🏥 健康检查: http://localhost:8000/api/health")
    print("💬 聊天API: http://localhost:8000/api/chat/stream")
    print("\n按 Ctrl+C 停止服务器")
    
    uvicorn.run(
        app,
        host="localhost",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    print("🧪 医学手术复盘AI Agent - 后端测试")
    print("=" * 50)
    
    # 测试模块导入
    if asyncio.run(test_import()):
        print("\n✅ 所有测试通过，准备启动服务器...")
        print("-" * 50)
        run_server()
    else:
        print("\n❌ 测试失败，请检查配置和依赖")
        exit(1) 
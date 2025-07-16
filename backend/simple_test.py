#!/usr/bin/env python3
"""
最简单的FastAPI测试应用
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# 创建FastAPI应用
app = FastAPI(title="测试应用")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "测试应用运行正常"}

@app.get("/api/health")
async def health():
    return {
        "status": "healthy",
        "message": "服务正常运行"
    }

@app.post("/api/test")
async def test_post(data: dict):
    return {
        "received": data,
        "status": "success"
    }

if __name__ == "__main__":
    print("🧪 启动简单测试服务器...")
    print("🌐 访问: http://localhost:8000")
    print("🏥 健康检查: http://localhost:8000/api/health")
    print("\n按 Ctrl+C 停止服务器")
    
    uvicorn.run(app, host="localhost", port=8000) 
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试后端是否能返回follow_up建议问题
"""

import requests
import json
import time

def test_backend_follow_up():
    """测试后端流式聊天接口是否返回follow_up问题"""
    
    # 后端API地址
    url = "http://localhost:8000/api/chat/stream"
    
    # 测试数据
    test_data = {
        "message": "肝脏手术的风险评估包括哪些方面？",
        "user_id": "test_user_123",
        "doctor_type": "sunhuichuan"
    }
    
    print(f"正在测试后端API: {url}")
    print(f"测试数据: {json.dumps(test_data, ensure_ascii=False, indent=2)}")
    print("\n开始发送请求...\n")
    
    try:
        # 发送POST请求
        response = requests.post(
            url,
            json=test_data,
            headers={"Content-Type": "application/json"},
            stream=True,
            timeout=30
        )
        
        print(f"响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            print(f"请求失败: {response.text}")
            return
        
        # 解析流式响应
        follow_up_found = False
        message_events = []
        follow_up_events = []
        complete_events = []
        
        for line in response.iter_lines(decode_unicode=True):
            if line.strip():
                if line.startswith("data: "):
                    data_str = line[6:]  # 移除"data: "前缀
                    try:
                        data = json.loads(data_str)
                        event_type = data.get("type")
                        
                        print(f"收到事件: {event_type}")
                        
                        if event_type == "MESSAGE":
                            message_events.append(data)
                            content = data.get("content", "")
                            print(f"  消息内容: {content[:100]}..." if len(content) > 100 else f"  消息内容: {content}")
                        
                        elif event_type == "FOLLOW_UP":
                            follow_up_events.append(data)
                            follow_up_found = True
                            questions = data.get("follow_up_questions", [])
                            print(f"  ✅ 发现FOLLOW_UP事件!")
                            print(f"  建议问题数量: {len(questions)}")
                            for i, q in enumerate(questions, 1):
                                print(f"    {i}. {q}")
                        
                        elif event_type == "COMPLETE":
                            complete_events.append(data)
                            print(f"  对话完成")
                        
                    except json.JSONDecodeError as e:
                        print(f"JSON解析错误: {e}")
                        print(f"原始数据: {data_str}")
        
        # 总结测试结果
        print("\n=== 测试结果总结 ===")
        print(f"MESSAGE事件数量: {len(message_events)}")
        print(f"FOLLOW_UP事件数量: {len(follow_up_events)}")
        print(f"COMPLETE事件数量: {len(complete_events)}")
        
        if follow_up_found:
            print("\n✅ 后端成功返回了FOLLOW_UP建议问题!")
            print("问题可能出现在前端处理逻辑中。")
        else:
            print("\n❌ 后端没有返回FOLLOW_UP建议问题!")
            print("问题可能出现在:")
            print("1. Coze API没有返回follow_up消息")
            print("2. 后端coze_service.py没有正确处理follow_up消息")
            print("3. 后端没有发送FOLLOW_UP事件")
        
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
    except Exception as e:
        print(f"其他错误: {e}")

if __name__ == "__main__":
    test_backend_follow_up()
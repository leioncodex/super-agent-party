import asyncio
import json
import os
import logging

from fastapi import APIRouter, WebSocket
import shortuuid

from py.get_setting import load_settings, save_settings, AGENT_DIR

logger = logging.getLogger(__name__)

router = APIRouter()
active_connections = []
settings_lock = asyncio.Lock()

async def broadcast_settings_update(settings):
    """向所有WebSocket连接推送配置更新"""
    for connection in active_connections:
        try:
            await connection.send_json({
                "type": "settings",
                "data": settings,
            })
            print("Settings broadcasted to client")
        except Exception as e:
            logger.error(f"Broadcast failed: {e}")

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    active_connections.append(websocket)
    try:
        async with settings_lock:
            current_settings = await load_settings()
        await websocket.send_json({"type": "settings", "data": current_settings})
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
            elif data.get("type") == "save_settings":
                await save_settings(data.get("data", {}))
                await websocket.send_json({
                    "type": "settings_saved",
                    "correlationId": data.get("correlationId"),
                    "success": True,
                })
            elif data.get("type") == "get_settings":
                settings = await load_settings()
                await websocket.send_json({"type": "settings", "data": settings})
            elif data.get("type") == "save_agent":
                current_settings = await load_settings()
                agent_id = str(shortuuid.ShortUUID().random(length=8))
                config_path = os.path.join(AGENT_DIR, f"{agent_id}.json")
                with open(config_path, 'w', encoding='utf-8') as f:
                    json.dump(current_settings, f, indent=4, ensure_ascii=False)
                current_settings['agents'][agent_id] = {
                    "id": agent_id,
                    "name": data['data']['name'],
                    "system_prompt": data['data']['system_prompt'],
                    "config_path": config_path,
                    "enabled": False,
                }
                await save_settings(current_settings)
                await websocket.send_json({
                    "type": "settings",
                    "data": current_settings,
                })
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        active_connections.remove(websocket)

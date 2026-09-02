import asyncio
import json
import psutil
from datetime import datetime, timezone
from typing import Set

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

_admin_connections: Set[WebSocket] = set()


async def broadcast_to_admins(data: dict):
    """Send a JSON message to all connected admin WebSocket clients."""
    msg = json.dumps(data)
    dead = set()
    for ws in list(_admin_connections):
        try:
            await ws.send_text(msg)
        except Exception:
            dead.add(ws)
    _admin_connections.difference_update(dead)


async def _heartbeat(websocket: WebSocket):
    """Push system health + timestamp every 5 seconds."""
    while True:
        await asyncio.sleep(5)
        try:
            cpu = psutil.cpu_percent(interval=None)
            mem = psutil.virtual_memory().percent
            await websocket.send_text(json.dumps({
                "type": "system_health",
                "payload": {
                    "cpu_usage": cpu,
                    "memory_usage": mem,
                    "server_status": "healthy",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                },
            }))
        except Exception:
            break


@router.websocket("/ws/admin")
async def admin_websocket(websocket: WebSocket):
    await websocket.accept()
    _admin_connections.add(websocket)
    heartbeat_task = asyncio.create_task(_heartbeat(websocket))
    try:
        # Send initial connected event
        await websocket.send_text(json.dumps({
            "type": "connected",
            "payload": {"message": "Admin WebSocket connected", "timestamp": datetime.now(timezone.utc).isoformat()},
        }))
        while True:
            # Listen for pings / client messages
            data = await websocket.receive_text()
            msg = json.loads(data)
            if msg.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        pass
    finally:
        heartbeat_task.cancel()
        _admin_connections.discard(websocket)

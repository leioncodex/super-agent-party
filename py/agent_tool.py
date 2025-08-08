"""Compatibility wrapper exposing the unified tool registry."""

from __future__ import annotations

import json
from typing import Any, Dict

from .tool_registry import (
    register_tool,
    get_tool,
    call_tool,
    load_plugins,
    reload_plugins,
    clear_registry,
)


async def get_agent_tool(settings: Dict[str, Any]):
    """Return an OpenAI-compatible tool description for available agents."""

    tool_agent_list = []
    for agent_id, agent_config in settings.get("agents", {}).items():
        if agent_config.get("enabled"):
            tool_agent_list.append(
                {"agent_id": agent_id, "agent_skill": agent_config.get("system_prompt")}
            )
    if tool_agent_list:
        tool_agent_list_json = json.dumps(tool_agent_list, ensure_ascii=False, indent=4)
        return {
            "type": "function",
            "function": {
                "name": "agent_tool_call",
                "description": (
                    "根据Agent给出的agent_skill调用指定Agent工具，返回结果。"
                    f"当前可用的Agent工具ID以及Agent工具的agent_skill有：{tool_agent_list_json}"
                ),
                "parameters": {
                    "type": "object",
                    "properties": {
                        "agent_id": {
                            "type": "string",
                            "description": "需要调用的Agent工具ID",
                        },
                        "query": {
                            "type": "string",
                            "description": "需要向Agent工具发送的问题",
                        },
                    },
                    "required": ["agent_id", "query"],
                },
            },
        }
    return None


__all__ = [
    "register_tool",
    "get_tool",
    "call_tool",
    "load_plugins",
    "reload_plugins",
    "clear_registry",
    "get_agent_tool",
]


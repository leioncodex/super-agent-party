import json
import importlib
import pkgutil
from pathlib import Path

from py.get_setting import HOST, PORT
from openai import AsyncOpenAI
import jsonschema


# Global registry mapping tool name to its metadata and handler
TOOL_REGISTRY = {}


def register_tool(name: str, description: str, schema: dict, handler):
    """Register a tool with metadata and a callable handler.

    Args:
        name: Unique name for the tool.
        description: Human readable description of the tool.
        schema: JSON schema describing the expected input.
        handler: Callable invoked when the tool is executed.
    """
    jsonschema.Draft7Validator.check_schema(schema)
    TOOL_REGISTRY[name] = {
        "name": name,
        "description": description,
        "schema": schema,
        "handler": handler,
    }


def get_tool(name: str):
    """Retrieve a registered tool by name."""
    return TOOL_REGISTRY.get(name)


def call_tool(name: str, arguments: dict):
    """Validate arguments against the tool schema and invoke its handler."""
    tool = get_tool(name)
    if not tool:
        raise ValueError(f"Tool '{name}' not registered")
    jsonschema.validate(instance=arguments, schema=tool["schema"])
    return tool["handler"](**arguments)


def _load_plugins():
    """Load all plugin modules and invoke their register functions."""
    plugins_dir = Path(__file__).resolve().parent.parent / "plugins"
    if not plugins_dir.exists():
        return
    for module_info in pkgutil.iter_modules([str(plugins_dir)]):
        module = importlib.import_module(f"plugins.{module_info.name}")
        if hasattr(module, "register"):
            module.register(register_tool)


# Load plugins on module import
_load_plugins()
async def get_agent_tool(settings):
    tool_agent_list = []
    for agent_id,agent_config in settings['agents'].items():
        if agent_config['enabled']:
            tool_agent_list.append({"agent_id": agent_id, "agent_skill": agent_config["system_prompt"]})
    if len(tool_agent_list) > 0:
        tool_agent_list = json.dumps(tool_agent_list, ensure_ascii=False, indent=4)
        agent_tool = {
            "type": "function",
            "function": {
                "name": "agent_tool_call",
                "description": f"根据Agent给出的agent_skill调用指定Agent工具，返回结果。当前可用的Agent工具ID以及Agent工具的agent_skill有：{tool_agent_list}",
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
                        }
                    },
                    "required": ["agent_id", "query"]
                }
            }
        }
    else:
        agent_tool = None
    return agent_tool

import importlib
import asyncio
from pathlib import Path
from typing import Callable, Dict, Any
import jsonschema

registry: Dict[str, Dict[str, Any]] = {}
PLUGIN_DIR = Path(__file__).resolve().parent.parent / "plugins"

def register_tool(name: str, func: Callable, schema: Dict[str, Any]) -> None:
    jsonschema.Draft7Validator.check_schema(schema)
    registry[name] = {"func": func, "schema": schema}

def get_tool(name: str):
    return registry.get(name)

async def call_tool(name: str, args: Dict[str, Any]):
    tool = get_tool(name)
    if not tool:
        raise KeyError(f"Tool '{name}' not found")
    jsonschema.validate(args, tool["schema"])
    result = tool["func"](**args)
    if asyncio.iscoroutine(result):
        result = await result
    return result

def load_plugins() -> None:
    if not PLUGIN_DIR.exists():
        return
    for path in PLUGIN_DIR.iterdir():
        if path.suffix == ".py" and path.name != "__init__.py":
            importlib.import_module(f"plugins.{path.stem}")
        elif path.is_dir() and (path / "__init__.py").exists():
            importlib.import_module(f"plugins.{path.name}")

def reload_registry() -> None:
    registry.clear()
    load_plugins()

load_plugins()

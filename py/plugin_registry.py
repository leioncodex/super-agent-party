import importlib
import os
import sys
from dataclasses import dataclass
from types import ModuleType
from typing import Callable, Dict

@dataclass
class Tool:
    name: str
    description: str
    handler: Callable[[str], str]

_registry: Dict[str, Tool] = {}


def register_tool(tool: Tool) -> None:
    """Register a tool in the global registry."""
    _registry[tool.name] = tool


def get_tool(name: str) -> Tool | None:
    return _registry.get(name)


def load_plugins(plugins_dir: str | None = None) -> None:
    """Dynamically load plugins from the plugins directory."""
    base_dir = os.path.dirname(os.path.dirname(__file__))
    plugins_dir = plugins_dir or os.path.join(base_dir, "plugins")
    if not os.path.isdir(plugins_dir):
        return

    if plugins_dir not in sys.path:
        sys.path.insert(0, plugins_dir)

    for entry in os.listdir(plugins_dir):
        plugin_path = os.path.join(plugins_dir, entry)
        if not os.path.isdir(plugin_path):
            continue
        try:
            if plugin_path not in sys.path:
                sys.path.insert(0, plugin_path)
            module: ModuleType = importlib.import_module(entry)
        except Exception:
            continue
        register = getattr(module, "register", None)
        if callable(register):
            register(register_tool)

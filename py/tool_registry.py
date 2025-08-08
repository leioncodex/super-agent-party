from typing import Callable, Dict, Any
import importlib
import os
import sys
from pathlib import Path

_registry: Dict[str, Dict[str, Any]] = {}

def register_tool(name: str, description: str, schema: Dict[str, Any], handler: Callable[[Dict[str, Any]], Any]) -> None:
    """Register a tool with metadata and handler."""
    _registry[name] = {
        "name": name,
        "description": description,
        "schema": schema,
        "handler": handler,
    }

def get_tool(name: str) -> Dict[str, Any] | None:
    """Retrieve a tool by name."""
    return _registry.get(name)

def call_tool(name: str, payload: Dict[str, Any]) -> Any:
    """Validate payload against schema and invoke the tool handler."""
    tool = get_tool(name)
    if not tool:
        raise KeyError(f"Tool {name} not found")
    schema = tool.get("schema", {})
    for key in schema.get("required", []):
        if key not in payload:
            raise ValueError(f"Missing required field: {key}")
    return tool["handler"](payload)

def load_plugins(directory: str = "plugins") -> None:
    """Dynamically load plugin packages from a directory."""
    dir_path = Path(directory)
    if not dir_path.is_dir():
        return
    sys.path.insert(0, str(dir_path.resolve()))
    for item in dir_path.iterdir():
        if item.is_dir() and (item / "__init__.py").exists():
            if item.name in sys.modules:
                del sys.modules[item.name]
            importlib.invalidate_caches()
            module = importlib.import_module(item.name)
            if hasattr(module, "setup"):
                module.setup(register_tool)

def clear_registry() -> None:
    """Reset the tool registry (for testing)."""
    _registry.clear()

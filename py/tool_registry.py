"""Unified tool registry for plugin management."""

from __future__ import annotations

from pathlib import Path
import importlib
import sys
from typing import Any, Callable, Dict

import jsonschema


# Global registry of tool definitions
registry: Dict[str, Dict[str, Any]] = {}


def register_tool(
    name: str,
    description: str,
    schema: Dict[str, Any],
    handler: Callable[..., Any],
) -> None:
    """Register a tool and its metadata."""

    jsonschema.Draft7Validator.check_schema(schema)
    registry[name] = {
        "name": name,
        "description": description,
        "schema": schema,
        "handler": handler,
    }


def get_tool(name: str) -> Dict[str, Any] | None:
    """Return the registered tool by name."""

    return registry.get(name)


def call_tool(name: str, payload: Dict[str, Any]) -> Any:
    """Validate the payload and invoke the tool's handler."""

    tool = get_tool(name)
    if not tool:
        raise KeyError(f"Tool {name} not found")
    jsonschema.validate(payload, tool["schema"])
    return tool["handler"](**payload)


def load_plugins(directory: str = "plugins") -> None:
    """Load all plugin packages from a directory."""

    plugins_path = Path(directory)
    if not plugins_path.is_dir():
        return
    sys.path.insert(0, str(plugins_path.resolve()))
    importlib.invalidate_caches()
    for entry in plugins_path.iterdir():
        if entry.is_dir() and (entry / "__init__.py").exists():
            if entry.name in sys.modules:
                del sys.modules[entry.name]
            pycache = entry / "__pycache__"
            if pycache.exists():
                for f in pycache.iterdir():
                    f.unlink()
            module = importlib.import_module(entry.name)

    sys.path.insert(0, str(dir_path.resolve()))
    for item in dir_path.iterdir():
        if item.is_dir() and (item / "__init__.py").exists():
            if item.name in sys.modules:
                del sys.modules[item.name]
            importlib.invalidate_caches()
            module = importlib.import_module(item.name)
            if hasattr(module, "setup"):
                module.setup(register_tool)


def reload_plugins(directory: str = "plugins") -> None:
    """Clear registry then load plugins from directory."""

    clear_registry()
    load_plugins(directory)


def clear_registry() -> None:
    """Remove all registered tools (mainly for testing)."""

    registry.clear()


__all__ = [
    "register_tool",
    "get_tool",
    "call_tool",
    "load_plugins",
    "reload_plugins",
    "clear_registry",
]


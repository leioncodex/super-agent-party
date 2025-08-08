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

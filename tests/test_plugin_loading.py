from pathlib import Path
from py.tool_registry import load_plugins, reload_plugins, call_tool, clear_registry


def setup_function():
    clear_registry()


def test_dynamic_plugin_loading(tmp_path):
    plugin_dir = tmp_path / "plugins"
    pkg = plugin_dir / "sample_plugin"
    pkg.mkdir(parents=True)
    (pkg / "__init__.py").write_text(
        "def setup(register):\n"
        "    schema = {\"type\": \"object\", \"properties\":{\"x\":{\"type\":\"number\"}}, \"required\": [\"x\"]}\n"
        "    def handler(x):\n"
        "        return x + 1\n"
        "    register('increment', 'add one', schema, handler)\n"
    )
    load_plugins(str(plugin_dir))
    assert call_tool("increment", {"x": 1}) == 2


def test_reload_plugins(tmp_path):
    plugin_dir = tmp_path / "plugins"
    pkg = plugin_dir / "sample_plugin"
    pkg.mkdir(parents=True)
    (pkg / "__init__.py").write_text(
        "def setup(register):\n"
        "    schema = {\"type\": \"object\", \"properties\":{\"x\":{\"type\":\"number\"}}, \"required\": [\"x\"]}\n"
        "    def handler(x):\n"
        "        return x + 1\n"
        "    register('increment', 'add one', schema, handler)\n"
    )
    load_plugins(str(plugin_dir))
    assert call_tool("increment", {"x": 1}) == 2

    # modify plugin and reload
    (pkg / "__init__.py").write_text(
        "def setup(register):\n"
        "    schema = {\"type\": \"object\", \"properties\":{\"x\":{\"type\":\"number\"}}, \"required\": [\"x\"]}\n"
        "    def handler(x):\n"
        "        return x + 2\n"
        "    register('increment', 'add two', schema, handler)\n"
    )
    reload_plugins(str(plugin_dir))
    assert call_tool("increment", {"x": 1}) == 3

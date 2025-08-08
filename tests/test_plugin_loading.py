from pathlib import Path
from py.tool_registry import load_plugins, get_tool, clear_registry


def setup_function():
    clear_registry()


def test_dynamic_plugin_loading(tmp_path):
    plugin_dir = tmp_path / "plugins"
    pkg = plugin_dir / "sample_plugin"
    pkg.mkdir(parents=True)
    (pkg / "__init__.py").write_text(
        "def setup(register):\n"
        "    schema = {\"type\": \"object\", \"required\": [\"x\"]}\n"
        "    def handler(p):\n"
        "        return p['x'] + 1\n"
        "    register('increment', 'add one', schema, handler)\n"
    )
    load_plugins(str(plugin_dir))
    tool = get_tool("increment")
    assert tool is not None
    assert tool["description"] == "add one"
    assert tool["handler"]({"x": 1}) == 2

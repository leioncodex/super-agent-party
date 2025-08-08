import shutil
import subprocess
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.modules.pop('py', None)

from py import agent_cli
from py.tool_registry import get_tool, call_tool, clear_registry


def test_agent_add(tmp_path):
    plugin_repo = tmp_path / "demo_plugin"
    package_dir = plugin_repo / "demo_plugin"
    package_dir.mkdir(parents=True)
    (package_dir / "__init__.py").write_text(
        "def setup(register):\n"
        "    schema = {\"type\": \"object\", \"properties\":{\"text\":{\"type\":\"string\"}}, \"required\": [\"text\"]}\n"
        "    def handler(text):\n"
        "        return text\n"
        "    register('echo', 'echo back', schema, handler)\n"
    )
    subprocess.check_call(["git", "init", str(plugin_repo)])
    subprocess.check_call(["git", "-C", str(plugin_repo), "add", "."])
    subprocess.check_call(["git", "-C", str(plugin_repo), "commit", "-m", "init"])

    dest = Path(agent_cli.PLUGINS_DIR) / "demo_plugin"
    if dest.exists():
        shutil.rmtree(dest)
    clear_registry()
    agent_cli.add_repo(str(plugin_repo))
    tool = get_tool("echo")
    assert tool is not None
    assert call_tool("echo", {"text": "hi"}) == "hi"
    shutil.rmtree(dest)

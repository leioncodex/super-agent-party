import subprocess
from pathlib import Path
import importlib.util

from py.tool_registry import get_tool, clear_registry

root = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("agent", root / "agent.py")
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


def setup_function():
    clear_registry()


def test_agent_add_clones_and_activates(tmp_path):
    plugin_repo = tmp_path / "sample_plugin"
    plugin_repo.mkdir()
    (plugin_repo / "__init__.py").write_text(
        "def setup(register):\n"
        "    schema = {\"type\": \"object\", \"required\": [\"y\"]}\n"
        "    def handler(p):\n"
        "        return p['y'] * 3\n"
        "    register('triple', 'triple numbers', schema, handler)\n"
    )
    subprocess.run(["git", "init"], cwd=plugin_repo, check=True, stdout=subprocess.PIPE)
    subprocess.run(["git", "add", "__init__.py"], cwd=plugin_repo, check=True, stdout=subprocess.PIPE)
    subprocess.run([
        "git", "-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "init"
    ], cwd=plugin_repo, check=True, stdout=subprocess.PIPE)

    agent.add(str(plugin_repo), plugins_dir=str(tmp_path / "plugins"))
    tool = get_tool("triple")
    assert tool is not None
    assert tool["handler"]({"y": 2}) == 6
    assert (tmp_path / "plugins" / plugin_repo.name).exists()

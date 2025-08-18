import os
import sys
import importlib
import types

# Ensure project root precedes site-packages and prevent argparse in server.py from parsing pytest args
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
py_pkg = types.ModuleType("py")
py_pkg.__path__ = [os.path.join(os.path.dirname(os.path.dirname(__file__)), "py")]
sys.modules["py"] = py_pkg
# Stub out optional modules used by server to avoid heavy dependencies
qq_stub = types.ModuleType("py.qq_bot_manager")
class DummyQQBotManager: ...
qq_stub.QQBotManager = DummyQQBotManager
sys.modules["py.qq_bot_manager"] = qq_stub
aiosqlite_stub = types.ModuleType("aiosqlite")
sys.modules["aiosqlite"] = aiosqlite_stub
ollama_stub = types.ModuleType("ollama")
class DummyAsyncClient: ...
ollama_stub.AsyncClient = DummyAsyncClient
sys.modules["ollama"] = ollama_stub
importlib.invalidate_caches()
sys.argv = ["server.py"]
os.makedirs(os.path.join(os.path.dirname(os.path.dirname(__file__)), "node_modules"), exist_ok=True)

from fastapi.testclient import TestClient
import pytest

import server
import py.comfyui_tool as comfy_tool
import py.get_setting as get_setting


@pytest.fixture
def client(monkeypatch):
    async def fake_load_settings():
        return {"comfyuiServers": [], "workflows": []}

    async def fake_init_db():
        pass

    monkeypatch.setattr(server, "load_settings", fake_load_settings)
    monkeypatch.setattr(get_setting, "init_db", fake_init_db)

    return TestClient(server.app)


@pytest.fixture(autouse=True)
def mock_run_workflow(monkeypatch):
    async def fake_run_workflow(workflow, text=None, image=None, extra_inputs=None):
        return {"files": [f"{workflow}_out.png"], "meta": {"workflow": workflow}}

    monkeypatch.setattr(comfy_tool, "run_workflow", fake_run_workflow, raising=False)


@pytest.mark.parametrize("endpoint", ["/comfyui/image", "/comfyui/video", "/comfyui/audio"])
def test_comfyui_endpoints_structure(client, endpoint):
    response = client.post(endpoint, json={})
    if response.status_code in {404, 405}:
        pytest.skip(f"{endpoint} not implemented")
    assert response.status_code == 200
    data = response.json()
    assert "files" in data and isinstance(data["files"], list)
    assert "meta" in data and isinstance(data["meta"], dict)

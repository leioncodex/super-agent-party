import sys
from unittest.mock import AsyncMock

import pathlib
import pytest
from fastapi.testclient import TestClient
from types import SimpleNamespace

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1]))
sys.argv = ["server"]
sys.modules.pop("py", None)
sys.modules.setdefault("mem0", SimpleNamespace(Memory=object))
botpy_stub = SimpleNamespace(Client=object)
sys.modules.setdefault("botpy", botpy_stub)
sys.modules.setdefault(
    "botpy.message", SimpleNamespace(C2CMessage=object, GroupMessage=object)
)
sys.modules.setdefault("ollama", SimpleNamespace(AsyncClient=object))
sys.modules.setdefault("brotli", SimpleNamespace(error=Exception))
import server  # noqa: E402

app = server.app


def test_comfyui_image(monkeypatch):
    monkeypatch.setattr(
        server,
        "run_workflow",
        AsyncMock(return_value={"files": ["img.png"], "meta": {"workflow": "comfyui_image"}}),
    )
    client = TestClient(app)
    resp = client.post("/comfyui/image", data={"text": "hello"})
    assert resp.status_code == 200
    assert resp.json()["files"] == ["img.png"]


def test_comfyui_video(monkeypatch):
    monkeypatch.setattr(
        server,
        "run_workflow",
        AsyncMock(return_value={"files": ["vid.mp4"], "meta": {"workflow": "comfyui_video"}}),
    )
    client = TestClient(app)
    resp = client.post("/comfyui/video")
    assert resp.status_code == 200
    assert resp.json()["files"] == ["vid.mp4"]


def test_comfyui_audio(monkeypatch):
    monkeypatch.setattr(
        server,
        "run_workflow",
        AsyncMock(return_value={"files": ["aud.wav"], "meta": {"workflow": "comfyui_audio"}}),
    )
    client = TestClient(app)
    resp = client.post("/comfyui/audio")
    assert resp.status_code == 200
    assert resp.json()["files"] == ["aud.wav"]

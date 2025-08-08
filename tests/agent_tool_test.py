import sys
import asyncio
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent / 'py'))
import agent_tool as ag


def test_register_and_call():
    async def main():
        ag.register_tool('echo', lambda msg: msg, {
            'type': 'object',
            'properties': {'msg': {'type': 'string'}},
            'required': ['msg']
        })
        res = await ag.call_tool('echo', {'msg': 'hi'})
        assert res == 'hi'
    asyncio.run(main())


def test_load_plugins(tmp_path, monkeypatch):
    plugin = tmp_path / 'plugins'
    plugin.mkdir()
    sys.path.append(str(plugin.parent))
    (plugin / '__init__.py').write_text('')
    (plugin / 'adder.py').write_text(
        "from agent_tool import register_tool\n"
        "def add(a,b):\n    return a+b\n"
        "register_tool('adder', add, {'type':'object','properties':{'a':{'type':'number'},'b':{'type':'number'}},'required':['a','b']})\n"
    )
    monkeypatch.setattr(ag, 'PLUGIN_DIR', plugin)
    ag.reload_registry()
    async def main():
        res = await ag.call_tool('adder', {'a':1,'b':2})
        assert res == 3
    asyncio.run(main())

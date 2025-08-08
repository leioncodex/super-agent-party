from py.tool_registry import register_tool, get_tool, call_tool, clear_registry


def setup_function():
    clear_registry()


def test_register_and_get_tool():
    def handler(payload):
        return payload["value"] * 2
    schema = {"type": "object", "required": ["value"]}
    register_tool("doubler", "double numbers", schema, handler)
    tool = get_tool("doubler")
    assert tool["description"] == "double numbers"
    assert call_tool("doubler", {"value": 3}) == 6

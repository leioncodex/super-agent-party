import pytest
from jsonschema import ValidationError
from py.tool_registry import register_tool, get_tool, call_tool, clear_registry


def setup_function():
    clear_registry()


def test_register_and_get_tool():
    def handler(value):
        return value * 2

    schema = {
        "type": "object",
        "properties": {"value": {"type": "number"}},
        "required": ["value"],
    }
    register_tool("doubler", "double numbers", schema, handler)
    tool = get_tool("doubler")
    assert tool["description"] == "double numbers"
    assert call_tool("doubler", {"value": 3}) == 6


def test_validation_error():
    def handler(value):
        return value * 2

    schema = {
        "type": "object",
        "properties": {"value": {"type": "number"}},
        "required": ["value"],
    }
    register_tool("doubler", "double numbers", schema, handler)
    with pytest.raises(ValidationError):
        call_tool("doubler", {})

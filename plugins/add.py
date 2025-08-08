from __future__ import annotations


def register(register):
    schema = {
        "type": "object",
        "properties": {
            "a": {"type": "number"},
            "b": {"type": "number"},
        },
        "required": ["a", "b"],
    }

    def handler(a: float, b: float):
        return a + b

    register(
        name="add",
        description="Add two numbers together",
        schema=schema,
        handler=handler,
    )

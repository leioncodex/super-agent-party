from __future__ import annotations


def register(register_tool):
    schema = {
        "type": "object",
        "properties": {
            "message": {"type": "string"}
        },
        "required": ["message"],
    }

    def handler(message: str):
        return message

    register_tool(
        name="echo",
        description="Return the provided message",
        schema=schema,
        handler=handler,
    )

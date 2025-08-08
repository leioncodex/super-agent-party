import asyncio
import logging
from typing import Any, Dict, Optional

from camel.utils.mcp_client import MCPClient


class McpClient:
    def __init__(self) -> None:
        self._client: Optional[MCPClient] = None
        self._config: Optional[dict] = None
        self._lock = asyncio.Lock()
        self._on_failure_callback: Optional[callable] = None
        self.disabled: bool = False

    async def initialize(
        self,
        server_name: str,
        server_config: dict,
        on_failure_callback: Optional[callable] = None,
    ) -> None:
        """Initialize connection to an MCP server using CAMEL's MCPClient."""
        self._config = server_config
        self._on_failure_callback = on_failure_callback
        try:
            client = MCPClient(server_config)
            await client.__aenter__()
            async with self._lock:
                self._client = client
            logging.info(
                "Connected to MCP server. Tools: %s",
                [t.name for t in client.get_tools()],
            )
        except Exception as e:  # pragma: no cover - network errors
            logging.exception("Connection failed: %s", e)
            if self._on_failure_callback:
                await self._on_failure_callback(str(e))

    async def close(self) -> None:
        async with self._lock:
            if self._client:
                await self._client.__aexit__(None, None, None)
                self._client = None

    def is_connected(self) -> bool:
        return self._client is not None and self._client.is_connected()

    async def get_openai_functions(self):
        async with self._lock:
            if not self.is_connected():
                return []
            return [tool.openai_tool_schema for tool in self._client.get_tools()]

    async def call_tool(self, tool_name: str, tool_params: Dict[str, Any]) -> Any:
        async with self._lock:
            if not self.is_connected():
                return None
            return await self._client.call_tool(tool_name, tool_params)


if __name__ == "__main__":
    import asyncio

    async def main():
        client = McpClient()
        await client.initialize(
            "example",
            {
                "type": "sse",
                "url": "http://127.0.0.1:8000/mcp",
            },
        )
        funcs = await client.get_openai_functions()
        print("OpenAI functions:", funcs)
        await client.close()

    asyncio.run(main())

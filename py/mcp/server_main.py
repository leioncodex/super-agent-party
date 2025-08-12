#!/usr/bin/env python3
"""Standalone MCP server entrypoint."""

import logging

from .router import mcp_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


def run_stdio() -> None:
    """Run the MCP router using stdio transport."""
    mcp_router.run("stdio")


if __name__ == "__main__":
    run_stdio()

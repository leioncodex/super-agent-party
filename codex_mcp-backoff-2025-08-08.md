# MCP client retry improvements - 2025-08-08
- implement exponential backoff for reconnection attempts
- add debug/info logging for each attempt and failure
- expose `on_reconnect` hook to notify UI and other agents

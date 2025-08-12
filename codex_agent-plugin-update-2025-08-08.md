# codex_agent-plugin-update-2025-08-08

## Request
- Verify existing `plugins/<repo>` before cloning, allow optional update.
- Test `spawnSync` return codes and show clear failure messages.
- Wrap `fs.cpSync` with try/catch to prevent silent failures.

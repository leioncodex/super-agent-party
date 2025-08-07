# Agent Task: Tool Registry & Plugin Loader

## Prompt 1: Python Tool Registry
- **Target**: `py/agent_tool.py`
- Introduce a registry storing metadata for each tool: `name`, `description`, `schema`, `handler`.
- Provide `register_tool`, `get_tool`, and `call_tool` helpers.
- Validate payloads against JSON Schema before calling the handler.
- Load tool plugins from a `plugins/` directory at runtime and register them automatically.

## Prompt 2: TypeScript Tool Registry & Hot Plugins
- **Target**: `src/tools/*`
- Create `registry.ts` exposing `registerTool`, `getTool`, and `loadPlugins`.
- Extend the `Tool` interface with a `schema` field.
- Update existing tools (`shell.ts`, `web-fetch.ts`) to register themselves.
- Support dynamic `import()` of plugin modules placed under `src/plugins`.

## Prompt 3: CLI `agent add <repo-url>`
- **Target**: new CLI script.
- Implement command that clones the given repository into `plugins/`.
- After cloning, invoke the registry loaders to activate the plugin tools without restarting.

## Prompt 4: Tests
- Add unit tests covering registry registration, plugin loading, and the CLI workflow.

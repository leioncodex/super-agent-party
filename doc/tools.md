# Tools Interface

This document describes the tool system used by agents.

## Interface

### TypeScript

```typescript
export interface Tool {
  name: string;
  description: string;
  handler: (input: string) => Promise<string> | string;
}
```

### Rust

```rust
pub struct ToolMetadata {
    pub name: &'static str,
    pub description: &'static str,
}

pub trait Tool {
    fn metadata(&self) -> ToolMetadata;
    fn handle(&self, input: String) -> anyhow::Result<String>;
}
```

## Built-in Examples

- **shell** – execute shell commands.
- **web-fetch** – fetch the body of a URL.

Agents can enable or disable each tool in the agent configuration dialog.

## ComfyUI

Super-Agent-Party can call ComfyUI workflows through HTTP endpoints when
`comfyuiServers` are configured and workflow files are uploaded.

### Endpoints

- `POST /comfyui/image`
- `POST /comfyui/video`
- `POST /comfyui/audio`

Each endpoint accepts form fields `text`, `image`, and optional
`extra_inputs` (JSON) and returns:

```json
{
  "files": ["http://localhost:3456/uploaded_files/example.png"],
  "meta": {"workflow": "comfyui_image"}
}
```

Example:

```bash
curl -X POST http://localhost:3456/comfyui/image -F text="a cat"
```

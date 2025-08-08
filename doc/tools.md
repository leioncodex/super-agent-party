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

ComfyUI workflows can be triggered through dedicated API endpoints once the
application is configured.

### Required Settings

- `comfyuiServers`: array of ComfyUI server URLs (e.g.
  `"http://127.0.0.1:8188"`).
- `comfyuiAPIkey`: optional API key passed as `Authorization` header.
- `workflows`: include entries for `comfyui_image`, `comfyui_video`, and
  `comfyui_audio` so the server knows which workflow to run.

### Endpoints

| Endpoint              | Expected Inputs                                                                 |
|-----------------------|----------------------------------------------------------------------------------|
| `POST /comfyui/image` | `text` (string, optional), `image` (base64 string, optional), `extra_inputs` (object) |
| `POST /comfyui/video` | `text` (string, optional), `image` (base64 string, optional), `extra_inputs` (object) |
| `POST /comfyui/audio` | `text` (string, optional), `extra_inputs` (object)                                |

Each endpoint responds with a JSON payload:

```json
{
  "files": ["/path/to/output"],
  "meta": {"details": "..."}
}
```

### Sample CURL Commands

```bash
curl -X POST http://localhost:8000/comfyui/image \
  -H "Content-Type: application/json" \
  -d '{"text":"A cat on the beach","image":null,"extra_inputs":{}}'

curl -X POST http://localhost:8000/comfyui/video \
  -H "Content-Type: application/json" \
  -d '{"text":"A running dog","extra_inputs":{}}'

curl -X POST http://localhost:8000/comfyui/audio \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world","extra_inputs":{}}'

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

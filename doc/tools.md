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

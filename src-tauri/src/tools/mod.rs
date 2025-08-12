pub struct ToolMetadata {
    pub name: &'static str,
    pub description: &'static str,
}

pub trait Tool {
    fn metadata(&self) -> ToolMetadata;
    fn handle(&self, input: String) -> anyhow::Result<String>;
}

pub mod shell;
pub mod web_fetch;

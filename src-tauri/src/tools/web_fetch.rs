use super::{Tool, ToolMetadata};

pub struct WebFetch;

impl Tool for WebFetch {
    fn metadata(&self) -> ToolMetadata {
        ToolMetadata {
            name: "web-fetch",
            description: "Fetch content from a URL",
        }
    }

    fn handle(&self, input: String) -> anyhow::Result<String> {
        let body = reqwest::blocking::get(&input)?.text()?;
        Ok(body)
    }
}

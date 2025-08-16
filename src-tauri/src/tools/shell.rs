use super::{Tool, ToolMetadata};
use std::process::Command;

pub struct Shell;

impl Tool for Shell {
    fn metadata(&self) -> ToolMetadata {
        ToolMetadata {
            name: "shell",
            description: "Execute shell commands",
        }
    }

    fn handle(&self, input: String) -> anyhow::Result<String> {
        let output = Command::new("sh").arg("-c").arg(input).output()?;
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    }
}

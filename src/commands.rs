use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentConfig {
    pub name: String,
}

#[tauri::command]
pub fn create_agent(config: AgentConfig) -> Result<(), String> {
    let base = PathBuf::from("agents").join(&config.name);
    let subdirs = ["knowledge", "memory", "tools", "vector-store"];
    for sub in &subdirs {
        fs::create_dir_all(base.join(sub)).map_err(|e| e.to_string())?;
    }

    let config_path = base.join("config.json");
    let config_content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_content).map_err(|e| e.to_string())?;

    let schema_path = base.join("vector-store").join("schema.json");
    let schema = serde_json::json!({
        "fields": ["id", "text", "embedding"]
    });
    fs::write(
        schema_path,
        serde_json::to_string_pretty(&schema).map_err(|e| e.to_string())?,
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn list_agents() -> Result<Vec<String>, String> {
    let base = PathBuf::from("agents");
    let mut names = Vec::new();
    if base.exists() {
        for entry in fs::read_dir(base).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            if entry.path().is_dir() {
                if let Some(name) = entry.file_name().to_str() {
                    names.push(name.to_string());
                }
            }
        }
    }
    Ok(names)
}

use chrono::Utc;
use serde::{Deserialize, Serialize};
use serde_json;
use std::fs;
use std::path::{Path};
use tauri;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentConfig {
    pub name: String,
    pub role: String,
    pub model: String,
    pub created_at: String,
    pub vector_store: String,
    pub rag_enabled: bool,
    pub status: String,
}

#[tauri::command]
pub fn create_agent(name: String) -> Result<AgentConfig, String> {
    let base_path = Path::new("src/agents").join(&name);

    let dirs = ["knowledge", "memory", "tools", "vector-store"];
    for d in &dirs {
        fs::create_dir_all(base_path.join(d)).map_err(|e| e.to_string())?;
    }

    let config = AgentConfig {
        name: name.clone(),
        role: String::new(),
        model: String::new(),
        created_at: Utc::now().to_rfc3339(),
        vector_store: "vector-store".to_string(),
        rag_enabled: false,
        status: "inactive".to_string(),
    };

    let config_path = base_path.join("config.json");
    let config_data = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(config_path, config_data).map_err(|e| e.to_string())?;

    let schema_path = base_path.join("vector-store").join("schema.json");
    fs::write(schema_path, "{}\n").map_err(|e| e.to_string())?;

    Ok(config)
}

#[tauri::command]
pub fn list_agents() -> Result<Vec<AgentConfig>, String> {
    let mut agents = Vec::new();
    let agents_dir = Path::new("src/agents");
    if !agents_dir.exists() {
        return Ok(agents);
    }
    for entry in fs::read_dir(agents_dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.is_dir() {
            let config_path = path.join("config.json");
            if config_path.exists() {
                if let Ok(contents) = fs::read_to_string(&config_path) {
                    if let Ok(cfg) = serde_json::from_str::<AgentConfig>(&contents) {
                        agents.push(cfg);
                    }
                }
            }
        }
    }
    Ok(agents)
}

#[tauri::command]
pub async fn create_agent(name: String) -> Result<String, String> {
  use std::fs;
  use std::path::Path;

  let agents_dir = std::env::current_dir()
    .unwrap()
    .join("src/agents")
    .join(&name);

  // Créer les dossiers nécessaires
  let dirs = [
    "knowledge",
    "memory",
    "tools",
    "vector-store"
  ];

  for dir in &dirs {
    let path = agents_dir.join(dir);
    if !path.exists() {
      fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    }
  }

  // Créer config.json minimal
  let config = serde_json::json!({
    "name": name,
    "role": "Agent autonome",
    "model": "",
    "created_at": chrono::Utc::now().to_rfc3339(),
    "status": "pending"
  });

  fs::write(
    agents_dir.join("config.json"),
    config.to_string()
  ).map_err(|e| e.to_string())?;

  Ok(format!("Agent '{}' créé avec succès.", name))
}

#[tauri::command]
pub fn list_agents() -> Result<Vec<AgentConfig>, String> {
  let agents_dir = std::env::current_dir()
    .unwrap()
    .join("src/agents");

  if !agents_dir.exists() {
    return Ok(vec![]);
  }

  let mut agents = Vec::new();
  for entry in std::fs::read_dir(agents_dir).map_err(|e| e.to_string())? {
    let entry = entry.map_err(|e| e.to_string())?;
    let path = entry.path();
    
    if path.is_dir() {
      let config_path = path.join("config.json");
      if config_path.exists() {
        let config_str = std::fs::read_to_string(config_path)
          .map_err(|e| e.to_string())?;
          
        let config: AgentConfig = serde_json::from_str(&config_str)
          .map_err(|e| e.to_string())?;
          
        agents.push(config);
      }
    }
  }

  Ok(agents)
}

#[derive(serde::Serialize, serde::Deserialize)]
struct AgentConfig {
  name: String,
  role: String,
  model: String,
  created_at: String,
  status: String,
}

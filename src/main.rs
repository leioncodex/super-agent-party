mod commands;
use commands::{create_agent, list_agents};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_agent, list_agents])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

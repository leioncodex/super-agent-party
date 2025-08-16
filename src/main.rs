mod commands;
use commands::{create_agent, list_agents};

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![create_agent, list_agents])
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            commands::create_agent,
            commands::list_agents
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

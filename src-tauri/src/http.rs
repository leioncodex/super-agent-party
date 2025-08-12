use std::{net::SocketAddr, sync::{Arc, Mutex}};

use axum::{
    extract::{Path, State},
    routing::{delete, get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};

#[derive(Serialize, Clone)]
pub struct Agent {
    pub id: usize,
    pub name: String,
}

#[derive(Default)]
struct AppState {
    agents: Mutex<Vec<Agent>>,
}

async fn list_agents(State(state): State<Arc<AppState>>) -> Json<Vec<Agent>> {
    let agents = state.agents.lock().unwrap().clone();
    Json(agents)
}

#[derive(Deserialize)]
struct NewAgent {
    name: String,
}

async fn create_agent(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<NewAgent>,
) -> Json<Agent> {
    let mut agents = state.agents.lock().unwrap();
    let id = agents.len() + 1;
    let agent = Agent {
        id,
        name: payload.name,
    };
    agents.push(agent.clone());
    Json(agent)
}

async fn delete_agent(Path(id): Path<usize>, State(state): State<Arc<AppState>>) -> Json<bool> {
    let mut agents = state.agents.lock().unwrap();
    let len_before = agents.len();
    agents.retain(|a| a.id != id);
    Json(len_before != agents.len())
}

pub fn start_server() {
    let state = Arc::new(AppState::default());

    let app = Router::new()
        .route("/agents", get(list_agents).post(create_agent))
        .route("/agents/:id", delete(delete_agent))
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods(Any)
                .allow_headers(Any),
        );

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    let rt = tokio::runtime::Runtime::new().expect("failed to build runtime");
    rt.block_on(async move {
        axum::Server::bind(&addr)
            .serve(app.into_make_service())
            .await
            .unwrap();
    });
}

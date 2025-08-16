use std::path::Path;
use tracing::info;
use tracing_subscriber::FmtSubscriber;
use tracing_appender::rolling::daily;

pub fn init() {
    let level = std::env::var("RUST_LOG_LEVEL").unwrap_or_else(|_| "info".to_string());
    let log_dir = Path::new("logs");
    let _ = std::fs::create_dir_all(log_dir);
    let file_appender = daily(log_dir, "app.log");
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    let subscriber = FmtSubscriber::builder()
        .with_writer(non_blocking)
        .with_env_filter(level)
        .finish();
    tracing::subscriber::set_global_default(subscriber).expect("setting default subscriber failed");
    info!("logger initialized");
}

fn main() {
    init();
    info!("application started");
}

use sqlx::{postgres::PgPoolOptions, PgPool};
use std::env;
use tracing::info;

pub async fn init_db(database_url: &str) -> anyhow::Result<PgPool> {
    // Supabase requires SSL, so we'll use native-tls which is already in dependencies
    let max_connections = env::var("DATABASE_MAX_CONNECTIONS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(5);

    let pool = PgPoolOptions::new()
        .max_connections(max_connections)
        .connect(database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("Database migrations completed");

    Ok(pool)
}

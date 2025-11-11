use sqlx::{postgres::PgPoolOptions, PgPool};
use tracing::info;

pub async fn init_db(database_url: &str) -> anyhow::Result<PgPool> {
    // Supabase requires SSL, so we'll use native-tls which is already in dependencies
    let pool = PgPoolOptions::new()
        .max_connections(10)
        .connect(database_url)
        .await?;

    // Run migrations
    sqlx::migrate!("./migrations").run(&pool).await?;
    info!("Database migrations completed");

    Ok(pool)
}

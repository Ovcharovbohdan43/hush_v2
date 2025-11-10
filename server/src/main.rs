mod api;
mod auth;
mod config;
mod db;
mod error;
mod models;
mod services;

use axum::{
    http::StatusCode,
    routing::{get, post},
    Router,
};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{info, Level};

use crate::config::Config;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_max_level(Level::INFO)
        .with_target(false)
        .init();

    // Load configuration
    dotenv::dotenv().ok();
    let config = Config::from_env()?;

    // Initialize database
    let pool = db::init_db(&config.database_url).await?;
    info!("Database connection established");

    // Build application
    let app = create_app(pool, config.clone()).await?;

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!("Server starting on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn create_app(pool: sqlx::PgPool, config: Config) -> anyhow::Result<Router> {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any);

    // Public routes
    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/auth/login", post(api::auth::login))
        .route("/api/v1/auth/refresh", post(api::auth::refresh))
        .route("/api/v1/auth/register", post(api::auth::register))
        .route("/api/v1/targets/verify", get(api::targets::verify_get).post(api::targets::verify_post))
        // Email forwarding webhook (public, but should be secured with webhook secret in production)
        .route("/api/v1/incoming/mailgun", post(api::incoming::handle_incoming_email))
        .route("/api/v1/incoming/mailgun/json", post(api::incoming::handle_incoming_email_json))
        .route("/api/v1/incoming/sendgrid", post(api::incoming::handle_sendgrid_webhook));

    // Protected routes (require authentication)
    let protected_routes = Router::new()
        .route("/api/v1/auth/logout", post(api::auth::logout))
        .route("/api/v1/aliases", get(api::aliases::list).post(api::aliases::create))
        .route(
            "/api/v1/aliases/:id",
            axum::routing::delete(api::aliases::delete),
        )
        .route(
            "/api/v1/aliases/:id/toggle",
            post(api::aliases::toggle),
        )
        .route("/api/v1/aliases/:id/logs", get(api::aliases::logs))
        .route(
            "/api/v1/targets/request_verify",
            post(api::targets::request_verify),
        )
        .route(
            "/api/v1/targets",
            get(api::targets::get_current),
        )
        .route(
            "/api/v1/notifications/subscribe",
            post(api::notifications::subscribe),
        );

    let router = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(cors)
                .layer(axum::Extension(pool))
                .layer(axum::Extension(config)),
        );

    Ok(router)
}

async fn health_check() -> Result<&'static str, StatusCode> {
    Ok("OK")
}


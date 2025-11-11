mod api;
mod auth;
mod config;
mod db;
mod error;
mod middleware;
mod models;
mod rate_limit;
mod services;
mod webhook_security;

use axum::{
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use tower::ServiceBuilder;
use tower_http::{
    cors::CorsLayer,
    trace::TraceLayer,
};
use tracing::{info, Level, warn};

use crate::config::Config;
use crate::rate_limit::{
    create_auth_rate_limiter, create_protected_rate_limiter, create_public_rate_limiter,
    create_webhook_rate_limiter, RateLimitConfig,
};

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

    if config.tls.enabled {
        // For Railway/production, TLS is handled by the proxy
        // We'll just start HTTP server - Railway will handle TLS termination
        warn!("TLS_ENABLED is set, but Railway handles TLS automatically. Starting HTTP server.");
        let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
        info!("Server starting on http://{} (TLS handled by Railway)", addr);
        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, app).await?;
    } else {
        // Start HTTP server (development mode)
        let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
        info!("Server starting on http://{}", addr);
        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, app).await?;
    }

    Ok(())
}

async fn create_app(pool: sqlx::PgPool, config: Config) -> anyhow::Result<Router> {
    let cors = CorsLayer::permissive();

    // Rate limiting configuration
    let rate_limit_config = RateLimitConfig::from_env();
    info!(
        "Rate limiting configured: auth={}/min, protected={}/min, webhook={}/min, public={}/min",
        rate_limit_config.auth_per_minute,
        rate_limit_config.protected_per_minute,
        rate_limit_config.webhook_per_minute,
        rate_limit_config.public_per_minute
    );

    // Health check (no rate limiting)
    let health_route = Router::new().route("/health", get(health_check));

    // Auth endpoints with strict rate limiting
    let auth_rate_limiter = create_auth_rate_limiter(&rate_limit_config);
    let auth_routes = Router::new()
        .route("/api/v1/auth/login", post(api::auth::login))
        .route("/api/v1/auth/register", post(api::auth::register))
        .route("/api/v1/auth/refresh", post(api::auth::refresh))
        .layer(auth_rate_limiter);

    // Public endpoints with moderate rate limiting
    let public_rate_limiter = create_public_rate_limiter(&rate_limit_config);
    let public_routes = Router::new()
        .route(
            "/api/v1/targets/verify",
            get(api::targets::verify_get).post(api::targets::verify_post),
        )
        .layer(public_rate_limiter);

    // Webhook endpoints with higher rate limits
    let webhook_rate_limiter = create_webhook_rate_limiter(&rate_limit_config);
    let webhook_routes = Router::new()
        .route(
            "/api/v1/incoming/mailgun",
            post(api::incoming::handle_incoming_email),
        )
        .route(
            "/api/v1/incoming/mailgun/json",
            post(api::incoming::handle_incoming_email_json),
        )
        .route(
            "/api/v1/incoming/sendgrid",
            post(api::incoming::handle_sendgrid_webhook),
        )
        .route(
            "/api/v1/incoming/brevo",
            post(api::incoming::handle_brevo_webhook),
        )
        // Test endpoint для проверки доступности webhook
        .route(
            "/api/v1/incoming/test",
            get(|| async {
                info!("Webhook test endpoint accessed");
                (StatusCode::OK, Json(serde_json::json!({
                    "status": "ok",
                    "message": "Webhook endpoint is accessible",
                    "timestamp": chrono::Utc::now().to_rfc3339()
                })))
            }),
        )
        .layer(webhook_rate_limiter);

    // Protected routes with rate limiting
    let protected_rate_limiter = create_protected_rate_limiter(&rate_limit_config);
    let protected_routes = Router::new()
        .route("/api/v1/auth/logout", post(api::auth::logout))
        .route(
            "/api/v1/aliases",
            get(api::aliases::list).post(api::aliases::create),
        )
        .route(
            "/api/v1/aliases/:id",
            axum::routing::delete(api::aliases::delete),
        )
        .route("/api/v1/aliases/:id/toggle", post(api::aliases::toggle))
        .route("/api/v1/aliases/:id/logs", get(api::aliases::logs))
        .route(
            "/api/v1/targets/request_verify",
            post(api::targets::request_verify),
        )
        .route("/api/v1/targets", get(api::targets::get_current))
        .route(
            "/api/v1/notifications/subscribe",
            post(api::notifications::subscribe),
        )
        .layer(protected_rate_limiter);

    let mut router = Router::new()
        .merge(health_route)
        .merge(auth_routes)
        .merge(public_routes)
        .merge(webhook_routes)
        .merge(protected_routes)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http())
                .layer(cors)
                .layer(axum::Extension(pool))
                .layer(axum::Extension(config.clone())),
        );

    // Add HSTS middleware if HTTPS is enabled
    if config.tls.enabled {
        router = router.layer(crate::middleware::hsts::create_hsts_layer(config.tls.clone()));
    }

    Ok(router)
}

/// Создает приложение для HTTP редиректа на HTTPS
async fn health_check() -> Result<&'static str, StatusCode> {
    Ok("OK")
}

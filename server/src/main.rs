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
    extract::Request,
    http::{StatusCode, Uri},
    response::Redirect,
    routing::{get, post},
    Json, Router,
};
use std::net::SocketAddr;
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing::{info, Level, warn};
use rustls::{Certificate, PrivateKey, ServerConfig};
use rustls_pemfile::{certs, pkcs8_private_keys};
use std::fs::File;
use std::io::BufReader;

use crate::config::Config;
use crate::middleware::hsts::hsts_middleware;
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
        // Start HTTP redirect server if configured (before HTTPS server)
        if let Some(http_port) = config.tls.http_redirect_port {
            let redirect_app = create_http_redirect_app(&config);
            tokio::spawn(async move {
                let addr = SocketAddr::from(([0, 0, 0, 0], http_port));
                info!("HTTP redirect server starting on http://{}", addr);
                if let Ok(listener) = tokio::net::TcpListener::bind(addr).await {
                    if let Err(e) = axum::serve(listener, redirect_app).await {
                        warn!("HTTP redirect server error: {}", e);
                    }
                }
            });
        }
        
        // Start HTTPS server (blocking)
        start_https_server(app, &config).await?;
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
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any)
        .expose_headers(Any);

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
        router = router.layer(axum::middleware::from_fn_with_state(
            config.tls.clone(),
            hsts_middleware,
        ));
    }

    Ok(router)
}

/// Создает приложение для HTTP редиректа на HTTPS
fn create_http_redirect_app(config: &Config) -> Router {
    let https_port = config.tls.https_port;
    Router::new().fallback(move |uri: Uri| redirect_to_https(uri, https_port))
}

/// Редирект всех HTTP запросов на HTTPS
async fn redirect_to_https(uri: Uri, https_port: u16) -> Redirect {
    let host = uri
        .authority()
        .map(|a| a.host())
        .unwrap_or("localhost");
    
    // Сохраняем путь и query параметры
    let path_and_query = uri.path_and_query()
        .map(|pq| pq.as_str())
        .unwrap_or("/");
    
    // Формируем HTTPS URL
    let https_url = if https_port == 443 {
        format!("https://{}{}", host, path_and_query)
    } else {
        format!("https://{}:{}{}", host, https_port, path_and_query)
    };
    
    Redirect::permanent(&https_url)
}

/// Запускает HTTPS сервер
async fn start_https_server(app: Router, config: &Config) -> anyhow::Result<()> {
    let cert_path = config
        .tls
        .cert_path
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("TLS_CERT_PATH must be set when HTTPS_ENABLED=true"))?;
    let key_path = config
        .tls
        .key_path
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("TLS_KEY_PATH must be set when HTTPS_ENABLED=true"))?;

    // Load certificate and key
    let certs = load_certs(cert_path)?;
    let key = load_private_key(key_path)?;

    // Create TLS config
    let tls_config = ServerConfig::builder()
        .with_safe_defaults()
        .with_no_client_auth()
        .with_single_cert(certs, key)
        .map_err(|e| anyhow::anyhow!("Failed to create TLS config: {}", e))?;

    let addr = SocketAddr::from(([0, 0, 0, 0], config.tls.https_port));
    info!("HTTPS server starting on https://{}", addr);

    let acceptor = tokio_rustls::TlsAcceptor::from(Arc::new(tls_config));
    let listener = tokio::net::TcpListener::bind(addr).await?;

    // Create a stream of TLS connections
    let incoming = futures::stream::unfold(
        (listener, acceptor),
        |(listener, acceptor)| async move {
            let (stream, _) = listener.accept().await.ok()?;
            let acceptor = acceptor.clone();
            let tls_stream = acceptor.accept(stream).await.ok()?;
            Some((Ok::<_, std::io::Error>(tokio_rustls::TlsStream::Server(tls_stream)), (listener, acceptor)))
        },
    );

    axum::serve::IncomingStream::from_stream(incoming, app).await?;
    
    Ok(())
}

/// Загружает сертификаты из PEM файла
fn load_certs(filename: &str) -> anyhow::Result<Vec<Certificate>> {
    let certfile = File::open(filename)
        .map_err(|e| anyhow::anyhow!("Failed to open certificate file {}: {}", filename, e))?;
    let mut reader = BufReader::new(certfile);
    let certs = certs(&mut reader)
        .map_err(|e| anyhow::anyhow!("Failed to parse certificate: {}", e))?;
    Ok(certs.into_iter().map(Certificate).collect())
}

/// Загружает приватный ключ из PEM файла
fn load_private_key(filename: &str) -> anyhow::Result<PrivateKey> {
    let keyfile = File::open(filename)
        .map_err(|e| anyhow::anyhow!("Failed to open key file {}: {}", filename, e))?;
    let mut reader = BufReader::new(keyfile);
    let keys = pkcs8_private_keys(&mut reader)
        .map_err(|e| anyhow::anyhow!("Failed to parse private key: {}", e))?;

    if keys.is_empty() {
        return Err(anyhow::anyhow!("No private keys found in file"));
    }

    Ok(PrivateKey(keys[0].clone()))
}

async fn health_check() -> Result<&'static str, StatusCode> {
    Ok("OK")
}

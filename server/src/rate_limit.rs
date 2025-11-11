use axum::{
    body::Body,
    http::{HeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use governor::middleware::NoOpMiddleware;
use std::time::Duration;
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::SmartIpKeyExtractor, GovernorError,
    GovernorLayer,
};
use tracing::warn;

/// Rate limit configuration for different endpoint types
#[derive(Clone, Debug)]
pub struct RateLimitConfig {
    /// Requests per minute for public auth endpoints (login, register)
    pub auth_per_minute: u32,
    /// Requests per minute for protected endpoints
    pub protected_per_minute: u32,
    /// Requests per minute for webhook endpoints
    pub webhook_per_minute: u32,
    /// Requests per minute for general public endpoints
    pub public_per_minute: u32,
    /// Burst size multiplier (allows short bursts)
    pub burst_multiplier: u32,
}

impl Default for RateLimitConfig {
    fn default() -> Self {
        Self {
            auth_per_minute: 5,       // 5 requests per minute for auth
            protected_per_minute: 60, // 60 requests per minute for protected
            webhook_per_minute: 100,  // 100 requests per minute for webhooks
            public_per_minute: 30,    // 30 requests per minute for public
            burst_multiplier: 2,      // Allow 2x burst
        }
    }
}

impl RateLimitConfig {
    pub fn from_env() -> Self {
        Self {
            auth_per_minute: std::env::var("RATE_LIMIT_AUTH_PER_MIN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(5),
            protected_per_minute: std::env::var("RATE_LIMIT_PROTECTED_PER_MIN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(60),
            webhook_per_minute: std::env::var("RATE_LIMIT_WEBHOOK_PER_MIN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(100),
            public_per_minute: std::env::var("RATE_LIMIT_PUBLIC_PER_MIN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(30),
            burst_multiplier: std::env::var("RATE_LIMIT_BURST_MULTIPLIER")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(2),
        }
    }
}

fn build_rate_limiter_layer(
    requests_per_minute: u32,
    burst_multiplier: u32,
    error_message: &'static str,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware, Body> {
    let rate_limit = requests_per_minute.max(1);
    let burst_limit = rate_limit.saturating_mul(burst_multiplier.max(1)).max(1);

    let mut builder = GovernorConfigBuilder::default();
    let mut builder = builder.key_extractor(SmartIpKeyExtractor);
    builder.period(Duration::from_secs(60));
    builder.burst_size(burst_limit);

    let config = builder.finish().expect(error_message);

    GovernorLayer::new(config)
        .error_handler(move |err| build_rate_limit_response(err, rate_limit, burst_limit))
}

/// Create rate limiter for auth endpoints
pub fn create_auth_rate_limiter(
    config: &RateLimitConfig,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware, Body> {
    build_rate_limiter_layer(
        config.auth_per_minute,
        config.burst_multiplier,
        "Failed to create auth rate limiter",
    )
}

/// Create rate limiter for protected endpoints
pub fn create_protected_rate_limiter(
    config: &RateLimitConfig,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware, Body> {
    build_rate_limiter_layer(
        config.protected_per_minute,
        config.burst_multiplier,
        "Failed to create protected rate limiter",
    )
}

/// Create rate limiter for webhook endpoints
pub fn create_webhook_rate_limiter(
    config: &RateLimitConfig,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware, Body> {
    build_rate_limiter_layer(
        config.webhook_per_minute,
        config.burst_multiplier,
        "Failed to create webhook rate limiter",
    )
}

/// Create rate limiter for public endpoints
pub fn create_public_rate_limiter(
    config: &RateLimitConfig,
) -> GovernorLayer<SmartIpKeyExtractor, NoOpMiddleware, Body> {
    build_rate_limiter_layer(
        config.public_per_minute,
        config.burst_multiplier,
        "Failed to create public rate limiter",
    )
}

fn build_rate_limit_response(
    err: GovernorError,
    per_minute_limit: u32,
    burst_limit: u32,
) -> Response {
    warn!("Rate limit exceeded: {}", err);

    match err {
        GovernorError::TooManyRequests { wait_time, headers } => {
            let retry_after_str = wait_time.to_string();
            let mut response = (
                StatusCode::TOO_MANY_REQUESTS,
                axum::Json(serde_json::json!({
                    "error": "Rate limit exceeded",
                    "message": "Too many requests. Please try again later.",
                    "retry_after": wait_time,
                    "limit_per_minute": per_minute_limit,
                    "burst_limit": burst_limit,
                })),
            )
                .into_response();

            let headers_map = response.headers_mut();
            headers_map.insert(
                "X-RateLimit-Limit",
                HeaderValue::from_str(&burst_limit.to_string())
                    .unwrap_or_else(|_| HeaderValue::from_static("0")),
            );
            headers_map.insert("X-RateLimit-Remaining", HeaderValue::from_static("0"));
            headers_map.insert(
                "X-RateLimit-Reset",
                HeaderValue::from_str(&retry_after_str)
                    .unwrap_or_else(|_| HeaderValue::from_static("60")),
            );
            headers_map.insert(
                "Retry-After",
                HeaderValue::from_str(&retry_after_str)
                    .unwrap_or_else(|_| HeaderValue::from_static("60")),
            );

            if let Some(extra) = headers {
                headers_map.extend(extra);
            }

            response
        }
        other => other.into_response().map(Body::from),
    }
}

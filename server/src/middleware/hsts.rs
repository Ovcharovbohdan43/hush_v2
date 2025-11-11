use axum::{
    extract::Request,
    http::HeaderValue,
    middleware::Next,
    response::IntoResponse,
};

use crate::config::TlsConfig;

/// Middleware для добавления HSTS заголовков
pub async fn hsts_middleware(
    config: axum::extract::State<TlsConfig>,
    request: Request,
    next: Next,
) -> impl IntoResponse {
    let mut response = next.run(request).await;

    // Добавляем HSTS заголовок только если HTTPS включен
    if config.enabled {
        let hsts_value = if config.hsts_include_subdomains {
            format!("max-age={}; includeSubDomains", config.hsts_max_age)
        } else {
            format!("max-age={}", config.hsts_max_age)
        };

        if let Ok(header_value) = HeaderValue::from_str(&hsts_value) {
            response.headers_mut().insert("Strict-Transport-Security", header_value);
        }
    }

    response
}

/// Создает middleware layer для HSTS
pub fn create_hsts_layer(config: TlsConfig) -> axum::middleware::FromFnWithStateLayer<TlsConfig, impl Fn(axum::extract::State<TlsConfig>, axum::extract::Request, axum::middleware::Next) -> _ + Clone> {
    axum::middleware::from_fn_with_state(config, hsts_middleware)
}


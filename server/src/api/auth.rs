use axum::{extract::Extension, Json};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::{authenticate_user, hash_password, AuthConfig};
use crate::config::Config;
use crate::error::{AppError, Result};
use crate::models::{LoginRequest, LoginResponse, RefreshRequest};

pub async fn login(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    Json(req): Json<LoginRequest>,
) -> Result<Json<LoginResponse>> {
    // Normalize email
    let email = req.email.to_lowercase().trim().to_string();
    let user = authenticate_user(&pool, &email, &req.password).await?;

    let auth_config = AuthConfig::new(config.jwt_secret.clone(), config.jwt_expires_in);
    let access_token = auth_config.encode_token(&user.id.to_string())?;

    // For refresh token, we'll use a longer expiration
    let refresh_auth_config =
        AuthConfig::new(config.jwt_secret.clone(), config.refresh_token_expires_in);
    let refresh_token = refresh_auth_config.encode_token(&user.id.to_string())?;

    Ok(Json(LoginResponse {
        access_token,
        refresh_token,
        expires_in: config.jwt_expires_in,
    }))
}

pub async fn refresh(
    Extension(config): Extension<Config>,
    Json(req): Json<RefreshRequest>,
) -> Result<Json<LoginResponse>> {
    let refresh_auth_config =
        AuthConfig::new(config.jwt_secret.clone(), config.refresh_token_expires_in);

    let claims = refresh_auth_config.decode_token(&req.refresh_token)?;

    let auth_config = AuthConfig::new(config.jwt_secret.clone(), config.jwt_expires_in);
    let access_token = auth_config.encode_token(&claims.sub)?;

    Ok(Json(LoginResponse {
        access_token,
        refresh_token: req.refresh_token,
        expires_in: config.jwt_expires_in,
    }))
}

#[derive(Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

pub async fn register(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    Json(req): Json<RegisterRequest>,
) -> Result<Json<LoginResponse>> {
    // Validate email format (basic validation)
    if !req.email.contains('@') || !req.email.contains('.') {
        return Err(AppError::Validation("Invalid email format".to_string()));
    }

    // Email should be lowercase
    let email = req.email.to_lowercase().trim().to_string();
    if email.is_empty() {
        return Err(AppError::Validation("Email cannot be empty".to_string()));
    }

    // Validate password length
    if req.password.len() < 8 {
        return Err(AppError::Validation(
            "Password must be at least 8 characters".to_string(),
        ));
    }

    // Check if user already exists
    let existing = sqlx::query("SELECT id FROM users WHERE email = $1")
        .bind(&email)
        .fetch_optional(&pool)
        .await?;

    if existing.is_some() {
        return Err(AppError::Validation("User already exists".to_string()));
    }

    // Hash password
    let password_hash = hash_password(&req.password).await?;

    // Create user
    let user_id: Uuid =
        sqlx::query_scalar("INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id")
            .bind(&email)
            .bind(&password_hash)
            .fetch_one(&pool)
            .await?;

    // Generate tokens
    let auth_config = AuthConfig::new(config.jwt_secret.clone(), config.jwt_expires_in);
    let access_token = auth_config.encode_token(&user_id.to_string())?;

    let refresh_auth_config =
        AuthConfig::new(config.jwt_secret.clone(), config.refresh_token_expires_in);
    let refresh_token = refresh_auth_config.encode_token(&user_id.to_string())?;

    Ok(Json(LoginResponse {
        access_token,
        refresh_token,
        expires_in: config.jwt_expires_in,
    }))
}

pub async fn logout() -> Result<Json<serde_json::Value>> {
    // In a stateless JWT system, logout is typically handled client-side
    // by removing the token. If you need server-side logout, you'd maintain
    // a blacklist of tokens.
    Ok(Json(
        serde_json::json!({ "message": "Logged out successfully" }),
    ))
}

use axum::{
    extract::{Extension, Query},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::auth::AuthenticatedUser;
use crate::error::Result;
use crate::models::{RequestVerifyRequest, RequestVerifyResponse};
use crate::services::{EmailService, TargetService};
use crate::config::Config;

#[derive(Deserialize)]
pub struct VerifyQuery {
    pub token: String,
}

pub async fn get_current(
    Extension(pool): Extension<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>> {
    let target = TargetService::get_current(&pool, user.user_id).await?;

    if let Some(t) = target {
        Ok(Json(serde_json::json!({
            "email": t.email,
            "verified": t.verified
        })))
    } else {
        Ok(Json(serde_json::json!(null)))
    }
}

pub async fn request_verify(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    user: AuthenticatedUser,
    Json(req): Json<RequestVerifyRequest>,
) -> Result<Json<RequestVerifyResponse>> {
    let target = TargetService::create_or_update(&pool, user.user_id, &req.target).await?;

    if let Some(token) = &target.verification_token {
        EmailService::send_verification_email(&config, &req.target, token).await?;
    }

    Ok(Json(RequestVerifyResponse {
        message: "verification_sent".to_string(),
    }))
}

pub async fn verify(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<VerifyQuery>,
) -> Result<Json<serde_json::Value>> {
    let target = TargetService::verify(&pool, &params.token).await?;

    Ok(Json(serde_json::json!({
        "message": "Email verified successfully",
        "email": target.email
    })))
}


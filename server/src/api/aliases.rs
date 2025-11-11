use axum::{
    extract::{Extension, Path, Query},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use uuid::Uuid;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::{AppError, Result};
use crate::models::{AliasResponse, CreateAliasRequest, ToggleAliasRequest};
use crate::services::AliasService;

#[derive(Deserialize)]
pub struct LogsQuery {
    pub limit: Option<i64>,
}

pub async fn list(
    Extension(pool): Extension<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>> {
    let aliases = AliasService::list(&pool, user.user_id).await?;

    let response: Vec<AliasResponse> = aliases
        .into_iter()
        .map(|a| AliasResponse {
            id: a.id.to_string(),
            address: a.address,
            status: format!("{:?}", a.status).to_lowercase(),
            created_at: a.created_at,
        })
        .collect();

    Ok(Json(serde_json::json!({ "aliases": response })))
}

pub async fn create(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    user: AuthenticatedUser,
    Json(req): Json<CreateAliasRequest>,
) -> Result<Json<AliasResponse>> {
    let alias = AliasService::create(
        &pool,
        user.user_id,
        req.alias_type,
        req.custom,
        req.ttl_minutes,
        &config.hush_domain,
    )
    .await?;

    Ok(Json(AliasResponse {
        id: alias.id.to_string(),
        address: alias.address,
        status: format!("{:?}", alias.status).to_lowercase(),
        created_at: alias.created_at,
    }))
}

pub async fn toggle(
    Extension(pool): Extension<PgPool>,
    user: AuthenticatedUser,
    Path(id): Path<String>,
    Json(req): Json<ToggleAliasRequest>,
) -> Result<Json<AliasResponse>> {
    let alias_id =
        Uuid::parse_str(&id).map_err(|_| AppError::Validation("Invalid alias ID".to_string()))?;

    let alias = AliasService::toggle(&pool, alias_id, user.user_id, req.enabled).await?;

    Ok(Json(AliasResponse {
        id: alias.id.to_string(),
        address: alias.address,
        status: format!("{:?}", alias.status).to_lowercase(),
        created_at: alias.created_at,
    }))
}

pub async fn delete(
    Extension(pool): Extension<PgPool>,
    user: AuthenticatedUser,
    Path(id): Path<String>,
) -> Result<Json<serde_json::Value>> {
    let alias_id =
        Uuid::parse_str(&id).map_err(|_| AppError::Validation("Invalid alias ID".to_string()))?;

    AliasService::delete(&pool, alias_id, user.user_id).await?;

    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn logs(
    Extension(pool): Extension<PgPool>,
    user: AuthenticatedUser,
    Path(id): Path<String>,
    Query(params): Query<LogsQuery>,
) -> Result<Json<serde_json::Value>> {
    let alias_id =
        Uuid::parse_str(&id).map_err(|_| AppError::Validation("Invalid alias ID".to_string()))?;

    let limit = params.limit.unwrap_or(20);

    let logs = AliasService::get_logs(&pool, alias_id, user.user_id, limit).await?;

    let response: Vec<serde_json::Value> = logs
        .into_iter()
        .map(|log| {
            serde_json::json!({
                "id": log.id.to_string(),
                "from": log.from_email,
                "subject": log.subject,
                "status": format!("{:?}", log.status).to_lowercase(),
                "time": log.created_at,
                "metadata": log.metadata
            })
        })
        .collect();

    Ok(Json(serde_json::json!({ "logs": response })))
}

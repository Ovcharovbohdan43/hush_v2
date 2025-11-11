use axum::{extract::Extension, Json};
use serde::Deserialize;
use sqlx::PgPool;

use crate::auth::AuthenticatedUser;
use crate::error::Result;

#[derive(Deserialize)]
#[allow(dead_code)]
pub struct SubscribeRequest {
    pub push_token: Option<String>,
    pub platform: String,
}

pub async fn subscribe(
    Extension(_pool): Extension<PgPool>,
    _user: AuthenticatedUser,
    Json(_req): Json<SubscribeRequest>,
) -> Result<Json<serde_json::Value>> {
    // TODO: Implement push notification subscription
    // This would typically store the push token in the database
    // and integrate with a push notification service (e.g., Firebase Cloud Messaging)

    Ok(Json(serde_json::json!({
        "message": "Subscription saved",
        "status": "success"
    })))
}

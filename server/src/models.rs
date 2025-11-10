use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Alias {
    pub id: Uuid,
    pub user_id: Uuid,
    pub address: String,
    pub status: AliasStatus,
    pub alias_type: AliasType,
    pub expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "alias_status", rename_all = "lowercase")]
pub enum AliasStatus {
    Active,
    Paused,
    Deleted,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "alias_type", rename_all = "lowercase")]
#[serde(rename_all = "lowercase")]
pub enum AliasType {
    Random,
    Custom,
    Temporary,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct TargetEmail {
    pub id: Uuid,
    pub user_id: Uuid,
    pub email: String,
    pub verified: bool,
    pub verification_token: Option<String>,
    pub verification_expires_at: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct EmailLog {
    pub id: Uuid,
    pub alias_id: Uuid,
    pub from_email: String,
    pub subject: String,
    pub status: EmailStatus,
    pub metadata: Option<serde_json::Value>,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type)]
#[sqlx(type_name = "email_status", rename_all = "lowercase")]
pub enum EmailStatus {
    Forwarded,
    Bounced,
    Rejected,
    Pending,
}

// Request/Response DTOs

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub access_token: String,
    pub refresh_token: String,
    pub expires_in: u64,
}

#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateAliasRequest {
    #[serde(default = "default_alias_type")]
    pub alias_type: AliasType,
    pub custom: Option<String>,
    pub ttl_minutes: Option<u64>,
}

fn default_alias_type() -> AliasType {
    AliasType::Random
}

#[derive(Debug, Serialize)]
pub struct AliasResponse {
    pub id: String,
    pub address: String,
    pub status: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct ToggleAliasRequest {
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
pub struct RequestVerifyRequest {
    pub target: String,
}

#[derive(Debug, Serialize)]
pub struct RequestVerifyResponse {
    pub message: String,
}

#[derive(Debug, Deserialize)]
#[allow(dead_code)]
pub struct VerifyRequest {
    pub token: String,
}


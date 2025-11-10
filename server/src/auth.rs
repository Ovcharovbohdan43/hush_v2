use crate::error::{AppError, Result};
use crate::models::User;
use axum::{
    extract::FromRequestParts,
    http::request::Parts,
    Extension,
};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use sqlx::PgPool;

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: String, // user_id
    pub exp: usize,
    pub iat: usize,
}

pub struct AuthConfig {
    pub secret: String,
    pub expires_in: u64,
}

impl AuthConfig {
    pub fn new(secret: String, expires_in: u64) -> Self {
        Self { secret, expires_in }
    }

    pub fn encode_token(&self, user_id: &str) -> Result<String> {
        let now = chrono::Utc::now().timestamp() as usize;
        let exp = now + self.expires_in as usize;

        let claims = Claims {
            sub: user_id.to_string(),
            exp,
            iat: now,
        };

        encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(self.secret.as_ref()),
        )
        .map_err(|e| AppError::Auth(format!("Failed to encode token: {}", e)))
    }

    pub fn decode_token(&self, token: &str) -> Result<Claims> {
        decode::<Claims>(
            token,
            &DecodingKey::from_secret(self.secret.as_ref()),
            &Validation::default(),
        )
        .map(|data| data.claims)
        .map_err(|e| AppError::Auth(format!("Invalid token: {}", e)))
    }
}

pub async fn verify_password(password: &str, hash: &str) -> Result<bool> {
    bcrypt::verify(password, hash)
        .map_err(|e| AppError::Auth(format!("Password verification failed: {}", e)))
}

pub async fn hash_password(password: &str) -> Result<String> {
    bcrypt::hash(password, bcrypt::DEFAULT_COST)
        .map_err(|e| AppError::Internal(format!("Password hashing failed: {}", e)))
}

pub async fn authenticate_user(
    pool: &PgPool,
    email: &str,
    password: &str,
) -> Result<User> {
    let user = sqlx::query_as::<_, User>(
        "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE email = $1",
    )
    .bind(email)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::Auth("Invalid email or password".to_string()))?;

    let is_valid = verify_password(password, &user.password_hash).await?;
    if !is_valid {
        return Err(AppError::Auth("Invalid email or password".to_string()));
    }

    Ok(user)
}

#[derive(Clone)]
pub struct AuthenticatedUser {
    pub user_id: uuid::Uuid,
}

#[axum::async_trait]
impl<S> FromRequestParts<S> for AuthenticatedUser
where
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self> {
        let Extension(config) = Extension::<crate::config::Config>::from_request_parts(parts, state)
            .await
            .map_err(|_| AppError::Auth("Config not found".to_string()))?;

        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|h| h.to_str().ok())
            .ok_or_else(|| AppError::Auth("Missing Authorization header".to_string()))?;

        if !auth_header.starts_with("Bearer ") {
            return Err(AppError::Auth("Invalid Authorization header format".to_string()));
        }

        let token = &auth_header[7..];
        let auth_config = AuthConfig::new(config.jwt_secret.clone(), config.jwt_expires_in);
        let claims = auth_config.decode_token(token)?;

        let user_id = uuid::Uuid::parse_str(&claims.sub)
            .map_err(|_| AppError::Auth("Invalid user ID in token".to_string()))?;

        Ok(AuthenticatedUser { user_id })
    }
}


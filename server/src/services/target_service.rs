use crate::error::{AppError, Result};
use crate::models::TargetEmail;
use sqlx::PgPool;
use uuid::Uuid;

pub struct TargetService;

impl TargetService {
    pub async fn get_current(pool: &PgPool, user_id: Uuid) -> Result<Option<TargetEmail>> {
        let target = sqlx::query_as::<_, TargetEmail>(
            "SELECT * FROM target_emails WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
        )
        .bind(user_id)
        .fetch_optional(pool)
        .await?;

        Ok(target)
    }

    pub async fn create_or_update(
        pool: &PgPool,
        user_id: Uuid,
        email: &str,
    ) -> Result<TargetEmail> {
        // Check if target already exists
        let existing = Self::get_current(pool, user_id).await?;

        let verification_token = Uuid::new_v4().to_string();
        let expires_at = chrono::Utc::now() + chrono::Duration::hours(24);

        let target = if let Some(existing) = existing {
            // Update existing
            sqlx::query_as::<_, TargetEmail>(
                r#"
                UPDATE target_emails
                SET email = $1, verified = false, verification_token = $2, verification_expires_at = $3, updated_at = NOW()
                WHERE id = $4
                RETURNING *
                "#,
            )
            .bind(email)
            .bind(&verification_token)
            .bind(expires_at)
            .bind(existing.id)
            .fetch_one(pool)
            .await?
        } else {
            // Create new
            sqlx::query_as::<_, TargetEmail>(
                r#"
                INSERT INTO target_emails (user_id, email, verified, verification_token, verification_expires_at)
                VALUES ($1, $2, false, $3, $4)
                RETURNING *
                "#,
            )
            .bind(user_id)
            .bind(email)
            .bind(&verification_token)
            .bind(expires_at)
            .fetch_one(pool)
            .await?
        };

        Ok(target)
    }

    pub async fn verify(pool: &PgPool, token: &str) -> Result<TargetEmail> {
        let target = sqlx::query_as::<_, TargetEmail>(
            r#"
            UPDATE target_emails
            SET verified = true, verification_token = NULL, verification_expires_at = NULL, updated_at = NOW()
            WHERE verification_token = $1 AND verification_expires_at > NOW()
            RETURNING *
            "#,
        )
        .bind(token)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::Auth("Invalid or expired verification token".to_string()))?;

        Ok(target)
    }
}


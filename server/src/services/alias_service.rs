use crate::error::{AppError, Result};
use crate::models::{Alias, AliasStatus, AliasType, EmailLog};
use chrono::Utc;
use sqlx::PgPool;
use uuid::Uuid;

pub struct AliasService;

impl AliasService {
    pub async fn create(
        pool: &PgPool,
        user_id: Uuid,
        alias_type: AliasType,
        custom: Option<String>,
        ttl_minutes: Option<u64>,
        hush_domain: &str,
    ) -> Result<Alias> {
        let address = match alias_type {
            AliasType::Random => {
                let uuid_str = Uuid::new_v4().to_string();
                let random_part = format!("hush-{}", &uuid_str[..8]);
                format!("{}@{}", random_part, hush_domain)
            }
            AliasType::Custom => {
                let custom_part = custom.ok_or_else(|| {
                    AppError::Validation("Custom alias requires 'custom' field".to_string())
                })?;
                format!("{}@{}", custom_part, hush_domain)
            }
            AliasType::Temporary => {
                let uuid_str = Uuid::new_v4().to_string();
                let random_part = format!("temp-{}", &uuid_str[..8]);
                format!("{}@{}", random_part, hush_domain)
            }
        };

        // Check if address already exists
        let existing = sqlx::query_as::<_, Alias>(
            "SELECT * FROM aliases WHERE address = $1 AND status != 'deleted'",
        )
        .bind(&address)
        .fetch_optional(pool)
        .await?;

        if existing.is_some() {
            return Err(AppError::Validation("Alias already exists".to_string()));
        }

        let expires_at = ttl_minutes.map(|ttl| Utc::now() + chrono::Duration::minutes(ttl as i64));

        let alias = sqlx::query_as::<_, Alias>(
            r#"
            INSERT INTO aliases (user_id, address, status, alias_type, expires_at)
            VALUES ($1, $2, 'active', $3, $4)
            RETURNING *
            "#,
        )
        .bind(user_id)
        .bind(&address)
        .bind(&alias_type)
        .bind(expires_at)
        .fetch_one(pool)
        .await?;

        Ok(alias)
    }

    pub async fn list(pool: &PgPool, user_id: Uuid) -> Result<Vec<Alias>> {
        let aliases = sqlx::query_as::<_, Alias>(
            "SELECT * FROM aliases WHERE user_id = $1 AND status != 'deleted' ORDER BY created_at DESC",
        )
        .bind(user_id)
        .fetch_all(pool)
        .await?;

        Ok(aliases)
    }

    pub async fn get_by_id(pool: &PgPool, alias_id: Uuid, user_id: Uuid) -> Result<Alias> {
        let alias = sqlx::query_as::<_, Alias>(
            "SELECT * FROM aliases WHERE id = $1 AND user_id = $2",
        )
        .bind(alias_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Alias not found".to_string()))?;

        Ok(alias)
    }

    pub async fn toggle(pool: &PgPool, alias_id: Uuid, user_id: Uuid, enabled: bool) -> Result<Alias> {
        let status = if enabled {
            AliasStatus::Active
        } else {
            AliasStatus::Paused
        };

        let alias = sqlx::query_as::<_, Alias>(
            r#"
            UPDATE aliases
            SET status = $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
            RETURNING *
            "#,
        )
        .bind(&status)
        .bind(alias_id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Alias not found".to_string()))?;

        Ok(alias)
    }

    pub async fn delete(pool: &PgPool, alias_id: Uuid, user_id: Uuid) -> Result<()> {
        let result = sqlx::query(
            r#"
            UPDATE aliases
            SET status = 'deleted', updated_at = NOW()
            WHERE id = $1 AND user_id = $2
            "#,
        )
        .bind(alias_id)
        .bind(user_id)
        .execute(pool)
        .await?;

        if result.rows_affected() == 0 {
            return Err(AppError::NotFound("Alias not found".to_string()));
        }

        Ok(())
    }

    pub async fn get_logs(
        pool: &PgPool,
        alias_id: Uuid,
        user_id: Uuid,
        limit: i64,
    ) -> Result<Vec<EmailLog>> {
        // Verify alias belongs to user
        let _alias = Self::get_by_id(pool, alias_id, user_id).await?;

        let logs = sqlx::query_as::<_, EmailLog>(
            r#"
            SELECT el.*
            FROM email_logs el
            JOIN aliases a ON el.alias_id = a.id
            WHERE el.alias_id = $1 AND a.user_id = $2
            ORDER BY el.created_at DESC
            LIMIT $3
            "#,
        )
        .bind(alias_id)
        .bind(user_id)
        .bind(limit)
        .fetch_all(pool)
        .await?;

        Ok(logs)
    }

    /// Find alias by email address (for email forwarding)
    pub async fn find_by_address(pool: &PgPool, address: &str) -> Result<Option<Alias>> {
        let alias = sqlx::query_as::<_, Alias>(
            r#"
            SELECT * FROM aliases 
            WHERE address = $1 
            AND status = 'active'
            AND (expires_at IS NULL OR expires_at > NOW())
            LIMIT 1
            "#,
        )
        .bind(address)
        .fetch_optional(pool)
        .await?;

        Ok(alias)
    }
}


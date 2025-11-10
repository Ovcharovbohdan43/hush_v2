use axum::{
    extract::{Extension, Form, Json as JsonExtractor},
    Json,
};
use serde::Deserialize;
use sqlx::PgPool;
use tracing::{error, info, warn};
use uuid::Uuid;

use crate::config::Config;
use crate::error::Result;
use crate::models::EmailStatus;
use crate::services::{AliasService, EmailService, TargetService};

/// Webhook payload from email provider (Mailgun/SendGrid format)
#[derive(Debug, Deserialize)]
pub struct IncomingEmailWebhook {
    /// Recipient email address (alias)
    #[serde(rename = "recipient")]
    pub recipient: String,
    
    /// Sender email address
    #[serde(rename = "sender")]
    pub sender: String,
    
    /// Email subject
    #[serde(rename = "subject", default)]
    pub subject: String,
    
    /// Plain text body
    #[serde(rename = "body-plain", default)]
    pub body_plain: Option<String>,
    
    /// HTML body
    #[serde(rename = "body-html", default)]
    pub body_html: Option<String>,
    
    /// Message ID
    #[serde(rename = "Message-Id", default)]
    pub message_id: Option<String>,
    
    /// Additional headers (as string)
    #[serde(rename = "message-headers", default)]
    pub message_headers: Option<String>,
    
    /// Attachment count
    #[serde(rename = "attachment-count", default)]
    pub attachment_count: Option<u32>,
}

/// Alternative format for SendGrid webhook
#[derive(Debug, Deserialize)]
pub struct SendGridWebhook {
    pub to: String,
    pub from: String,
    pub subject: String,
    pub text: Option<String>,
    pub html: Option<String>,
    #[serde(rename = "message-id")]
    pub message_id: Option<String>,
}

/// Process incoming email webhook (Mailgun format - form-urlencoded)
pub async fn handle_incoming_email(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    Form(payload): Form<IncomingEmailWebhook>,
) -> Result<Json<serde_json::Value>> {
    process_incoming_email(pool, config, payload).await
}

/// Process incoming email webhook (JSON format)
pub async fn handle_incoming_email_json(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    JsonExtractor(payload): JsonExtractor<IncomingEmailWebhook>,
) -> Result<Json<serde_json::Value>> {
    process_incoming_email(pool, config, payload).await
}

/// Internal function to process incoming email
async fn process_incoming_email(
    pool: PgPool,
    config: Config,
    payload: IncomingEmailWebhook,
) -> Result<Json<serde_json::Value>> {
    info!(
        "Received incoming email: {} -> {}",
        payload.sender, payload.recipient
    );

    // Normalize recipient address (lowercase)
    let recipient = payload.recipient.to_lowercase().trim().to_string();
    let sender = payload.sender.to_lowercase().trim().to_string();

    // Find alias by recipient address
    let alias = match AliasService::find_by_address(&pool, &recipient).await? {
        Some(a) => a,
        None => {
            warn!("No active alias found for: {}", recipient);
            return Ok(Json(serde_json::json!({
                "status": "ignored",
                "reason": "alias_not_found"
            })));
        }
    };

    info!("Found alias: {} (user_id: {})", alias.address, alias.user_id);

    // Get target email for the user
    let target = match TargetService::get_current(&pool, alias.user_id).await? {
        Some(t) if t.verified => t,
        Some(_) => {
            warn!("Target email not verified for user: {}", alias.user_id);
            // Log as rejected
            log_email(
                &pool,
                alias.id,
                &sender,
                &payload.subject,
                EmailStatus::Rejected,
                Some(serde_json::json!({
                    "reason": "target_email_not_verified"
                })),
            )
            .await?;

            return Ok(Json(serde_json::json!({
                "status": "rejected",
                "reason": "target_email_not_verified"
            })));
        }
        None => {
            warn!("No target email set for user: {}", alias.user_id);
            // Log as rejected
            log_email(
                &pool,
                alias.id,
                &sender,
                &payload.subject,
                EmailStatus::Rejected,
                Some(serde_json::json!({
                    "reason": "no_target_email"
                })),
            )
            .await?;

            return Ok(Json(serde_json::json!({
                "status": "rejected",
                "reason": "no_target_email"
            })));
        }
    };

    // Forward email to target address
    let forward_result = EmailService::forward_email(
        &config,
        &sender,
        &target.email,
        &payload.subject,
        payload.body_plain.as_deref(),
        payload.body_html.as_deref(),
        Some(&sender), // Reply-To should be original sender
    )
    .await;

    match forward_result {
        Ok(_) => {
            info!("Email forwarded successfully: {} -> {}", recipient, target.email);

            // Log as forwarded
            log_email(
                &pool,
                alias.id,
                &sender,
                &payload.subject,
                EmailStatus::Forwarded,
                Some(serde_json::json!({
                    "target_email": target.email,
                    "message_id": payload.message_id
                })),
            )
            .await?;

            Ok(Json(serde_json::json!({
                "status": "forwarded",
                "target": target.email
            })))
        }
        Err(e) => {
            error!("Failed to forward email: {}", e);

            // Log as pending (will retry later)
            log_email(
                &pool,
                alias.id,
                &sender,
                &payload.subject,
                EmailStatus::Pending,
                Some(serde_json::json!({
                    "error": e.to_string(),
                    "target_email": target.email
                })),
            )
            .await?;

            Err(e)
        }
    }
}

/// Handle SendGrid webhook format
pub async fn handle_sendgrid_webhook(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    JsonExtractor(payload): JsonExtractor<SendGridWebhook>,
) -> Result<Json<serde_json::Value>> {
    // Convert SendGrid format to our format
    let incoming = IncomingEmailWebhook {
        recipient: payload.to,
        sender: payload.from,
        subject: payload.subject,
        body_plain: payload.text,
        body_html: payload.html,
        message_id: payload.message_id,
        message_headers: None,
        attachment_count: None,
    };

    // Use form extractor by converting to Form
    // For now, we'll process it directly
    let recipient = incoming.recipient.to_lowercase().trim().to_string();
    let sender = incoming.sender.to_lowercase().trim().to_string();

    let alias = match AliasService::find_by_address(&pool, &recipient).await? {
        Some(a) => a,
        None => {
            return Ok(Json(serde_json::json!({
                "status": "ignored",
                "reason": "alias_not_found"
            })));
        }
    };

    let target = match TargetService::get_current(&pool, alias.user_id).await? {
        Some(t) if t.verified => t,
        _ => {
            return Ok(Json(serde_json::json!({
                "status": "rejected",
                "reason": "target_not_verified"
            })));
        }
    };

    EmailService::forward_email(
        &config,
        &sender,
        &target.email,
        &incoming.subject,
        incoming.body_plain.as_deref(),
        incoming.body_html.as_deref(),
        Some(&sender),
    )
    .await?;

    log_email(
        &pool,
        alias.id,
        &sender,
        &incoming.subject,
        EmailStatus::Forwarded,
        Some(serde_json::json!({
            "target_email": target.email
        })),
    )
    .await?;

    Ok(Json(serde_json::json!({
        "status": "forwarded",
        "target": target.email
    })))
}

/// Log email event to database
async fn log_email(
    pool: &PgPool,
    alias_id: Uuid,
    from_email: &str,
    subject: &str,
    status: EmailStatus,
    metadata: Option<serde_json::Value>,
) -> Result<()> {
    sqlx::query(
        r#"
        INSERT INTO email_logs (alias_id, from_email, subject, status, metadata)
        VALUES ($1, $2, $3, $4, $5)
        "#,
    )
    .bind(alias_id)
    .bind(from_email)
    .bind(subject)
    .bind(&status)
    .bind(metadata)
    .execute(pool)
    .await?;

    Ok(())
}


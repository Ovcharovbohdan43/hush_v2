use axum::{
    extract::{Extension, Json as JsonExtractor, Multipart, Request},
    Json,
};
use base64::{engine::general_purpose, Engine as _};
use serde::Deserialize;
use sqlx::PgPool;
use std::collections::HashMap;
use tracing::{debug, error, info, warn};
use uuid::Uuid;

use crate::config::Config;
use crate::error::{AppError, Result};
use crate::models::EmailStatus;
use crate::services::{AliasService, EmailService, TargetService};
use crate::webhook_security::{verify_webhook_security, WebhookProvider};

/// Bounce detection result
#[derive(Debug, Clone)]
pub struct BounceInfo {
    pub is_bounce: bool,
    pub bounce_type: Option<String>,
    pub bounce_reason: Option<String>,
    pub failed_recipient: Option<String>,
}

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

/// Email attachment structure
#[derive(Debug, Clone)]
pub struct EmailAttachment {
    pub filename: String,
    pub content_type: String,
    pub data: Vec<u8>,
    pub size: usize,
}

/// Brevo webhook email address representation
#[derive(Debug, Deserialize)]
pub struct BrevoAddress {
    pub email: String,
    #[serde(default)]
    pub name: Option<String>,
}

/// Brevo attachment representation
#[derive(Debug, Deserialize)]
pub struct BrevoAttachmentPayload {
    #[serde(alias = "name")]
    #[serde(alias = "filename")]
    pub filename: Option<String>,
    #[serde(alias = "contentType")]
    #[serde(alias = "type")]
    pub content_type: Option<String>,
    /// Base64 encoded content
    #[serde(alias = "content")]
    #[serde(alias = "base64")]
    pub content_base64: Option<String>,
    #[serde(default)]
    pub size: Option<usize>,
    #[serde(default)]
    pub url: Option<String>,
}

/// Brevo inbound webhook payload
#[derive(Debug, Deserialize)]
pub struct BrevoWebhookPayload {
    pub from: BrevoAddress,
    #[serde(default)]
    pub to: Vec<BrevoAddress>,
    #[serde(default)]
    pub cc: Vec<BrevoAddress>,
    #[serde(default)]
    pub subject: String,
    #[serde(default)]
    pub text: Option<String>,
    #[serde(default)]
    pub html: Option<String>,
    #[serde(alias = "headers")]
    #[serde(default)]
    pub headers: Option<serde_json::Value>,
    #[serde(alias = "message-id")]
    #[serde(alias = "messageId")]
    #[serde(default)]
    pub message_id: Option<String>,
    #[serde(default)]
    pub attachments: Vec<BrevoAttachmentPayload>,
}

/// Process incoming email webhook (Mailgun format - multipart/form-data with attachments)
pub async fn handle_incoming_email(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    request: Request,
    mut multipart: Multipart,
) -> Result<Json<serde_json::Value>> {
    info!("=== MAILGUN WEBHOOK RECEIVED ===");
    
    // Verify webhook security before processing
    info!("Verifying webhook security...");
    verify_webhook_security(
        &config.webhook_security,
        WebhookProvider::Mailgun,
        request.headers(),
        request.uri(),
        &[], // Body not available for multipart, but Mailgun signature is in query params/headers
    )
    .await?;
    info!("Webhook security verified");
    
    let mut form_data: HashMap<String, String> = HashMap::new();
    let mut attachments: Vec<EmailAttachment> = Vec::new();

    // Parse multipart form data
    while let Some(field) = multipart.next_field().await.map_err(|e| {
        error!("Failed to parse multipart field: {}", e);
        AppError::Validation(format!("Failed to parse multipart: {}", e))
    })? {
        let field_name = field.name().unwrap_or("").to_string();
        let file_name = field.file_name().map(|name| name.to_string());
        let content_type = field.content_type().map(|ct| ct.to_string());
        let field_data = field.bytes().await.map_err(|e| {
            error!("Failed to read field data: {}", e);
            AppError::Validation(format!("Failed to read field: {}", e))
        })?;

        // Check if this is an attachment field (Mailgun uses "attachment-1", "attachment-2", etc.)
        if field_name.starts_with("attachment") {
            let filename =
                file_name.unwrap_or_else(|| format!("attachment_{}.bin", attachments.len() + 1));

            let content_type =
                content_type.unwrap_or_else(|| "application/octet-stream".to_string());

            let data = field_data.to_vec();
            let size = data.len();

            // Check attachment size limit
            if size as u64 > config.max_attachment_size {
                warn!(
                    "Attachment {} exceeds size limit: {} > {}",
                    filename, size, config.max_attachment_size
                );
                continue; // Skip oversized attachments
            }

            attachments.push(EmailAttachment {
                filename,
                content_type,
                data,
                size,
            });
        } else {
            // Regular form field
            let value = String::from_utf8(field_data.to_vec()).map_err(|e| {
                error!("Failed to decode field value: {}", e);
                AppError::Validation(format!("Invalid UTF-8 in field {}: {}", field_name, e))
            })?;
            form_data.insert(field_name, value);
        }
    }

    // Build IncomingEmailWebhook from form data
    let payload = IncomingEmailWebhook {
        recipient: form_data
            .get("recipient")
            .cloned()
            .unwrap_or_else(|| "".to_string()),
        sender: form_data
            .get("sender")
            .cloned()
            .unwrap_or_else(|| "".to_string()),
        subject: form_data
            .get("subject")
            .cloned()
            .unwrap_or_else(|| "".to_string()),
        body_plain: form_data.get("body-plain").cloned(),
        body_html: form_data.get("body-html").cloned(),
        message_id: form_data.get("Message-Id").cloned(),
        message_headers: form_data.get("message-headers").cloned(),
        attachment_count: Some(attachments.len() as u32),
    };
    
    info!("Parsed Mailgun webhook data:\n  Recipient: {}\n  Sender: {}\n  Subject: {}\n  Attachments: {}", 
        payload.recipient, payload.sender, payload.subject, attachments.len());

    process_incoming_email_with_attachments(pool, config, payload, attachments).await
}

/// Process incoming email webhook (JSON format)
/// Note: JSON format doesn't support attachments directly - attachments would need to be sent as base64 or URLs
pub async fn handle_incoming_email_json(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    request: Request,
    JsonExtractor(payload): JsonExtractor<IncomingEmailWebhook>,
) -> Result<Json<serde_json::Value>> {
    // Verify webhook security before processing
    // For JSON format, we need the body for signature verification
    // But since we've already consumed it, we'll verify using headers/query params only
    verify_webhook_security(
        &config.webhook_security,
        WebhookProvider::Mailgun,
        request.headers(),
        request.uri(),
        &[], // Body already consumed, but Mailgun signature verification uses query params
    )
    .await?;

    // JSON format doesn't include attachments, so pass empty vector
    process_incoming_email_with_attachments(pool, config, payload, Vec::new()).await
}

/// Process Brevo webhook (JSON with base64 attachments)
pub async fn handle_brevo_webhook(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    request: Request,
    JsonExtractor(mut payload): JsonExtractor<BrevoWebhookPayload>,
) -> Result<Json<serde_json::Value>> {
    info!("=== BREVO WEBHOOK RECEIVED ===");
    info!("From: {:?}", payload.from);
    info!("To: {:?}", payload.to);
    info!("CC: {:?}", payload.cc);
    info!("Subject: {}", payload.subject);
    info!("Message ID: {:?}", payload.message_id);
    
    // Verify webhook security before processing
    info!("Verifying webhook security...");
    verify_webhook_security(
        &config.webhook_security,
        WebhookProvider::Brevo,
        request.headers(),
        request.uri(),
        &[], // Body already consumed, but Brevo uses secret in headers/query params
    )
    .await?;
    info!("Webhook security verified");
    
    let sender = payload.from.email.clone();
    info!("Extracted sender: {}", sender);
    if let Some(name) = payload.from.name.as_ref() {
        debug!("Brevo webhook sender display name: {}", name);
    }

    let recipient_address = payload
        .to
        .first()
        .or_else(|| payload.cc.first())
        .ok_or_else(|| {
            warn!("Brevo webhook payload missing recipients");
            AppError::Validation("Brevo payload missing recipient list".to_string())
        })?;
    let recipient = recipient_address.email.clone();
    
    info!("Extracted recipient: '{}'", recipient);

    let mut attachments: Vec<EmailAttachment> = Vec::new();
    let attachments_payload = std::mem::take(&mut payload.attachments);

    for (index, attachment_payload) in attachments_payload.into_iter().enumerate() {
        let BrevoAttachmentPayload {
            filename,
            content_type,
            content_base64,
            size,
            url,
        } = attachment_payload;

        let default_filename = format!("attachment_{}.bin", index + 1);
        let resolved_filename = filename
            .as_ref()
            .cloned()
            .unwrap_or_else(|| default_filename.clone());

        if let Some(size_hint) = size {
            if size_hint as u64 > config.max_attachment_size {
                warn!(
                    "Brevo attachment '{}' exceeds size limit hint: {} > {}. Skipping.",
                    resolved_filename, size_hint, config.max_attachment_size
                );
                continue;
            }
        }

        let filename = filename.unwrap_or(default_filename);

        let base64_content = match content_base64 {
            Some(content) => content,
            None => {
                if let Some(url) = url {
                    warn!(
                        "Brevo attachment '{}' missing inline content, provided URL: {}. Skipping.",
                        filename, url
                    );
                } else {
                    warn!(
                        "Brevo attachment '{}' missing content (no base64 data). Skipping.",
                        filename
                    );
                }
                continue;
            }
        };

        let cleaned_content: String = base64_content
            .chars()
            .filter(|c| !c.is_whitespace())
            .collect();

        let data = match general_purpose::STANDARD.decode(cleaned_content) {
            Ok(bytes) => bytes,
            Err(e) => {
                warn!(
                    "Failed to decode Brevo attachment '{}': {}. Skipping.",
                    filename, e
                );
                continue;
            }
        };

        let size = data.len();
        if size as u64 > config.max_attachment_size {
            warn!(
                "Brevo attachment '{}' exceeds size limit: {} > {}. Skipping.",
                filename, size, config.max_attachment_size
            );
            continue;
        }

        let content_type = content_type.unwrap_or_else(|| "application/octet-stream".to_string());

        attachments.push(EmailAttachment {
            filename,
            content_type,
            data,
            size,
        });
    }

    let message_headers = payload
        .headers
        .as_ref()
        .and_then(|headers| serde_json::to_string(headers).ok());

    let incoming = IncomingEmailWebhook {
        recipient,
        sender,
        subject: payload.subject,
        body_plain: payload.text,
        body_html: payload.html,
        message_id: payload.message_id,
        message_headers,
        attachment_count: Some(attachments.len() as u32),
    };
    
    info!("Built IncomingEmailWebhook for Brevo:\n  Recipient: {}\n  Sender: {}\n  Subject: {}\n  Attachments: {}", 
        incoming.recipient, incoming.sender, incoming.subject, attachments.len());

    process_incoming_email_with_attachments(pool, config, incoming, attachments).await
}

/// Internal function to process incoming email with attachments
async fn process_incoming_email_with_attachments(
    pool: PgPool,
    config: Config,
    payload: IncomingEmailWebhook,
    attachments: Vec<EmailAttachment>,
) -> Result<Json<serde_json::Value>> {
    info!(
        "=== INCOMING EMAIL START ===\nFrom: {}\nTo: {}\nSubject: {}\nAttachments: {}",
        payload.sender, payload.recipient, payload.subject, attachments.len()
    );

    // Normalize recipient address (lowercase)
    let recipient = payload.recipient.to_lowercase().trim().to_string();
    let sender = payload.sender.to_lowercase().trim().to_string();
    
    info!("Normalized recipient: '{}', sender: '{}'", recipient, sender);

    // Detect if this is a bounce message
    let bounce_info = detect_bounce(
        &sender,
        &payload.subject,
        payload.body_plain.as_deref(),
        payload.body_html.as_deref(),
        payload.message_headers.as_deref(),
    );

    // If it's a bounce, handle it separately
    if bounce_info.is_bounce {
        info!(
            "Detected bounce message: {} -> {} (type: {:?})",
            sender, recipient, bounce_info.bounce_type
        );

        // Find alias by recipient address
        if let Ok(Some(alias)) = AliasService::find_by_address(&pool, &recipient).await {
            // Log bounce
            log_email(
                &pool,
                alias.id,
                &sender,
                &payload.subject,
                EmailStatus::Bounced,
                Some(serde_json::json!({
                    "bounce_type": bounce_info.bounce_type,
                    "bounce_reason": bounce_info.bounce_reason,
                    "failed_recipient": bounce_info.failed_recipient,
                    "message_id": payload.message_id,
                })),
            )
            .await?;

            // Notify user about bounce
            if let Err(e) =
                notify_user_of_bounce(&pool, alias.user_id, &alias.address, &bounce_info, &config)
                    .await
            {
                warn!("Failed to send bounce notification: {}", e);
                // Don't fail the request if notification fails
            }

            return Ok(Json(serde_json::json!({
                "status": "bounced",
                "bounce_type": bounce_info.bounce_type,
                "reason": bounce_info.bounce_reason
            })));
        } else {
            // Bounce for unknown alias - just log and ignore
            warn!("Bounce message for unknown alias: {}", recipient);
            return Ok(Json(serde_json::json!({
                "status": "ignored",
                "reason": "alias_not_found"
            })));
        }
    }

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

    info!(
        "Found alias: {} (user_id: {}, status: {:?})",
        alias.address, alias.user_id, alias.status
    );

    // Get target email for the user
    info!("Looking up target email for user_id: {}", alias.user_id);
    let target = match TargetService::get_current(&pool, alias.user_id).await? {
        Some(t) if t.verified => {
            info!("Found verified target email: {} for user: {}", t.email, alias.user_id);
            t
        },
        Some(t) => {
            warn!("Target email exists but NOT verified: {} (user_id: {})", t.email, alias.user_id);
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

    // Forward email to target address with attachments
    info!(
        "Attempting to forward email:\n  From: {}\n  To: {}\n  Subject: {}\n  Body plain: {} bytes\n  Body HTML: {} bytes\n  Attachments: {}",
        sender,
        target.email,
        payload.subject,
        payload.body_plain.as_ref().map(|b| b.len()).unwrap_or(0),
        payload.body_html.as_ref().map(|b| b.len()).unwrap_or(0),
        attachments.len()
    );
    
    let forward_result = EmailService::forward_email_with_attachments(
        &config,
        &sender,
        &target.email,
        &payload.subject,
        payload.body_plain.as_deref(),
        payload.body_html.as_deref(),
        Some(&sender), // Reply-To should be original sender
        &attachments,
    )
    .await;

    match forward_result {
        Ok(_) => {
            info!(
                "✓✓✓ Email forwarded successfully: {} -> {} ✓✓✓",
                recipient, target.email
            );

            // Log as forwarded with attachment info
            log_email(
                &pool,
                alias.id,
                &sender,
                &payload.subject,
                EmailStatus::Forwarded,
                Some(serde_json::json!({
                    "target_email": target.email,
                    "message_id": payload.message_id,
                    "attachment_count": attachments.len(),
                    "webhook_attachment_count": payload.attachment_count,
                    "webhook_message_headers": payload.message_headers.clone(),
                    "attachments": attachments.iter().map(|a| serde_json::json!({
                        "filename": a.filename,
                        "size": a.size,
                        "content_type": a.content_type
                    })).collect::<Vec<_>>()
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
    request: Request,
    JsonExtractor(payload): JsonExtractor<SendGridWebhook>,
) -> Result<Json<serde_json::Value>> {
    // Verify webhook security before processing
    // Note: For full signature verification, body is needed, but it's already consumed
    // We'll verify IP whitelist and attempt signature verification if possible
    verify_webhook_security(
        &config.webhook_security,
        WebhookProvider::SendGrid,
        request.headers(),
        request.uri(),
        &[], // Body already consumed - signature verification may be limited
    )
    .await?;
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

    // SendGrid webhook doesn't include attachments in JSON format
    // Attachments would need to be fetched separately or sent as base64/URLs
    EmailService::forward_email_with_attachments(
        &config,
        &sender,
        &target.email,
        &incoming.subject,
        incoming.body_plain.as_deref(),
        incoming.body_html.as_deref(),
        Some(&sender),
        &Vec::new(), // No attachments in SendGrid JSON format
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

/// Detect if an incoming email is a bounce message
fn detect_bounce(
    sender: &str,
    subject: &str,
    body_plain: Option<&str>,
    body_html: Option<&str>,
    headers: Option<&str>,
) -> BounceInfo {
    let sender_lower = sender.to_lowercase();
    let subject_lower = subject.to_lowercase();

    // Common bounce sender patterns
    let bounce_senders = [
        "mailer-daemon",
        "postmaster",
        "mail delivery subsystem",
        "mail delivery system",
        "mailer-daemon@",
        "postmaster@",
        "noreply@",
        "no-reply@",
        "donotreply@",
        "bounce@",
        "returned-mail@",
    ];

    // Common bounce subject patterns
    let bounce_subjects = [
        "undelivered mail",
        "mail delivery failed",
        "delivery status notification",
        "delivery failure",
        "returned mail",
        "mail system error",
        "delayed mail",
        "warning: message",
        "failure notice",
        "mail delivery subsystem",
        "returned mail: see transcript",
        "mail delivery failed: returning message to sender",
        "delivery failure:",
        "mail system error -",
        "undeliverable:",
        "returned mail:",
        "bounce notification",
        "delivery error",
    ];

    // Check sender
    let is_bounce_sender = bounce_senders
        .iter()
        .any(|&pattern| sender_lower.contains(pattern));

    // Check subject
    let is_bounce_subject = bounce_subjects
        .iter()
        .any(|&pattern| subject_lower.contains(pattern));

    // Check headers for bounce indicators
    let mut bounce_type: Option<String> = None;
    let mut bounce_reason: Option<String> = None;
    let mut failed_recipient: Option<String> = None;

    if let Some(headers_str) = headers {
        let headers_lower = headers_str.to_lowercase();

        // Check for Return-Path indicating bounce
        if headers_lower.contains("return-path:") || headers_lower.contains("returned-mail") {
            bounce_type = Some("hard_bounce".to_string());
        }

        // Extract failed recipient from headers
        if let Some(start) = headers_lower.find("x-failed-recipients:") {
            let after_colon = start + 20; // Length of "x-failed-recipients:"
            let remaining = &headers_lower[after_colon..];
            let end = remaining
                .find('\n')
                .or_else(|| remaining.find('\r'))
                .unwrap_or(remaining.len());
            let recipient_line = remaining[..end].trim();
            if !recipient_line.is_empty() {
                failed_recipient = Some(recipient_line.to_string());
            }
        }
    }

    // Check body for bounce indicators
    let body_text = body_plain
        .or_else(|| body_html.as_deref())
        .unwrap_or("")
        .to_lowercase();

    if body_text.contains("delivery has failed") || body_text.contains("could not be delivered") {
        bounce_type = Some("hard_bounce".to_string());
    }

    if body_text.contains("delivery delayed") || body_text.contains("temporarily unavailable") {
        bounce_type = Some("soft_bounce".to_string());
    }

    // Extract bounce reason from body
    if body_text.contains("reason:") {
        if let Some(start) = body_text.find("reason:") {
            let reason_text = &body_text[start + 7..];
            let reason = reason_text.lines().next().unwrap_or("").trim().to_string();
            if !reason.is_empty() {
                bounce_reason = Some(reason);
            }
        }
    }

    let is_bounce = is_bounce_sender || is_bounce_subject || bounce_type.is_some();

    BounceInfo {
        is_bounce,
        bounce_type: bounce_type.or_else(|| {
            if is_bounce {
                Some("unknown".to_string())
            } else {
                None
            }
        }),
        bounce_reason,
        failed_recipient,
    }
}

/// Send bounce notification to user
async fn notify_user_of_bounce(
    pool: &PgPool,
    user_id: Uuid,
    alias_address: &str,
    bounce_info: &BounceInfo,
    config: &Config,
) -> Result<()> {
    // Get user email
    let user = sqlx::query_as::<_, crate::models::User>(
        "SELECT id, email, password_hash, created_at, updated_at FROM users WHERE id = $1",
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;

    if let Some(user) = user {
        let bounce_type = bounce_info.bounce_type.as_deref().unwrap_or("unknown");
        let bounce_reason = bounce_info
            .bounce_reason
            .as_deref()
            .unwrap_or("No reason provided");

        let subject = format!("Email delivery failed for alias {}", alias_address);
        let body = format!(
            r#"Hello,

We wanted to let you know that an email sent to your alias {} could not be delivered.

Bounce Type: {}
Reason: {}

Please check if the recipient email address is correct and active.

Best regards,
Hush Team"#,
            alias_address, bounce_type, bounce_reason
        );

        // Send notification email
        EmailService::send_bounce_notification(config, &user.email, &subject, &body).await?;
    }

    Ok(())
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

#[cfg(test)]
mod tests {
    use super::*;
    use base64::engine::general_purpose;

    /// Helper function to create a test Brevo attachment payload
    fn create_brevo_attachment(
        filename: Option<String>,
        content_type: Option<String>,
        content_base64: Option<String>,
        size: Option<usize>,
    ) -> BrevoAttachmentPayload {
        BrevoAttachmentPayload {
            filename,
            content_type,
            content_base64,
            size,
            url: None,
        }
    }

    #[test]
    fn test_brevo_attachment_parsing_simple() {
        // Test parsing a simple attachment with all fields
        let test_content = "Hello, World!";
        let base64_content = general_purpose::STANDARD.encode(test_content.as_bytes());

        let attachment = create_brevo_attachment(
            Some("test.txt".to_string()),
            Some("text/plain".to_string()),
            Some(base64_content.clone()),
            Some(test_content.len()),
        );

        // Verify the attachment structure
        assert_eq!(attachment.filename, Some("test.txt".to_string()));
        assert_eq!(attachment.content_type, Some("text/plain".to_string()));
        assert_eq!(attachment.content_base64, Some(base64_content));
        assert_eq!(attachment.size, Some(test_content.len()));
    }

    #[test]
    fn test_brevo_attachment_base64_decoding() {
        // Test base64 decoding
        let test_content = "Test attachment content";
        let base64_content = general_purpose::STANDARD.encode(test_content.as_bytes());

        let attachment = create_brevo_attachment(
            Some("test.txt".to_string()),
            Some("text/plain".to_string()),
            Some(base64_content),
            None,
        );

        if let Some(content) = attachment.content_base64 {
            let cleaned: String = content.chars().filter(|c| !c.is_whitespace()).collect();
            let decoded = general_purpose::STANDARD.decode(cleaned).unwrap();
            let decoded_str = String::from_utf8(decoded).unwrap();
            assert_eq!(decoded_str, test_content);
        } else {
            panic!("Content should be present");
        }
    }

    #[test]
    fn test_brevo_attachment_base64_with_whitespace() {
        // Test that whitespace is properly removed from base64 content
        let test_content = "Test content";
        let base64_content = general_purpose::STANDARD.encode(test_content.as_bytes());
        // Add whitespace to simulate real-world scenarios
        let base64_with_whitespace =
            format!("{}\n\t{}", &base64_content[..10], &base64_content[10..]);

        let attachment = create_brevo_attachment(
            Some("test.txt".to_string()),
            Some("text/plain".to_string()),
            Some(base64_with_whitespace),
            None,
        );

        if let Some(content) = attachment.content_base64 {
            let cleaned: String = content.chars().filter(|c| !c.is_whitespace()).collect();
            let decoded = general_purpose::STANDARD.decode(cleaned).unwrap();
            let decoded_str = String::from_utf8(decoded).unwrap();
            assert_eq!(decoded_str, test_content);
        } else {
            panic!("Content should be present");
        }
    }

    #[test]
    fn test_brevo_attachment_missing_filename() {
        // Test attachment without filename (should use default)
        let test_content = "Content";
        let base64_content = general_purpose::STANDARD.encode(test_content.as_bytes());

        let attachment = create_brevo_attachment(
            None,
            Some("text/plain".to_string()),
            Some(base64_content),
            None,
        );

        assert_eq!(attachment.filename, None);
    }

    #[test]
    fn test_brevo_attachment_missing_content_type() {
        // Test attachment without content type (should use default)
        let test_content = "Content";
        let base64_content = general_purpose::STANDARD.encode(test_content.as_bytes());

        let attachment = create_brevo_attachment(
            Some("test.bin".to_string()),
            None,
            Some(base64_content),
            None,
        );

        assert_eq!(attachment.content_type, None);
    }

    #[test]
    fn test_brevo_attachment_missing_content() {
        // Test attachment without base64 content (should be skipped in real processing)
        let attachment = create_brevo_attachment(
            Some("test.txt".to_string()),
            Some("text/plain".to_string()),
            None,
            None,
        );

        assert_eq!(attachment.content_base64, None);
    }

    #[test]
    fn test_brevo_attachment_size_limit_check() {
        // Test size limit checking logic
        let large_size = 15_000_000; // 15MB
        let small_size = 1_000; // 1KB

        let large_attachment = create_brevo_attachment(
            Some("large.bin".to_string()),
            Some("application/octet-stream".to_string()),
            Some("dGVzdA==".to_string()), // "test" in base64
            Some(large_size),
        );

        let small_attachment = create_brevo_attachment(
            Some("small.bin".to_string()),
            Some("application/octet-stream".to_string()),
            Some("dGVzdA==".to_string()),
            Some(small_size),
        );

        // Default max_attachment_size is 10MB (10_485_760 bytes)
        let max_size = 10_485_760u64;

        if let Some(size) = large_attachment.size {
            assert!(
                size as u64 > max_size,
                "Large attachment should exceed limit"
            );
        }

        if let Some(size) = small_attachment.size {
            assert!(
                size as u64 <= max_size,
                "Small attachment should be within limit"
            );
        }
    }

    #[test]
    fn test_brevo_attachment_multiple_attachments() {
        // Test parsing multiple attachments
        let attachments = vec![
            create_brevo_attachment(
                Some("file1.txt".to_string()),
                Some("text/plain".to_string()),
                Some(general_purpose::STANDARD.encode("Content 1".as_bytes())),
                None,
            ),
            create_brevo_attachment(
                Some("file2.pdf".to_string()),
                Some("application/pdf".to_string()),
                Some(general_purpose::STANDARD.encode("PDF Content".as_bytes())),
                None,
            ),
            create_brevo_attachment(
                Some("file3.jpg".to_string()),
                Some("image/jpeg".to_string()),
                Some(general_purpose::STANDARD.encode("Image Data".as_bytes())),
                None,
            ),
        ];

        assert_eq!(attachments.len(), 3);
        assert_eq!(attachments[0].filename, Some("file1.txt".to_string()));
        assert_eq!(attachments[1].filename, Some("file2.pdf".to_string()));
        assert_eq!(attachments[2].filename, Some("file3.jpg".to_string()));
    }

    #[test]
    fn test_brevo_attachment_invalid_base64() {
        // Test handling of invalid base64 content
        let invalid_base64 = "!!!Invalid Base64!!!";

        let attachment = create_brevo_attachment(
            Some("test.txt".to_string()),
            Some("text/plain".to_string()),
            Some(invalid_base64.to_string()),
            None,
        );

        if let Some(content) = attachment.content_base64 {
            let cleaned: String = content.chars().filter(|c| !c.is_whitespace()).collect();
            let decode_result = general_purpose::STANDARD.decode(cleaned);
            assert!(
                decode_result.is_err(),
                "Invalid base64 should fail to decode"
            );
        }
    }

    #[test]
    fn test_brevo_webhook_payload_deserialization() {
        // Test deserialization of full Brevo webhook payload
        let json = r#"
        {
            "from": {
                "email": "sender@example.com",
                "name": "Test Sender"
            },
            "to": [
                {
                    "email": "recipient@example.com",
                    "name": "Test Recipient"
                }
            ],
            "subject": "Test Subject",
            "text": "Plain text body",
            "html": "<p>HTML body</p>",
            "message-id": "test-message-id",
            "attachments": [
                {
                    "filename": "test.txt",
                    "contentType": "text/plain",
                    "content": "SGVsbG8gV29ybGQ=",
                    "size": 11
                }
            ]
        }
        "#;

        let payload: std::result::Result<BrevoWebhookPayload, _> = serde_json::from_str(json);
        assert!(payload.is_ok(), "Should deserialize successfully");

        let payload = payload.unwrap();
        assert_eq!(payload.from.email, "sender@example.com");
        assert_eq!(payload.to.len(), 1);
        assert_eq!(payload.to[0].email, "recipient@example.com");
        assert_eq!(payload.subject, "Test Subject");
        assert_eq!(payload.attachments.len(), 1);
        assert_eq!(
            payload.attachments[0].filename,
            Some("test.txt".to_string())
        );
    }

    #[test]
    fn test_brevo_attachment_aliases() {
        // Test that different field name aliases work
        let json1 = r#"
        {
            "name": "test.txt",
            "contentType": "text/plain",
            "content": "SGVsbG8="
        }
        "#;

        let json2 = r#"
        {
            "filename": "test.txt",
            "type": "text/plain",
            "base64": "SGVsbG8="
        }
        "#;

        let attachment1: std::result::Result<BrevoAttachmentPayload, _> =
            serde_json::from_str(json1);
        let attachment2: std::result::Result<BrevoAttachmentPayload, _> =
            serde_json::from_str(json2);

        assert!(attachment1.is_ok(), "Should accept 'name' alias");
        assert!(
            attachment2.is_ok(),
            "Should accept 'filename' and 'type' aliases"
        );

        let att1 = attachment1.unwrap();
        let att2 = attachment2.unwrap();

        assert_eq!(att1.filename, Some("test.txt".to_string()));
        assert_eq!(att2.filename, Some("test.txt".to_string()));
        assert_eq!(att1.content_type, Some("text/plain".to_string()));
        assert_eq!(att2.content_type, Some("text/plain".to_string()));
    }

    #[test]
    fn test_bounce_detection_by_sender() {
        // Test bounce detection by sender
        let bounce_info = detect_bounce(
            "MAILER-DAEMON@example.com",
            "Regular Subject",
            None,
            None,
            None,
        );
        assert!(bounce_info.is_bounce, "Should detect bounce by sender");
    }

    #[test]
    fn test_bounce_detection_by_subject() {
        // Test bounce detection by subject
        let bounce_info = detect_bounce(
            "sender@example.com",
            "Undelivered Mail Returned to Sender",
            None,
            None,
            None,
        );
        assert!(bounce_info.is_bounce, "Should detect bounce by subject");
    }

    #[test]
    fn test_bounce_detection_by_body() {
        // Test bounce detection by body content
        let bounce_info = detect_bounce(
            "sender@example.com",
            "Regular Subject",
            Some("Delivery has failed for the following recipient"),
            None,
            None,
        );
        assert!(bounce_info.is_bounce, "Should detect bounce by body");
        assert_eq!(bounce_info.bounce_type, Some("hard_bounce".to_string()));
    }

    #[test]
    fn test_bounce_detection_soft_bounce() {
        // Test soft bounce detection
        let bounce_info = detect_bounce(
            "sender@example.com",
            "Regular Subject",
            Some("Delivery delayed: temporarily unavailable"),
            None,
            None,
        );
        assert!(bounce_info.is_bounce, "Should detect soft bounce");
        assert_eq!(bounce_info.bounce_type, Some("soft_bounce".to_string()));
    }

    #[test]
    fn test_bounce_detection_by_headers() {
        // Test bounce detection by headers
        let headers = "Return-Path: <>\nX-Failed-Recipients: failed@example.com";
        let bounce_info = detect_bounce(
            "sender@example.com",
            "Regular Subject",
            None,
            None,
            Some(headers),
        );
        assert!(bounce_info.is_bounce, "Should detect bounce by headers");
        assert_eq!(
            bounce_info.failed_recipient,
            Some("failed@example.com".to_string())
        );
    }

    #[test]
    fn test_bounce_detection_non_bounce() {
        // Test that regular emails are not detected as bounce
        let bounce_info = detect_bounce(
            "regular.sender@example.com",
            "Hello, this is a regular email",
            Some("This is a normal email body"),
            None,
            None,
        );
        assert!(
            !bounce_info.is_bounce,
            "Should not detect regular email as bounce"
        );
    }

    #[test]
    fn test_bounce_reason_extraction() {
        // Test extraction of bounce reason
        let bounce_info = detect_bounce(
            "MAILER-DAEMON@example.com",
            "Delivery Failure",
            Some("Reason: User mailbox is full"),
            None,
            None,
        );
        assert!(bounce_info.is_bounce);
        assert_eq!(
            bounce_info.bounce_reason,
            Some("user mailbox is full".to_string())
        );
    }

    #[test]
    fn test_bounce_detection_various_senders() {
        // Test various bounce sender patterns
        let bounce_senders = [
            "postmaster@example.com",
            "mailer-daemon@example.com",
            "bounce@example.com",
            "returned-mail@example.com",
        ];

        for sender in bounce_senders.iter() {
            let bounce_info = detect_bounce(sender, "Subject", None, None, None);
            assert!(
                bounce_info.is_bounce,
                "Should detect bounce for sender: {}",
                sender
            );
        }
    }
}

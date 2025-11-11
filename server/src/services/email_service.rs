use crate::config::Config;
use crate::error::{AppError, Result};
use lettre::{
    message::{header::ContentType, Attachment, Body, MessageBuilder, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
};
use std::str::FromStr;
use tracing::{error, info};

pub struct EmailService;

impl EmailService {
    pub async fn send_verification_email(config: &Config, to: &str, token: &str) -> Result<()> {
        info!("Sending verification email to: {}", to);
        info!("SMTP_FROM value: '{}'", config.smtp_from);
        let verification_url = format!(
            "{}/api/v1/targets/verify?token={}",
            config.api_base_url, token
        );

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }

        let email = MessageBuilder::new()
            .from(from_addr.parse().map_err(|e| {
                error!("Failed to parse SMTP_FROM '{}': {}", from_addr, e);
                AppError::Internal(format!("Invalid from address '{}': {}", from_addr, e))
            })?)
            .to(to.parse().map_err(|e| {
                AppError::Internal(format!("Invalid to address: {}", e))
            })?)
            .subject("Verify your email address for Hush")
            .multipart(
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(format!(
                                "Please verify your email address by clicking the following link:\n\n{}\n\nThis link will expire in 24 hours.",
                                verification_url
                            )),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(format!(
                                r#"
                                <html>
                                <body>
                                    <h2>Verify your email address</h2>
                                    <p>Please click the following link to verify your email address:</p>
                                    <p><a href="{}">Verify Email</a></p>
                                    <p>This link will expire in 24 hours.</p>
                                </body>
                                </html>
                                "#,
                                verification_url
                            )),
                    ),
            )
            .map_err(|e| AppError::Internal(format!("Failed to build email: {}", e)))?;

        let creds = Credentials::new(config.smtp_username.clone(), config.smtp_password.clone());

        // For Brevo and most SMTP servers, we need STARTTLS
        info!(
            "Connecting to SMTP server: {}:{}",
            config.smtp_host, config.smtp_port
        );

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
            .map_err(|e| {
                error!("Failed to create SMTP transport: {}", e);
                AppError::Internal(format!("Failed to create SMTP transport: {}", e))
            })?
            .port(config.smtp_port)
            .credentials(creds)
            .build();

        mailer.send(email).await.map_err(|e| {
            error!("Failed to send email: {}", e);
            AppError::Internal(format!("Failed to send email: {}", e))
        })?;

        info!("Verification email sent successfully to: {}", to);
        Ok(())
    }

    /// Forward email to target address
    pub async fn forward_email(
        config: &Config,
        from: &str,
        to: &str,
        subject: &str,
        text_body: Option<&str>,
        html_body: Option<&str>,
        reply_to: Option<&str>,
    ) -> Result<()> {
        info!("Forwarding email from {} to {}", from, to);

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }

        let mut builder = MessageBuilder::new()
            .from(from_addr.parse().map_err(|e| {
                error!("Failed to parse SMTP_FROM '{}': {}", from_addr, e);
                AppError::Internal(format!("Invalid from address '{}': {}", from_addr, e))
            })?)
            .to(to
                .parse()
                .map_err(|e| AppError::Internal(format!("Invalid to address: {}", e)))?)
            .subject(format!("Fwd: {}", subject));

        // Set Reply-To header if provided
        if let Some(reply_to_addr) = reply_to {
            builder = builder.reply_to(
                reply_to_addr
                    .parse()
                    .map_err(|e| AppError::Internal(format!("Invalid reply-to address: {}", e)))?,
            );
        }

        // Build multipart message
        let multipart = if let Some(html) = html_body {
            // Both text and HTML
            if let Some(text) = text_body {
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text.to_string()),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html.to_string()),
                    )
            } else {
                // Only HTML
                MultiPart::alternative().singlepart(
                    SinglePart::builder()
                        .header(ContentType::TEXT_HTML)
                        .body(html.to_string()),
                )
            }
        } else if let Some(text) = text_body {
            // Only text
            MultiPart::alternative().singlepart(
                SinglePart::builder()
                    .header(ContentType::TEXT_PLAIN)
                    .body(text.to_string()),
            )
        } else {
            // No body provided
            MultiPart::alternative().singlepart(
                SinglePart::builder()
                    .header(ContentType::TEXT_PLAIN)
                    .body("(No content)".to_string()),
            )
        };

        let email = builder
            .multipart(multipart)
            .map_err(|e| AppError::Internal(format!("Failed to build email: {}", e)))?;

        let creds = Credentials::new(config.smtp_username.clone(), config.smtp_password.clone());

        info!(
            "Connecting to SMTP server: {}:{}",
            config.smtp_host, config.smtp_port
        );

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
            .map_err(|e| {
                error!("Failed to create SMTP transport: {}", e);
                AppError::Internal(format!("Failed to create SMTP transport: {}", e))
            })?
            .port(config.smtp_port)
            .credentials(creds)
            .build();

        mailer.send(email).await.map_err(|e| {
            error!("Failed to forward email: {}", e);
            AppError::Internal(format!("Failed to forward email: {}", e))
        })?;

        info!("Email forwarded successfully from {} to {}", from, to);
        Ok(())
    }

    /// Forward email to target address with attachments
    pub async fn forward_email_with_attachments(
        config: &Config,
        from: &str,
        to: &str,
        subject: &str,
        text_body: Option<&str>,
        html_body: Option<&str>,
        reply_to: Option<&str>,
        attachments: &[crate::api::incoming::EmailAttachment],
    ) -> Result<()> {
        info!(
            "Forwarding email from {} to {} with {} attachments",
            from,
            to,
            attachments.len()
        );

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }

        let mut builder = MessageBuilder::new()
            .from(from_addr.parse().map_err(|e| {
                error!("Failed to parse SMTP_FROM '{}': {}", from_addr, e);
                AppError::Internal(format!("Invalid from address '{}': {}", from_addr, e))
            })?)
            .to(to
                .parse()
                .map_err(|e| AppError::Internal(format!("Invalid to address: {}", e)))?)
            .subject(format!("Fwd: {}", subject));

        // Set Reply-To header if provided
        if let Some(reply_to_addr) = reply_to {
            builder = builder.reply_to(
                reply_to_addr
                    .parse()
                    .map_err(|e| AppError::Internal(format!("Invalid reply-to address: {}", e)))?,
            );
        }

        // Build multipart message with body and attachments
        let mut multipart = if let Some(html) = html_body {
            // Both text and HTML
            if let Some(text) = text_body {
                MultiPart::alternative()
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_PLAIN)
                            .body(text.to_string()),
                    )
                    .singlepart(
                        SinglePart::builder()
                            .header(ContentType::TEXT_HTML)
                            .body(html.to_string()),
                    )
            } else {
                // Only HTML
                MultiPart::alternative().singlepart(
                    SinglePart::builder()
                        .header(ContentType::TEXT_HTML)
                        .body(html.to_string()),
                )
            }
        } else if let Some(text) = text_body {
            // Only text
            MultiPart::alternative().singlepart(
                SinglePart::builder()
                    .header(ContentType::TEXT_PLAIN)
                    .body(text.to_string()),
            )
        } else {
            // No body provided
            MultiPart::alternative().singlepart(
                SinglePart::builder()
                    .header(ContentType::TEXT_PLAIN)
                    .body("(No content)".to_string()),
            )
        };

        // Add attachments if any
        if !attachments.is_empty() {
            info!("Adding {} attachments to email", attachments.len());

            // Create a mixed multipart to include both body and attachments
            let body_multipart = multipart;
            let mut mixed_multipart = MultiPart::mixed().multipart(body_multipart);

            // Add each attachment as a singlepart
            for attachment in attachments {
                let content_type =
                    ContentType::from_str(&attachment.content_type).unwrap_or_else(|_| {
                        ContentType::parse("application/octet-stream")
                            .unwrap_or(ContentType::TEXT_PLAIN)
                    });

                let part = Attachment::new(attachment.filename.clone())
                    .body(Body::new(attachment.data.clone()), content_type);

                mixed_multipart = mixed_multipart.singlepart(part);
            }

            multipart = mixed_multipart;
        }

        let email = builder
            .multipart(multipart)
            .map_err(|e| AppError::Internal(format!("Failed to build email: {}", e)))?;

        let creds = Credentials::new(config.smtp_username.clone(), config.smtp_password.clone());

        info!(
            "Connecting to SMTP server: {}:{}",
            config.smtp_host, config.smtp_port
        );

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
            .map_err(|e| {
                error!("Failed to create SMTP transport: {}", e);
                AppError::Internal(format!("Failed to create SMTP transport: {}", e))
            })?
            .port(config.smtp_port)
            .credentials(creds)
            .build();

        mailer.send(email).await.map_err(|e| {
            error!("Failed to forward email: {}", e);
            AppError::Internal(format!("Failed to forward email: {}", e))
        })?;

        info!(
            "Email forwarded successfully from {} to {} with {} attachments",
            from,
            to,
            attachments.len()
        );
        Ok(())
    }

    /// Send bounce notification email to user
    pub async fn send_bounce_notification(
        config: &Config,
        to: &str,
        subject: &str,
        body: &str,
    ) -> Result<()> {
        info!("Sending bounce notification to: {}", to);

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }

        let email = MessageBuilder::new()
            .from(from_addr.parse().map_err(|e| {
                error!("Failed to parse SMTP_FROM '{}': {}", from_addr, e);
                AppError::Internal(format!("Invalid from address '{}': {}", from_addr, e))
            })?)
            .to(to
                .parse()
                .map_err(|e| AppError::Internal(format!("Invalid to address: {}", e)))?)
            .subject(subject)
            .singlepart(
                SinglePart::builder()
                    .header(ContentType::TEXT_PLAIN)
                    .body(body.to_string()),
            )
            .map_err(|e| AppError::Internal(format!("Failed to build email: {}", e)))?;

        let creds = Credentials::new(config.smtp_username.clone(), config.smtp_password.clone());

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&config.smtp_host)
            .map_err(|e| {
                error!("Failed to create SMTP transport: {}", e);
                AppError::Internal(format!("Failed to create SMTP transport: {}", e))
            })?
            .port(config.smtp_port)
            .credentials(creds)
            .build();

        mailer.send(email).await.map_err(|e| {
            error!("Failed to send bounce notification: {}", e);
            AppError::Internal(format!("Failed to send bounce notification: {}", e))
        })?;

        info!("Bounce notification sent successfully to: {}", to);
        Ok(())
    }
}

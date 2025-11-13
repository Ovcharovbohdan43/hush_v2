use crate::config::Config;
use crate::error::{AppError, Result};
use lettre::{
    message::{header::ContentType, Attachment, Body, Message, MessageBuilder, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
};
use std::str::FromStr;
use tracing::{error, info, warn};

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

        Self::send_with_fallback(config, email, "verification email").await?;

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

        Self::send_with_fallback(config, email, "forwarded email").await?;

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
            "=== EMAIL SERVICE: Forwarding email ===\n  From: {}\n  To: {}\n  Subject: {}\n  Attachments: {}\n  SMTP Host: {}\n  SMTP Port: {}\n  SMTP From: {}",
            from, to, subject, attachments.len(), config.smtp_host, config.smtp_port, config.smtp_from
        );

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            error!("SMTP_FROM is empty - cannot send email");
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }
        
        info!("Using SMTP From address: '{}'", from_addr);

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

        info!(
            "Sending email through SMTP (attachments: {}, username: {})",
            attachments.len(),
            config.smtp_username
        );

        match Self::send_with_fallback(config, email, "forwarded email with attachments").await {
            Ok(_) => {
                info!(
                    "✓✓✓ Email forwarded successfully from {} to {} with {} attachments ✓✓✓",
                    from, to, attachments.len()
                );
                Ok(())
            }
            Err(e) => {
                error!("✗✗✗ Failed to forward email from {} to {}: {} ✗✗✗", from, to, e);
                Err(e)
            }
        }
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

        Self::send_with_fallback(config, email, "bounce notification").await?;

        info!("Bounce notification sent successfully to: {}", to);
        Ok(())
    }

    fn candidate_ports(config: &Config) -> Vec<u16> {
        let mut ports = Vec::new();
        ports.push(config.smtp_port);

        for &fallback in &[587u16, 2525u16] {
            if !ports.contains(&fallback) {
                ports.push(fallback);
            }
        }

        ports
    }

    async fn send_with_fallback(
        config: &Config,
        email: Message,
        context: &str,
    ) -> Result<()> {
        let creds = Credentials::new(config.smtp_username.clone(), config.smtp_password.clone());
        let host = config.smtp_host.trim();

        if host.is_empty() {
            return Err(AppError::Internal(
                "SMTP_HOST is empty - cannot send email".to_string(),
            ));
        }

        let ports = Self::candidate_ports(config);
        let mut errors: Vec<String> = Vec::new();

        for port in ports.iter().copied() {
            info!(
                "Attempting to send {} via SMTP {}:{} (username: {})",
                context, host, port, config.smtp_username
            );

            let builder = match AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(host) {
                Ok(builder) => builder,
                Err(e) => {
                    let msg = format!(
                        "Failed to create SMTP transport for {}:{} - {}",
                        host, port, e
                    );
                    warn!("{}", msg);
                    errors.push(msg);
                    continue;
                }
            };

            let mailer = builder
                .port(port)
                .credentials(creds.clone())
                .build();

            match mailer.send(email.clone()).await {
                Ok(_) => {
                    info!(
                        "Successfully sent {} via SMTP {}:{}",
                        context, host, port
                    );
                    return Ok(());
                }
                Err(e) => {
                    let msg = format!(
                        "Failed to send {} via {}:{} - {}",
                        context, host, port, e
                    );
                    warn!("{}", msg);
                    errors.push(msg);
                }
            }
        }

        error!(
            "Unable to send {} via SMTP {} using ports {:?}. Errors: {}",
            context,
            host,
            ports,
            errors.join(" | ")
        );

        Err(AppError::Internal(format!(
            "Failed to send {}: unable to reach SMTP server {} on ports {:?}. Last errors: {}",
            context,
            host,
            ports,
            errors.join(" | ")
        )))
    }
}

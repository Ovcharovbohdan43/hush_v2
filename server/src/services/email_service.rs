use crate::config::Config;
use crate::error::{AppError, Result};
use crate::services::email_service::mailgun::MailgunSender;
use tracing::{error, info};

mod mailgun;

pub struct EmailService;

impl EmailService {
    pub async fn send_verification_email(config: &Config, to: &str, token: &str) -> Result<()> {
        info!("Sending verification email to: {}", to);
        info!("Mailgun FROM value: '{}'", config.smtp_from);
        let verification_url = format!(
            "{}/api/v1/targets/verify?token={}",
            config.api_base_url, token
        );

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }

        let text_body = format!(
            "Please verify your email address by clicking the following link:\n\n{}\n\nThis link will expire in 24 hours.",
            verification_url
        );

        let html_body = format!(
            r#"
            <html>
            <body>
                <h2>Verify your email address</h2>
                <p>Please click the following link to verify your email address:</p>
                <p><a href="{0}">Verify Email</a></p>
                <p>This link will expire in 24 hours.</p>
            </body>
            </html>
            "#,
            verification_url
        );

        MailgunSender::new(config)
            .await?
            .send_email(
                from_addr,
                to,
                "Verify your email address for Hush",
                Some(&text_body),
                Some(&html_body),
                None,
                &[],
                "verification email",
            )
            .await?;

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

        let text_fallback = "(No content)".to_string();
        let text = text_body.unwrap_or(&text_fallback);

        MailgunSender::new(config)
            .await?
            .send_email(
                from_addr,
                to,
                &format!("Fwd: {}", subject),
                Some(text),
                html_body,
                reply_to,
                &[],
                "forwarded email",
            )
            .await?;

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
            "=== EMAIL SERVICE: Forwarding email ===\n  From: {}\n  To: {}\n  Subject: {}\n  Attachments: {}\n  Mailgun Domain: {}\n  Mailgun Base URL: {}\n  Mailgun From: {}",
            from,
            to,
            subject,
            attachments.len(),
            config.mailgun_domain,
            config.mailgun_api_base_url,
            config.smtp_from
        );

        let from_addr = config.smtp_from.trim();
        if from_addr.is_empty() {
            error!("SMTP_FROM is empty - cannot send email");
            return Err(AppError::Internal("SMTP_FROM is empty".to_string()));
        }
        
        info!("Using Mailgun From address: '{}'", from_addr);

        let text_fallback = "(No content)".to_string();
        let text = text_body.unwrap_or(&text_fallback);

        MailgunSender::new(config)
            .await?
            .send_email(
                from_addr,
                to,
                &format!("Fwd: {}", subject),
                Some(text),
                html_body,
                reply_to,
                attachments,
                "forwarded email with attachments",
            )
            .await?;

        info!(
            "✓✓✓ Email forwarded successfully from {} to {} with {} attachments ✓✓✓",
            from, to, attachments.len()
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

        MailgunSender::new(config)
            .await?
            .send_email(
                from_addr,
                to,
                subject,
                Some(body),
                None,
                None,
                &[],
                "bounce notification",
            )
            .await?;

        info!("Bounce notification sent successfully to: {}", to);
        Ok(())
    }
}

use crate::api::incoming::EmailAttachment;
use crate::config::Config;
use crate::error::{AppError, Result};
use mime::Mime;
use reqwest::multipart::{Form, Part};
use reqwest::Client;
use std::str::FromStr;
use tracing::{debug, error, info, warn};

pub struct MailgunSender {
    client: Client,
    endpoint: String,
    api_key: String,
}

impl MailgunSender {
    pub async fn new(config: &Config) -> Result<Self> {
        let api_key = config.mailgun_api_key.trim();
        if api_key.is_empty() {
            return Err(AppError::Internal(
                "MAILGUN_API_KEY is empty - cannot send email".to_string(),
            ));
        }

        let domain = config.mailgun_domain.trim();
        if domain.is_empty() {
            return Err(AppError::Internal(
                "MAILGUN_DOMAIN is empty - cannot send email".to_string(),
            ));
        }

        let base_url = config.mailgun_api_base_url.trim().trim_end_matches('/');
        let endpoint = format!("{}/v3/{}/messages", base_url, domain);

        info!(
            "Mailgun endpoint resolved:\n  base: {}\n  domain: {}\n  endpoint: {}",
            base_url, domain, endpoint
        );

        Ok(Self {
            client: Client::new(),
            endpoint,
            api_key: api_key.to_string(),
        })
    }

    #[allow(clippy::too_many_arguments)]
    pub async fn send_email(
        &self,
        from: &str,
        to: &str,
        subject: &str,
        text_body: Option<&str>,
        html_body: Option<&str>,
        reply_to: Option<&str>,
        attachments: &[EmailAttachment],
        context: &str,
    ) -> Result<()> {
        let mut form = Form::new()
            .text("from", from.to_string())
            .text("to", to.to_string())
            .text("subject", subject.to_string());

        if let Some(text) = text_body {
            form = form.text("text", text.to_string());
        }

        if let Some(html) = html_body {
            form = form.text("html", html.to_string());
        }

        if let Some(reply_to_addr) = reply_to {
            form = form.text("h:Reply-To", reply_to_addr.to_string());
        }

        if !attachments.is_empty() {
            info!("Adding {} attachments to {}", attachments.len(), context);
        }

        for attachment in attachments {
            let mime = match Mime::from_str(&attachment.content_type) {
                Ok(m) => m,
                Err(_) => {
                    warn!(
                        "Attachment '{}' has invalid content type '{}', defaulting to application/octet-stream",
                        attachment.filename, attachment.content_type
                    );
                    Mime::from_str("application/octet-stream")
                        .unwrap_or(mime::APPLICATION_OCTET_STREAM)
                }
            };

            let part = Part::bytes(attachment.data.clone())
                .file_name(attachment.filename.clone())
                .mime_str(mime.as_ref())
                .map_err(|e| {
                    AppError::Internal(format!(
                        "Failed to prepare attachment '{}' for {}: {}",
                        attachment.filename, context, e
                    ))
                })?;
            form = form.part("attachment", part);
        }

        let response = self
            .client
            .post(&self.endpoint)
            .basic_auth("api", Some(&self.api_key))
            .multipart(form)
            .send()
            .await
            .map_err(|e| {
                error!("Failed to call Mailgun API for {}: {}", context, e);
                AppError::Internal(format!("Failed to call Mailgun API: {}", e))
            })?;

        let status = response.status();
        let body = response
            .text()
            .await
            .unwrap_or_else(|_| "<unable to read response body>".to_string());

        if !status.is_success() {
            error!(
                "Mailgun API returned error for {}: status={} body={}",
                context, status, body
            );
            return Err(AppError::Internal(format!(
                "Mailgun API responded with status {}: {}",
                status, body
            )));
        }

        debug!("Mailgun API success for {}: {}", context, body);
        Ok(())
    }
}

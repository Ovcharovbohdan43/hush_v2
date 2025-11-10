use crate::config::Config;
use crate::error::{AppError, Result};
use lettre::{
    message::{header::ContentType, MessageBuilder, MultiPart, SinglePart},
    transport::smtp::authentication::Credentials,
    AsyncSmtpTransport, AsyncTransport, Tokio1Executor,
};

pub struct EmailService;

impl EmailService {
    pub async fn send_verification_email(
        config: &Config,
        to: &str,
        token: &str,
    ) -> Result<()> {
        let verification_url = format!("{}/api/v1/targets/verify?token={}", config.api_base_url, token);

        let email = MessageBuilder::new()
            .from(config.smtp_from.parse().map_err(|e| {
                AppError::Internal(format!("Invalid from address: {}", e))
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

        let creds = Credentials::new(
            config.smtp_username.clone(),
            config.smtp_password.clone(),
        );

        let mailer = AsyncSmtpTransport::<Tokio1Executor>::relay(&config.smtp_host)
            .map_err(|e| AppError::Internal(format!("Failed to create SMTP transport: {}", e)))?
            .port(config.smtp_port)
            .credentials(creds)
            .build();

        mailer
            .send(email)
            .await
            .map_err(|e| AppError::Internal(format!("Failed to send email: {}", e)))?;

        Ok(())
    }
}


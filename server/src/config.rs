use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub port: u16,
    pub jwt_secret: String,
    pub jwt_expires_in: u64,
    pub refresh_token_expires_in: u64,
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_username: String,
    pub smtp_password: String,
    pub smtp_from: String,
    pub hush_domain: String,
    pub api_base_url: String,
    /// Maximum attachment size in bytes (default: 10MB)
    pub max_attachment_size: u64,
    /// Webhook security configuration
    pub webhook_security: WebhookSecurityConfig,
    /// HTTPS/TLS configuration
    pub tls: TlsConfig,
}

#[derive(Clone, Debug)]
pub struct TlsConfig {
    /// Enable HTTPS server
    pub enabled: bool,
    /// HTTPS port (default: 3443)
    pub https_port: u16,
    /// HTTP redirect port (default: 80, for redirecting HTTP to HTTPS)
    pub http_redirect_port: Option<u16>,
    /// Path to TLS certificate file (PEM format)
    pub cert_path: Option<String>,
    /// Path to TLS private key file (PEM format)
    pub key_path: Option<String>,
    /// HSTS max-age in seconds (default: 31536000 = 1 year)
    pub hsts_max_age: u64,
    /// Enable HSTS includeSubDomains directive
    pub hsts_include_subdomains: bool,
}

#[derive(Clone, Debug)]
pub struct WebhookSecurityConfig {
    /// Enable webhook security checks (set to false for development)
    pub enabled: bool,
    /// Mailgun webhook signing key
    pub mailgun_secret: Option<String>,
    /// SendGrid webhook signing key
    pub sendgrid_secret: Option<String>,
    /// Brevo webhook secret
    pub brevo_secret: Option<String>,
    /// IP whitelist for Mailgun (comma-separated)
    pub mailgun_ip_whitelist: Vec<String>,
    /// IP whitelist for SendGrid (comma-separated)
    pub sendgrid_ip_whitelist: Vec<String>,
    /// IP whitelist for Brevo (comma-separated)
    pub brevo_ip_whitelist: Vec<String>,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        Ok(Config {
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| {
                "postgresql://postgres:postgres@localhost:5432/hush".to_string()
            }),
            port: env::var("PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(3001),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "your-secret-key-change-in-production".to_string()),
            jwt_expires_in: env::var("JWT_EXPIRES_IN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(3600),
            refresh_token_expires_in: env::var("REFRESH_TOKEN_EXPIRES_IN")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(604800), // 7 days
            smtp_host: env::var("SMTP_HOST").unwrap_or_else(|_| "smtp.gmail.com".to_string()),
            smtp_port: env::var("SMTP_PORT")
                .ok()
                .and_then(|p| p.parse().ok())
                .unwrap_or(587),
            smtp_username: env::var("SMTP_USERNAME").unwrap_or_else(|_| "".to_string()),
            smtp_password: env::var("SMTP_PASSWORD").unwrap_or_else(|_| "".to_string()),
            smtp_from: env::var("SMTP_FROM").unwrap_or_else(|_| "noreply@hush.example".to_string()),
            hush_domain: env::var("HUSH_DOMAIN").unwrap_or_else(|_| "hush.example".to_string()),
            api_base_url: env::var("API_BASE_URL")
                .unwrap_or_else(|_| "http://localhost:3001".to_string()),
            max_attachment_size: env::var("MAX_ATTACHMENT_SIZE")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(10 * 1024 * 1024), // 10MB default
            webhook_security: WebhookSecurityConfig::from_env(),
            tls: TlsConfig::from_env(),
        })
    }
}

impl TlsConfig {
    pub fn from_env() -> Self {
        let enabled = env::var("HTTPS_ENABLED")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(false); // Disabled by default for development

        let https_port = env::var("HTTPS_PORT")
            .ok()
            .and_then(|p| p.parse().ok())
            .unwrap_or(3443);

        let http_redirect_port = env::var("HTTP_REDIRECT_PORT")
            .ok()
            .and_then(|p| p.parse().ok());

        let cert_path = env::var("TLS_CERT_PATH").ok();
        let key_path = env::var("TLS_KEY_PATH").ok();

        let hsts_max_age = env::var("HSTS_MAX_AGE")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(31536000); // 1 year default

        let hsts_include_subdomains = env::var("HSTS_INCLUDE_SUBDOMAINS")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(true);

        Self {
            enabled,
            https_port,
            http_redirect_port,
            cert_path,
            key_path,
            hsts_max_age,
            hsts_include_subdomains,
        }
    }
}

impl WebhookSecurityConfig {
    pub fn from_env() -> Self {
        let enabled = env::var("WEBHOOK_SECURITY_ENABLED")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(true); // Enabled by default in production

        // Parse IP whitelists (comma-separated)
        let parse_ip_list = |var_name: &str, default_ips: &[&str]| -> Vec<String> {
            env::var(var_name)
                .ok()
                .map(|s| {
                    if s.is_empty() {
                        default_ips.iter().map(|s| s.to_string()).collect()
                    } else {
                        s.split(',')
                            .map(|s| s.trim().to_string())
                            .filter(|s| !s.is_empty())
                            .collect()
                    }
                })
                .unwrap_or_else(|| default_ips.iter().map(|s| s.to_string()).collect())
        };

        // Default IP ranges for providers (from their documentation)
        // Mailgun: https://documentation.mailgun.com/en/latest/user_manual.html#webhooks
        let mailgun_default_ips = &[
            "50.56.129.0/24",
            "50.56.250.0/24",
            "159.135.128.0/24",
            "198.61.254.0/24",
        ];

        // SendGrid: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook-security-features
        let sendgrid_default_ips = &[
            "167.89.0.0/16",
            "149.72.0.0/16",
        ];

        // Brevo: https://developers.brevo.com/docs/webhooks-security
        let brevo_default_ips = &[
            "185.60.216.0/24",
            "1.179.112.0/24",
        ];

        Self {
            enabled,
            mailgun_secret: env::var("MAILGUN_WEBHOOK_SECRET").ok(),
            sendgrid_secret: env::var("SENDGRID_WEBHOOK_SECRET").ok(),
            brevo_secret: env::var("BREVO_WEBHOOK_SECRET").ok(),
            mailgun_ip_whitelist: parse_ip_list("MAILGUN_IP_WHITELIST", mailgun_default_ips),
            sendgrid_ip_whitelist: parse_ip_list("SENDGRID_IP_WHITELIST", sendgrid_default_ips),
            brevo_ip_whitelist: parse_ip_list("BREVO_IP_WHITELIST", brevo_default_ips),
        }
    }
}

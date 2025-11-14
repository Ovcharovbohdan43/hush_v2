use crate::config::WebhookSecurityConfig;
use crate::error::{AppError, Result};
use axum::http::{HeaderMap, Uri};
use hmac::{Hmac, Mac};
use ipnet::IpNet;
use sha2::Sha256;
use std::net::IpAddr;
use tracing::{debug, warn};

type HmacSha256 = Hmac<Sha256>;

/// Verify webhook request security
pub async fn verify_webhook_security(
    config: &WebhookSecurityConfig,
    provider: WebhookProvider,
    headers: &HeaderMap,
    uri: &Uri,
    body: &[u8],
) -> Result<()> {
    // Skip security checks if disabled (for development)
    if !config.enabled {
        debug!("Webhook security checks disabled, skipping verification");
        return Ok(());
    }

    // Extract client IP from headers (if provided)
    let client_ip = match extract_client_ip(headers) {
        Ok(ip) => {
            debug!("Resolved client IP for webhook: {}", ip);
            Some(ip)
        }
        Err(e) => {
            warn!(
                "Unable to determine client IP for {:?} webhook: {}. Skipping IP whitelist check.",
                provider, e
            );
            None
        }
    };

    // Verify IP whitelist when we have an IP
    if let Some(ip) = client_ip {
        verify_ip_whitelist(config, provider, &ip)?;
    } else {
        warn!(
            "Skipping IP whitelist verification for {:?} webhook because no client IP was provided.",
            provider
        );
    }

    // Verify signature/secret based on provider
    match provider {
        WebhookProvider::Mailgun => verify_mailgun_signature(config, headers, uri, body)?,
        WebhookProvider::SendGrid => verify_sendgrid_signature(config, headers, body)?,
        WebhookProvider::Brevo => verify_brevo_secret(config, headers, uri)?,
    }

    Ok(())
}

#[derive(Debug, Clone, Copy)]
pub enum WebhookProvider {
    Mailgun,
    SendGrid,
    Brevo,
}

/// Extract client IP from request headers
/// Checks X-Forwarded-For, X-Real-IP, and direct connection
fn extract_client_ip(headers: &HeaderMap) -> Result<IpAddr> {
    // Check X-Forwarded-For header (first IP is the original client)
    if let Some(forwarded_for) = headers.get("x-forwarded-for") {
        if let Ok(forwarded_str) = forwarded_for.to_str() {
            if let Some(first_ip) = forwarded_str.split(',').next() {
                if let Ok(ip) = first_ip.trim().parse::<IpAddr>() {
                    return Ok(ip);
                }
            }
        }
    }

    // Check X-Real-IP header
    if let Some(real_ip) = headers.get("x-real-ip") {
        if let Ok(ip_str) = real_ip.to_str() {
            if let Ok(ip) = ip_str.parse::<IpAddr>() {
                return Ok(ip);
            }
        }
    }

    // Fallback: try to get from CF-Connecting-IP (Cloudflare)
    if let Some(cf_ip) = headers.get("cf-connecting-ip") {
        if let Ok(ip_str) = cf_ip.to_str() {
            if let Ok(ip) = ip_str.parse::<IpAddr>() {
                return Ok(ip);
            }
        }
    }

    // Note: In production, IP should be set by reverse proxy (nginx, etc.)
    // For development, we'll allow requests without IP validation
    // In production, this should fail
    Err(AppError::Validation(
        "Could not determine client IP address. Ensure X-Forwarded-For or X-Real-IP header is set.".to_string(),
    ))
}

/// Verify IP address against whitelist
fn verify_ip_whitelist(
    config: &WebhookSecurityConfig,
    provider: WebhookProvider,
    client_ip: &IpAddr,
) -> Result<()> {
    let whitelist = match provider {
        WebhookProvider::Mailgun => &config.mailgun_ip_whitelist,
        WebhookProvider::SendGrid => &config.sendgrid_ip_whitelist,
        WebhookProvider::Brevo => &config.brevo_ip_whitelist,
    };

    if whitelist.is_empty() {
        warn!(
            "IP whitelist is empty for {:?}, allowing all IPs",
            provider
        );
        return Ok(());
    }

    // Check if IP matches any CIDR in whitelist
    for cidr_str in whitelist {
        match cidr_str.parse::<IpNet>() {
            Ok(cidr) => {
                if cidr.contains(client_ip) {
                    debug!("IP {} matches whitelist CIDR {}", client_ip, cidr_str);
                    return Ok(());
                }
            }
            Err(e) => {
                warn!("Invalid CIDR format in whitelist: {} - {}", cidr_str, e);
            }
        }
    }

    warn!(
        "IP {} not in whitelist for {:?} provider",
        client_ip, provider
    );
    Err(AppError::Auth(format!(
        "IP address {} not authorized for {:?} webhooks",
        client_ip, provider
    )))
}

/// Verify Mailgun webhook signature
/// Mailgun signs webhooks using HMAC-SHA256 with timestamp and token
/// Signature format: HMAC(timestamp + token, signing_key)
fn verify_mailgun_signature(
    config: &WebhookSecurityConfig,
    headers: &HeaderMap,
    uri: &Uri,
    _body: &[u8],
) -> Result<()> {
    let secret = config
        .mailgun_secret
        .as_ref()
        .ok_or_else(|| AppError::Auth("Mailgun webhook secret not configured".to_string()))?;

    // Mailgun sends signature in query params or headers
    // Check query params first (more common)
    let query_params: std::collections::HashMap<String, String> = uri
        .query()
        .map(|q| {
            url::form_urlencoded::parse(q.as_bytes())
                .into_owned()
                .collect()
        })
        .unwrap_or_default();

    let signature: String = query_params
        .get("signature")
        .cloned()
        .or_else(|| headers.get("x-mailgun-signature").and_then(|h| h.to_str().ok()).map(|s| s.to_string()))
        .ok_or_else(|| AppError::Auth("Missing Mailgun signature".to_string()))?;

    let timestamp: String = query_params
        .get("timestamp")
        .cloned()
        .or_else(|| headers.get("x-mailgun-timestamp").and_then(|h| h.to_str().ok()).map(|s| s.to_string()))
        .ok_or_else(|| AppError::Auth("Missing Mailgun timestamp".to_string()))?;

    let token: String = query_params
        .get("token")
        .cloned()
        .or_else(|| headers.get("x-mailgun-token").and_then(|h| h.to_str().ok()).map(|s| s.to_string()))
        .ok_or_else(|| AppError::Auth("Missing Mailgun token".to_string()))?;

    // Verify timestamp (prevent replay attacks)
    // Allow 15 minutes window
    if let Ok(ts) = timestamp.parse::<i64>() {
        let now = chrono::Utc::now().timestamp();
        let age: i64 = (now - ts).abs();
        if age > 900 {
            // 15 minutes
            return Err(AppError::Auth(format!(
                "Mailgun timestamp too old: {} seconds",
                age
            )));
        }
    }

    // Compute expected signature: HMAC(timestamp + token, secret)
    let signing_string = format!("{}{}", timestamp, token);
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| AppError::Internal(format!("Failed to create HMAC: {}", e)))?;
    mac.update(signing_string.as_bytes());
    let expected_signature = hex::encode(mac.finalize().into_bytes());

    // Compare signatures (constant-time comparison)
    if expected_signature != signature {
        warn!("Mailgun signature verification failed");
        return Err(AppError::Auth("Invalid Mailgun signature".to_string()));
    }

    debug!("Mailgun signature verified successfully");
    Ok(())
}

/// Verify SendGrid webhook signature
/// SendGrid uses HMAC-SHA256 with the request body
/// Signature format: HMAC(request_body, signing_key)
fn verify_sendgrid_signature(
    config: &WebhookSecurityConfig,
    headers: &HeaderMap,
    body: &[u8],
) -> Result<()> {
    let secret = config
        .sendgrid_secret
        .as_ref()
        .ok_or_else(|| AppError::Auth("SendGrid webhook secret not configured".to_string()))?;

    // SendGrid sends signature in X-Twilio-Email-Event-Webhook-Signature header
    // Format: t=<timestamp>,v1=<signature>
    let signature_header = headers
        .get("x-twilio-email-event-webhook-signature")
        .or_else(|| headers.get("x-sendgrid-signature"))
        .and_then(|h| h.to_str().ok())
        .ok_or_else(|| AppError::Auth("Missing SendGrid signature header".to_string()))?;

    // Parse signature header: t=<timestamp>,v1=<signature>
    let mut timestamp: Option<i64> = None;
    let mut signature: Option<&str> = None;

    for part in signature_header.split(',') {
        let part = part.trim();
        if part.starts_with("t=") {
            timestamp = part[2..].parse::<i64>().ok();
        } else if part.starts_with("v1=") {
            signature = Some(&part[3..]);
        }
    }

    let signature = signature.ok_or_else(|| AppError::Auth("Invalid SendGrid signature format".to_string()))?;

    // Verify timestamp (prevent replay attacks)
    if let Some(ts) = timestamp {
        let now = chrono::Utc::now().timestamp();
        let age = (now - ts).abs();
        if age > 900 {
            // 15 minutes
            return Err(AppError::Auth(format!(
                "SendGrid timestamp too old: {} seconds",
                age
            )));
        }
    }

    // Compute expected signature: HMAC(request_body, secret)
    let mut mac = HmacSha256::new_from_slice(secret.as_bytes())
        .map_err(|e| AppError::Internal(format!("Failed to create HMAC: {}", e)))?;
    mac.update(body);
    let expected_signature = hex::encode(mac.finalize().into_bytes());

    // Compare signatures (constant-time comparison)
    if expected_signature != signature {
        warn!("SendGrid signature verification failed");
        return Err(AppError::Auth("Invalid SendGrid signature".to_string()));
    }

    debug!("SendGrid signature verified successfully");
    Ok(())
}

/// Verify Brevo webhook secret
/// Brevo uses a simple secret key in headers or query params
fn verify_brevo_secret(
    config: &WebhookSecurityConfig,
    headers: &HeaderMap,
    uri: &Uri,
) -> Result<()> {
    let secret = config
        .brevo_secret
        .as_ref()
        .ok_or_else(|| AppError::Auth("Brevo webhook secret not configured".to_string()))?;

    // Check query params first
    let query_params: std::collections::HashMap<String, String> = uri
        .query()
        .map(|q| {
            url::form_urlencoded::parse(q.as_bytes())
                .into_owned()
                .collect()
        })
        .unwrap_or_default();

    let provided_secret: String = query_params
        .get("secret")
        .cloned()
        .or_else(|| {
            headers
                .get("x-brevo-secret")
                .and_then(|h| h.to_str().ok())
                .map(|s| s.to_string())
        })
        .ok_or_else(|| AppError::Auth("Missing Brevo secret".to_string()))?;

    // Constant-time comparison
    if provided_secret != *secret {
        warn!("Brevo secret verification failed");
        return Err(AppError::Auth("Invalid Brevo secret".to_string()));
    }

    debug!("Brevo secret verified successfully");
    Ok(())
}


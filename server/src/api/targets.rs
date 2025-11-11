use axum::{
    extract::{Extension, Query},
    http::StatusCode,
    response::{Html, IntoResponse, Json},
};
use serde::Deserialize;
use sqlx::PgPool;

use crate::auth::AuthenticatedUser;
use crate::config::Config;
use crate::error::Result;
use crate::models::{RequestVerifyRequest, RequestVerifyResponse};
use crate::services::{EmailService, TargetService};

#[derive(Deserialize)]
pub struct VerifyQuery {
    pub token: String,
}

/// Simple HTML escaping function
fn escape_html(text: &str) -> String {
    let mut result = String::with_capacity(text.len());
    for c in text.chars() {
        match c {
            '<' => result.push_str("&lt;"),
            '>' => result.push_str("&gt;"),
            '&' => result.push_str("&amp;"),
            '"' => result.push_str("&quot;"),
            '\'' => result.push_str("&#x27;"),
            _ => result.push(c),
        }
    }
    result
}

pub async fn get_current(
    Extension(pool): Extension<PgPool>,
    user: AuthenticatedUser,
) -> Result<Json<serde_json::Value>> {
    let target = TargetService::get_current(&pool, user.user_id).await?;

    if let Some(t) = target {
        Ok(Json(serde_json::json!({
            "email": t.email,
            "verified": t.verified
        })))
    } else {
        Ok(Json(serde_json::json!(null)))
    }
}

pub async fn request_verify(
    Extension(pool): Extension<PgPool>,
    Extension(config): Extension<Config>,
    user: AuthenticatedUser,
    Json(req): Json<RequestVerifyRequest>,
) -> Result<Json<RequestVerifyResponse>> {
    let target = TargetService::create_or_update(&pool, user.user_id, &req.target).await?;

    if let Some(token) = &target.verification_token {
        EmailService::send_verification_email(&config, &req.target, token).await?;
    }

    Ok(Json(RequestVerifyResponse {
        message: "verification_sent".to_string(),
    }))
}

/// Verify email via GET (for browser links)
pub async fn verify_get(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<VerifyQuery>,
) -> impl IntoResponse {
    match TargetService::verify(&pool, &params.token).await {
        Ok(target) => {
            let html = format!(
                r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Email Verified - Hush</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }}
        .container {{
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }}
        .success-icon {{
            font-size: 4rem;
            margin-bottom: 1rem;
        }}
        h1 {{
            color: #667eea;
            margin-bottom: 1rem;
        }}
        p {{
            color: #666;
            line-height: 1.6;
            margin-bottom: 0.5rem;
        }}
        .email {{
            font-weight: bold;
            color: #333;
            word-break: break-all;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="success-icon">✓</div>
        <h1>Email Verified!</h1>
        <p>Your email address has been successfully verified.</p>
        <p>Email: <span class="email">{}</span></p>
        <p>You can now receive forwarded emails to this address.</p>
    </div>
</body>
</html>"#,
                escape_html(&target.email)
            );
            (StatusCode::OK, Html(html))
        }
        Err(e) => {
            let html = format!(
                r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verification Failed - Hush</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: #333;
        }}
        .container {{
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            max-width: 500px;
            width: 90%;
        }}
        .error-icon {{
            font-size: 4rem;
            margin-bottom: 1rem;
        }}
        h1 {{
            color: #f5576c;
            margin-bottom: 1rem;
        }}
        p {{
            color: #666;
            line-height: 1.6;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="error-icon">✗</div>
        <h1>Verification Failed</h1>
        <p>{}</p>
        <p>The verification link may have expired or is invalid.</p>
    </div>
</body>
</html>"#,
                escape_html(&e.to_string())
            );
            (StatusCode::BAD_REQUEST, Html(html))
        }
    }
}

/// Verify email via POST (for API)
pub async fn verify_post(
    Extension(pool): Extension<PgPool>,
    Query(params): Query<VerifyQuery>,
) -> Result<Json<serde_json::Value>> {
    let target = TargetService::verify(&pool, &params.token).await?;

    Ok(Json(serde_json::json!({
        "message": "Email verified successfully",
        "email": target.email
    })))
}

# Test Email Forwarding Webhook
# This script simulates incoming email webhooks

param(
    [string]$AliasAddress = "",
    [string]$SenderEmail = "test@example.com",
    [string]$Subject = "Test Email",
    [string]$BodyText = "This is a test email body.",
    [string]$BodyHtml = "",
    [string]$WebhookUrl = "http://localhost:3001/api/v1/incoming/mailgun/json"
)

Write-Host "=== Email Forwarding Test ===" -ForegroundColor Cyan
Write-Host ""

# If alias not provided, try to get one from API
if ([string]::IsNullOrEmpty($AliasAddress)) {
    Write-Host "Alias address not provided. Getting token first..." -ForegroundColor Yellow
    
    # Try to get token
    $body = @{
        email = "test@example.com"
        password = "TestPassword123!"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/login" `
            -Method POST `
            -ContentType "application/json" `
            -Body $body -ErrorAction SilentlyContinue
        
        $token = $response.access_token
        Write-Host "[OK] Got token" -ForegroundColor Green
        
        # Get aliases
        $headers = @{ Authorization = "Bearer $token" }
        $aliases = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
            -Method GET `
            -Headers $headers
        
        if ($aliases.aliases.Count -gt 0) {
            $AliasAddress = $aliases.aliases[0].address
            Write-Host "[OK] Using alias: $AliasAddress" -ForegroundColor Green
        } else {
            Write-Host "[ERROR] No aliases found. Please create an alias first." -ForegroundColor Red
            exit 1
        }
    } catch {
        Write-Host "[ERROR] Failed to get token or aliases. Please:" -ForegroundColor Red
        Write-Host "  1. Make sure server is running" -ForegroundColor Yellow
        Write-Host "  2. Register/login first" -ForegroundColor Yellow
        Write-Host "  3. Create an alias" -ForegroundColor Yellow
        Write-Host "  4. Provide alias address manually: -AliasAddress 'alias@hush.example'" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Alias: $AliasAddress" -ForegroundColor White
Write-Host "  Sender: $SenderEmail" -ForegroundColor White
Write-Host "  Subject: $Subject" -ForegroundColor White
Write-Host "  Webhook URL: $WebhookUrl" -ForegroundColor White
Write-Host ""

# Prepare HTML body if not provided
if ([string]::IsNullOrEmpty($BodyHtml)) {
    $BodyHtml = "<html><body><p>$BodyText</p></body></html>"
}

# Prepare webhook payload (Mailgun JSON format)
$payload = @{
    recipient = $AliasAddress
    sender = $SenderEmail
    subject = $Subject
    "body-plain" = $BodyText
    "body-html" = $BodyHtml
    "Message-Id" = "<test-$(Get-Date -Format 'yyyyMMddHHmmss')@test.com>"
} | ConvertTo-Json

Write-Host "Sending webhook request..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $WebhookUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $payload
    
    Write-Host ""
    Write-Host "[SUCCESS] Webhook processed!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.status -eq "forwarded") {
        Write-Host ""
        Write-Host "✅ Email should be forwarded to: $($response.target)" -ForegroundColor Green
        Write-Host "Check the target email inbox (and spam folder)" -ForegroundColor Yellow
    } elseif ($response.status -eq "ignored") {
        Write-Host ""
        Write-Host "⚠️ Email ignored: $($response.reason)" -ForegroundColor Yellow
        Write-Host "Make sure:" -ForegroundColor Yellow
        Write-Host "  - Alias exists and is active" -ForegroundColor White
        Write-Host "  - Alias is not expired" -ForegroundColor White
    } elseif ($response.status -eq "rejected") {
        Write-Host ""
        Write-Host "❌ Email rejected: $($response.reason)" -ForegroundColor Red
        Write-Host "Make sure:" -ForegroundColor Yellow
        Write-Host "  - Target email is set and verified" -ForegroundColor White
    }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Failed to send webhook: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ""
Write-Host "=== Test completed ===" -ForegroundColor Cyan


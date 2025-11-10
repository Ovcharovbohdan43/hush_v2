# Test Email Forwarding Webhook (Mailgun form-urlencoded format)

param(
    [string]$AliasAddress = "",
    [string]$SenderEmail = "test@example.com",
    [string]$Subject = "Test Email",
    [string]$BodyText = "This is a test email body.",
    [string]$WebhookUrl = "http://localhost:3001/api/v1/incoming/mailgun"
)

Write-Host "=== Email Forwarding Test (Mailgun Format) ===" -ForegroundColor Cyan
Write-Host ""

if ([string]::IsNullOrEmpty($AliasAddress)) {
    Write-Host "[ERROR] Alias address required!" -ForegroundColor Red
    Write-Host "Usage: .\TEST_EMAIL_FORWARDING_FORM.ps1 -AliasAddress 'alias@hush.example'" -ForegroundColor Yellow
    exit 1
}

Write-Host "Test Configuration:" -ForegroundColor Yellow
Write-Host "  Alias: $AliasAddress" -ForegroundColor White
Write-Host "  Sender: $SenderEmail" -ForegroundColor White
Write-Host "  Subject: $Subject" -ForegroundColor White
Write-Host ""

# Prepare form data (Mailgun format)
$formData = @{
    recipient = $AliasAddress
    sender = $SenderEmail
    subject = $Subject
    "body-plain" = $BodyText
    "body-html" = "<html><body><p>$BodyText</p></body></html>"
    "Message-Id" = "<test-$(Get-Date -Format 'yyyyMMddHHmmss')@test.com>"
}

Write-Host "Sending webhook request (form-urlencoded)..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $WebhookUrl `
        -Method POST `
        -ContentType "application/x-www-form-urlencoded" `
        -Body $formData
    
    Write-Host ""
    Write-Host "[SUCCESS] Webhook processed!" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Yellow
    $response | ConvertTo-Json -Depth 10 | Write-Host
    
    if ($response.status -eq "forwarded") {
        Write-Host ""
        Write-Host "✅ Email should be forwarded to: $($response.target)" -ForegroundColor Green
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


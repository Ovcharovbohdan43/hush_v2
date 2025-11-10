# Script to test SMTP configuration
# This will help debug SMTP issues

Write-Host "=== SMTP Configuration Test ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env file not found at: $envFile" -ForegroundColor Red
    Write-Host "Please create .env file with SMTP settings" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] .env file found" -ForegroundColor Green
Write-Host ""

# Read .env file (simple parsing)
$envContent = Get-Content $envFile
$smtpSettings = @{}

foreach ($line in $envContent) {
    if ($line -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $smtpSettings[$key] = $value
    }
}

# Check required SMTP settings
$required = @("SMTP_HOST", "SMTP_PORT", "SMTP_USERNAME", "SMTP_PASSWORD", "SMTP_FROM")

Write-Host "SMTP Settings:" -ForegroundColor Yellow
foreach ($key in $required) {
    if ($smtpSettings.ContainsKey($key)) {
        $displayValue = if ($key -eq "SMTP_PASSWORD") {
            "***hidden***"
        } else {
            $smtpSettings[$key]
        }
        Write-Host "  $key = $displayValue" -ForegroundColor Green
    } else {
        Write-Host "  $key = [MISSING]" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan

if ($smtpSettings["SMTP_HOST"] -like "*brevo*") {
    Write-Host "[INFO] Brevo SMTP detected" -ForegroundColor Yellow
    Write-Host "  - Host should be: smtp-relay.brevo.com" -ForegroundColor White
    Write-Host "  - Port should be: 587" -ForegroundColor White
    Write-Host "  - Username format: YOUR_SMTP_KEY@smtp-brevo.com" -ForegroundColor White
    Write-Host "  - Password: Your Brevo SMTP key" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host "1. Check server logs when sending email" -ForegroundColor White
Write-Host "2. Verify SMTP credentials in Brevo dashboard" -ForegroundColor White
Write-Host "3. Ensure SMTP_FROM is a valid email address" -ForegroundColor White
Write-Host "4. Check firewall/network allows outbound SMTP connections" -ForegroundColor White


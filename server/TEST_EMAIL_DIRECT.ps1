# Direct SMTP test script
# This will help identify SMTP issues

param(
    [string]$ToEmail = "ovcharovbohdan43@gmail.com"
)

Write-Host "=== Direct SMTP Test ===" -ForegroundColor Cyan
Write-Host ""

# Check .env file
$envFile = Join-Path $PSScriptRoot ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "[ERROR] .env file not found" -ForegroundColor Red
    exit 1
}

# Load environment variables
$envContent = Get-Content $envFile
foreach ($line in $envContent) {
    if ($line -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($key, $value, "Process")
    }
}

$smtpHost = $env:SMTP_HOST
$smtpPort = $env:SMTP_PORT
$smtpUser = $env:SMTP_USERNAME
$smtpPass = $env:SMTP_PASSWORD
$smtpFrom = $env:SMTP_FROM

Write-Host "SMTP Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $smtpHost" -ForegroundColor White
Write-Host "  Port: $smtpPort" -ForegroundColor White
Write-Host "  Username: $smtpUser" -ForegroundColor White
Write-Host "  Password: $(if ($smtpPass) { '***set***' } else { '[NOT SET]' })" -ForegroundColor $(if ($smtpPass) { "Green" } else { "Red" })
Write-Host "  From: $smtpFrom" -ForegroundColor White
Write-Host ""

# Validate settings
if (-not $smtpHost) {
    Write-Host "[ERROR] SMTP_HOST not set" -ForegroundColor Red
    exit 1
}

if (-not $smtpUser) {
    Write-Host "[ERROR] SMTP_USERNAME not set" -ForegroundColor Red
    exit 1
}

if (-not $smtpPass) {
    Write-Host "[ERROR] SMTP_PASSWORD not set" -ForegroundColor Red
    Write-Host "SMTP_PASSWORD should be your Brevo SMTP key" -ForegroundColor Yellow
    exit 1
}

if (-not $smtpFrom) {
    Write-Host "[ERROR] SMTP_FROM not set" -ForegroundColor Red
    exit 1
}

# Test network connectivity
Write-Host "Testing network connectivity..." -ForegroundColor Cyan
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($smtpHost, $smtpPort, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait) {
        $tcpClient.EndConnect($connect)
        Write-Host "[OK] Can connect to $smtpHost`:$smtpPort" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "[ERROR] Cannot connect to $smtpHost`:$smtpPort (timeout)" -ForegroundColor Red
        Write-Host "Check firewall/network settings" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[ERROR] Network test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Recommendations ===" -ForegroundColor Cyan
Write-Host "1. Check server logs when sending email (look for 'Failed to send email')" -ForegroundColor White
Write-Host "2. Verify SMTP credentials in Brevo dashboard" -ForegroundColor White
Write-Host "3. Ensure SMTP_FROM is a valid email address format" -ForegroundColor White
Write-Host "4. For Brevo:" -ForegroundColor White
Write-Host "   - SMTP_USERNAME: your email or smtp-key@smtp-brevo.com" -ForegroundColor Gray
Write-Host "   - SMTP_PASSWORD: your SMTP key (long string from Brevo)" -ForegroundColor Gray
Write-Host "   - SMTP_FROM: must be verified sender in Brevo" -ForegroundColor Gray


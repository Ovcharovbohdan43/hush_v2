# Quick API Testing Script for Hush V2
# Use this script after getting access_token

# ============================================
# STEP 1: Check token
# ============================================
if (-not $token) {
    Write-Host "[ERROR] Variable `$token is not defined!" -ForegroundColor Red
    Write-Host "Set token before running script:" -ForegroundColor Yellow
    Write-Host '  $token = "your-token-here"' -ForegroundColor Cyan
    Write-Host "Or if you just got response:" -ForegroundColor Yellow
    Write-Host '  $token = $response.access_token' -ForegroundColor Cyan
    exit 1
}

Write-Host "`n=== Starting API Testing ===" -ForegroundColor Green
Write-Host "Token set: $($token.Substring(0, [Math]::Min(50, $token.Length)))..." -ForegroundColor Gray

# ============================================
# STEP 2: Create random alias
# ============================================
Write-Host "`n=== Creating random alias ===" -ForegroundColor Cyan

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    alias_type = "random"
} | ConvertTo-Json

try {
    $alias = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    if ($alias) {
        Write-Host "[OK] Alias created!" -ForegroundColor Green
        Write-Host "ID: $($alias.id)" -ForegroundColor Yellow
        Write-Host "Address: $($alias.address)" -ForegroundColor Yellow
        Write-Host "Status: $($alias.status)" -ForegroundColor Yellow
        
        # Save alias ID for next operations
        $aliasId = $alias.id
    }
}
catch {
    Write-Host "[ERROR] Failed to create alias: $($_.Exception.Message)" -ForegroundColor Red
    $aliasId = $null
}

# ============================================
# STEP 3: Get list of all aliases
# ============================================
Write-Host "`n=== List of all aliases ===" -ForegroundColor Cyan

try {
    $aliases = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "Found aliases: $($aliases.aliases.Count)" -ForegroundColor Green
    foreach ($a in $aliases.aliases) {
        Write-Host "  - $($a.address) (ID: $($a.id))" -ForegroundColor White
    }
}
catch {
    Write-Host "[ERROR] Failed to get aliases: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 4: Create custom alias
# ============================================
Write-Host "`n=== Creating custom alias ===" -ForegroundColor Cyan

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

# Generate unique custom alias name
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$customAliasName = "test-alias-$timestamp"

$body = @{
    alias_type = "custom"
    custom = $customAliasName
} | ConvertTo-Json

try {
    $customAlias = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "[OK] Custom alias created: $($customAlias.address)" -ForegroundColor Green
}
catch {
    Write-Host "[ERROR] Failed to create custom alias: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Yellow
    }
}

# ============================================
# STEP 5: Request target email verification
# ============================================
Write-Host "`n=== Request email verification ===" -ForegroundColor Cyan
Write-Host "Enter your real email to receive letters:" -ForegroundColor Yellow
$targetEmail = Read-Host "Email"

$headers = @{
    Authorization = "Bearer $token"
    "Content-Type" = "application/json"
}

$body = @{
    target = $targetEmail
} | ConvertTo-Json

try {
    $verifyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/targets/request_verify" `
        -Method POST `
        -Headers $headers `
        -Body $body
    
    Write-Host "[OK] Verification email sent to $targetEmail" -ForegroundColor Green
    Write-Host "Check your email (including spam) and copy verification token" -ForegroundColor Yellow
}
catch {
    Write-Host "[ERROR] Failed to send verification: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================
# STEP 6: Check current target email
# ============================================
Write-Host "`n=== Current target email ===" -ForegroundColor Cyan

try {
    $target = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/targets" `
        -Method GET `
        -Headers @{ Authorization = "Bearer $token" }
    
    Write-Host "Email: $($target.email)" -ForegroundColor Yellow
    Write-Host "Verified: $($target.verified)" -ForegroundColor Yellow
}
catch {
    Write-Host "Target email not configured yet" -ForegroundColor Yellow
}

# ============================================
# STEP 7: Toggle alias on/off
# ============================================
Write-Host "`n=== Manage alias ===" -ForegroundColor Cyan

if ($aliasId) {
    $headers = @{
        Authorization = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    $body = @{
        enabled = $false
    } | ConvertTo-Json
    
    try {
        $toggleResult = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases/$aliasId/toggle" `
            -Method POST `
            -Headers $headers `
            -Body $body
        
        Write-Host "[OK] Alias $aliasId disabled" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Failed to toggle alias: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ============================================
# STEP 8: View alias logs
# ============================================
Write-Host "`n=== Alias logs ===" -ForegroundColor Cyan

if ($aliasId) {
    try {
        $logs = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/aliases/$aliasId/logs?limit=10" `
            -Method GET `
            -Headers @{ Authorization = "Bearer $token" }
        
        Write-Host "Found logs: $($logs.logs.Count)" -ForegroundColor Green
        foreach ($log in $logs.logs) {
            Write-Host "  - From: $($log.from) | Subject: $($log.subject) | Status: $($log.status)" -ForegroundColor White
        }
    }
    catch {
        Write-Host "No logs yet or error: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== Testing completed! ===" -ForegroundColor Green

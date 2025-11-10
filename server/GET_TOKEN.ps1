# Script to get a new JWT token
# Usage: .\GET_TOKEN.ps1

param(
    [string]$Email = "test2@example.com",
    [string]$Password = "TestPassword123!",
    [switch]$Login = $false
)

$uri = if ($Login) {
    "http://localhost:3001/api/v1/auth/login"
} else {
    "http://localhost:3001/api/v1/auth/register"
}

$body = @{
    email = $Email
    password = $Password
} | ConvertTo-Json

Write-Host "Getting token via $uri..." -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri $uri `
        -Method POST `
        -ContentType "application/json" `
        -Body $body
    
    Write-Host "`n[SUCCESS] Token obtained!" -ForegroundColor Green
    Write-Host "Access Token: $($response.access_token)" -ForegroundColor Yellow
    Write-Host "Expires in: $($response.expires_in) seconds" -ForegroundColor Yellow
    
    # Set token in current session
    $script:token = $response.access_token
    $global:token = $response.access_token
    
    Write-Host "`nToken saved to `$token variable" -ForegroundColor Green
    Write-Host "You can now run: .\QUICK_TEST.ps1" -ForegroundColor Cyan
    
    return $response.access_token
}
catch {
    Write-Host "`n[ERROR] Failed to get token: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response: $responseBody" -ForegroundColor Red
    }
    exit 1
}


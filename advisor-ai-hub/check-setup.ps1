# AdvisorAI Hub Setup Validation Script
# Run this to check if everything is properly configured

$RootDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RootDir "packages\backend"
$FrontendDir = Join-Path $RootDir "packages\frontend"
$EnvFile = Join-Path $BackendDir ".env"
$FrontendEnv = Join-Path $FrontendDir ".env.local"

$Green = "Green"
$Red = "Red"
$Yellow = "Yellow"
$Cyan = "Cyan"
$White = "White"

function Write-Status {
    param([string]$Message, [string]$Color = $White)
    Write-Host "[$((Get-Date).ToString('HH:mm:ss'))] $Message" -ForegroundColor $Color
}

Write-Status "🔍 Checking AdvisorAI Hub Setup..." $Cyan

# Check files and directories
$checks = @(
    @{ Name = "Root directory"; Path = $RootDir; Type = "dir" },
    @{ Name = "Backend directory"; Path = $BackendDir; Type = "dir" },
    @{ Name = "Frontend directory"; Path = $FrontendDir; Type = "dir" },
    @{ Name = "Shared package"; Path = (Join-Path $RootDir "packages\shared"); Type = "dir" },
    @{ Name = "Backend .env file"; Path = $EnvFile; Type = "file" },
    @{ Name = "Frontend .env.local"; Path = $FrontendEnv; Type = "file" },
    @{ Name = "Docker"; Command = "docker --version"; Check = "command" },
    @{ Name = "Node.js"; Command = "node --version"; Check = "command" },
    @{ Name = "npm"; Command = "npm --version"; Check = "command" }
)

$allGood = $true

foreach ($check in $checks) {
    $success = $false

    switch ($check.Check) {
        "command" {
            try {
                $result = Invoke-Expression $check.Command
                if ($LASTEXITCODE -eq 0) {
                    $success = $true
                }
            }
            catch {
                $success = $false
            }
        }
        default {
            if ($check.Type -eq "dir") {
                $success = Test-Path $check.Path -PathType Container
            } elseif ($check.Type -eq "file") {
                $success = Test-Path $check.Path -PathType Leaf
            }
        }
    }

    if ($success) {
        Write-Status "✓ $($check.Name) - OK" $Green
    } else {
        Write-Status "✗ $($check.Name) - Missing" $Red
        $allGood = $false
    }
}

# Check environment variables
if (Test-Path $EnvFile) {
    $envContent = Get-Content $EnvFile -Raw
    $hasOpenAI = $envContent -match "OPENAI_API_KEY=.*[^your-openai-api-key-here]"
    $hasDatabase = $envContent -match "DATABASE_URL=.*postgresql"

    if ($hasOpenAI) {
        Write-Status "✓ OpenAI API Key configured" $Green
    } else {
        Write-Status "⚠️  OpenAI API Key not set (edit $EnvFile)" $Yellow
    }

    if ($hasDatabase) {
        Write-Status "✓ Database URL configured" $Green
    } else {
        Write-Status "✗ Database URL not configured" $Red
        $allGood = $false
    }
}

# Check Docker containers
$postgresRunning = docker ps -q -f name=advisorai-postgres
$redisRunning = docker ps -q -f name=advisorai-redis

if ($postgresRunning) {
    Write-Status "✓ PostgreSQL container running" $Green
} else {
    Write-Status "⚠️  PostgreSQL container not running" $Yellow
}

if ($redisRunning) {
    Write-Status "✓ Redis container running" $Green
} else {
    Write-Status "⚠️  Redis container not running" $Yellow
}

# Check ports
$ports = @(3000, 5000, 5432, 6379)
foreach ($port in $ports) {
    try {
        $connection = New-Object System.Net.Sockets.TcpClient("localhost", $port)
        Write-Status "⚠️  Port $port is already in use" $Yellow
        $connection.Close()
    }
    catch {
        Write-Status "✓ Port $port is available" $Green
    }
}

# Final status
Write-Status "`n=== Setup Summary ===" $Cyan

if ($allGood) {
    Write-Status "🎉 Setup looks good! You can run: .\start-advisorai.ps1" $Green
} else {
    Write-Status "❌ Setup incomplete. Please fix the issues above." $Red
    Write-Status "💡 Run .\start-advisorai.ps1 to auto-setup" $Yellow
}

Write-Status "====================" $Cyan

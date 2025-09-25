# AdvisorAI Hub Startup Script (ASCII-only)
# Usage examples:
#   powershell -ExecutionPolicy Bypass -File .\start-advisorai.ps1
#   powershell -ExecutionPolicy Bypass -File .\start-advisorai.ps1 -SkipDocker -SkipSetup

param(
    [switch]$SkipDocker,
    [switch]$SkipSetup,
    [switch]$ResetDb,
    [string]$Environment = "development"
)

$RootDir = Split-Path -Parent $PSScriptRoot
$BackendDir = Join-Path $RootDir "packages\backend"
$FrontendDir = Join-Path $RootDir "packages\frontend"
$EnvFile = Join-Path $BackendDir ".env"

function Write-Status {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = (Get-Date).ToString('HH:mm:ss')
    Write-Host "[$timestamp] [$Level] $Message"
}

function Ensure-Command {
    param([string]$CommandName)
    $null = Get-Command $CommandName -ErrorAction SilentlyContinue
    if ($LASTEXITCODE -ne 0 -and $null -eq $null) {
        return $false
    }
    return $true
}

function Test-Prerequisites {
    Write-Status "Checking prerequisites..."

    if (-not (Ensure-Command node)) {
        Write-Status "Node.js is not installed. Install Node 18+" "ERROR"
        exit 1
    }
    if (-not (Ensure-Command npm)) {
        Write-Status "npm is not installed." "ERROR"
        exit 1
    }
    if (-not $SkipDocker) {
        if (-not (Ensure-Command docker)) {
            Write-Status "Docker is not installed. Re-run with -SkipDocker or install Docker Desktop" "ERROR"
            exit 1
        }
    }

    Write-Status "Prerequisites OK" "OK"
}

function Setup-EnvironmentFiles {
    if (Test-Path $EnvFile) {
        if ($SkipSetup) {
            Write-Status ".env exists and SkipSetup set, skipping" "OK"
            return
        }
        Write-Status ".env already exists at $EnvFile" "WARN"
        $answer = Read-Host "Recreate .env? (y/N)"
        if ($answer -ne 'y' -and $answer -ne 'Y') {
            return
        }
    }

    Write-Status "Creating backend .env"
    $envLines = @(
        '# AdvisorAI Hub Environment Configuration',
        '',
        '# Database',
        'DATABASE_URL="postgresql://postgres:password@localhost:5432/advisor_ai_hub"',
        '',
        '# JWT Configuration',
        ('JWT_SECRET="advisorai-jwt-' + (Get-Random) + '"'),
        ('JWT_ACCESS_SECRET="advisorai-access-' + (Get-Random) + '"'),
        ('JWT_REFRESH_SECRET="advisorai-refresh-' + (Get-Random) + '"'),
        'JWT_EXPIRES_IN="1d"',
        '',
        '# OpenAI',
        'OPENAI_API_KEY="your-openai-api-key-here"',
        '',
        '# Redis',
        'REDIS_URL="redis://localhost:6379"',
        '',
        '# Frontend URL',
        'FRONTEND_URL="http://localhost:3000"',
        '',
        '# Environment',
        ('NODE_ENV="' + $Environment + '"'),
        'PORT=5000'
    )
    ($envLines -join "`r`n") | Out-File -FilePath $EnvFile -Encoding UTF8
    Write-Status "Created $EnvFile" "OK"

    $frontendEnv = Join-Path $FrontendDir ".env.local"
    "NEXT_PUBLIC_API_URL=http://localhost:5000/api" | Out-File -FilePath $frontendEnv -Encoding UTF8
    Write-Status "Created $frontendEnv" "OK"
}

function Start-DockerServices {
    if ($SkipDocker) { return }

    Write-Status "Starting Docker services"
    $composeFile = Join-Path $RootDir "docker-compose.dev.yml"

    if (Test-Path $composeFile) {
        try {
            docker compose -f $composeFile up -d
            if ($LASTEXITCODE -ne 0) { throw "docker compose failed" }
            Write-Status "Docker services up" "OK"
        } catch {
            Write-Status "docker compose failed, falling back to simple containers" "WARN"
            Start-DockerServicesSimple
        }
    } else {
        Start-DockerServicesSimple
    }
}

function Start-DockerServicesSimple {
    $pg = (& docker ps -q -f name=advisorai-postgres)
    if (-not $pg) {
        Write-Status "Starting Postgres container"
        docker run -d --name advisorai-postgres -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=advisor_ai_hub -p 5432:5432 postgres:15-alpine | Out-Null
        Start-Sleep -Seconds 5
    } else {
        Write-Status "Postgres already running" "OK"
    }

    $rd = (& docker ps -q -f name=advisorai-redis)
    if (-not $rd) {
        Write-Status "Starting Redis container"
        docker run -d --name advisorai-redis -p 6379:6379 redis:7-alpine | Out-Null
    } else {
        Write-Status "Redis already running" "OK"
    }
}

function Setup-Database {
    Write-Status "Setting up database"
    Push-Location $BackendDir
    try {
        npx prisma generate
        if ($LASTEXITCODE -ne 0) { throw "prisma generate failed" }
        if ($ResetDb) {
            npx prisma migrate reset --force
            if ($LASTEXITCODE -ne 0) { throw "prisma reset failed" }
        }
        npx prisma migrate dev --name init
        if ($LASTEXITCODE -ne 0) { throw "prisma migrate failed" }
        Write-Status "Database ready" "OK"
    } finally {
        Pop-Location
    }
}

function Start-Backend {
    Write-Status "Starting backend"
    Push-Location $BackendDir
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Status "Installing backend dependencies"
            npm install
            if ($LASTEXITCODE -ne 0) { throw "npm install (backend) failed" }
        }
        Start-Process -FilePath "npm" -ArgumentList "run","dev" -NoNewWindow -PassThru | Out-Null
        Start-Sleep -Seconds 5
        Write-Status "Backend started (check http://localhost:5000/health)" "OK"
    } finally {
        Pop-Location
    }
}

function Start-Frontend {
    Write-Status "Starting frontend"
    Push-Location $FrontendDir
    try {
        if (-not (Test-Path "node_modules")) {
            Write-Status "Installing frontend dependencies"
            npm install
            if ($LASTEXITCODE -ne 0) { throw "npm install (frontend) failed" }
        }
        Start-Process -FilePath "npm" -ArgumentList "run","dev" -NoNewWindow -PassThru | Out-Null
        Start-Sleep -Seconds 3
        Write-Status "Frontend started (http://localhost:3000)" "OK"
    } finally {
        Pop-Location
    }
}

function Main {
    Write-Status "Starting AdvisorAI Hub"
    Test-Prerequisites
    if (-not $SkipSetup) { Setup-EnvironmentFiles }
    Start-DockerServices
    Setup-Database
    Start-Backend
    Start-Frontend
    Write-Status "All services started"
}

Main

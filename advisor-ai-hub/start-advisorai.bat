@echo off
REM AdvisorAI Hub Startup Script for Windows
REM Simple batch file to start the application

setlocal enabledelayedexpansion

REM Configuration
set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%packages\backend"
set "FRONTEND_DIR=%ROOT_DIR%packages\frontend"
set "ENV_FILE=%BACKEND_DIR%\.env"

REM Colors (using Windows color codes)
REM Not as fancy as PowerShell, but functional
call :PrintStatus "🚀 Starting AdvisorAI Hub..." "cyan"

REM Check prerequisites
call :CheckPrerequisites
if %ERRORLEVEL% neq 0 exit /b 1

REM Setup environment
call :SetupEnvironment
if %ERRORLEVEL% neq 0 exit /b 1

REM Start Docker services
call :StartDockerServices
if %ERRORLEVEL% neq 0 exit /b 1

REM Setup database
call :SetupDatabase
if %ERRORLEVEL% neq 0 exit /b 1

REM Start backend
call :StartBackend
if %ERRORLEVEL% neq 0 exit /b 1

REM Start frontend
call :StartFrontend
if %ERRORLEVEL% neq 0 exit /b 1

REM Show status
call :ShowStatus

call :PrintStatus "✅ AdvisorAI Hub is running!" "green"
call :PrintStatus "Press any key to stop all services..." "yellow"
pause >nul

REM Cleanup
call :Cleanup
exit /b 0

REM ==========================================
REM FUNCTIONS
REM ==========================================

:CheckPrerequisites
call :PrintStatus "Checking prerequisites..." "cyan"

REM Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "❌ Node.js not found. Please install Node.js 18+" "red"
    exit /b 1
)
for /f "tokens=2 delims=v" %%i in ('node --version') do set NODE_VERSION=%%i
call :PrintStatus "✓ Node.js found: v%NODE_VERSION%" "green"

REM Check npm
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "❌ npm not found" "red"
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
call :PrintStatus "✓ npm found: %NPM_VERSION%" "green"

REM Check Docker
docker --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "❌ Docker not found. Install Docker Desktop" "red"
    exit /b 1
)
call :PrintStatus "✓ Docker found" "green"

call :PrintStatus "All prerequisites met!" "green"
exit /b 0

:SetupEnvironment
if exist "%ENV_FILE%" (
    call :PrintStatus ".env file already exists at %ENV_FILE%" "yellow"
    set /p CREATE_NEW="Do you want to recreate it? (y/N): "
    if /i not "!CREATE_NEW!"=="y" exit /b 0
)

call :PrintStatus "Setting up environment files..." "cyan"

REM Create backend .env
(
    echo # AdvisorAI Hub Environment Configuration
    echo # Edit these values for your setup
    echo.
    echo # Database
    echo DATABASE_URL="postgresql://postgres:password@localhost:5432/advisor_ai_hub"
    echo.
    echo # JWT Configuration
    echo JWT_SECRET="advisoriai-super-secret-jwt-key-%RANDOM%"
    echo JWT_ACCESS_SECRET="advisoriai-access-secret-%RANDOM%"
    echo JWT_REFRESH_SECRET="advisoriai-refresh-secret-%RANDOM%"
    echo JWT_EXPIRES_IN="1d"
    echo.
    echo # OpenAI API Key
    echo OPENAI_API_KEY="your-openai-api-key-here"
    echo.
    echo # Redis
    echo REDIS_URL="redis://localhost:6379"
    echo.
    echo # Stripe ^(Optional - for billing features^)
    echo STRIPE_SECRET_KEY="your-stripe-secret-key"
    echo STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
    echo.
    echo # Frontend URL
    echo FRONTEND_URL="http://localhost:3000"
    echo.
    echo # Environment
    echo NODE_ENV="development"
    echo PORT=5000
) > "%ENV_FILE%"

call :PrintStatus "✓ Created %ENV_FILE%" "green"
call :PrintStatus "⚠️  Please edit %ENV_FILE% and add your OpenAI API key!" "yellow"

REM Create frontend .env.local
(
    echo NEXT_PUBLIC_API_URL=http://localhost:5000/api
) > "%FRONTEND_DIR%\.env.local"

call :PrintStatus "✓ Created %FRONTEND_DIR%\.env.local" "green"
exit /b 0

:StartDockerServices
call :PrintStatus "Starting Docker services..." "cyan"

REM Check and start PostgreSQL
docker ps -q -f name=advisorai-postgres >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "Starting PostgreSQL..." "cyan"
    docker run -d --name advisorai-postgres ^
      -e POSTGRES_USER=postgres ^
      -e POSTGRES_PASSWORD=password ^
      -e POSTGRES_DB=advisor_ai_hub ^
      -p 5432:5432 ^
      postgres:15-alpine

    REM Wait for PostgreSQL
    call :PrintStatus "Waiting for PostgreSQL to be ready..." "yellow"
    timeout /t 5 /nobreak >nul
    call :PrintStatus "✓ PostgreSQL ready" "green"
) else (
    call :PrintStatus "✓ PostgreSQL container already running" "green"
)

REM Check and start Redis
docker ps -q -f name=advisorai-redis >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "Starting Redis..." "cyan"
    docker run -d --name advisorai-redis -p 6379:6379 redis:7-alpine
    timeout /t 2 /nobreak >nul
    call :PrintStatus "✓ Redis ready" "green"
) else (
    call :PrintStatus "✓ Redis container already running" "green"
)
exit /b 0

:SetupDatabase
call :PrintStatus "Setting up database..." "cyan"

REM Navigate to backend directory
pushd "%BACKEND_DIR%"

REM Generate Prisma client
call :PrintStatus "Generating Prisma client..." "cyan"
call npx prisma generate
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "❌ Failed to generate Prisma client" "red"
    popd
    exit /b 1
)

REM Run migrations
call :PrintStatus "Running database migrations..." "cyan"
call npx prisma migrate dev --name init
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "❌ Failed to run migrations" "red"
    popd
    exit /b 1
)

call :PrintStatus "✓ Database setup complete" "green"
popd
exit /b 0

:StartBackend
call :PrintStatus "Starting backend..." "cyan"

REM Navigate to backend directory
pushd "%BACKEND_DIR%"

REM Install dependencies if needed
if not exist "node_modules" (
    call :PrintStatus "Installing backend dependencies..." "cyan"
    call npm install
    if %ERRORLEVEL% neq 0 (
        call :PrintStatus "❌ Failed to install backend dependencies" "red"
        popd
        exit /b 1
    )
)

REM Start backend
call :PrintStatus "Starting backend server..." "cyan"
start "AdvisorAI Backend" cmd /c "npm run dev"
timeout /t 5 /nobreak >nul

REM Check if backend is responding
curl -s http://localhost:5000/health >nul 2>&1
if %ERRORLEVEL% neq 0 (
    call :PrintStatus "⚠️  Backend may still be starting up..." "yellow"
) else (
    call :PrintStatus "✓ Backend started successfully" "green"
)

popd
exit /b 0

:StartFrontend
call :PrintStatus "Starting frontend..." "cyan"

REM Navigate to frontend directory
pushd "%FRONTEND_DIR%"

REM Install dependencies if needed
if not exist "node_modules" (
    call :PrintStatus "Installing frontend dependencies..." "cyan"
    call npm install
    if %ERRORLEVEL% neq 0 (
        call :PrintStatus "❌ Failed to install frontend dependencies" "red"
        popd
        exit /b 1
    )
)

REM Start frontend
call :PrintStatus "Starting frontend server..." "cyan"
start "AdvisorAI Frontend" cmd /c "npm run dev"
timeout /t 3 /nobreak >nul

call :PrintStatus "✓ Frontend starting..." "green"
popd
exit /b 0

:ShowStatus
call :PrintStatus "=== AdvisorAI Hub Status ===" "green"
call :PrintStatus "Frontend: http://localhost:3000" "cyan"
call :PrintStatus "Backend API: http://localhost:5000" "cyan"
call :PrintStatus "API Health: http://localhost:5000/health" "cyan"
call :PrintStatus "Database: PostgreSQL (localhost:5432)" "cyan"
call :PrintStatus "Cache: Redis (localhost:6379)" "cyan"
call :PrintStatus "============================" "green"
exit /b 0

:Cleanup
call :PrintStatus "Shutting down services..." "yellow"

REM Kill processes
taskkill /FI "WINDOWTITLE eq AdvisorAI Backend*" /T /F >nul 2>&1
taskkill /FI "WINDOWTITLE eq AdvisorAI Frontend*" /T /F >nul 2>&1

REM Stop Docker containers
docker stop advisorai-postgres advisorai-redis >nul 2>&1
docker rm advisorai-postgres advisorai-redis >nul 2>&1

call :PrintStatus "Services stopped" "green"
exit /b 0

:PrintStatus
REM Simple color output for batch files
REM Colors: red, green, yellow, cyan, white
setlocal
set "message=%~1"
set "color=%~2"

if "%color%"=="red" (
    echo [%TIME%] ❌ %message%
) else if "%color%"=="green" (
    echo [%TIME%] ✅ %message%
) else if "%color%"=="yellow" (
    echo [%TIME%] ⚠️  %message%
) else if "%color%"=="cyan" (
    echo [%TIME%] 🚀 %message%
) else (
    echo [%TIME%] %message%
)
endlocal
exit /b 0

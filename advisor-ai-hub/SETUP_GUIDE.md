# 🚀 Complete Setup Guide

> **Everything you need to get AI Advisor Hub running on your computer**

This guide is designed for users of all technical levels - from complete beginners to experienced developers.

---

## 🎯 Choose Your Setup Method

| Method | Difficulty | Time | Best For |
|--------|------------|------|----------|
| [One-Click Setup](#-one-click-setup-beginners) | ⭐ | 5 minutes | Complete beginners |
| [Docker Setup](#-docker-setup-easy) | ⭐⭐ | 10 minutes | Developers, tech-savvy users |
| [Manual Setup](#-manual-setup-advanced) | ⭐⭐⭐ | 30 minutes | Full control, customization |

---

## 🟢 One-Click Setup (Beginners)

### Windows Users

1. **Download the repository**
   ```cmd
   git clone https://github.com/lukebarhoumeh/AI-Advisor.git
   cd AI-Advisor/advisor-ai-hub
   ```

2. **Run the startup script**
   ```cmd
   # Double-click this file in Windows Explorer:
   start-advisorai.bat
   
   # OR run in Command Prompt:
   start-advisorai.bat
   ```

3. **Wait for setup to complete** (5-10 minutes)
   - The script will automatically install dependencies
   - Set up the database
   - Start all services

4. **Access the application**
   - Open your browser and go to: http://localhost:3000
   - You should see the AI Advisor Hub login page

### Mac/Linux Users

1. **Download the repository**
   ```bash
   git clone https://github.com/lukebarhoumeh/AI-Advisor.git
   cd AI-Advisor/advisor-ai-hub
   ```

2. **Make the script executable and run it**
   ```bash
   chmod +x start-advisorai.sh
   ./start-advisorai.sh
   ```

3. **Wait for setup to complete** (5-10 minutes)

4. **Access the application**
   - Open your browser and go to: http://localhost:3000

---

## 🟡 Docker Setup (Easy)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop) installed
- Basic command line knowledge

### Step-by-Step Instructions

1. **Install Docker Desktop**
   - Download from: https://www.docker.com/products/docker-desktop
   - Follow the installation wizard
   - Start Docker Desktop

2. **Clone the repository**
   ```bash
   git clone https://github.com/lukebarhoumeh/AI-Advisor.git
   cd AI-Advisor/advisor-ai-hub
   ```

3. **Set up environment variables**
   
   Create `.env` file in the root directory:
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:password@postgres:5432/advisor_ai_hub"
   
   # Redis
   REDIS_URL="redis://redis:6379"
   
   # JWT Secrets (generate random strings)
   JWT_SECRET="your-super-secret-jwt-key-here"
   JWT_ACCESS_SECRET="your-access-secret-key"
   JWT_REFRESH_SECRET="your-refresh-secret-key"
   
   # OpenAI (get from https://platform.openai.com/api-keys)
   OPENAI_API_KEY="your-openai-api-key"
   
   # Stripe (get from https://dashboard.stripe.com/apikeys)
   STRIPE_SECRET_KEY="your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="your-stripe-publishable-key"
   
   # Email (optional)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

4. **Start all services with Docker**
   ```bash
   docker-compose up -d
   ```

5. **Set up the database**
   ```bash
   # Wait for services to start (30 seconds)
   sleep 30
   
   # Run database migrations
   docker-compose exec backend npx prisma migrate dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - Database Studio: http://localhost:5555

### Useful Docker Commands

```bash
# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Restart services
docker-compose restart

# Update and restart
docker-compose down
docker-compose pull
docker-compose up -d
```

---

## 🔴 Manual Setup (Advanced)

### Prerequisites

**Required Software:**
- Node.js 18+ ([Download](https://nodejs.org/))
- npm 9+ (comes with Node.js)
- PostgreSQL 14+ ([Download](https://www.postgresql.org/download/))
- Redis 6+ ([Download](https://redis.io/download))
- Git ([Download](https://git-scm.com/downloads))

**Required Accounts:**
- OpenAI API account ([Sign up](https://platform.openai.com/))
- Stripe account ([Sign up](https://dashboard.stripe.com/register))

### Step 1: Install Required Software

#### Node.js Installation
1. Go to https://nodejs.org/
2. Download the LTS version (18.x or higher)
3. Run the installer and follow the wizard
4. Verify installation:
   ```bash
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 9.x.x or higher
   ```

#### PostgreSQL Installation

**Windows:**
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer
3. Remember the password you set for the `postgres` user
4. Verify installation:
   ```cmd
   psql --version
   ```

**Mac (using Homebrew):**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Redis Installation

**Windows:**
1. Download Redis from https://github.com/microsoftarchive/redis/releases
2. Extract and run `redis-server.exe`

**Mac (using Homebrew):**
```bash
brew install redis
brew services start redis
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Step 2: Set Up Database

1. **Create database**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres
   
   # Create database
   CREATE DATABASE advisor_ai_hub;
   
   # Exit PostgreSQL
   \q
   ```

2. **Verify Redis is running**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

### Step 3: Clone and Configure

1. **Clone the repository**
   ```bash
   git clone https://github.com/lukebarhoumeh/AI-Advisor.git
   cd AI-Advisor/advisor-ai-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   **Backend environment** (`packages/backend/.env`):
   ```env
   # Database
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/advisor_ai_hub"
   
   # Redis
   REDIS_URL="redis://localhost:6379"
   
   # JWT Secrets (generate random 32+ character strings)
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
   JWT_ACCESS_SECRET="your-access-secret-key-minimum-32-characters"
   JWT_REFRESH_SECRET="your-refresh-secret-key-minimum-32-characters"
   
   # OpenAI API
   OPENAI_API_KEY="sk-your-openai-api-key"
   
   # Stripe
   STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
   STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
   STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
   
   # Email (Gmail example)
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   
   # Application
   NODE_ENV="development"
   PORT="5000"
   FRONTEND_URL="http://localhost:3000"
   ```

   **Frontend environment** (`packages/frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
   ```

### Step 4: Database Setup

1. **Navigate to backend directory**
   ```bash
   cd packages/backend
   ```

2. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

3. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

4. **Verify database setup**
   ```bash
   npx prisma studio
   # This opens a web interface to view your database
   ```

### Step 5: Start Development Servers

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
```

**Terminal 3 - Database Studio (optional):**
```bash
cd packages/backend
npx prisma studio
```

### Step 6: Verify Installation

1. **Check Backend**: http://localhost:5000/api/health
   - Should return: `{"status": "ok"}`

2. **Check Frontend**: http://localhost:3000
   - Should show the AI Advisor Hub login page

3. **Check Database**: http://localhost:5555
   - Should show the Prisma Studio interface

---

## 🔧 Troubleshooting

### Common Issues

#### "Database connection failed"
```bash
# Check if PostgreSQL is running
# Windows: Check Services
# Mac: brew services list | grep postgres
# Linux: sudo systemctl status postgresql

# Test connection
psql -U postgres -h localhost -p 5432 -d advisor_ai_hub
```

#### "Redis connection failed"
```bash
# Check if Redis is running
redis-cli ping

# Start Redis if not running
# Windows: redis-server.exe
# Mac: brew services start redis
# Linux: sudo systemctl start redis-server
```

#### "OpenAI API key invalid"
- Verify your API key at https://platform.openai.com/api-keys
- Make sure you have credits in your OpenAI account
- Check that the key starts with `sk-`

#### "Port already in use"
```bash
# Find process using port 3000 or 5000
# Windows:
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Mac/Linux:
lsof -i :3000
lsof -i :5000

# Kill the process or use different ports
```

#### "Permission denied" (Mac/Linux)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

### Getting Help

1. **Check the logs**
   ```bash
   # Backend logs
   cd packages/backend
   npm run dev
   
   # Frontend logs
   cd packages/frontend
   npm run dev
   ```

2. **Reset everything**
   ```bash
   # Stop all services
   # Delete node_modules and reinstall
   rm -rf node_modules packages/*/node_modules
   npm install
   
   # Reset database
   cd packages/backend
   npx prisma migrate reset
   ```

3. **Ask for help**
   - Create an issue on GitHub
   - Join our Discord community
   - Email support@advisorai.com

---

## 🎉 Next Steps

Once you have AI Advisor Hub running:

1. **Create your first account** at http://localhost:3000/register
2. **Set up your business profile**
3. **Explore the AI modules**
4. **Try generating some content**

### Learn More

- [API Documentation](docs/API.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

---

## 📞 Support

**Still having trouble? We're here to help!**

- 🐛 [Report Issues](https://github.com/lukebarhoumeh/AI-Advisor/issues)
- 💬 [Discussions](https://github.com/lukebarhoumeh/AI-Advisor/discussions)
- 📧 Email: support@advisorai.com
- 📚 [Documentation](https://docs.advisorai.com)

---

<div align="center">

**Happy Building! 🚀**

*If this guide helped you, please ⭐ star the repository!*

</div>

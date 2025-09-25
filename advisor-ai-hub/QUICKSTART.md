# 🚀 AdvisorAI Hub - Quick Start Guide

## One-Click Startup

### Option 1: PowerShell (Recommended)
```powershell
# Run the PowerShell script (recommended)
.\start-advisorai.ps1
```

### Option 2: Batch File
```cmd
REM Run the batch file (if PowerShell is restricted)
start-advisorai.bat
```

### Option 3: Manual Setup
```bash
# 1. Install dependencies
npm install

# 2. Start database services
docker-compose up postgres redis -d

# 3. Setup database
cd packages/backend
npx prisma migrate dev
npx prisma generate

# 4. Start services
# Terminal 1:
npm run dev  # Backend

# Terminal 2:
cd ../frontend
npm run dev  # Frontend
```

## ⚙️ Configuration

The startup scripts will automatically:

1. **Check Prerequisites**:
   - Node.js 18+
   - npm
   - Docker (optional)

2. **Create Environment Files**:
   - `packages/backend/.env` - Backend configuration
   - `packages/frontend/.env.local` - Frontend configuration

3. **Setup Database**:
   - Start PostgreSQL and Redis containers
   - Run Prisma migrations
   - Generate Prisma client

4. **Start Services**:
   - Backend API server (port 5000)
   - Frontend development server (port 3000)

## 🔧 Environment Variables

**Required**: Edit `packages/backend/.env` and add:
```env
OPENAI_API_KEY="your-openai-api-key-here"
```

**Optional**: For billing features:
```env
STRIPE_SECRET_KEY="your-stripe-secret-key"
STRIPE_WEBHOOK_SECRET="your-stripe-webhook-secret"
```

## 🌐 Access Points

Once running, access:

- **Application**: http://localhost:3000
- **API Health**: http://localhost:5000/health
- **API Documentation**: http://localhost:5000/api (when implemented)

## 🛠️ Troubleshooting

### Common Issues:

**"Execution Policy" Error (PowerShell):**
```powershell
# Allow scripts to run
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Port Already in Use:**
```cmd
REM Kill processes on ports 3000 and 5000
npx kill-port 3000
npx kill-port 5000
```

**Database Connection Issues:**
```bash
# Check if containers are running
docker ps

# Restart containers
docker-compose restart postgres redis
```

**Missing Dependencies:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

## 📝 First Time Setup

1. **Run the startup script**
2. **Edit the generated `.env` file** - add your OpenAI API key
3. **Register a new account** at http://localhost:3000/register
4. **Choose your role**:
   - **SMB Owner** - For small business owners
   - **Advisor** - For consultants managing multiple clients
5. **Start using AI modules** from the dashboard!

## 🎯 Features Available

- ✅ **Marketing Advisor** - AI content generation
- ✅ **Operations Advisor** - Invoicing & scheduling
- ✅ **Support Advisor** - Chatbot & FAQ management
- ✅ **Compliance Advisor** - Checklists & audits
- ✅ **Multi-tenant Support** - SMB & Advisor roles
- ✅ **Billing Integration** - Subscription management
- ✅ **Third-party Integrations** - Gmail, Calendar, etc.

## 🆘 Need Help?

- Check the main `README.md` for detailed documentation
- Ensure your OpenAI API key is properly configured
- Make sure Docker Desktop is running
- Try the batch file if PowerShell scripts are restricted

**Happy building with AdvisorAI Hub!** 🎉

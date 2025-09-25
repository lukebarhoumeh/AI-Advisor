# 🤖 AI Advisor Hub

> **Intelligent Business Automation Platform** - Transform your small business operations with AI-powered advisors that handle marketing, operations, customer support, and compliance.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?logo=node.js&logoColor=white)](https://nodejs.org/)

## 🌟 What is AI Advisor Hub?

AI Advisor Hub is a comprehensive platform that provides intelligent business automation for small and medium businesses (SMBs). Think of it as having a team of expert advisors available 24/7 to help with:

- 📈 **Marketing**: Create compelling ads, social media posts, and email campaigns
- ⚙️ **Operations**: Automate invoicing, scheduling, and inventory management  
- 💬 **Customer Support**: AI-powered chatbots and intelligent ticket routing
- 📋 **Compliance**: Industry-specific checklists and regulatory guidance
- 💰 **Business Intelligence**: Analytics and insights to grow your business

## 🎯 Perfect For

- **Small Business Owners** who want to automate routine tasks
- **Independent Consultants** offering AI-powered business advice
- **Marketing Agencies** looking to scale their services
- **Business Coaches** who want to provide data-driven insights
- **Non-Technical Users** who need simple, powerful tools

---

## 🚀 Quick Start (For Everyone)

### Option 1: One-Click Setup (Recommended for Beginners)

**Windows Users:**
```cmd
# Download and double-click this file:
start-advisorai.bat
```

**Or run in PowerShell:**
```powershell
.\start-advisorai.ps1
```

### Option 2: Docker Setup (Easy for Developers)

```bash
# Clone the repository
git clone https://github.com/lukebarhoumeh/AI-Advisor.git
cd AI-Advisor/advisor-ai-hub

# Start everything with Docker
docker-compose up -d

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

### Option 3: Manual Setup (For Advanced Users)

See our detailed [Setup Guide](SETUP_GUIDE.md) for step-by-step instructions.

---

## ✨ Key Features

### 🤖 AI-Powered Modules

| Module | Description | Perfect For |
|--------|-------------|-------------|
| **Marketing Advisor** | Generate ad copy, social posts, email campaigns | Small businesses, agencies |
| **Operations Advisor** | Automate invoicing, scheduling, inventory | Service businesses, retail |
| **Support Advisor** | AI chatbots, ticket management | E-commerce, SaaS |
| **Compliance Advisor** | Industry checklists, regulatory guidance | Healthcare, finance, legal |

### 🏢 Multi-Tenant Architecture

- **Business Owners**: Use AI advisors for your own business
- **Independent Advisors**: Offer AI-powered services to clients
- **Agencies**: Scale your consulting services with AI

### 💳 Flexible Pricing

- **Starter**: $49/month - Basic AI features
- **Professional**: $149/month - Advanced automation
- **Enterprise**: $299/month - Full platform access

---

## 🛠️ Technology Stack

### Frontend
- **Next.js 14** - Modern React framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Beautiful, responsive design
- **Radix UI** - Accessible components

### Backend
- **Node.js** - Server runtime
- **Express** - Web framework
- **Prisma** - Database toolkit
- **PostgreSQL** - Reliable database

### AI & Integrations
- **OpenAI GPT-4** - Advanced AI capabilities
- **Stripe** - Payment processing
- **Redis** - Fast caching
- **AWS** - Cloud infrastructure

---

## 📱 Screenshots

> *Coming soon - We're working on adding screenshots of the dashboard and key features!*

---

## 🎯 Getting Started (Step by Step)

### Prerequisites

**For Non-Technical Users:**
- A computer with Windows, Mac, or Linux
- Internet connection
- Basic understanding of using websites

**For Developers:**
- Node.js 18+ and npm 9+
- PostgreSQL database
- Redis server
- OpenAI API key

### 1. Installation

Choose your preferred method:

**🟢 Easiest (One-Click):**
```bash
# Windows
start-advisorai.bat

# Mac/Linux  
./start-advisorai.sh
```

**🟡 Docker (Recommended):**
```bash
git clone https://github.com/lukebarhoumeh/AI-Advisor.git
cd AI-Advisor/advisor-ai-hub
docker-compose up -d
```

**🔴 Manual (Advanced):**
See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions.

### 2. Configuration

**Environment Variables:**
```env
# Backend (.env)
DATABASE_URL="postgresql://user:pass@localhost:5432/advisor_ai_hub"
OPENAI_API_KEY="your-openai-key"
JWT_SECRET="your-secret-key"

# Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:5000/api"
```

### 3. Database Setup

```bash
cd packages/backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development

```bash
# Backend (Terminal 1)
cd packages/backend
npm run dev

# Frontend (Terminal 2)  
cd packages/frontend
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Database Studio**: `npx prisma studio`

---

## 📁 Project Structure

```
advisor-ai-hub/
├── 📦 packages/
│   ├── 🖥️ backend/          # API server
│   │   ├── src/
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── middleware/   # Auth & validation
│   │   │   ├── routes/       # API endpoints
│   │   │   └── utils/        # Helper functions
│   │   └── prisma/          # Database schema
│   ├── 🎨 frontend/         # Web application
│   │   ├── src/
│   │   │   ├── app/         # Pages & routing
│   │   │   ├── components/  # Reusable UI
│   │   │   ├── services/    # API calls
│   │   │   └── store/       # State management
│   └── 🔄 shared/           # Common code
├── 🏗️ infrastructure/       # Deployment configs
├── 📚 docs/                # Documentation
└── 🚀 start-advisorai.*    # Quick start scripts
```

---

## 🔧 Development Commands

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Create new migration
npx prisma migrate dev --name add-new-feature

# View database in browser
npx prisma studio

# Reset database
npx prisma migrate reset
```

### Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Building & Deployment
```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@advisor-ai/backend

# Start production server
npm run start
```

---

## 🌐 API Documentation

### Authentication
```bash
POST /api/auth/register    # Create new account
POST /api/auth/login       # Sign in
POST /api/auth/refresh     # Refresh token
POST /api/auth/logout      # Sign out
```

### AI Modules
```bash
GET  /api/ai/templates/:moduleType     # Get AI templates
POST /api/ai/generate/:businessId      # Generate AI content
GET  /api/ai/history/:businessId       # Get generation history
```

### Business Management
```bash
GET    /api/businesses           # List user's businesses
POST   /api/businesses           # Create new business
PUT    /api/businesses/:id       # Update business
DELETE /api/businesses/:id       # Delete business
```

### Subscriptions
```bash
GET  /api/subscriptions/plans    # Get pricing plans
POST /api/subscriptions/create   # Create subscription
PUT  /api/subscriptions/update   # Update subscription
```

---

## 🚀 Deployment

### Production Deployment Options

**Option 1: Vercel (Recommended for Frontend)**
```bash
# Deploy frontend to Vercel
cd packages/frontend
vercel --prod
```

**Option 2: AWS (Full Stack)**
```bash
# Deploy with AWS CDK
cd infrastructure
npm run deploy
```

**Option 3: Docker**
```bash
# Build production images
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Setup

**Required Services:**
- PostgreSQL database (AWS RDS recommended)
- Redis cache (AWS ElastiCache recommended)
- File storage (AWS S3 recommended)
- Email service (AWS SES recommended)

**Environment Variables:**
See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete production configuration.

---

## 🤝 Contributing

We welcome contributions from developers of all skill levels! 

### For Non-Technical Contributors
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 📖 Help improve documentation
- 🧪 Test new features

### For Developers
1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📋 Roadmap

### 🎯 Current Version (v1.0)
- ✅ Core AI modules (Marketing, Operations, Support, Compliance)
- ✅ Multi-tenant architecture
- ✅ Stripe integration
- ✅ Basic dashboard

### 🚀 Upcoming Features (v1.1)
- 🔄 Advanced AI workflows
- 📊 Enhanced analytics dashboard
- 🔌 More third-party integrations
- 📱 Mobile app (React Native)

### 🎨 Future Vision (v2.0)
- 🤖 Custom AI model training
- 🌍 Multi-language support
- 🏢 Enterprise features
- 🔗 API marketplace

---

## 🆘 Support & Help

### Getting Help

**📚 Documentation:**
- [Setup Guide](SETUP_GUIDE.md) - Detailed installation instructions
- [API Documentation](docs/API.md) - Complete API reference
- [Contributing Guide](CONTRIBUTING.md) - How to contribute
- [Deployment Guide](docs/DEPLOYMENT.md) - Production deployment

**💬 Community:**
- 🐛 [Report Issues](https://github.com/lukebarhoumeh/AI-Advisor/issues)
- 💡 [Request Features](https://github.com/lukebarhoumeh/AI-Advisor/issues/new?template=feature_request.md)
- 💬 [Discussions](https://github.com/lukebarhoumeh/AI-Advisor/discussions)

**📧 Contact:**
- Email: support@advisorai.com
- Twitter: [@AdvisorAI](https://twitter.com/advisorai)
- LinkedIn: [AdvisorAI](https://linkedin.com/company/advisorai)

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API
- **Vercel** for the amazing Next.js framework
- **Prisma** for the excellent database toolkit
- **Tailwind CSS** for beautiful styling
- **All Contributors** who help make this project better

---

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=lukebarhoumeh/AI-Advisor&type=Date)](https://star-history.com/#lukebarhoumeh/AI-Advisor&Date)

---

<div align="center">

**Made with ❤️ by the AdvisorAI Team**

[Website](https://advisorai.com) • [Documentation](https://docs.advisorai.com) • [Support](https://support.advisorai.com)

</div>
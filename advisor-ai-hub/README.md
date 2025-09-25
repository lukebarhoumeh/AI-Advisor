# AdvisorAI Hub

AI-powered business advisor platform for SMBs - simplifying operations with intelligent automation.

## 🚀 Quick Start

### One-Click Setup (Windows)
```cmd
# Simply run the startup script
.\start.cmd
# OR
.\start-advisorai.ps1
# OR
start-advisorai.bat
```

### Manual Setup
```bash
npm install
docker-compose up postgres redis -d
cd packages/backend && npx prisma migrate dev
npm run dev  # Backend
cd ../frontend && npm run dev  # Frontend
```

## 🚀 Features

- **Marketing Advisor**: Generate ad copy, social posts, and email campaigns
- **Operations Advisor**: Automate invoicing, scheduling, and inventory management
- **Customer Support Advisor**: AI chatbot and ticket management
- **Compliance Advisor**: Industry-specific checklists and templates
- **Multi-tenant Architecture**: Support for SMB owners and independent advisors
- **Subscription Tiers**: Flexible pricing from $49-$299/month

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Node.js, Express, Prisma, PostgreSQL
- **AI**: OpenAI GPT-4 integration
- **Infrastructure**: AWS, Redis for caching
- **Payments**: Stripe integration

## 📋 Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL database
- Redis server
- OpenAI API key
- Stripe account (for payments)

## 🏁 Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/advisor-ai-hub.git
cd advisor-ai-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**

Backend (.env in packages/backend):
```env
# Copy from packages/backend/env.example
DATABASE_URL="postgresql://postgres:password@localhost:5432/advisor_ai_hub"
JWT_SECRET=your-secret-key
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
OPENAI_API_KEY=your-openai-key
# ... see env.example for all variables
```

Frontend (.env.local in packages/frontend):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. **Set up the database**
```bash
cd packages/backend
npx prisma migrate dev
npx prisma generate
```

5. **Start development servers**

In separate terminals:

Backend:
```bash
cd packages/backend
npm run dev
```

Frontend:
```bash
cd packages/frontend
npm run dev
```

6. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📁 Project Structure

```
advisor-ai-hub/
├── packages/
│   ├── backend/          # Express API server
│   │   ├── src/
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── routes/
│   │   │   └── utils/
│   │   └── prisma/       # Database schema
│   ├── frontend/         # Next.js application
│   │   ├── src/
│   │   │   ├── app/      # App router pages
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   └── store/    # Zustand state management
│   └── shared/           # Shared types and utilities
├── infrastructure/       # Deployment configs
└── docs/                # Documentation
```

## 🔧 Development

### Database Commands
```bash
# Generate Prisma client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration-name

# View database
npx prisma studio
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Building for Production
```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@advisor-ai/backend
```

## 🚀 Deployment

The application is designed to be deployed on AWS with:
- Frontend: Vercel or AWS Amplify
- Backend: AWS ECS or Lambda
- Database: AWS RDS (PostgreSQL)
- Cache: AWS ElastiCache (Redis)
- Files: AWS S3

## 📝 API Documentation

Key endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/businesses` - List businesses
- `POST /api/ai/generate/:businessId` - Generate AI content
- `GET /api/ai/templates/:moduleType` - Get AI templates

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 💡 Support

For support, email support@advisorai.com or join our Slack channel.

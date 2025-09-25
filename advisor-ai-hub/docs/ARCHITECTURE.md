# 🏗️ Architecture Overview

> **Technical architecture and design decisions for AI Advisor Hub**

---

## 🎯 System Overview

AI Advisor Hub is a modern, scalable SaaS platform built with a microservices-inspired architecture using a monorepo approach. The system is designed to handle multiple tenants (business owners and independent advisors) with AI-powered automation modules.

---

## 🏛️ High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Web App<br/>Next.js]
        MOBILE[Mobile App<br/>React Native]
        API_CLIENT[API Clients<br/>SDK/Webhooks]
    end
    
    subgraph "API Gateway"
        NGINX[Nginx<br/>Load Balancer]
        AUTH[Auth Middleware<br/>JWT Validation]
    end
    
    subgraph "Application Layer"
        BACKEND[Backend API<br/>Node.js/Express]
        AI_SERVICE[AI Service<br/>OpenAI Integration]
        EMAIL_SERVICE[Email Service<br/>SMTP/SES]
    end
    
    subgraph "Data Layer"
        POSTGRES[(PostgreSQL<br/>Primary Database)]
        REDIS[(Redis<br/>Cache & Sessions)]
        S3[(S3<br/>File Storage)]
    end
    
    subgraph "External Services"
        OPENAI[OpenAI API<br/>GPT-4]
        STRIPE[Stripe<br/>Payments]
        SMTP[Email Provider<br/>SES/SMTP]
    end
    
    WEB --> NGINX
    MOBILE --> NGINX
    API_CLIENT --> NGINX
    
    NGINX --> AUTH
    AUTH --> BACKEND
    
    BACKEND --> AI_SERVICE
    BACKEND --> EMAIL_SERVICE
    
    BACKEND --> POSTGRES
    BACKEND --> REDIS
    BACKEND --> S3
    
    AI_SERVICE --> OPENAI
    BACKEND --> STRIPE
    EMAIL_SERVICE --> SMTP
```

---

## 📦 Monorepo Structure

```
advisor-ai-hub/
├── packages/
│   ├── backend/              # Express.js API server
│   ├── frontend/             # Next.js React application
│   └── shared/               # Shared types and utilities
├── infrastructure/           # Deployment configurations
├── docs/                     # Documentation
└── .github/                  # GitHub workflows and templates
```

### Package Dependencies

```mermaid
graph LR
    SHARED[shared] --> BACKEND[backend]
    SHARED --> FRONTEND[frontend]
    BACKEND --> FRONTEND
```

---

## 🖥️ Frontend Architecture

### Technology Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Radix UI
- **State Management**: Zustand
- **Authentication**: JWT with refresh tokens

### Component Architecture

```
src/
├── app/                      # App Router pages
│   ├── (auth)/              # Authentication routes
│   ├── (dashboard)/         # Protected dashboard routes
│   └── globals.css          # Global styles
├── components/              # Reusable components
│   ├── ui/                  # Base UI components
│   ├── layout/              # Layout components
│   ├── dashboard/           # Dashboard-specific components
│   └── modules/             # AI module components
├── services/                # API service layer
├── hooks/                   # Custom React hooks
├── store/                   # State management
└── lib/                     # Utility functions
```

### State Management Strategy

```typescript
// Zustand store structure
interface AppState {
  // Authentication
  user: User | null;
  tokens: Tokens | null;
  
  // Business data
  businesses: Business[];
  currentBusiness: Business | null;
  
  // AI modules
  aiGenerations: AIGeneration[];
  
  // UI state
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
}
```

---

## 🔧 Backend Architecture

### Technology Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis
- **Authentication**: JWT with refresh tokens

### Service Layer Architecture

```
src/
├── controllers/             # Request handlers
│   ├── auth.controller.ts
│   ├── business.controller.ts
│   ├── ai.controller.ts
│   └── modules/             # Module-specific controllers
├── services/                # Business logic
│   ├── auth.service.ts
│   ├── ai.service.ts
│   ├── email.service.ts
│   └── cache.service.ts
├── middleware/              # Express middleware
│   ├── auth.ts
│   ├── error.ts
│   └── validation.ts
├── routes/                  # API route definitions
├── utils/                   # Utility functions
└── types/                   # TypeScript definitions
```

### Database Design

#### Core Entities

```mermaid
erDiagram
    User ||--o{ Business : owns
    User ||--o{ Subscription : has
    Business ||--o{ AIGeneration : generates
    Business ||--o{ Integration : connects
    
    User {
        uuid id PK
        string email
        string name
        string password_hash
        timestamp created_at
        timestamp updated_at
    }
    
    Business {
        uuid id PK
        uuid user_id FK
        string name
        string industry
        string size
        json settings
        timestamp created_at
        timestamp updated_at
    }
    
    AIGeneration {
        uuid id PK
        uuid business_id FK
        string module_type
        string template_id
        json inputs
        json outputs
        string status
        timestamp created_at
    }
    
    Subscription {
        uuid id PK
        uuid user_id FK
        string plan_id
        string stripe_subscription_id
        string status
        timestamp created_at
        timestamp updated_at
    }
```

---

## 🤖 AI Module Architecture

### Module Types

```typescript
interface AIModule {
  id: string;
  name: string;
  type: 'marketing' | 'operations' | 'support' | 'compliance';
  templates: AITemplate[];
  settings: ModuleSettings;
}

interface AITemplate {
  id: string;
  name: string;
  description: string;
  inputs: TemplateInput[];
  prompt: string;
  outputFormat: 'text' | 'json' | 'html';
}
```

### AI Service Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AIService
    participant OpenAI
    participant Cache
    
    Client->>API: POST /api/ai/generate
    API->>AIService: generateContent()
    AIService->>Cache: checkRateLimit()
    Cache-->>AIService: rate limit status
    AIService->>OpenAI: generate completion
    OpenAI-->>AIService: AI response
    AIService->>Cache: store generation
    AIService-->>API: formatted response
    API-->>Client: AI generation result
```

---

## 🔐 Security Architecture

### Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant AuthService
    participant Database
    
    Client->>API: POST /auth/login
    API->>AuthService: validateCredentials()
    AuthService->>Database: getUserByEmail()
    Database-->>AuthService: user data
    AuthService->>AuthService: verifyPassword()
    AuthService->>AuthService: generateTokens()
    AuthService-->>API: access + refresh tokens
    API-->>Client: authentication response
```

### Authorization Levels

1. **Public**: No authentication required
   - Health checks
   - Public documentation

2. **Authenticated**: Valid JWT required
   - User profile management
   - Business management
   - AI generations

3. **Admin**: Admin role required
   - User management
   - System configuration
   - Analytics

### Data Protection

- **Encryption**: All sensitive data encrypted at rest
- **HTTPS**: All communications encrypted in transit
- **JWT**: Secure token-based authentication
- **Rate Limiting**: API abuse prevention
- **Input Validation**: Comprehensive data sanitization

---

## 📊 Caching Strategy

### Redis Cache Layers

```typescript
interface CacheStrategy {
  // Session cache (TTL: 7 days)
  sessions: {
    key: `session:${userId}`;
    ttl: 604800; // 7 days
  };
  
  // API response cache (TTL: 1 hour)
  apiResponses: {
    key: `api:${endpoint}:${hash}`;
    ttl: 3600; // 1 hour
  };
  
  // AI generation cache (TTL: 24 hours)
  aiGenerations: {
    key: `ai:${businessId}:${moduleType}`;
    ttl: 86400; // 24 hours
  };
}
```

---

## 🚀 Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
services:
  frontend:
    build: ./packages/frontend
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:5000/api
  
  backend:
    build: ./packages/backend
    ports: ["5000:5000"]
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/advisor_ai_hub
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15
    environment:
      - POSTGRES_DB=advisor_ai_hub
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
```

### Production Environment

```mermaid
graph TB
    subgraph "AWS Cloud"
        subgraph "Frontend"
            CLOUDFRONT[CloudFront CDN]
            S3[S3 Static Hosting]
        end
        
        subgraph "Backend"
            ALB[Application Load Balancer]
            ECS[ECS Fargate]
            ECR[ECR Container Registry]
        end
        
        subgraph "Data"
            RDS[RDS PostgreSQL]
            ELASTICACHE[ElastiCache Redis]
        end
        
        subgraph "Services"
            SES[SES Email]
            S3_STORAGE[S3 File Storage]
        end
    end
    
    USERS[Users] --> CLOUDFRONT
    CLOUDFRONT --> S3
    CLOUDFRONT --> ALB
    ALB --> ECS
    ECS --> RDS
    ECS --> ELASTICACHE
    ECS --> SES
    ECS --> S3_STORAGE
```

---

## 📈 Scalability Considerations

### Horizontal Scaling

1. **Stateless Backend**: All backend services are stateless
2. **Database Connection Pooling**: Prisma connection pooling
3. **Redis Clustering**: Distributed caching
4. **CDN**: Global content delivery

### Performance Optimization

1. **Database Indexing**: Optimized queries with proper indexes
2. **Query Optimization**: Efficient Prisma queries
3. **Caching Strategy**: Multi-layer caching with Redis
4. **Code Splitting**: Frontend bundle optimization
5. **Image Optimization**: Next.js automatic image optimization

### Monitoring & Observability

```typescript
interface MonitoringStack {
  metrics: 'Prometheus + Grafana';
  logging: 'Winston + CloudWatch';
  tracing: 'OpenTelemetry';
  errors: 'Sentry';
  uptime: 'UptimeRobot';
}
```

---

## 🔄 Data Flow Patterns

### AI Generation Flow

```mermaid
flowchart TD
    A[User Request] --> B[Validate Input]
    B --> C[Check Rate Limits]
    C --> D[Load Template]
    D --> E[Build Prompt]
    E --> F[Call OpenAI API]
    F --> G[Process Response]
    G --> H[Save to Database]
    H --> I[Update Cache]
    I --> J[Return to User]
    
    C --> K[Rate Limit Exceeded]
    K --> L[Return Error]
    
    F --> M[API Error]
    M --> N[Retry Logic]
    N --> F
```

### Subscription Flow

```mermaid
flowchart TD
    A[User Selects Plan] --> B[Create Stripe Session]
    B --> C[Redirect to Stripe]
    C --> D[Payment Success]
    D --> E[Stripe Webhook]
    E --> F[Update Subscription]
    F --> G[Grant Access]
    G --> H[Send Confirmation]
    
    D --> I[Payment Failed]
    I --> J[Return to App]
    J --> K[Show Error]
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```mermaid
graph TD
    A[Unit Tests] --> B[Integration Tests]
    B --> C[E2E Tests]
    
    A1[Service Functions<br/>80% Coverage] --> A
    B1[API Endpoints<br/>60% Coverage] --> B
    C1[Critical User Flows<br/>40% Coverage] --> C
```

### Test Types

1. **Unit Tests**: Service functions, utilities
2. **Integration Tests**: API endpoints, database operations
3. **E2E Tests**: Complete user workflows
4. **Performance Tests**: Load testing, stress testing

---

## 🔧 Development Workflow

### Git Flow

```mermaid
graph LR
    A[main] --> B[develop]
    B --> C[feature/xyz]
    C --> D[Pull Request]
    D --> B
    B --> E[release/v1.0]
    E --> F[main]
    F --> G[Production]
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Setup Node.js
      - Install dependencies
      - Run linting
      - Run tests
      - Build packages
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - Build Docker images
      - Push to ECR
      - Deploy to ECS
```

---

## 📚 Technology Decisions

### Why These Technologies?

| Technology | Reason | Alternative |
|------------|--------|-------------|
| **Next.js** | SSR, performance, developer experience | React + Vite |
| **Express.js** | Mature, flexible, extensive ecosystem | Fastify, Koa |
| **PostgreSQL** | ACID compliance, JSON support | MongoDB, MySQL |
| **Prisma** | Type safety, migration management | TypeORM, Sequelize |
| **Redis** | Performance, pub/sub, data structures | Memcached |
| **OpenAI** | Best AI capabilities, reliability | Anthropic, Cohere |

---

## 🔮 Future Architecture Plans

### Microservices Migration

```mermaid
graph TB
    subgraph "Future Architecture"
        API_GATEWAY[API Gateway]
        
        AUTH_SERVICE[Auth Service]
        USER_SERVICE[User Service]
        BUSINESS_SERVICE[Business Service]
        AI_SERVICE[AI Service]
        PAYMENT_SERVICE[Payment Service]
        
        EVENT_BUS[Event Bus<br/>Kafka/RabbitMQ]
        
        DB_USER[(User DB)]
        DB_BUSINESS[(Business DB)]
        DB_AI[(AI DB)]
        DB_PAYMENT[(Payment DB)]
    end
    
    API_GATEWAY --> AUTH_SERVICE
    API_GATEWAY --> USER_SERVICE
    API_GATEWAY --> BUSINESS_SERVICE
    API_GATEWAY --> AI_SERVICE
    API_GATEWAY --> PAYMENT_SERVICE
    
    AUTH_SERVICE --> DB_USER
    USER_SERVICE --> DB_USER
    BUSINESS_SERVICE --> DB_BUSINESS
    AI_SERVICE --> DB_AI
    PAYMENT_SERVICE --> DB_PAYMENT
    
    AUTH_SERVICE --> EVENT_BUS
    USER_SERVICE --> EVENT_BUS
    BUSINESS_SERVICE --> EVENT_BUS
    AI_SERVICE --> EVENT_BUS
    PAYMENT_SERVICE --> EVENT_BUS
```

### Planned Improvements

1. **Event-Driven Architecture**: Implement event sourcing
2. **GraphQL API**: Add GraphQL layer for complex queries
3. **Real-time Features**: WebSocket support for live updates
4. **Multi-region**: Global deployment with data replication
5. **AI Model Training**: Custom model training pipeline

---

<div align="center">

**Architecture Evolution** 🚀

*This document is living and evolves with the platform*

</div>

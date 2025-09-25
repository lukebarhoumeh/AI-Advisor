# 🚀 Deployment Guide

> **Complete guide to deploying AI Advisor Hub in production**

---

## 🌐 Deployment Options

| Option | Complexity | Cost | Best For |
|--------|------------|------|----------|
| [Vercel + Railway](#vercel--railway-easy) | ⭐ | $ | Small to medium projects |
| [AWS Full Stack](#aws-full-stack-advanced) | ⭐⭐⭐ | $$ | Enterprise applications |
| [Docker + VPS](#docker--vps-intermediate) | ⭐⭐ | $ | Custom hosting needs |

---

## 🟢 Vercel + Railway (Easy)

### Prerequisites
- Vercel account (free tier available)
- Railway account (free tier available)
- GitHub repository

### Step 1: Deploy Backend to Railway

1. **Connect Railway to GitHub**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   ```

2. **Create Railway Project**
   ```bash
   # Create new project
   railway new
   
   # Add PostgreSQL database
   railway add postgresql
   
   # Add Redis
   railway add redis
   ```

3. **Set Environment Variables**
   ```bash
   # Set backend environment variables
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-super-secret-jwt-key
   railway variables set JWT_ACCESS_SECRET=your-access-secret
   railway variables set JWT_REFRESH_SECRET=your-refresh-secret
   railway variables set OPENAI_API_KEY=your-openai-key
   railway variables set STRIPE_SECRET_KEY=your-stripe-secret
   railway variables set STRIPE_PUBLISHABLE_KEY=your-stripe-publishable
   
   # Get database URL
   railway variables
   # Copy DATABASE_URL and REDIS_URL
   ```

4. **Deploy Backend**
   ```bash
   # Deploy from backend directory
   cd packages/backend
   railway up
   ```

5. **Run Database Migrations**
   ```bash
   # Connect to Railway and run migrations
   railway run npx prisma migrate deploy
   railway run npx prisma generate
   ```

### Step 2: Deploy Frontend to Vercel

1. **Connect Vercel to GitHub**
   - Go to https://vercel.com
   - Import your GitHub repository
   - Select the `packages/frontend` directory

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "rootDirectory": "packages/frontend"
   }
   ```

3. **Set Environment Variables**
   ```bash
   NEXT_PUBLIC_API_URL=https://your-railway-app.railway.app/api
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

4. **Deploy**
   - Click "Deploy" in Vercel dashboard
   - Your app will be available at `https://your-app.vercel.app`

---

## 🔴 AWS Full Stack (Advanced)

### Prerequisites
- AWS account with appropriate permissions
- AWS CLI configured
- Docker installed

### Step 1: Infrastructure Setup

1. **Create ECR Repositories**
   ```bash
   # Create repositories for backend and frontend
   aws ecr create-repository --repository-name advisor-ai-backend
   aws ecr create-repository --repository-name advisor-ai-frontend
   
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
   ```

2. **Set Up RDS Database**
   ```bash
   # Create RDS PostgreSQL instance
   aws rds create-db-instance \
     --db-instance-identifier advisor-ai-db \
     --db-instance-class db.t3.micro \
     --engine postgres \
     --master-username postgres \
     --master-user-password YourSecurePassword123 \
     --allocated-storage 20 \
     --vpc-security-group-ids sg-xxxxxxxxx \
     --db-subnet-group-name default
   ```

3. **Set Up ElastiCache Redis**
   ```bash
   # Create Redis cluster
   aws elasticache create-cache-cluster \
     --cache-cluster-id advisor-ai-redis \
     --cache-node-type cache.t3.micro \
     --engine redis \
     --num-cache-nodes 1 \
     --cache-subnet-group-name default
   ```

### Step 2: Build and Push Docker Images

1. **Build Backend Image**
   ```bash
   cd packages/backend
   
   # Build image
   docker build -t advisor-ai-backend .
   
   # Tag for ECR
   docker tag advisor-ai-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advisor-ai-backend:latest
   
   # Push to ECR
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advisor-ai-backend:latest
   ```

2. **Build Frontend Image**
   ```bash
   cd packages/frontend
   
   # Build image
   docker build -t advisor-ai-frontend .
   
   # Tag for ECR
   docker tag advisor-ai-frontend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/advisor-ai-frontend:latest
   
   # Push to ECR
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/advisor-ai-frontend:latest
   ```

### Step 3: ECS Service Setup

1. **Create ECS Cluster**
   ```bash
   # Create cluster
   aws ecs create-cluster --cluster-name advisor-ai-cluster
   ```

2. **Create Task Definitions**
   ```json
   // backend-task-definition.json
   {
     "family": "advisor-ai-backend",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::<account-id>:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "backend",
         "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/advisor-ai-backend:latest",
         "portMappings": [
           {
             "containerPort": 5000,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "NODE_ENV",
             "value": "production"
           },
           {
             "name": "DATABASE_URL",
             "value": "postgresql://postgres:password@your-rds-endpoint:5432/advisor_ai_hub"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/advisor-ai-backend",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

3. **Create ECS Services**
   ```bash
   # Register task definition
   aws ecs register-task-definition --cli-input-json file://backend-task-definition.json
   
   # Create service
   aws ecs create-service \
     --cluster advisor-ai-cluster \
     --service-name advisor-ai-backend \
     --task-definition advisor-ai-backend:1 \
     --desired-count 2 \
     --launch-type FARGATE \
     --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxxxxxx],securityGroups=[sg-xxxxxxxxx],assignPublicIp=ENABLED}"
   ```

### Step 4: Load Balancer Setup

1. **Create Application Load Balancer**
   ```bash
   # Create ALB
   aws elbv2 create-load-balancer \
     --name advisor-ai-alb \
     --subnets subnet-xxxxxxxxx subnet-yyyyyyyyy \
     --security-groups sg-xxxxxxxxx
   ```

2. **Create Target Groups**
   ```bash
   # Backend target group
   aws elbv2 create-target-group \
     --name advisor-ai-backend-tg \
     --protocol HTTP \
     --port 5000 \
     --vpc-id vpc-xxxxxxxxx \
     --target-type ip \
     --health-check-path /api/health
   ```

3. **Create Listeners**
   ```bash
   # Backend listener
   aws elbv2 create-listener \
     --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:<account-id>:loadbalancer/app/advisor-ai-alb/xxxxxxxxx \
     --protocol HTTP \
     --port 80 \
     --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:<account-id>:targetgroup/advisor-ai-backend-tg/xxxxxxxxx
   ```

---

## 🟡 Docker + VPS (Intermediate)

### Prerequisites
- VPS with Docker and Docker Compose
- Domain name (optional)
- SSL certificate (Let's Encrypt recommended)

### Step 1: Server Setup

1. **Install Docker**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   
   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/lukebarhoumeh/AI-Advisor.git
   cd AI-Advisor/advisor-ai-hub
   ```

### Step 2: Production Configuration

1. **Create Production Docker Compose**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   
   services:
     nginx:
       image: nginx:alpine
       ports:
         - "80:80"
         - "443:443"
       volumes:
         - ./nginx.conf:/etc/nginx/nginx.conf
         - ./ssl:/etc/ssl/certs
       depends_on:
         - frontend
         - backend
   
     frontend:
       build:
         context: ./packages/frontend
         dockerfile: Dockerfile
       environment:
         - NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api
       expose:
         - "3000"
   
     backend:
       build:
         context: ./packages/backend
         dockerfile: Dockerfile
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://postgres:password@postgres:5432/advisor_ai_hub
         - REDIS_URL=redis://redis:6379
         - JWT_SECRET=your-super-secret-jwt-key
         - OPENAI_API_KEY=your-openai-key
       depends_on:
         - postgres
         - redis
       expose:
         - "5000"
   
     postgres:
       image: postgres:15
       environment:
         - POSTGRES_DB=advisor_ai_hub
         - POSTGRES_PASSWORD=password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       expose:
         - "5432"
   
     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data
       expose:
         - "6379"
   
   volumes:
     postgres_data:
     redis_data:
   ```

2. **Create Nginx Configuration**
   ```nginx
   # nginx.conf
   events {
     worker_connections 1024;
   }
   
   http {
     upstream frontend {
       server frontend:3000;
     }
   
     upstream backend {
       server backend:5000;
     }
   
     server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
     }
   
     server {
       listen 443 ssl;
       server_name yourdomain.com;
   
       ssl_certificate /etc/ssl/certs/fullchain.pem;
       ssl_certificate_key /etc/ssl/certs/privkey.pem;
   
       location / {
         proxy_pass http://frontend;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
       }
   
       location /api/ {
         proxy_pass http://backend;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
       }
     }
   
     server {
       listen 443 ssl;
       server_name api.yourdomain.com;
   
       ssl_certificate /etc/ssl/certs/fullchain.pem;
       ssl_certificate_key /etc/ssl/certs/privkey.pem;
   
       location / {
         proxy_pass http://backend;
         proxy_set_header Host $host;
         proxy_set_header X-Real-IP $remote_addr;
       }
     }
   }
   ```

### Step 3: SSL Certificate Setup

1. **Install Certbot**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Get SSL Certificate**
   ```bash
   # Stop nginx temporarily
   sudo docker-compose -f docker-compose.prod.yml stop nginx
   
   # Get certificate
   sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com
   
   # Copy certificates
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
   sudo chown $USER:$USER ./ssl/*
   ```

### Step 4: Deploy Application

1. **Set Environment Variables**
   ```bash
   # Create .env file
   cp packages/backend/env.example packages/backend/.env
   
   # Edit with production values
   nano packages/backend/.env
   ```

2. **Deploy with Docker Compose**
   ```bash
   # Build and start services
   docker-compose -f docker-compose.prod.yml up -d --build
   
   # Run database migrations
   docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
   ```

3. **Set Up Auto-renewal**
   ```bash
   # Add to crontab
   echo "0 12 * * * /usr/bin/certbot renew --quiet && docker-compose -f /path/to/docker-compose.prod.yml restart nginx" | sudo crontab -
   ```

---

## 🔧 Environment Configuration

### Required Environment Variables

#### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database"

# Redis
REDIS_URL="redis://host:6379"

# JWT Secrets (generate secure random strings)
JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters"
JWT_ACCESS_SECRET="your-access-secret-key-minimum-32-characters"
JWT_REFRESH_SECRET="your-refresh-secret-key-minimum-32-characters"

# OpenAI
OPENAI_API_KEY="sk-your-openai-api-key"

# Stripe
STRIPE_SECRET_KEY="sk_live_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Application
NODE_ENV="production"
PORT="5000"
FRONTEND_URL="https://yourdomain.com"

# Optional: Monitoring
SENTRY_DSN="your-sentry-dsn"
```

#### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_your-stripe-publishable-key"
```

---

## 📊 Monitoring & Logging

### Application Monitoring

1. **Health Checks**
   ```typescript
   // packages/backend/src/routes/health.routes.ts
   router.get('/health', (req, res) => {
     res.json({
       status: 'ok',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       memory: process.memoryUsage()
     });
   });
   ```

2. **Error Tracking with Sentry**
   ```typescript
   import * as Sentry from '@sentry/node';
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV
   });
   ```

3. **Logging with Winston**
   ```typescript
   import winston from 'winston';
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.combine(
       winston.format.timestamp(),
       winston.format.errors({ stack: true }),
       winston.format.json()
     ),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

### Infrastructure Monitoring

1. **AWS CloudWatch** (for AWS deployments)
2. **UptimeRobot** (for uptime monitoring)
3. **Grafana + Prometheus** (for custom metrics)

---

## 🔒 Security Checklist

### Production Security

- [ ] **HTTPS**: SSL certificates configured
- [ ] **Environment Variables**: Secrets not in code
- [ ] **Database Security**: Strong passwords, restricted access
- [ ] **Rate Limiting**: API abuse prevention
- [ ] **CORS**: Properly configured for production domains
- [ ] **Headers**: Security headers (HSTS, CSP, etc.)
- [ ] **Dependencies**: Regular security updates
- [ ] **Logs**: No sensitive data in logs

### Security Headers (Nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.openai.com;" always;
```

---

## 🚀 CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Build and push backend image
        run: |
          cd packages/backend
          docker build -t advisor-ai-backend .
          docker tag advisor-ai-backend:latest $ECR_REGISTRY/advisor-ai-backend:latest
          docker push $ECR_REGISTRY/advisor-ai-backend:latest
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
      
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster advisor-ai-cluster --service advisor-ai-backend --force-new-deployment
```

---

## 🔄 Backup Strategy

### Database Backups

1. **Automated RDS Backups** (AWS)
   ```bash
   # Enable automated backups
   aws rds modify-db-instance \
     --db-instance-identifier advisor-ai-db \
     --backup-retention-period 7 \
     --preferred-backup-window "03:00-04:00"
   ```

2. **Manual Backup Script**
   ```bash
   #!/bin/bash
   # backup-db.sh
   
   TIMESTAMP=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="advisor_ai_backup_${TIMESTAMP}.sql"
   
   pg_dump $DATABASE_URL > $BACKUP_FILE
   
   # Upload to S3
   aws s3 cp $BACKUP_FILE s3://your-backup-bucket/database-backups/
   
   # Cleanup local file
   rm $BACKUP_FILE
   ```

### File Backups

```bash
# Backup uploaded files to S3
aws s3 sync /var/www/uploads s3://your-backup-bucket/uploads/ --delete
```

---

## 📞 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database connectivity
   psql $DATABASE_URL -c "SELECT 1;"
   
   # Check network connectivity
   telnet your-db-host 5432
   ```

2. **Redis Connection Failed**
   ```bash
   # Test Redis connection
   redis-cli -h your-redis-host -p 6379 ping
   ```

3. **OpenAI API Errors**
   ```bash
   # Check API key validity
   curl -H "Authorization: Bearer $OPENAI_API_KEY" \
        https://api.openai.com/v1/models
   ```

4. **High Memory Usage**
   ```bash
   # Monitor memory usage
   docker stats
   
   # Check for memory leaks
   node --inspect app.js
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes for frequently queried columns
   CREATE INDEX idx_businesses_user_id ON businesses(user_id);
   CREATE INDEX idx_ai_generations_business_id ON ai_generations(business_id);
   ```

2. **Caching Strategy**
   ```typescript
   // Implement Redis caching
   const cacheKey = `ai_generation:${businessId}:${templateId}`;
   const cached = await redis.get(cacheKey);
   if (cached) return JSON.parse(cached);
   ```

---

## 📈 Scaling Considerations

### Horizontal Scaling

1. **Load Balancer Configuration**
2. **Database Read Replicas**
3. **Redis Clustering**
4. **CDN Implementation**

### Performance Monitoring

1. **APM Tools**: New Relic, DataDog
2. **Custom Metrics**: Prometheus + Grafana
3. **Log Analysis**: ELK Stack

---

<div align="center">

**Deployment Complete! 🎉**

*Your AI Advisor Hub is now live and ready for users*

</div>

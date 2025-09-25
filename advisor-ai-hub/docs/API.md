# 🔌 API Documentation

> **Complete reference for the AI Advisor Hub API**

---

## 🌐 Base URL

```
Development: http://localhost:5000/api
Production: https://api.advisorai.com/api
```

---

## 🔐 Authentication

All protected endpoints require a valid JWT token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

### Token Types

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to get new access tokens

---

## 📋 API Endpoints

### 🔑 Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "businessName": "My Business"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "businessName": "My Business",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <access-token>
```

---

### 🏢 Business Management

#### Get User's Businesses
```http
GET /api/businesses
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "business_123",
      "name": "My Business",
      "industry": "Technology",
      "size": "small",
      "createdAt": "2024-01-01T00:00:00Z",
      "settings": {
        "timezone": "America/New_York",
        "currency": "USD"
      }
    }
  ]
}
```

#### Create Business
```http
POST /api/businesses
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "New Business",
  "industry": "Healthcare",
  "size": "medium",
  "settings": {
    "timezone": "America/Los_Angeles",
    "currency": "USD"
  }
}
```

#### Update Business
```http
PUT /api/businesses/:id
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Business Name",
  "industry": "Finance"
}
```

#### Delete Business
```http
DELETE /api/businesses/:id
Authorization: Bearer <access-token>
```

---

### 🤖 AI Modules

#### Get AI Templates
```http
GET /api/ai/templates/:moduleType
Authorization: Bearer <access-token>

# moduleType options: marketing, operations, support, compliance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "moduleType": "marketing",
    "templates": [
      {
        "id": "template_1",
        "name": "Social Media Post",
        "description": "Generate engaging social media content",
        "inputs": [
          {
            "name": "topic",
            "type": "text",
            "required": true,
            "description": "Main topic or theme"
          },
          {
            "name": "platform",
            "type": "select",
            "required": true,
            "options": ["Facebook", "Instagram", "Twitter", "LinkedIn"]
          }
        ]
      }
    ]
  }
}
```

#### Generate AI Content
```http
POST /api/ai/generate/:businessId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "moduleType": "marketing",
  "templateId": "template_1",
  "inputs": {
    "topic": "New product launch",
    "platform": "Instagram",
    "tone": "excited",
    "targetAudience": "young professionals"
  },
  "customization": {
    "maxLength": 280,
    "includeHashtags": true,
    "brandVoice": "friendly and professional"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "generation_123",
    "content": "🚀 Exciting news! We're launching our newest product designed specifically for young professionals like you! Get ready to revolutionize your workflow with cutting-edge features that make your life easier. #ProductLaunch #Innovation #YoungProfessionals #Workflow",
    "metadata": {
      "wordCount": 42,
      "estimatedReadingTime": "15 seconds",
      "platform": "Instagram",
      "generatedAt": "2024-01-01T12:00:00Z"
    },
    "alternatives": [
      {
        "content": "Alternative version 1...",
        "variation": "formal"
      }
    ]
  }
}
```

#### Get Generation History
```http
GET /api/ai/history/:businessId
Authorization: Bearer <access-token>
Query Parameters:
- moduleType (optional): Filter by module type
- limit (optional): Number of results (default: 20)
- offset (optional): Pagination offset (default: 0)
```

#### Save Generated Content
```http
POST /api/ai/save/:generationId
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "title": "My Saved Content",
  "category": "social_media",
  "tags": ["product-launch", "instagram"]
}
```

---

### 💳 Subscriptions

#### Get Subscription Plans
```http
GET /api/subscriptions/plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "starter",
      "name": "Starter",
      "price": 49,
      "currency": "USD",
      "interval": "month",
      "features": [
        "5 AI generations per month",
        "Basic templates",
        "Email support"
      ]
    },
    {
      "id": "professional",
      "name": "Professional", 
      "price": 149,
      "currency": "USD",
      "interval": "month",
      "features": [
        "Unlimited AI generations",
        "Advanced templates",
        "Priority support",
        "Custom branding"
      ]
    }
  ]
}
```

#### Create Subscription
```http
POST /api/subscriptions/create
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "planId": "professional",
  "paymentMethodId": "pm_1234567890"
}
```

#### Update Subscription
```http
PUT /api/subscriptions/update
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "planId": "enterprise"
}
```

#### Cancel Subscription
```http
DELETE /api/subscriptions/cancel
Authorization: Bearer <access-token>
```

---

### 🔌 Integrations

#### Get Available Integrations
```http
GET /api/integrations/available
Authorization: Bearer <access-token>
```

#### Connect Integration
```http
POST /api/integrations/connect
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "integrationType": "stripe",
  "credentials": {
    "apiKey": "sk_test_...",
    "webhookSecret": "whsec_..."
  }
}
```

#### Get Connected Integrations
```http
GET /api/integrations/connected
Authorization: Bearer <access-token>
```

---

### 👥 User Management

#### Get User Profile
```http
GET /api/user/profile
Authorization: Bearer <access-token>
```

#### Update User Profile
```http
PUT /api/user/profile
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "preferences": {
    "notifications": true,
    "theme": "dark"
  }
}
```

#### Change Password
```http
PUT /api/user/password
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": {
    // Response data here
  },
  "message": "Optional success message",
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": "2024-01-01T12:00:00Z",
    "requestId": "req_123456"
  }
}
```

---

## 🚨 Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## 🔒 Rate Limiting

API requests are rate-limited to ensure fair usage:

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| AI Generation | 10 requests | 1 minute |
| General API | 100 requests | 15 minutes |

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## 📝 Pagination

List endpoints support pagination:

```http
GET /api/businesses?limit=10&offset=20
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "limit": 10,
    "offset": 20,
    "total": 150,
    "hasMore": true
  }
}
```

---

## 🔍 Filtering & Sorting

Many endpoints support filtering and sorting:

```http
GET /api/ai/history?moduleType=marketing&sortBy=createdAt&sortOrder=desc
```

**Available Filters:**
- `moduleType`: Filter by AI module type
- `dateFrom`: Start date (ISO 8601)
- `dateTo`: End date (ISO 8601)
- `status`: Filter by status

**Available Sort Options:**
- `createdAt`: Sort by creation date
- `updatedAt`: Sort by update date
- `name`: Sort by name

---

## 🧪 Testing

### Test Environment

Use our test environment for development:
```
Base URL: https://api-test.advisorai.com/api
```

### Test Data

Use these test accounts for development:
```json
{
  "email": "test@advisorai.com",
  "password": "testPassword123"
}
```

### Webhook Testing

Use [ngrok](https://ngrok.com/) for local webhook testing:
```bash
ngrok http 5000
# Use the provided URL as your webhook endpoint
```

---

## 📚 SDKs & Libraries

### JavaScript/TypeScript
```bash
npm install @advisor-ai/sdk
```

```typescript
import { AdvisorAIClient } from '@advisor-ai/sdk';

const client = new AdvisorAIClient({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.advisorai.com/api'
});

// Generate AI content
const result = await client.ai.generate({
  businessId: 'business_123',
  moduleType: 'marketing',
  templateId: 'template_1',
  inputs: {
    topic: 'Product launch',
    platform: 'Instagram'
  }
});
```

### Python
```bash
pip install advisor-ai-sdk
```

```python
from advisor_ai import AdvisorAIClient

client = AdvisorAIClient(
    api_key='your-api-key',
    base_url='https://api.advisorai.com/api'
)

# Generate AI content
result = client.ai.generate(
    business_id='business_123',
    module_type='marketing',
    template_id='template_1',
    inputs={
        'topic': 'Product launch',
        'platform': 'Instagram'
    }
)
```

---

## 🔗 Webhooks

Configure webhooks to receive real-time notifications:

### Available Events
- `user.registered`
- `subscription.created`
- `subscription.updated`
- `subscription.cancelled`
- `ai.generation.completed`

### Webhook Payload
```json
{
  "event": "ai.generation.completed",
  "data": {
    "generationId": "gen_123",
    "businessId": "business_123",
    "moduleType": "marketing",
    "status": "completed"
  },
  "timestamp": "2024-01-01T12:00:00Z"
}
```

---

## 📞 Support

### API Support
- 📧 Email: api-support@advisorai.com
- 📚 Documentation: https://docs.advisorai.com
- 💬 Discord: https://discord.gg/advisorai

### Status Page
- 🟢 API Status: https://status.advisorai.com

---

<div align="center">

**Happy Building! 🚀**

*For the latest API updates, follow our [changelog](https://docs.advisorai.com/changelog)*

</div>

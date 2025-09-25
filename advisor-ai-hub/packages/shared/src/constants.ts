// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    VERIFY_EMAIL: '/auth/verify-email',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    REFRESH_TOKEN: '/auth/refresh',
  },
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    CHANGE_PASSWORD: '/user/change-password',
  },
  BUSINESS: {
    LIST: '/businesses',
    CREATE: '/businesses',
    GET: '/businesses/:id',
    UPDATE: '/businesses/:id',
    DELETE: '/businesses/:id',
  },
  AI: {
    GENERATE: '/ai/generate',
    HISTORY: '/ai/history',
    TEMPLATES: '/ai/templates',
  },
  MODULES: {
    MARKETING: '/modules/marketing',
    OPERATIONS: '/modules/operations',
    SUPPORT: '/modules/support',
    COMPLIANCE: '/modules/compliance',
  },
  INTEGRATIONS: {
    LIST: '/integrations',
    CONNECT: '/integrations/connect',
    DISCONNECT: '/integrations/disconnect',
    SYNC: '/integrations/sync',
  },
  SUBSCRIPTION: {
    CURRENT: '/subscription',
    UPGRADE: '/subscription/upgrade',
    CANCEL: '/subscription/cancel',
    BILLING_PORTAL: '/subscription/billing-portal',
  },
} as const;

// Module limits by subscription tier
export const MODULE_LIMITS = {
  FREE_TRIAL: {
    aiGenerationsPerMonth: 50,
    businessesAllowed: 1,
    integrationsAllowed: 2,
    templatesAllowed: 5,
  },
  SMB_BASIC: {
    aiGenerationsPerMonth: 500,
    businessesAllowed: 1,
    integrationsAllowed: 3,
    templatesAllowed: 20,
  },
  SMB_PRO: {
    aiGenerationsPerMonth: 2000,
    businessesAllowed: 1,
    integrationsAllowed: -1, // unlimited
    templatesAllowed: -1,
  },
  ADVISOR_BASIC: {
    aiGenerationsPerMonth: 1000,
    businessesAllowed: 10,
    integrationsAllowed: 5,
    templatesAllowed: 50,
  },
  ADVISOR_PRO: {
    aiGenerationsPerMonth: 5000,
    businessesAllowed: 50,
    integrationsAllowed: -1,
    templatesAllowed: -1,
  },
} as const;

// Error codes
export const ERROR_CODES = {
  // Auth errors
  AUTH_INVALID_CREDENTIALS: 'AUTH001',
  AUTH_USER_NOT_FOUND: 'AUTH002',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH003',
  AUTH_TOKEN_EXPIRED: 'AUTH004',
  AUTH_TOKEN_INVALID: 'AUTH005',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH006',
  
  // Business errors
  BUSINESS_NOT_FOUND: 'BUS001',
  BUSINESS_LIMIT_REACHED: 'BUS002',
  BUSINESS_ACCESS_DENIED: 'BUS003',
  
  // AI errors
  AI_GENERATION_FAILED: 'AI001',
  AI_LIMIT_REACHED: 'AI002',
  AI_INVALID_MODULE: 'AI003',
  
  // Subscription errors
  SUB_PAYMENT_FAILED: 'SUB001',
  SUB_INVALID_TIER: 'SUB002',
  SUB_DOWNGRADE_NOT_ALLOWED: 'SUB003',
  
  // Integration errors
  INT_CONNECTION_FAILED: 'INT001',
  INT_SYNC_FAILED: 'INT002',
  INT_NOT_SUPPORTED: 'INT003',
  
  // General errors
  VALIDATION_ERROR: 'VAL001',
  SERVER_ERROR: 'SRV001',
  RATE_LIMIT_EXCEEDED: 'RATE001',
} as const;

// Module metadata
export const MODULE_INFO = {
  MARKETING: {
    name: 'Marketing Advisor',
    description: 'Generate ad copy, social posts, and email campaigns',
    icon: 'megaphone',
    color: '#FF6B6B',
  },
  OPERATIONS: {
    name: 'Operations Advisor',
    description: 'Automate invoicing, scheduling, and inventory',
    icon: 'settings',
    color: '#4ECDC4',
  },
  CUSTOMER_SUPPORT: {
    name: 'Customer Support Advisor',
    description: 'AI chatbot and ticket management',
    icon: 'headphones',
    color: '#45B7D1',
  },
  COMPLIANCE: {
    name: 'Compliance Advisor',
    description: 'Regulatory checklists and compliance tracking',
    icon: 'shield-check',
    color: '#96CEB4',
  },
} as const;

// Time constants
export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '15m',
  REFRESH_TOKEN: '7d',
  EMAIL_VERIFICATION: '24h',
  PASSWORD_RESET: '1h',
} as const;

import { z } from 'zod';

// User roles
export enum UserRole {
  SMB_OWNER = 'SMB_OWNER',
  ADVISOR = 'ADVISOR',
  ADMIN = 'ADMIN'
}

// Subscription tiers
export enum SubscriptionTier {
  FREE_TRIAL = 'FREE_TRIAL',
  SMB_BASIC = 'SMB_BASIC',
  SMB_PRO = 'SMB_PRO',
  ADVISOR_BASIC = 'ADVISOR_BASIC',
  ADVISOR_PRO = 'ADVISOR_PRO'
}

// Module types
export enum ModuleType {
  MARKETING = 'MARKETING',
  OPERATIONS = 'OPERATIONS',
  CUSTOMER_SUPPORT = 'CUSTOMER_SUPPORT',
  COMPLIANCE = 'COMPLIANCE'
}

// Tier pricing
export const TIER_PRICING = {
  [SubscriptionTier.SMB_BASIC]: 49,
  [SubscriptionTier.SMB_PRO]: 99,
  [SubscriptionTier.ADVISOR_BASIC]: 199,
  [SubscriptionTier.ADVISOR_PRO]: 299,
} as const;

// User schemas
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  role: z.nativeEnum(UserRole),
  emailVerified: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastLoginAt: z.date().nullable(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.nativeEnum(UserRole),
  businessName: z.string().optional(),
});

// Business schemas
export const businessSchema = z.object({
  id: z.string(),
  name: z.string(),
  industry: z.string().nullable(),
  website: z.string().url().nullable(),
  address: z.string().nullable(),
  phone: z.string().nullable(),
  ownerId: z.string(),
  advisorId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// AI Generation schemas
export const aiGenerationRequestSchema = z.object({
  moduleType: z.nativeEnum(ModuleType),
  prompt: z.string(),
  context: z.record(z.any()).optional(),
  templateId: z.string().optional(),
});

export const aiGenerationResponseSchema = z.object({
  id: z.string(),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  tokens: z.number().optional(),
});

// Marketing module schemas
export const marketingContentSchema = z.object({
  type: z.enum(['ad_copy', 'social_post', 'email_campaign']),
  platform: z.string().optional(),
  tone: z.enum(['professional', 'casual', 'friendly', 'urgent']).optional(),
  targetAudience: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  maxLength: z.number().optional(),
});

// Operations module schemas
export const operationsTaskSchema = z.object({
  type: z.enum(['invoice', 'appointment', 'inventory_reminder']),
  data: z.record(z.any()),
});

// Customer support schemas
export const supportTicketSchema = z.object({
  subject: z.string(),
  description: z.string(),
  priority: z.enum(['low', 'medium', 'high']),
  category: z.string().optional(),
});

// Compliance schemas
export const complianceChecklistSchema = z.object({
  industry: z.string(),
  category: z.string(),
  includeRegulations: z.array(z.string()).optional(),
});

// Integration schemas
export const integrationSchema = z.object({
  type: z.enum(['gmail', 'outlook', 'google_calendar', 'quickbooks']),
  enabled: z.boolean(),
  settings: z.record(z.any()).optional(),
});

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Type exports
export type User = z.infer<typeof userSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type Business = z.infer<typeof businessSchema>;
export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;
export type AIGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;
export type MarketingContent = z.infer<typeof marketingContentSchema>;
export type OperationsTask = z.infer<typeof operationsTaskSchema>;
export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type ComplianceChecklist = z.infer<typeof complianceChecklistSchema>;
export type Integration = z.infer<typeof integrationSchema>;

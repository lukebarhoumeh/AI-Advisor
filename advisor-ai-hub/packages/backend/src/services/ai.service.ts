import OpenAI from 'openai';
import { ModuleType, AIGenerationRequest, MODULE_LIMITS } from '@advisor-ai/shared';
import { prisma } from '../config/database';
import { AppError } from '../utils/errors';
import { cacheService } from './cache.service';
import { logger } from '../utils/logger';

interface AIPromptTemplate {
  system: string;
  userPrompt: (context: any) => string;
}

// Module-specific prompt templates
const PROMPT_TEMPLATES: Record<ModuleType, Record<string, AIPromptTemplate>> = {
  [ModuleType.MARKETING]: {
    ad_copy: {
      system: `You are an expert marketing copywriter. Create compelling, conversion-focused ad copy that captures attention and drives action. Consider the target audience, platform constraints, and brand voice.`,
      userPrompt: (context) => `Create ad copy for:
Product/Service: ${context.product}
Platform: ${context.platform || 'General'}
Target Audience: ${context.targetAudience || 'General audience'}
Tone: ${context.tone || 'Professional'}
Keywords: ${context.keywords?.join(', ') || 'None specified'}
Additional Instructions: ${context.instructions || 'None'}`,
    },
    social_post: {
      system: `You are a social media expert. Create engaging social media content that encourages interaction, shares, and brand awareness. Adapt tone and style for each platform.`,
      userPrompt: (context) => `Create a social media post for:
Topic: ${context.topic}
Platform: ${context.platform || 'General'}
Goal: ${context.goal || 'Engagement'}
Tone: ${context.tone || 'Friendly'}
Include hashtags: ${context.includeHashtags ? 'Yes' : 'No'}
Character limit: ${context.maxLength || 'No limit'}`,
    },
    email_campaign: {
      system: `You are an email marketing specialist. Create compelling email campaigns that drive opens, clicks, and conversions while maintaining deliverability best practices.`,
      userPrompt: (context) => `Create an email campaign for:
Campaign Type: ${context.campaignType}
Subject: ${context.subject}
Target Audience: ${context.targetAudience}
Call to Action: ${context.callToAction || 'Learn More'}
Tone: ${context.tone || 'Professional'}
Include: Subject line, preview text, and body content`,
    },
  },
  [ModuleType.OPERATIONS]: {
    invoice: {
      system: `You are a business operations expert. Generate professional, clear invoices with all necessary details for proper accounting and payment processing.`,
      userPrompt: (context) => `Generate invoice content for:
Client: ${context.clientName}
Services: ${context.services}
Date Range: ${context.dateRange}
Payment Terms: ${context.paymentTerms || 'Net 30'}
Additional Notes: ${context.notes || 'None'}`,
    },
    appointment_reminder: {
      system: `You are a customer communication specialist. Create friendly, professional appointment reminders that reduce no-shows and improve customer experience.`,
      userPrompt: (context) => `Create appointment reminder for:
Service: ${context.service}
Date: ${context.date}
Time: ${context.time}
Location: ${context.location}
Provider: ${context.provider}
Special Instructions: ${context.instructions || 'None'}`,
    },
  },
  [ModuleType.CUSTOMER_SUPPORT]: {
    faq_response: {
      system: `You are a customer support expert. Provide helpful, accurate, and empathetic responses to customer questions. Be concise but thorough.`,
      userPrompt: (context) => `Answer this customer question:
Question: ${context.question}
Product/Service Context: ${context.productContext || 'General'}
Customer Type: ${context.customerType || 'General'}
Tone: ${context.tone || 'Helpful and professional'}`,
    },
    ticket_response: {
      system: `You are a customer support specialist. Draft professional responses to support tickets that resolve issues efficiently while maintaining customer satisfaction.`,
      userPrompt: (context) => `Draft response for support ticket:
Issue: ${context.issue}
Severity: ${context.severity || 'Medium'}
Customer Sentiment: ${context.sentiment || 'Neutral'}
Previous Interactions: ${context.previousInteractions || 'None'}
Goal: ${context.goal || 'Resolve issue'}`,
    },
  },
  [ModuleType.COMPLIANCE]: {
    checklist: {
      system: `You are a compliance expert. Create comprehensive, actionable compliance checklists that help businesses meet regulatory requirements in their industry.`,
      userPrompt: (context) => `Create compliance checklist for:
Industry: ${context.industry}
Business Type: ${context.businessType}
Location: ${context.location || 'United States'}
Specific Regulations: ${context.regulations || 'General'}
Compliance Area: ${context.area || 'General'}`,
    },
    policy_template: {
      system: `You are a legal compliance specialist. Create clear, comprehensive policy templates that meet regulatory requirements while being practical for small businesses.`,
      userPrompt: (context) => `Create policy template for:
Policy Type: ${context.policyType}
Industry: ${context.industry}
Company Size: ${context.companySize || 'Small Business'}
Specific Requirements: ${context.requirements || 'Standard'}`,
    },
  },
};

export class AIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  /**
   * Generate AI content based on module and request
   */
  async generate(businessId: string, request: AIGenerationRequest, userId: string) {
    try {
      // Check subscription limits
      await this.checkUsageLimits(businessId);

      // Check if module is enabled
      const moduleUsage = await prisma.moduleUsage.findUnique({
        where: {
          businessId_moduleType: {
            businessId,
            moduleType: request.moduleType,
          },
        },
      });

      if (!moduleUsage || !moduleUsage.enabled) {
        throw new AppError('This module is not enabled for your business', 403);
      }

      // Try to get from cache first
      const cacheKey = this.generateCacheKey(request);
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info('Returning cached AI response');
        return JSON.parse(cached);
      }

      // Get appropriate prompt template
      const promptTemplate = this.getPromptTemplate(request.moduleType, request.context?.type);
      if (!promptTemplate) {
        throw new AppError('Invalid request type for this module', 400);
      }

      // Generate content using OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: promptTemplate.system },
          { role: 'user', content: promptTemplate.userPrompt(request.context) },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      const generatedContent = completion.choices[0].message.content || '';
      const tokens = completion.usage?.total_tokens || 0;

      // Save to database
      const aiGeneration = await prisma.aIGeneration.create({
        data: {
          businessId,
          moduleType: request.moduleType,
          prompt: request.prompt,
          response: generatedContent,
          metadata: request.context as any,
          tokens,
          cost: this.calculateCost(tokens),
          createdBy: userId,
        },
      });

      // Update module usage
      await prisma.moduleUsage.update({
        where: {
          businessId_moduleType: {
            businessId,
            moduleType: request.moduleType,
          },
        },
        data: {
          monthlyUsage: { increment: 1 },
          lastUsedAt: new Date(),
        },
      });

      // Cache the response
      const response = {
        id: aiGeneration.id,
        content: generatedContent,
        metadata: aiGeneration.metadata,
        tokens,
      };
      await cacheService.set(cacheKey, JSON.stringify(response), 3600); // Cache for 1 hour

      return response;
    } catch (error) {
      logger.error('AI generation error:', error);
      throw error;
    }
  }

  /**
   * Get AI generation history
   */
  async getHistory(businessId: string, moduleType?: ModuleType, limit = 50) {
    const where: any = { businessId };
    if (moduleType) {
      where.moduleType = moduleType;
    }

    return prisma.aIGeneration.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        moduleType: true,
        prompt: true,
        response: true,
        metadata: true,
        createdAt: true,
      },
    });
  }

  /**
   * Check usage limits based on subscription
   */
  private async checkUsageLimits(businessId: string) {
    const subscription = await prisma.subscription.findUnique({
      where: { businessId },
    });

    if (!subscription) {
      throw new AppError('No active subscription found', 403);
    }

    const limits = MODULE_LIMITS[subscription.tier as keyof typeof MODULE_LIMITS];
    if (!limits) {
      throw new AppError('Invalid subscription tier', 500);
    }

    // Check monthly usage
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyUsage = await prisma.aIGeneration.count({
      where: {
        businessId,
        createdAt: { gte: currentMonth },
      },
    });

    if (limits.aiGenerationsPerMonth !== -1 && monthlyUsage >= limits.aiGenerationsPerMonth) {
      throw new AppError(
        `Monthly AI generation limit reached (${limits.aiGenerationsPerMonth} generations)`,
        429
      );
    }
  }

  /**
   * Get prompt template for module and type
   */
  private getPromptTemplate(moduleType: ModuleType, type?: string): AIPromptTemplate | null {
    const moduleTemplates = PROMPT_TEMPLATES[moduleType];
    if (!moduleTemplates) return null;

    // Default to first template if type not specified
    const templateKey = type || Object.keys(moduleTemplates)[0];
    return moduleTemplates[templateKey] || null;
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(request: AIGenerationRequest): string {
    const context = JSON.stringify(request.context || {});
    return `ai:${request.moduleType}:${request.prompt}:${context}`;
  }

  /**
   * Calculate cost based on tokens (rough estimate)
   */
  private calculateCost(tokens: number): number {
    // GPT-4 Turbo pricing (approximate)
    const costPer1kTokens = 0.01; // $0.01 per 1K tokens
    return (tokens / 1000) * costPer1kTokens;
  }
}

export const aiService = new AIService();

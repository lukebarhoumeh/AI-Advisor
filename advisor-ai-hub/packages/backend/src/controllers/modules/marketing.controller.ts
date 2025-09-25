import { Request, Response, NextFunction } from 'express';
import { aiService } from '../../services/ai.service';
import { prisma } from '../../config/database';
import { ModuleType, marketingContentSchema } from '@advisor-ai/shared';
import { z } from 'zod';

const campaignSchema = z.object({
  name: z.string(),
  type: z.enum(['ad_copy', 'social_post', 'email_campaign']),
  content: z.string(),
  platform: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
  metadata: z.record(z.any()).optional(),
});

export class MarketingController {
  /**
   * Generate marketing content
   */
  async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = marketingContentSchema.parse(req.body);

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.MARKETING,
          prompt: `Generate ${validatedData.type} content`,
          context: validatedData,
        },
        req.user!.id
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Save campaign
   */
  async saveCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = campaignSchema.parse(req.body);

      const template = await prisma.template.create({
        data: {
          name: validatedData.name,
          moduleType: ModuleType.MARKETING,
          category: validatedData.type,
          content: validatedData as any,
          businessId,
        },
      });

      res.status(201).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get saved campaigns
   */
  async getCampaigns(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { type, limit = 50 } = req.query;

      const where: any = {
        businessId,
        moduleType: ModuleType.MARKETING,
      };

      if (type) {
        where.category = type;
      }

      const campaigns = await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: campaigns,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule campaign
   */
  async scheduleCampaign(req: Request, res: Response, next: NextFunction) {
    try {
      const { campaignId } = req.params;
      const { scheduledFor, platform } = req.body;

      // In a real implementation, this would integrate with scheduling service
      const template = await prisma.template.update({
        where: { id: campaignId },
        data: {
          content: {
            ...(await prisma.template.findUnique({ where: { id: campaignId } }))?.content as any,
            scheduledFor,
            platform,
            status: 'scheduled',
          },
        },
      });

      res.json({
        success: true,
        data: template,
        message: 'Campaign scheduled successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get campaign analytics (mock)
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;

      // Mock analytics data
      const analytics = {
        totalCampaigns: await prisma.template.count({
          where: { businessId, moduleType: ModuleType.MARKETING },
        }),
        thisMonth: await prisma.aIGeneration.count({
          where: {
            businessId,
            moduleType: ModuleType.MARKETING,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        engagement: {
          views: Math.floor(Math.random() * 10000),
          clicks: Math.floor(Math.random() * 1000),
          conversions: Math.floor(Math.random() * 100),
        },
        topPerforming: {
          type: 'social_post',
          platform: 'LinkedIn',
          engagement: '12.5%',
        },
      };

      res.json({
        success: true,
        data: analytics,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const marketingController = new MarketingController();

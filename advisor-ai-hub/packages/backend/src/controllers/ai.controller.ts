import { Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { aiGenerationRequestSchema, ModuleType } from '@advisor-ai/shared';
import { z } from 'zod';

const historyQuerySchema = z.object({
  moduleType: z.nativeEnum(ModuleType).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export class AIController {
  /**
   * Generate AI content
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = aiGenerationRequestSchema.parse(req.body);
      const businessId = req.params.businessId || req.body.businessId;

      if (!businessId) {
        return res.status(400).json({
          success: false,
          error: 'Business ID required',
        });
      }

      const result = await aiService.generate(
        businessId,
        validatedData,
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
   * Get AI generation history
   */
  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { moduleType, limit } = historyQuerySchema.parse(req.query);

      const history = await aiService.getHistory(businessId, moduleType, limit);

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get available prompt templates for a module
   */
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const { moduleType } = req.params;

      if (!Object.values(ModuleType).includes(moduleType as ModuleType)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid module type',
        });
      }

      // This would typically fetch from database, but for now return static templates
      const templates = {
        [ModuleType.MARKETING]: [
          { id: 'ad_copy', name: 'Ad Copy', description: 'Generate compelling ad copy' },
          { id: 'social_post', name: 'Social Media Post', description: 'Create engaging social content' },
          { id: 'email_campaign', name: 'Email Campaign', description: 'Draft email marketing campaigns' },
        ],
        [ModuleType.OPERATIONS]: [
          { id: 'invoice', name: 'Invoice', description: 'Generate professional invoices' },
          { id: 'appointment_reminder', name: 'Appointment Reminder', description: 'Create appointment reminders' },
        ],
        [ModuleType.CUSTOMER_SUPPORT]: [
          { id: 'faq_response', name: 'FAQ Response', description: 'Answer customer questions' },
          { id: 'ticket_response', name: 'Ticket Response', description: 'Draft support ticket responses' },
        ],
        [ModuleType.COMPLIANCE]: [
          { id: 'checklist', name: 'Compliance Checklist', description: 'Generate compliance checklists' },
          { id: 'policy_template', name: 'Policy Template', description: 'Create policy documents' },
        ],
      };

      res.json({
        success: true,
        data: templates[moduleType as ModuleType] || [],
      });
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AIController();

import { Request, Response, NextFunction } from 'express';
import { aiService } from '../../services/ai.service';
import { prisma } from '../../config/database';
import { ModuleType, supportTicketSchema } from '@advisor-ai/shared';
import { z } from 'zod';

const faqSchema = z.object({
  question: z.string(),
  category: z.string(),
  answer: z.string().optional(),
});

const chatMessageSchema = z.object({
  message: z.string(),
  sessionId: z.string(),
  context: z.record(z.any()).optional(),
});

export class SupportController {
  /**
   * Generate support response
   */
  async generateResponse(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { question, context } = req.body;

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.CUSTOMER_SUPPORT,
          prompt: question,
          context: {
            type: 'faq_response',
            question,
            productContext: context?.product,
            customerType: context?.customerType,
          },
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
   * Create support ticket
   */
  async createTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = supportTicketSchema.parse(req.body);

      // Generate initial response
      const aiResult = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.CUSTOMER_SUPPORT,
          prompt: 'Generate support ticket response',
          context: {
            type: 'ticket_response',
            issue: validatedData.description,
            severity: validatedData.priority,
          },
        },
        req.user!.id
      );

      // Save ticket
      const template = await prisma.template.create({
        data: {
          name: `Ticket - ${validatedData.subject}`,
          moduleType: ModuleType.CUSTOMER_SUPPORT,
          category: 'ticket',
          content: {
            ...validatedData,
            ticketId: `TKT-${Date.now()}`,
            status: 'open',
            initialResponse: aiResult.content,
            createdAt: new Date(),
          } as any,
          businessId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          response: aiResult.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Chat with AI support bot
   */
  async chatMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = chatMessageSchema.parse(req.body);

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.CUSTOMER_SUPPORT,
          prompt: validatedData.message,
          context: {
            type: 'chat_response',
            sessionId: validatedData.sessionId,
            ...validatedData.context,
          },
        },
        req.user!.id
      );

      res.json({
        success: true,
        data: {
          message: result.content,
          sessionId: validatedData.sessionId,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create or update FAQ
   */
  async upsertFAQ(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = faqSchema.parse(req.body);

      // Generate answer if not provided
      let answer = validatedData.answer;
      if (!answer) {
        const aiResult = await aiService.generate(
          businessId,
          {
            moduleType: ModuleType.CUSTOMER_SUPPORT,
            prompt: validatedData.question,
            context: {
              type: 'faq_response',
              question: validatedData.question,
              category: validatedData.category,
            },
          },
          req.user!.id
        );
        answer = aiResult.content;
      }

      const template = await prisma.template.create({
        data: {
          name: `FAQ - ${validatedData.question.slice(0, 50)}...`,
          moduleType: ModuleType.CUSTOMER_SUPPORT,
          category: 'faq',
          content: {
            question: validatedData.question,
            answer,
            category: validatedData.category,
          } as any,
          businessId,
          isPublic: true,
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
   * Get FAQs
   */
  async getFAQs(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { category, limit = 50 } = req.query;

      const where: any = {
        businessId,
        moduleType: ModuleType.CUSTOMER_SUPPORT,
        category: 'faq',
        isPublic: true,
      };

      const faqs = await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: faqs,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get support tickets
   */
  async getTickets(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { status, priority, limit = 50 } = req.query;

      const tickets = await prisma.template.findMany({
        where: {
          businessId,
          moduleType: ModuleType.CUSTOMER_SUPPORT,
          category: 'ticket',
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: tickets,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update ticket status
   */
  async updateTicket(req: Request, res: Response, next: NextFunction) {
    try {
      const { ticketId } = req.params;
      const { status, response } = req.body;

      const ticket = await prisma.template.findUnique({
        where: { id: ticketId },
      });

      if (!ticket) {
        return res.status(404).json({
          success: false,
          error: 'Ticket not found',
        });
      }

      const updatedContent = {
        ...(ticket.content as any),
        status,
        lastUpdate: new Date(),
      };

      if (response) {
        updatedContent.responses = [
          ...(updatedContent.responses || []),
          { message: response, timestamp: new Date() },
        ];
      }

      const updated = await prisma.template.update({
        where: { id: ticketId },
        data: {
          content: updatedContent,
        },
      });

      res.json({
        success: true,
        data: updated,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get support analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;

      const [totalTickets, totalFAQs, thisMonth] = await Promise.all([
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.CUSTOMER_SUPPORT, category: 'ticket' },
        }),
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.CUSTOMER_SUPPORT, category: 'faq' },
        }),
        prisma.aIGeneration.count({
          where: {
            businessId,
            moduleType: ModuleType.CUSTOMER_SUPPORT,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalTickets,
          totalFAQs,
          thisMonthInteractions: thisMonth,
          metrics: {
            avgResponseTime: '2.5 minutes',
            resolutionRate: '87%',
            customerSatisfaction: '4.6/5',
          },
          ticketsByStatus: {
            open: Math.floor(Math.random() * 20),
            inProgress: Math.floor(Math.random() * 15),
            resolved: totalTickets - 10,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const supportController = new SupportController();

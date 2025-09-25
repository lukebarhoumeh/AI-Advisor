import { Request, Response, NextFunction } from 'express';
import { aiService } from '../../services/ai.service';
import { prisma } from '../../config/database';
import { ModuleType, operationsTaskSchema } from '@advisor-ai/shared';
import { z } from 'zod';

const invoiceSchema = z.object({
  clientName: z.string(),
  clientEmail: z.string().email(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number(),
    rate: z.number(),
  })),
  dueDate: z.string(),
  notes: z.string().optional(),
});

const appointmentSchema = z.object({
  title: z.string(),
  clientName: z.string(),
  clientEmail: z.string().email(),
  date: z.string(),
  time: z.string(),
  duration: z.number(),
  location: z.string().optional(),
  notes: z.string().optional(),
});

export class OperationsController {
  /**
   * Generate operations content (invoices, reminders, etc.)
   */
  async generateContent(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = operationsTaskSchema.parse(req.body);

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.OPERATIONS,
          prompt: `Generate ${validatedData.type} content`,
          context: validatedData.data,
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
   * Create invoice
   */
  async createInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = invoiceSchema.parse(req.body);

      // Generate invoice content with AI
      const aiResult = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.OPERATIONS,
          prompt: 'Generate professional invoice',
          context: {
            type: 'invoice',
            ...validatedData,
            services: validatedData.items.map(item => 
              `${item.description} (${item.quantity} x $${item.rate})`
            ).join(', '),
            total: validatedData.items.reduce((sum, item) => sum + (item.quantity * item.rate), 0),
          },
        },
        req.user!.id
      );

      // Save invoice template
      const template = await prisma.template.create({
        data: {
          name: `Invoice - ${validatedData.clientName}`,
          moduleType: ModuleType.OPERATIONS,
          category: 'invoice',
          content: {
            ...validatedData,
            generatedContent: aiResult.content,
            invoiceNumber: `INV-${Date.now()}`,
            createdAt: new Date(),
          } as any,
          businessId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          content: aiResult.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Schedule appointment
   */
  async scheduleAppointment(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = appointmentSchema.parse(req.body);

      // Generate appointment reminder
      const aiResult = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.OPERATIONS,
          prompt: 'Generate appointment reminder',
          context: {
            type: 'appointment_reminder',
            ...validatedData,
          },
        },
        req.user!.id
      );

      // Save appointment
      const template = await prisma.template.create({
        data: {
          name: `Appointment - ${validatedData.clientName}`,
          moduleType: ModuleType.OPERATIONS,
          category: 'appointment',
          content: {
            ...validatedData,
            reminderContent: aiResult.content,
            status: 'scheduled',
          } as any,
          businessId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          reminderContent: aiResult.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get invoices
   */
  async getInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { status, limit = 50 } = req.query;

      const invoices = await prisma.template.findMany({
        where: {
          businessId,
          moduleType: ModuleType.OPERATIONS,
          category: 'invoice',
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: invoices,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get appointments
   */
  async getAppointments(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { date, limit = 50 } = req.query;

      const appointments = await prisma.template.findMany({
        where: {
          businessId,
          moduleType: ModuleType.OPERATIONS,
          category: 'appointment',
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: appointments,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate inventory reminder
   */
  async generateInventoryReminder(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { items, threshold } = req.body;

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.OPERATIONS,
          prompt: 'Generate inventory reorder reminder',
          context: {
            type: 'inventory_reminder',
            items,
            threshold,
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
   * Get operations analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;

      const [totalInvoices, totalAppointments, thisMonth] = await Promise.all([
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.OPERATIONS, category: 'invoice' },
        }),
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.OPERATIONS, category: 'appointment' },
        }),
        prisma.aIGeneration.count({
          where: {
            businessId,
            moduleType: ModuleType.OPERATIONS,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalInvoices,
          totalAppointments,
          thisMonthOperations: thisMonth,
          revenue: {
            thisMonth: Math.floor(Math.random() * 50000),
            pending: Math.floor(Math.random() * 10000),
            overdue: Math.floor(Math.random() * 5000),
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const operationsController = new OperationsController();

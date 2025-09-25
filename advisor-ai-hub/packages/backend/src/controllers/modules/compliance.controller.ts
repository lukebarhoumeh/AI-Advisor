import { Request, Response, NextFunction } from 'express';
import { aiService } from '../../services/ai.service';
import { prisma } from '../../config/database';
import { ModuleType, complianceChecklistSchema } from '@advisor-ai/shared';
import { z } from 'zod';

const policySchema = z.object({
  policyType: z.string(),
  industry: z.string(),
  companySize: z.string().optional(),
  requirements: z.array(z.string()).optional(),
});

const auditSchema = z.object({
  area: z.string(),
  scope: z.string(),
  regulations: z.array(z.string()).optional(),
  lastAuditDate: z.string().optional(),
});

export class ComplianceController {
  /**
   * Generate compliance checklist
   */
  async generateChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = complianceChecklistSchema.parse(req.body);

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.COMPLIANCE,
          prompt: 'Generate compliance checklist',
          context: {
            type: 'checklist',
            ...validatedData,
          },
        },
        req.user!.id
      );

      // Save checklist
      const template = await prisma.template.create({
        data: {
          name: `${validatedData.industry} - ${validatedData.area || 'General'} Checklist`,
          moduleType: ModuleType.COMPLIANCE,
          category: 'checklist',
          content: {
            ...validatedData,
            checklist: result.content,
            createdAt: new Date(),
          } as any,
          businessId,
        },
      });

      res.json({
        success: true,
        data: {
          template,
          checklist: result.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Generate policy template
   */
  async generatePolicy(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = policySchema.parse(req.body);

      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.COMPLIANCE,
          prompt: 'Generate policy template',
          context: {
            type: 'policy_template',
            ...validatedData,
          },
        },
        req.user!.id
      );

      // Save policy
      const template = await prisma.template.create({
        data: {
          name: `${validatedData.policyType} Policy`,
          moduleType: ModuleType.COMPLIANCE,
          category: 'policy',
          content: {
            ...validatedData,
            policyContent: result.content,
            version: '1.0',
            createdAt: new Date(),
          } as any,
          businessId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          policy: result.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get compliance templates
   */
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const { category, industry, limit = 50 } = req.query;

      const where: any = {
        businessId,
        moduleType: ModuleType.COMPLIANCE,
      };

      if (category) {
        where.category = category;
      }

      const templates = await prisma.template.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
      });

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create audit report
   */
  async createAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;
      const validatedData = auditSchema.parse(req.body);

      // Generate audit checklist
      const result = await aiService.generate(
        businessId,
        {
          moduleType: ModuleType.COMPLIANCE,
          prompt: 'Generate compliance audit checklist',
          context: {
            type: 'audit_checklist',
            ...validatedData,
          },
        },
        req.user!.id
      );

      // Save audit
      const template = await prisma.template.create({
        data: {
          name: `Audit - ${validatedData.area}`,
          moduleType: ModuleType.COMPLIANCE,
          category: 'audit',
          content: {
            ...validatedData,
            auditChecklist: result.content,
            status: 'in_progress',
            createdAt: new Date(),
          } as any,
          businessId,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          template,
          checklist: result.content,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get regulations by industry
   */
  async getRegulations(req: Request, res: Response, next: NextFunction) {
    try {
      const { industry } = req.params;

      // Mock regulations data - in real app, this would come from a regulations database
      const regulations = {
        healthcare: ['HIPAA', 'HITECH', 'FDA', 'Medicare/Medicaid'],
        finance: ['SOX', 'PCI-DSS', 'GLBA', 'AML/KYC', 'GDPR'],
        retail: ['PCI-DSS', 'CCPA', 'GDPR', 'FTC'],
        technology: ['GDPR', 'CCPA', 'SOC 2', 'ISO 27001'],
        general: ['GDPR', 'CCPA', 'OSHA', 'ADA'],
      };

      const industryRegulations = regulations[industry as keyof typeof regulations] || regulations.general;

      res.json({
        success: true,
        data: {
          industry,
          regulations: industryRegulations,
          description: `Common regulations for ${industry} businesses`,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update audit status
   */
  async updateAudit(req: Request, res: Response, next: NextFunction) {
    try {
      const { auditId } = req.params;
      const { status, findings, recommendations } = req.body;

      const audit = await prisma.template.findUnique({
        where: { id: auditId },
      });

      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'Audit not found',
        });
      }

      const updatedContent = {
        ...(audit.content as any),
        status,
        findings,
        recommendations,
        lastUpdate: new Date(),
      };

      const updated = await prisma.template.update({
        where: { id: auditId },
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
   * Get compliance analytics
   */
  async getAnalytics(req: Request, res: Response, next: NextFunction) {
    try {
      const businessId = req.params.businessId;

      const [totalChecklists, totalPolicies, totalAudits, thisMonth] = await Promise.all([
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.COMPLIANCE, category: 'checklist' },
        }),
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.COMPLIANCE, category: 'policy' },
        }),
        prisma.template.count({
          where: { businessId, moduleType: ModuleType.COMPLIANCE, category: 'audit' },
        }),
        prisma.aIGeneration.count({
          where: {
            businessId,
            moduleType: ModuleType.COMPLIANCE,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
      ]);

      res.json({
        success: true,
        data: {
          totalChecklists,
          totalPolicies,
          totalAudits,
          thisMonthGenerated: thisMonth,
          complianceScore: Math.floor(Math.random() * 20) + 80, // 80-100
          upcomingDeadlines: [
            { regulation: 'GDPR Annual Review', dueDate: '2025-12-31' },
            { regulation: 'SOC 2 Audit', dueDate: '2025-10-15' },
          ],
          riskAreas: [
            { area: 'Data Privacy', level: 'low' },
            { area: 'Financial Reporting', level: 'medium' },
          ],
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const complianceController = new ComplianceController();

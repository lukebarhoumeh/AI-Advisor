import { Business, ModuleType, UserRole } from '@advisor-ai/shared';
import { prisma } from '../config/database';
import { AppError, NotFoundError, AuthorizationError } from '../utils/errors';

interface CreateBusinessInput {
  name: string;
  industry?: string;
  website?: string;
  address?: string;
  phone?: string;
}

interface UpdateBusinessInput extends Partial<CreateBusinessInput> {
  advisorId?: string | null;
}

export class BusinessService {
  /**
   * Get businesses for current user
   */
  async getBusinesses(userId: string, role: UserRole) {
    if (role === UserRole.SMB_OWNER) {
      // SMB owners can only see their own businesses
      return prisma.business.findMany({
        where: { ownerId: userId },
        include: {
          subscription: true,
          moduleUsage: true,
        },
      });
    } else if (role === UserRole.ADVISOR) {
      // Advisors can see businesses they manage
      const advisorProfile = await prisma.advisorProfile.findUnique({
        where: { userId },
      });

      if (!advisorProfile) {
        throw new AppError('Advisor profile not found', 404);
      }

      return prisma.business.findMany({
        where: { advisorId: advisorProfile.id },
        include: {
          subscription: true,
          moduleUsage: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    } else if (role === UserRole.ADMIN) {
      // Admins can see all businesses
      return prisma.business.findMany({
        include: {
          subscription: true,
          moduleUsage: true,
          owner: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    throw new AuthorizationError();
  }

  /**
   * Get single business
   */
  async getBusiness(businessId: string, userId: string, role: UserRole) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        subscription: true,
        moduleUsage: true,
        owner: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        advisor: true,
      },
    });

    if (!business) {
      throw new NotFoundError('Business');
    }

    // Check access
    const hasAccess = await this.checkBusinessAccess(business, userId, role);
    if (!hasAccess) {
      throw new AuthorizationError();
    }

    return business;
  }

  /**
   * Create new business
   */
  async createBusiness(data: CreateBusinessInput, userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.role !== UserRole.SMB_OWNER) {
      throw new AppError('Only SMB owners can create businesses', 403);
    }

    // Check if user already has a business
    const existingBusiness = await prisma.business.findFirst({
      where: { ownerId: userId },
    });

    if (existingBusiness) {
      throw new AppError('You already have a business registered', 400);
    }

    // Create business with subscription and modules
    return prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          ...data,
          ownerId: userId,
        },
      });

      // Create free trial subscription
      await tx.subscription.create({
        data: {
          businessId: business.id,
          tier: 'FREE_TRIAL',
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      // Initialize all modules
      const modules = ['MARKETING', 'OPERATIONS', 'CUSTOMER_SUPPORT', 'COMPLIANCE'];
      await tx.moduleUsage.createMany({
        data: modules.map(moduleType => ({
          businessId: business.id,
          moduleType: moduleType as ModuleType,
        })),
      });

      return business;
    });
  }

  /**
   * Update business
   */
  async updateBusiness(businessId: string, data: UpdateBusinessInput, userId: string, role: UserRole) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business');
    }

    // Check access
    const hasAccess = await this.checkBusinessAccess(business, userId, role);
    if (!hasAccess) {
      throw new AuthorizationError();
    }

    // If updating advisor, verify advisor exists
    if (data.advisorId !== undefined) {
      if (data.advisorId) {
        const advisor = await prisma.advisorProfile.findUnique({
          where: { id: data.advisorId },
        });
        if (!advisor) {
          throw new AppError('Advisor not found', 404);
        }
      }
    }

    return prisma.business.update({
      where: { id: businessId },
      data,
      include: {
        subscription: true,
        moduleUsage: true,
      },
    });
  }

  /**
   * Delete business
   */
  async deleteBusiness(businessId: string, userId: string, role: UserRole) {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundError('Business');
    }

    // Only owner or admin can delete
    if (business.ownerId !== userId && role !== UserRole.ADMIN) {
      throw new AuthorizationError();
    }

    // Delete in transaction to ensure all related data is removed
    return prisma.$transaction(async (tx) => {
      // Delete related data
      await tx.moduleUsage.deleteMany({ where: { businessId } });
      await tx.aIGeneration.deleteMany({ where: { businessId } });
      await tx.integration.deleteMany({ where: { businessId } });
      await tx.template.deleteMany({ where: { businessId } });
      await tx.activityLog.deleteMany({ where: { businessId } });
      
      // Delete subscription and invoices
      const subscription = await tx.subscription.findUnique({
        where: { businessId },
      });
      if (subscription) {
        await tx.invoice.deleteMany({ where: { subscriptionId: subscription.id } });
        await tx.subscription.delete({ where: { businessId } });
      }

      // Finally delete the business
      await tx.business.delete({ where: { id: businessId } });
    });
  }

  /**
   * Get business statistics
   */
  async getBusinessStats(businessId: string) {
    const [
      aiGenerations,
      activeIntegrations,
      templateCount,
      currentMonth
    ] = await Promise.all([
      // Total AI generations
      prisma.aIGeneration.count({
        where: { businessId },
      }),
      
      // Active integrations
      prisma.integration.count({
        where: { businessId, enabled: true },
      }),
      
      // Template count
      prisma.template.count({
        where: { businessId },
      }),
      
      // Current month AI usage
      prisma.aIGeneration.count({
        where: {
          businessId,
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalAiGenerations: aiGenerations,
      activeIntegrations,
      templateCount,
      currentMonthUsage: currentMonth,
    };
  }

  /**
   * Check if user has access to business
   */
  private async checkBusinessAccess(business: Business & { advisorId?: string | null }, userId: string, role: UserRole): Promise<boolean> {
    if (role === UserRole.ADMIN) return true;
    if (business.ownerId === userId) return true;
    
    if (role === UserRole.ADVISOR) {
      const advisorProfile = await prisma.advisorProfile.findUnique({
        where: { userId },
      });
      return advisorProfile?.id === business.advisorId;
    }
    
    return false;
  }
}

export const businessService = new BusinessService();

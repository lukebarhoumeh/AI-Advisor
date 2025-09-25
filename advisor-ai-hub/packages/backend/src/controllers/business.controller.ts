import { Request, Response, NextFunction } from 'express';
import { businessService } from '../services/business.service';
import { businessSchema } from '@advisor-ai/shared';
import { z } from 'zod';

// Validation schemas
const createBusinessSchema = z.object({
  name: z.string().min(1).max(100),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
});

const updateBusinessSchema = createBusinessSchema.partial().extend({
  advisorId: z.string().nullable().optional(),
});

export class BusinessController {
  /**
   * Get all businesses for current user
   */
  async getBusinesses(req: Request, res: Response, next: NextFunction) {
    try {
      const businesses = await businessService.getBusinesses(
        req.user!.id,
        req.user!.role
      );

      res.json({
        success: true,
        data: businesses,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single business
   */
  async getBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      const business = await businessService.getBusiness(
        id,
        req.user!.id,
        req.user!.role
      );

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new business
   */
  async createBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = createBusinessSchema.parse(req.body);
      
      const business = await businessService.createBusiness(
        validatedData,
        req.user!.id
      );

      res.status(201).json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update business
   */
  async updateBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const validatedData = updateBusinessSchema.parse(req.body);
      
      const business = await businessService.updateBusiness(
        id,
        validatedData,
        req.user!.id,
        req.user!.role
      );

      res.json({
        success: true,
        data: business,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete business
   */
  async deleteBusiness(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      await businessService.deleteBusiness(
        id,
        req.user!.id,
        req.user!.role
      );

      res.json({
        success: true,
        message: 'Business deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get business statistics
   */
  async getBusinessStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      
      // Verify access first
      await businessService.getBusiness(
        id,
        req.user!.id,
        req.user!.role
      );

      const stats = await businessService.getBusinessStats(id);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const businessController = new BusinessController();

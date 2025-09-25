import { Request, Response, NextFunction } from 'express';
import { integrationService } from '../services/integration.service';
import { z } from 'zod';

const connectSchema = z.object({
  type: z.enum(['gmail', 'outlook', 'google_calendar', 'quickbooks']),
  credentials: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
});

export class IntegrationController {
  /**
   * Get integrations for a business
   */
  async getIntegrations(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;

      const integrations = await integrationService.getIntegrations(businessId);

      res.json({
        success: true,
        data: integrations,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get OAuth URL for integration
   */
  async getOAuthUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { type } = req.params;
      const { businessId } = req.query;

      if (!businessId || typeof businessId !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Business ID required',
        });
      }

      const url = await integrationService.getOAuthUrl(type, businessId);

      res.json({
        success: true,
        data: { url },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.query;

      if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Invalid callback parameters',
        });
      }

      await integrationService.handleOAuthCallback(code, state);

      // Redirect to frontend success page
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/integrations?success=true`);
    } catch (error) {
      // Redirect to frontend error page
      res.redirect(`${process.env.FRONTEND_URL}/dashboard/integrations?error=true`);
    }
  }

  /**
   * Connect integration (manual)
   */
  async connectIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId } = req.params;
      const validatedData = connectSchema.parse(req.body);

      const result = await integrationService.connectIntegration(businessId, validatedData);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, type } = req.params;

      const result = await integrationService.disconnectIntegration(businessId, type);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Sync integration
   */
  async syncIntegration(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, type } = req.params;

      const result = await integrationService.syncIntegration(businessId, type);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update integration settings
   */
  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const { businessId, type } = req.params;
      const { settings } = req.body;

      // In a real implementation, this would update the integration settings
      res.json({
        success: true,
        data: {
          message: 'Settings updated successfully',
          settings,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const integrationController = new IntegrationController();

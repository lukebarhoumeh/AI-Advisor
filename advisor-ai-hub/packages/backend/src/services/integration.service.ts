import { prisma } from '../config/database';
import { AppError, NotFoundError } from '../utils/errors';
import { cacheService } from './cache.service';
import axios from 'axios';

interface IntegrationConfig {
  type: 'gmail' | 'outlook' | 'google_calendar' | 'quickbooks';
  credentials: Record<string, any>;
  settings?: Record<string, any>;
}

export class IntegrationService {
  /**
   * Get integrations for a business
   */
  async getIntegrations(businessId: string) {
    const integrations = await prisma.integration.findMany({
      where: { businessId },
    });

    // Mask sensitive credentials
    return integrations.map(integration => ({
      ...integration,
      credentials: { connected: true }, // Don't expose actual credentials
    }));
  }

  /**
   * Connect integration
   */
  async connectIntegration(businessId: string, config: IntegrationConfig) {
    // Check if already connected
    const existing = await prisma.integration.findUnique({
      where: {
        businessId_type: {
          businessId,
          type: config.type,
        },
      },
    });

    if (existing) {
      throw new AppError('Integration already connected', 400);
    }

    // Validate and encrypt credentials
    const encryptedCredentials = this.encryptCredentials(config.credentials);

    // Create integration
    const integration = await prisma.integration.create({
      data: {
        businessId,
        type: config.type,
        credentials: encryptedCredentials,
        settings: config.settings || {},
        enabled: true,
      },
    });

    // Test connection
    await this.testConnection(integration);

    return {
      id: integration.id,
      type: integration.type,
      enabled: integration.enabled,
      connected: true,
    };
  }

  /**
   * Disconnect integration
   */
  async disconnectIntegration(businessId: string, type: string) {
    const integration = await prisma.integration.findUnique({
      where: {
        businessId_type: {
          businessId,
          type,
        },
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    await prisma.integration.delete({
      where: { id: integration.id },
    });

    return { message: 'Integration disconnected successfully' };
  }

  /**
   * Sync integration data
   */
  async syncIntegration(businessId: string, type: string) {
    const integration = await prisma.integration.findUnique({
      where: {
        businessId_type: {
          businessId,
          type,
        },
      },
    });

    if (!integration) {
      throw new NotFoundError('Integration');
    }

    if (!integration.enabled) {
      throw new AppError('Integration is disabled', 400);
    }

    // Decrypt credentials
    const credentials = this.decryptCredentials(integration.credentials as any);

    // Perform sync based on type
    let syncResult;
    switch (integration.type) {
      case 'gmail':
      case 'outlook':
        syncResult = await this.syncEmail(integration, credentials);
        break;
      case 'google_calendar':
        syncResult = await this.syncCalendar(integration, credentials);
        break;
      case 'quickbooks':
        syncResult = await this.syncAccounting(integration, credentials);
        break;
      default:
        throw new AppError('Unknown integration type', 400);
    }

    // Update last sync
    await prisma.integration.update({
      where: { id: integration.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      message: 'Sync completed successfully',
      data: syncResult,
    };
  }

  /**
   * Test integration connection
   */
  private async testConnection(integration: any): Promise<boolean> {
    // Mock implementation - in real app, would test actual API connection
    const credentials = this.decryptCredentials(integration.credentials);

    switch (integration.type) {
      case 'gmail':
        // Would use Google API client
        return true;
      case 'outlook':
        // Would use Microsoft Graph API
        return true;
      case 'google_calendar':
        // Would use Google Calendar API
        return true;
      case 'quickbooks':
        // Would use QuickBooks API
        return true;
      default:
        return false;
    }
  }

  /**
   * Sync email integration
   */
  private async syncEmail(integration: any, credentials: any) {
    // Mock implementation
    return {
      emailsSynced: Math.floor(Math.random() * 100),
      lastEmailDate: new Date(),
    };
  }

  /**
   * Sync calendar integration
   */
  private async syncCalendar(integration: any, credentials: any) {
    // Mock implementation
    return {
      eventsSynced: Math.floor(Math.random() * 50),
      upcomingEvents: Math.floor(Math.random() * 10),
    };
  }

  /**
   * Sync accounting integration
   */
  private async syncAccounting(integration: any, credentials: any) {
    // Mock implementation
    return {
      invoicesSynced: Math.floor(Math.random() * 30),
      totalRevenue: Math.floor(Math.random() * 100000),
      outstandingBalance: Math.floor(Math.random() * 10000),
    };
  }

  /**
   * Encrypt credentials
   */
  private encryptCredentials(credentials: Record<string, any>): any {
    // In production, use proper encryption (e.g., crypto module)
    return {
      encrypted: true,
      data: Buffer.from(JSON.stringify(credentials)).toString('base64'),
    };
  }

  /**
   * Decrypt credentials
   */
  private decryptCredentials(encryptedCredentials: any): Record<string, any> {
    // In production, use proper decryption
    if (encryptedCredentials.encrypted) {
      return JSON.parse(Buffer.from(encryptedCredentials.data, 'base64').toString());
    }
    return encryptedCredentials;
  }

  /**
   * Get OAuth URL for integration
   */
  async getOAuthUrl(type: string, businessId: string): Promise<string> {
    const redirectUri = `${process.env.FRONTEND_URL}/integrations/callback`;
    const state = Buffer.from(JSON.stringify({ type, businessId })).toString('base64');

    switch (type) {
      case 'gmail':
      case 'google_calendar':
        const googleParams = new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: type === 'gmail' 
            ? 'https://www.googleapis.com/auth/gmail.readonly' 
            : 'https://www.googleapis.com/auth/calendar',
          state,
          access_type: 'offline',
          prompt: 'consent',
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${googleParams}`;

      case 'outlook':
        const microsoftParams = new URLSearchParams({
          client_id: process.env.MICROSOFT_CLIENT_ID!,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'Mail.Read Calendars.Read offline_access',
          state,
        });
        return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${microsoftParams}`;

      case 'quickbooks':
        const qbParams = new URLSearchParams({
          client_id: process.env.QUICKBOOKS_CLIENT_ID!,
          redirect_uri: redirectUri,
          response_type: 'code',
          scope: 'com.intuit.quickbooks.accounting',
          state,
        });
        return `https://appcenter.intuit.com/connect/oauth2?${qbParams}`;

      default:
        throw new AppError('Unknown integration type', 400);
    }
  }

  /**
   * Handle OAuth callback
   */
  async handleOAuthCallback(code: string, state: string) {
    const { type, businessId } = JSON.parse(Buffer.from(state, 'base64').toString());

    // Exchange code for tokens (mock implementation)
    const tokens = await this.exchangeCodeForTokens(type, code);

    // Save integration
    await this.connectIntegration(businessId, {
      type,
      credentials: tokens,
    });

    return { success: true };
  }

  /**
   * Exchange OAuth code for tokens
   */
  private async exchangeCodeForTokens(type: string, code: string): Promise<any> {
    // Mock implementation - in production, would make actual API calls
    return {
      access_token: 'mock_access_token',
      refresh_token: 'mock_refresh_token',
      expires_in: 3600,
    };
  }
}

export const integrationService = new IntegrationService();

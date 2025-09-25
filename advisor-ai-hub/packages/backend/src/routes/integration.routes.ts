import { Router } from 'express';
import { integrationController } from '../controllers/integration.controller';
import { authenticate, verifyBusinessAccess } from '../middleware/auth';

const router = Router();

// OAuth callback (no auth required)
router.get('/callback', integrationController.handleOAuthCallback);

// All other routes require authentication
router.use(authenticate);

// Get OAuth URL for a specific integration type
router.get('/oauth/:type', integrationController.getOAuthUrl);

// Business-specific integration routes
router.get('/:businessId', verifyBusinessAccess, integrationController.getIntegrations);
router.post('/:businessId/connect', verifyBusinessAccess, integrationController.connectIntegration);
router.delete('/:businessId/:type', verifyBusinessAccess, integrationController.disconnectIntegration);
router.post('/:businessId/:type/sync', verifyBusinessAccess, integrationController.syncIntegration);
router.put('/:businessId/:type/settings', verifyBusinessAccess, integrationController.updateSettings);

export default router;

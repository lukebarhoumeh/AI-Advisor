import { Router } from 'express';
import { marketingController } from '../../controllers/modules/marketing.controller';
import { authenticate, verifyBusinessAccess } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Marketing module routes
router.post('/:businessId/generate', verifyBusinessAccess, marketingController.generateContent);
router.post('/:businessId/campaigns', verifyBusinessAccess, marketingController.saveCampaign);
router.get('/:businessId/campaigns', verifyBusinessAccess, marketingController.getCampaigns);
router.post('/:businessId/campaigns/:campaignId/schedule', verifyBusinessAccess, marketingController.scheduleCampaign);
router.get('/:businessId/analytics', verifyBusinessAccess, marketingController.getAnalytics);

export default router;

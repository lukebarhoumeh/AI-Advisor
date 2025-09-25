import { Router } from 'express';
import { complianceController } from '../../controllers/modules/compliance.controller';
import { authenticate, verifyBusinessAccess } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Compliance module routes
router.post('/:businessId/checklist', verifyBusinessAccess, complianceController.generateChecklist);
router.post('/:businessId/policy', verifyBusinessAccess, complianceController.generatePolicy);
router.get('/:businessId/templates', verifyBusinessAccess, complianceController.getTemplates);
router.post('/:businessId/audits', verifyBusinessAccess, complianceController.createAudit);
router.patch('/:businessId/audits/:auditId', verifyBusinessAccess, complianceController.updateAudit);
router.get('/regulations/:industry', complianceController.getRegulations);
router.get('/:businessId/analytics', verifyBusinessAccess, complianceController.getAnalytics);

export default router;

import { Router } from 'express';
import { businessController } from '../controllers/business.controller';
import { authenticate, authorize, verifyBusinessAccess } from '../middleware/auth';
import { UserRole } from '@advisor-ai/shared';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Get all businesses for current user
router.get('/', businessController.getBusinesses);

// Create new business (SMB owners only)
router.post('/', authorize(UserRole.SMB_OWNER), businessController.createBusiness);

// Get single business
router.get('/:id', businessController.getBusiness);

// Update business
router.put('/:id', businessController.updateBusiness);

// Delete business
router.delete('/:id', businessController.deleteBusiness);

// Get business statistics
router.get('/:id/stats', businessController.getBusinessStats);

// Business-specific routes that verify access
router.use('/:businessId/*', verifyBusinessAccess);

export default router;

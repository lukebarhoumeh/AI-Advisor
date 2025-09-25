import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';
import { authenticate, verifyBusinessAccess, createRateLimiter } from '../middleware/auth';

const router = Router();

// Rate limiter for AI generation (10 requests per minute)
const aiRateLimiter = createRateLimiter(60 * 1000, 10);

// All routes require authentication
router.use(authenticate);

// Get templates for a module (no business verification needed)
router.get('/templates/:moduleType', aiController.getTemplates);

// Business-specific routes
router.post('/generate/:businessId', verifyBusinessAccess, aiRateLimiter, aiController.generate);
router.get('/history/:businessId', verifyBusinessAccess, aiController.getHistory);

export default router;

import { Router } from 'express';
import { subscriptionController } from '../controllers/subscription.controller';
import { authenticate, verifyBusinessAccess } from '../middleware/auth';
import express from 'express';

const router = Router();

// Webhook route (no auth, raw body needed)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  subscriptionController.handleWebhook
);

// All other routes require authentication
router.use(authenticate);

// Get available plans
router.get('/plans', subscriptionController.getPlans);

// Check checkout session status
router.get('/check-status', subscriptionController.checkStatus);

// Business-specific subscription routes
router.get('/:businessId', verifyBusinessAccess, subscriptionController.getSubscription);
router.post('/checkout', subscriptionController.createCheckout);
router.post('/:businessId/portal', verifyBusinessAccess, subscriptionController.createPortal);
router.post('/:businessId/cancel', verifyBusinessAccess, subscriptionController.cancelSubscription);
router.get('/:businessId/history', verifyBusinessAccess, subscriptionController.getBillingHistory);

export default router;

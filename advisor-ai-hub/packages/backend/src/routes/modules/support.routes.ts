import { Router } from 'express';
import { supportController } from '../../controllers/modules/support.controller';
import { authenticate, verifyBusinessAccess } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Support module routes
router.post('/:businessId/generate', verifyBusinessAccess, supportController.generateResponse);
router.post('/:businessId/tickets', verifyBusinessAccess, supportController.createTicket);
router.get('/:businessId/tickets', verifyBusinessAccess, supportController.getTickets);
router.patch('/:businessId/tickets/:ticketId', verifyBusinessAccess, supportController.updateTicket);
router.post('/:businessId/chat', verifyBusinessAccess, supportController.chatMessage);
router.post('/:businessId/faqs', verifyBusinessAccess, supportController.upsertFAQ);
router.get('/:businessId/faqs', verifyBusinessAccess, supportController.getFAQs);
router.get('/:businessId/analytics', verifyBusinessAccess, supportController.getAnalytics);

export default router;

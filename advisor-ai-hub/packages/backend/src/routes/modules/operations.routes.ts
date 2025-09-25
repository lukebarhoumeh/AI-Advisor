import { Router } from 'express';
import { operationsController } from '../../controllers/modules/operations.controller';
import { authenticate, verifyBusinessAccess } from '../../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Operations module routes
router.post('/:businessId/generate', verifyBusinessAccess, operationsController.generateContent);
router.post('/:businessId/invoices', verifyBusinessAccess, operationsController.createInvoice);
router.get('/:businessId/invoices', verifyBusinessAccess, operationsController.getInvoices);
router.post('/:businessId/appointments', verifyBusinessAccess, operationsController.scheduleAppointment);
router.get('/:businessId/appointments', verifyBusinessAccess, operationsController.getAppointments);
router.post('/:businessId/inventory/reminder', verifyBusinessAccess, operationsController.generateInventoryReminder);
router.get('/:businessId/analytics', verifyBusinessAccess, operationsController.getAnalytics);

export default router;

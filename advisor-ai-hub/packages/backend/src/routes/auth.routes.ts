import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { createRateLimiter } from '../middleware/auth';

const router = Router();

// Rate limiters
const authRateLimiter = createRateLimiter(15 * 60 * 1000, 5); // 5 requests per 15 minutes
const generalRateLimiter = createRateLimiter(15 * 60 * 1000, 20); // 20 requests per 15 minutes

// Public routes
router.post('/register', authRateLimiter, authController.register);
router.post('/login', authRateLimiter, authController.login);
router.post('/refresh', generalRateLimiter, authController.refreshToken);
router.post('/logout', generalRateLimiter, authController.logout);
router.get('/verify-email', generalRateLimiter, authController.verifyEmail);
router.post('/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/reset-password', authRateLimiter, authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser);

export default router;

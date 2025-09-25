import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';
import { UserRole } from '@advisor-ai/shared';
import { prisma } from '../config/database';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: UserRole;
      };
      business?: {
        id: string;
        ownerId: string;
        advisorId?: string | null;
      };
    }
  }
}

/**
 * Authenticate JWT token
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
      });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);
    
    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, emailVerified: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found',
      });
    }

    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: 'Email not verified',
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Authorize based on user role
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
    }

    next();
  };
};

/**
 * Verify business access
 */
export const verifyBusinessAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const businessId = req.params.businessId || req.body.businessId;
    
    if (!businessId) {
      return res.status(400).json({
        success: false,
        error: 'Business ID required',
      });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, advisorId: true },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        error: 'Business not found',
      });
    }

    // Check access based on user role
    const hasAccess = 
      req.user!.role === UserRole.ADMIN ||
      business.ownerId === req.user!.id ||
      (req.user!.role === UserRole.ADVISOR && business.advisorId === req.user!.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to this business',
      });
    }

    req.business = business;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Failed to verify business access',
    });
  }
};

/**
 * Rate limiting middleware factory
 */
export const createRateLimiter = (windowMs: number, max: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id || req.ip;
    const now = Date.now();

    const userRequests = requests.get(key);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return next();
    }

    if (userRequests.count >= max) {
      const retryAfter = Math.ceil((userRequests.resetTime - now) / 1000);
      
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        retryAfter,
      });
    }

    userRequests.count++;
    next();
  };
};

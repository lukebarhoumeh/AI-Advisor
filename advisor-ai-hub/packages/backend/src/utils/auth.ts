import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '@prisma/client';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Hash password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (user: Pick<User, 'id' | 'email' | 'role'>): string => {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  });
};

/**
 * Generate both access and refresh tokens
 */
export const generateTokenPair = (user: Pick<User, 'id' | 'email' | 'role'>): TokenPair => {
  return {
    accessToken: generateAccessToken(user),
    refreshToken: generateRefreshToken(user.id),
  };
};

/**
 * Verify and decode access token
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify and decode refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (email: string): string => {
  return jwt.sign({ email, type: 'email_verification' }, process.env.JWT_SECRET!, {
    expiresIn: '24h',
  });
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (email: string): string => {
  return jwt.sign({ email, type: 'password_reset' }, process.env.JWT_SECRET!, {
    expiresIn: '1h',
  });
};

/**
 * Verify email verification or password reset token
 */
export const verifyEmailToken = (token: string, expectedType: 'email_verification' | 'password_reset'): { email: string } => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    if (decoded.type !== expectedType) {
      throw new Error('Invalid token type');
    }
    
    return { email: decoded.email };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

import { RegisterInput, LoginInput, UserRole, SubscriptionTier } from '@advisor-ai/shared';
import { prisma } from '../config/database';
import { 
  hashPassword, 
  comparePassword, 
  generateTokenPair, 
  generateEmailVerificationToken,
  generatePasswordResetToken,
  verifyEmailToken,
  verifyRefreshToken,
  generateAccessToken
} from '../utils/auth';
import { AppError } from '../utils/errors';
import { emailService } from './email.service';

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterInput) {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('User already exists with this email', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          firstName: data.firstName,
          lastName: data.lastName,
          role: data.role,
        },
      });

      // If SMB owner, create business
      let business = null;
      if (data.role === UserRole.SMB_OWNER && data.businessName) {
        business = await tx.business.create({
          data: {
            name: data.businessName,
            ownerId: user.id,
          },
        });

        // Create free trial subscription
        await tx.subscription.create({
          data: {
            businessId: business.id,
            tier: SubscriptionTier.FREE_TRIAL,
            currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
          },
        });

        // Initialize module usage
        const modules = ['MARKETING', 'OPERATIONS', 'CUSTOMER_SUPPORT', 'COMPLIANCE'];
        await tx.moduleUsage.createMany({
          data: modules.map(moduleType => ({
            businessId: business.id,
            moduleType: moduleType as any,
          })),
        });
      }

      // If advisor, create advisor profile
      if (data.role === UserRole.ADVISOR) {
        await tx.advisorProfile.create({
          data: {
            userId: user.id,
            companyName: data.businessName,
          },
        });
      }

      return { user, business };
    });

    // Generate email verification token
    const verificationToken = generateEmailVerificationToken(result.user.email);

    // Send verification email
    await emailService.sendVerificationEmail(result.user.email, verificationToken);

    // Generate tokens
    const tokens = generateTokenPair(result.user);

    // Create session
    await prisma.session.create({
      data: {
        userId: result.user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
      },
      business: result.business,
      tokens,
    };
  }

  /**
   * Login user
   */
  async login(data: LoginInput) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isValidPassword = await comparePassword(data.password, user.password);
    if (!isValidPassword) {
      throw new AppError('Invalid credentials', 401);
    }

    // Check email verification
    if (!user.emailVerified) {
      throw new AppError('Please verify your email before logging in', 403);
    }

    // Generate tokens
    const tokens = generateTokenPair(user);

    // Create session
    await prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Get user's business if SMB owner
    let business = null;
    if (user.role === UserRole.SMB_OWNER) {
      business = await prisma.business.findFirst({
        where: { ownerId: user.id },
      });
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      business,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    // Verify refresh token
    const payload = verifyRefreshToken(refreshToken);

    // Check if session exists
    const session = await prisma.session.findFirst({
      where: {
        token: refreshToken,
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Generate new access token
    const accessToken = generateAccessToken(user);

    return { accessToken };
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string) {
    await prisma.session.deleteMany({
      where: { token: refreshToken },
    });
  }

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    const { email } = verifyEmailToken(token, 'email_verification');

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.emailVerified) {
      throw new AppError('Email already verified', 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  /**
   * Request password reset
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, a reset link has been sent' };
    }

    const resetToken = generatePasswordResetToken(email);
    await emailService.sendPasswordResetEmail(email, resetToken);

    return { message: 'If the email exists, a reset link has been sent' };
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    const { email } = verifyEmailToken(token, 'password_reset');

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password reset successfully' };
  }
}

export const authService = new AuthService();

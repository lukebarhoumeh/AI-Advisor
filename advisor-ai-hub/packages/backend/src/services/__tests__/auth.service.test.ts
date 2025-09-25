import { registerUser, loginUser } from '../auth.service';
import { prisma } from '../../config/database';
import { UserRole } from '@prisma/client';

describe('AuthService', () => {
  describe('registerUser', () => {
    it('should register a new SMB user with business', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      const result = await registerUser(email, password, UserRole.SMB);

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(email);
      expect(result.user.role).toBe(UserRole.SMB);
      expect(result.token).toBeDefined();

      // Verify business was created
      const business = await prisma.business.findFirst({
        where: { ownerId: result.user.id },
      });
      expect(business).toBeDefined();
      expect(business?.name).toBe(`${email}'s Business`);
    });

    it('should throw error for duplicate email', async () => {
      const email = 'duplicate@example.com';
      const password = 'password123';

      // First registration
      await registerUser(email, password);

      // Attempt duplicate registration
      await expect(registerUser(email, password)).rejects.toThrow(
        'User with this email already exists'
      );
    });
  });

  describe('loginUser', () => {
    beforeEach(async () => {
      // Create test user
      await registerUser('login@example.com', 'password123');
    });

    it('should login with valid credentials', async () => {
      const result = await loginUser('login@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('login@example.com');
      expect(result.token).toBeDefined();
    });

    it('should throw error for invalid password', async () => {
      await expect(
        loginUser('login@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        loginUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });
  });
});

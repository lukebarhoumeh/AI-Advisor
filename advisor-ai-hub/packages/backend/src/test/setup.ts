import { prisma } from '../config/database';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';

// Clean up database after each test
afterEach(async () => {
  // Clean up test data
  const deleteOperations = [
    prisma.invoice.deleteMany(),
    prisma.templateUse.deleteMany(),
    prisma.template.deleteMany(),
    prisma.aIGeneration.deleteMany(),
    prisma.moduleUsage.deleteMany(),
    prisma.integration.deleteMany(),
    prisma.activityLog.deleteMany(),
    prisma.session.deleteMany(),
    prisma.subscription.deleteMany(),
    prisma.business.deleteMany(),
    prisma.advisorProfile.deleteMany(),
    prisma.user.deleteMany(),
  ];

  await prisma.$transaction(deleteOperations);
});

// Close database connection after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

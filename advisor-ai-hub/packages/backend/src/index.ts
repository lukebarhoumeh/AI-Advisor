import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { errorHandler, notFoundHandler } from './middleware/error';
import authRoutes from './routes/auth.routes';
import businessRoutes from './routes/business.routes';
import aiRoutes from './routes/ai.routes';
import marketingRoutes from './routes/modules/marketing.routes';
import operationsRoutes from './routes/modules/operations.routes';
import supportRoutes from './routes/modules/support.routes';
import complianceRoutes from './routes/modules/compliance.routes';
import subscriptionRoutes from './routes/subscription.routes';
import integrationRoutes from './routes/integration.routes';
import { prisma } from './config/database';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(compression());

// Stripe webhook needs raw body, so it must come before json parser
app.use('/api/subscriptions/webhook', express.raw({ type: 'application/json' }));

// JSON parser for all other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/modules/marketing', marketingRoutes);
app.use('/api/modules/operations', operationsRoutes);
app.use('/api/modules/support', supportRoutes);
app.use('/api/modules/compliance', complianceRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/integrations', integrationRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
  });
  await prisma.$disconnect();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process in development
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// Start the server
startServer();

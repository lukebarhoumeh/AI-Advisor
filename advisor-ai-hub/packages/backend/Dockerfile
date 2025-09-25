FROM node:18-alpine AS builder

WORKDIR /app

# Copy workspace files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy source files
COPY packages/backend ./packages/backend
COPY packages/shared ./packages/shared

# Build shared package
WORKDIR /app/packages/shared
RUN npm run build

# Build backend
WORKDIR /app/packages/backend
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy workspace package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/shared/package*.json ./packages/shared/

# Install production dependencies only
RUN npm ci --only=production

# Copy built files and necessary source files
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist
COPY --from=builder /app/packages/backend/prisma ./packages/backend/prisma
COPY packages/backend/env.example ./packages/backend/env.example

WORKDIR /app/packages/backend

EXPOSE 5000

CMD ["node", "dist/index.js"]

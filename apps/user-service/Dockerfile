FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/user-service/package.json ./apps/user-service/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN cd apps/user-service && npx prisma generate

# Build the application
RUN npm run build --workspace=user-service

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/user-service/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/user-service/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder --chown=nestjs:nodejs /app/apps/user-service/prisma ./prisma

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

USER nestjs

EXPOSE 3002

ENV PORT 3002

CMD ["node", "dist/main"]

FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/config/package.json ./packages/config/
COPY apps/gateway/package.json ./apps/gateway/

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Build shared packages first, then the application
RUN npm run build --workspace=@microservices/shared
RUN npm run build --workspace=@microservices/config
RUN npm run build --workspace=gateway

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Copy built application
COPY --from=builder --chown=nestjs:nodejs /app/apps/gateway/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/gateway/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder --chown=nestjs:nodejs /app/packages/config/package.json ./packages/config/package.json
COPY --from=builder --chown=nestjs:nodejs /app/package-lock.json ./package-lock.json

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

USER nestjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "dist/main"]

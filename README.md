# 🚀 Microservices Starter Kit

A production-ready microservices architecture built with **NestJS**, **PostgreSQL**, **RabbitMQ**, and **Redis**. This project demonstrates best practices for building scalable, event-driven distributed systems.

![TypeScript](https://img.shields.io/badge/TypeScript-5.1-blue)
![NestJS](https://img.shields.io/badge/NestJS-10.0-red)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.x-orange)
![Redis](https://img.shields.io/badge/Redis-7.x-red)
![License](https://img.shields.io/badge/License-MIT-green)

## 📋 Table of Contents

- [Architecture Overview](#-architecture-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)
- [Services](#-services)
- [API Documentation](#-api-documentation)
- [Event-Driven Communication](#-event-driven-communication)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)

## 🏗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT APPLICATIONS                             │
│                    (Web, Mobile, Third-party Services)                       │
└─────────────────────────────────────────────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           🌐 API GATEWAY (Port 3000)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Rate Limit  │  │ Auth Guard  │  │   Routing   │  │ Request Aggregation │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  🔐 Auth Svc    │ │  👤 User Svc    │ │  📦 Product Svc │ │  💳 Payment Svc │
│   Port 3001     │ │   Port 3002     │ │   Port 3003     │ │   Port 3004     │
├─────────────────┤ ├─────────────────┤ ├─────────────────┤ ├─────────────────┤
│ • Registration  │ │ • Profiles      │ │ • Catalog       │ │ • Orders        │
│ • Login/Logout  │ │ • Preferences   │ │ • Categories    │ │ • Payments      │
│ • JWT Tokens    │ │ • Addresses     │ │ • Inventory     │ │ • Refunds       │
│ • Password Reset│ │                 │ │                 │ │                 │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │                   │
         ▼                   ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   PostgreSQL    │ │   PostgreSQL    │ │   PostgreSQL    │ │   PostgreSQL    │
│  auth_service   │ │  user_service   │ │ product_service │ │ payment_service │
│      _db        │ │      _db        │ │      _db        │ │      _db        │
└─────────────────┘ └─────────────────┘ └─────────────────┘ └─────────────────┘

                    ┌─────────────────────────────────────┐
                    │        🐰 RabbitMQ (Port 5672)      │
                    │     Event Bus for Async Messaging   │
                    │  ┌───────────────────────────────┐  │
                    │  │   Exchange: microservices.    │  │
                    │  │            events             │  │
                    │  └───────────────────────────────┘  │
                    └─────────────────────────────────────┘
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         │                             │                             │
         ▼                             ▼                             ▼
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│ auth.user.*     │         │ user.profile.*  │         │ payment.order.* │
│ Events Queue    │         │ Events Queue    │         │ Events Queue    │
└─────────────────┘         └─────────────────┘         └─────────────────┘

                    ┌─────────────────────────────────────┐
                    │         🔴 Redis (Port 6379)        │
                    │    Caching & Session Management     │
                    └─────────────────────────────────────┘
```

## ✨ Features

### Core Features
- **Microservices Architecture** - 5 independent services with clear boundaries
- **Event-Driven Communication** - Asynchronous messaging via RabbitMQ
- **Database per Service** - Isolated PostgreSQL databases using Prisma ORM
- **API Gateway** - Centralized routing, authentication, and rate limiting
- **JWT Authentication** - Secure token-based auth with refresh tokens

### Infrastructure
- **Docker Compose** - One-command local development environment
- **Kubernetes Ready** - Production deployment manifests included
- **CI/CD Pipeline** - GitHub Actions for automated testing and deployment
- **Health Checks** - Readiness and liveness probes for all services

### Developer Experience
- **Monorepo with Turbo** - Parallel builds and caching
- **Shared Packages** - Common DTOs, types, and utilities
- **Auto-generated API Docs** - Swagger/OpenAPI for each service
- **Comprehensive Testing** - Unit and integration tests

## 🛠 Tech Stack

| Category | Technology |
|----------|------------|
| **Runtime** | Node.js 20+ |
| **Framework** | NestJS 10 |
| **Language** | TypeScript 5.1 |
| **HTTP Server** | Fastify |
| **Database** | PostgreSQL 15 |
| **ORM** | Prisma |
| **Message Queue** | RabbitMQ |
| **Cache** | Redis |
| **Build System** | Turborepo |
| **Container** | Docker |
| **Orchestration** | Kubernetes |
| **CI/CD** | GitHub Actions |

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20.x
- **npm** >= 9.x
- **Docker** & **Docker Compose**
- **Git**

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/microservices-starter-kit.git
cd microservices-starter-kit

# 2. Run setup script (copies env files, installs deps)
./scripts/setup.sh

# 3. Start infrastructure (PostgreSQL, Redis, RabbitMQ)
npm run docker:up

# 4. Generate Prisma clients
npm run prisma:generate

# 5. Run database migrations
npm run prisma:migrate

# 6. Start all services in development mode
npm run dev
```

### Service URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Gateway** | http://localhost:3000 | API Gateway |
| **Gateway Docs** | http://localhost:3000/api/docs | Swagger UI |
| **Auth Service** | http://localhost:3001 | Authentication |
| **Auth Docs** | http://localhost:3001/api/docs | Swagger UI |
| **User Service** | http://localhost:3002 | User Profiles |
| **User Docs** | http://localhost:3002/api/docs | Swagger UI |
| **Product Service** | http://localhost:3003 | Product Catalog |
| **Product Docs** | http://localhost:3003/api/docs | Swagger UI |
| **Payment Service** | http://localhost:3004 | Orders & Payments |
| **Payment Docs** | http://localhost:3004/api/docs | Swagger UI |
| **RabbitMQ UI** | http://localhost:15672 | Message Queue UI |
| **Adminer** | http://localhost:8080 | Database UI |

### Environment Variables

Each service has an `env.template` file. Copy and customize:

```bash
# Root level
cp env.template .env

# Each service
cp apps/auth-service/env.template apps/auth-service/.env
cp apps/user-service/env.template apps/user-service/.env
cp apps/product-service/env.template apps/product-service/.env
cp apps/payment-service/env.template apps/payment-service/.env
cp apps/gateway/env.template apps/gateway/.env
```

## 📁 Project Structure

```
microservices-starter-kit/
├── apps/                          # Microservices
│   ├── gateway/                   # API Gateway
│   │   └── src/
│   │       ├── auth/              # Auth guards & strategies
│   │       ├── proxy/             # Service proxies
│   │       └── health/            # Health endpoints
│   ├── auth-service/              # Authentication Service
│   │   ├── prisma/                # Database schema & migrations
│   │   └── src/
│   │       ├── auth/              # Auth module
│   │       └── prisma/            # Prisma service
│   ├── user-service/              # User Management Service
│   │   ├── prisma/
│   │   └── src/
│   │       ├── user/              # User module
│   │       └── events/            # Event publishing
│   ├── product-service/           # Product Catalog Service
│   │   ├── prisma/
│   │   └── src/
│   │       ├── product/           # Product module
│   │       ├── category/          # Category module
│   │       └── inventory/         # Inventory module
│   └── payment-service/           # Payment Processing Service
│       ├── prisma/
│       └── src/
│           ├── order/             # Order module
│           ├── payment/           # Payment module
│           └── events/            # Event publishing
├── packages/                      # Shared packages
│   ├── shared/                    # DTOs, types, events, utils
│   │   └── src/
│   │       ├── dto/               # Data Transfer Objects
│   │       ├── types/             # TypeScript interfaces
│   │       ├── events/            # Event definitions
│   │       └── constants/         # Shared constants
│   └── config/                    # Configuration utilities
│       └── src/
│           ├── database.ts        # Database config
│           ├── rabbitmq.ts        # RabbitMQ config
│           └── redis.ts           # Redis config
├── infra/                         # Infrastructure
│   ├── docker-compose.yml         # Infrastructure services
│   └── init-db.sql                # Database initialization
├── k8s/                           # Kubernetes manifests
│   ├── base/                      # Base configurations
│   └── overlays/                  # Environment-specific
├── .github/
│   └── workflows/                 # CI/CD pipelines
├── postman/                       # API collections
└── scripts/                       # Utility scripts
```

## 🔌 Services

### 🔐 Auth Service (Port 3001)

Handles authentication and authorization.

**Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/me` - Get current user

**Events Published:**
- `auth.user.registered`
- `auth.user.login`
- `auth.password.reset.completed`

### 👤 User Service (Port 3002)

Manages user profiles and preferences.

**Endpoints:**
- `GET /users/profile` - Get user profile
- `POST /users/profile` - Create user profile
- `PATCH /users/profile` - Update user profile
- `DELETE /users/profile` - Delete user profile
- `POST /users/address` - Add address
- `PATCH /users/preferences` - Update preferences

**Events Published:**
- `user.profile.updated`
- `user.preferences.updated`
- `user.deleted`

### 📦 Product Service (Port 3003)

Manages product catalog and inventory.

**Endpoints:**
- `GET /products` - List products (with filtering & pagination)
- `GET /products/:id` - Get product details
- `POST /products` - Create product (Admin)
- `PATCH /products/:id` - Update product (Admin)
- `DELETE /products/:id` - Delete product (Admin)
- `GET /categories` - List categories
- `POST /categories` - Create category (Admin)
- `PATCH /inventory/:productId` - Update inventory

**Events Published:**
- `product.created`
- `product.updated`
- `product.deleted`
- `product.inventory.updated`
- `product.inventory.low_stock`

### 💳 Payment Service (Port 3004)

Handles orders and payment processing.

**Endpoints:**
- `POST /orders` - Create order
- `GET /orders` - List user orders
- `GET /orders/:id` - Get order details
- `POST /orders/:id/cancel` - Cancel order
- `POST /payments/process` - Process payment
- `POST /payments/:id/refund` - Request refund

**Events Published:**
- `payment.order.created`
- `payment.order.status.updated`
- `payment.processed`
- `payment.failed`
- `payment.refund.processed`

### 🌐 API Gateway (Port 3000)

Unified entry point for all client requests.

**Features:**
- Request routing to appropriate services
- JWT token validation
- Rate limiting (100 req/min)
- Request/Response transformation
- Error handling and logging
- Health checks aggregation

## 📡 Event-Driven Communication

Services communicate asynchronously using RabbitMQ with a topic exchange.

### Event Flow Example: User Registration

```
┌──────────────┐    POST /auth/register    ┌──────────────┐
│    Client    │ ─────────────────────────▶│   Gateway    │
└──────────────┘                           └──────┬───────┘
                                                  │
                                                  ▼
                                           ┌──────────────┐
                                           │ Auth Service │
                                           └──────┬───────┘
                                                  │
                        ┌─────────────────────────┼─────────────────────────┐
                        │ Publish: auth.user.registered                     │
                        ▼                         ▼                         ▼
                 ┌──────────────┐         ┌──────────────┐         ┌──────────────┐
                 │ User Service │         │Email Service │         │Analytics Svc │
                 │ (Creates     │         │ (Sends       │         │ (Tracks      │
                 │  Profile)    │         │  Welcome)    │         │  Signup)     │
                 └──────────────┘         └──────────────┘         └──────────────┘
```

### Event Naming Convention

```
{service}.{entity}.{action}

Examples:
- auth.user.registered
- user.profile.updated
- product.inventory.low_stock
- payment.order.created
```

## 🧪 Testing

### Run All Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Run Service-Specific Tests

```bash
# Auth service tests
npm test --workspace=auth-service

# User service tests
npm test --workspace=user-service

# Product service tests
npm test --workspace=product-service

# Payment service tests
npm test --workspace=payment-service
```

### Test Structure

```
apps/{service}/
├── src/
│   └── {module}/
│       └── __tests__/
│           ├── {service}.service.spec.ts    # Unit tests
│           └── {service}.controller.spec.ts # Controller tests
└── test/
    ├── app.e2e-spec.ts                      # E2E tests
    └── jest-e2e.json                        # E2E config
```

## 🚢 Deployment

### Docker Compose (Development)

```bash
# Start full stack
docker-compose -f docker-compose.dev.yml up -d

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all
docker-compose -f docker-compose.dev.yml down
```

### Kubernetes (Production)

```bash
# Apply all manifests
kubectl apply -k k8s/overlays/production

# Check deployment status
kubectl get pods -n microservices

# View service logs
kubectl logs -f deployment/auth-service -n microservices
```

### CI/CD Pipeline

The GitHub Actions workflow handles:
1. **Lint & Type Check** - Code quality
2. **Unit Tests** - All services
3. **Build** - Docker images
4. **Push** - To container registry
5. **Deploy** - To Kubernetes cluster

## 🔧 Common Commands

```bash
# Development
npm run dev              # Start all services
npm run build            # Build all services
npm run lint             # Lint all code

# Database
npm run prisma:generate  # Generate Prisma clients
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio

# Docker
npm run docker:up        # Start infrastructure
npm run docker:down      # Stop infrastructure
npm run docker:logs      # View logs

# Testing
npm test                 # Run all tests
npm run test:cov         # With coverage
```

## 📚 API Documentation

Each service exposes Swagger documentation at `/api/docs`:

- **Gateway:** http://localhost:3000/api/docs
- **Auth Service:** http://localhost:3001/api/docs
- **User Service:** http://localhost:3002/api/docs
- **Product Service:** http://localhost:3003/api/docs
- **Payment Service:** http://localhost:3004/api/docs

Postman collections are available in the `/postman` directory.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built for learning and production use**

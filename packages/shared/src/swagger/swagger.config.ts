import { DocumentBuilder, SwaggerDocumentOptions } from '@nestjs/swagger';

export interface SwaggerConfig {
  title: string;
  description: string;
  version: string;
  basePath?: string;
  tags?: Array<{ name: string; description: string }>;
}

export const createSwaggerConfig = (config: SwaggerConfig) => {
  const builder = new DocumentBuilder()
    .setTitle(config.title)
    .setDescription(config.description)
    .setVersion(config.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addApiKey(
      {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
        description: 'API key for external integrations',
      },
      'api-key',
    )
    .addServer('http://localhost:3000', 'Local Gateway')
    .addServer('https://staging.example.com', 'Staging')
    .addServer('https://api.example.com', 'Production');

  if (config.tags) {
    config.tags.forEach((tag) => {
      builder.addTag(tag.name, tag.description);
    });
  }

  return builder.build();
};

export const swaggerDocumentOptions: SwaggerDocumentOptions = {
  operationIdFactory: (controllerKey: string, methodKey: string) =>
    `${controllerKey}_${methodKey}`,
  deepScanRoutes: true,
};

// Pre-configured Swagger configs for each service
export const authServiceSwagger: SwaggerConfig = {
  title: 'Auth Service API',
  description: `
## Authentication & Authorization Service

This service handles all authentication and authorization operations including:

- **User Registration**: Create new user accounts
- **User Login**: Authenticate users and issue JWT tokens
- **Token Refresh**: Refresh expired access tokens
- **Password Reset**: Request and complete password resets
- **Session Management**: Logout and invalidate sessions

### Authentication Flow

1. Register or login to receive access and refresh tokens
2. Use the access token in the Authorization header: \`Bearer <token>\`
3. When access token expires, use the refresh token to get new tokens
4. Logout to invalidate all tokens

### Rate Limiting

- Login: 5 requests per minute
- Registration: 3 requests per minute
- Token refresh: 10 requests per minute
`,
  version: '1.0.0',
  tags: [
    { name: 'auth', description: 'Authentication operations' },
    { name: 'users', description: 'User account management' },
    { name: 'health', description: 'Service health checks' },
  ],
};

export const userServiceSwagger: SwaggerConfig = {
  title: 'User Service API',
  description: `
## User Profile Management Service

This service manages user profiles, preferences, and addresses:

- **Profile Management**: Create, read, update user profiles
- **Address Management**: Manage shipping and billing addresses
- **Preferences**: User notification and display preferences
- **Admin Operations**: Administrative user management

### Authorization

Most endpoints require a valid JWT token. Admin endpoints require the 'admin' role.
`,
  version: '1.0.0',
  tags: [
    { name: 'profiles', description: 'User profile operations' },
    { name: 'addresses', description: 'Address management' },
    { name: 'preferences', description: 'User preferences' },
    { name: 'admin', description: 'Administrative operations' },
    { name: 'health', description: 'Service health checks' },
  ],
};

export const productServiceSwagger: SwaggerConfig = {
  title: 'Product Service API',
  description: `
## Product Catalog & Inventory Service

This service manages the product catalog and inventory:

- **Products**: CRUD operations for products
- **Categories**: Hierarchical category management
- **Inventory**: Stock levels and reservations
- **Search**: Product search and filtering

### Inventory Management

- Stock levels are tracked per product
- Reservations can be placed for checkout processes
- Low stock alerts are published as events
`,
  version: '1.0.0',
  tags: [
    { name: 'products', description: 'Product catalog operations' },
    { name: 'categories', description: 'Category management' },
    { name: 'inventory', description: 'Inventory and stock management' },
    { name: 'health', description: 'Service health checks' },
  ],
};

export const paymentServiceSwagger: SwaggerConfig = {
  title: 'Payment Service API',
  description: `
## Order & Payment Processing Service

This service handles orders and payment processing:

- **Orders**: Create and manage orders
- **Payments**: Process payments and refunds
- **Order Status**: Track order lifecycle

### Order Lifecycle

1. Order created (PENDING)
2. Payment processed (PAID/FAILED)
3. Order fulfilled (SHIPPED)
4. Order completed (DELIVERED)

### Payment Processing

Payments are processed through simulated gateways. In production, integrate with actual payment providers (Stripe, PayPal, etc.).
`,
  version: '1.0.0',
  tags: [
    { name: 'orders', description: 'Order management' },
    { name: 'payments', description: 'Payment processing' },
    { name: 'health', description: 'Service health checks' },
  ],
};

export const gatewaySwagger: SwaggerConfig = {
  title: 'Microservices API Gateway',
  description: `
## API Gateway

The central entry point for all microservices in this system.

### Services

- **Auth Service**: Authentication and authorization
- **User Service**: User profile management
- **Product Service**: Product catalog and inventory
- **Payment Service**: Order and payment processing

### Features

- **Rate Limiting**: Protects services from abuse
- **Authentication**: JWT-based authentication
- **Request Routing**: Intelligent routing to backend services
- **Health Aggregation**: Unified health status

### Rate Limits

- Default: 100 requests per minute
- Authentication endpoints: 5-10 requests per minute
- Admin endpoints: 50 requests per minute
`,
  version: '1.0.0',
  tags: [
    { name: 'auth', description: 'Authentication endpoints' },
    { name: 'users', description: 'User management endpoints' },
    { name: 'products', description: 'Product catalog endpoints' },
    { name: 'payments', description: 'Payment endpoints' },
    { name: 'health', description: 'Health check endpoints' },
  ],
};

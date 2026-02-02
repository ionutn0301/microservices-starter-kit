import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('ProductService');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // API Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Product Service API')
    .setDescription('Product catalog and inventory management microservice')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Products', 'Product management endpoints')
    .addTag('Categories', 'Category management endpoints')
    .addTag('Inventory', 'Inventory management endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3003;
  await app.listen(port, '0.0.0.0');
  logger.log(`📦 Product service running on port ${port}`);
  logger.log(`📚 API documentation available at http://localhost:${port}/api/docs`);
}

bootstrap(); 

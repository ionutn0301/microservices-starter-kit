import { config } from 'dotenv';
import * as Joi from 'joi';
import { Environment } from '@microservices/shared';

// Load environment variables
config();

export interface BaseConfig {
  NODE_ENV: Environment;
  PORT: number;
  SERVICE_NAME: string;
  LOG_LEVEL: string;
  
  // Database
  DATABASE_URL: string;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  
  // RabbitMQ
  RABBITMQ_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  JWT_REFRESH_SECRET: string;
  JWT_REFRESH_EXPIRES_IN: string;
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
  
  // CORS
  CORS_ORIGIN: string;
}

const baseSchema = Joi.object({
  NODE_ENV: Joi.string().valid(...Object.values(Environment)).default(Environment.DEVELOPMENT),
  PORT: Joi.number().default(3000),
  SERVICE_NAME: Joi.string().required(),
  LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace').default('info'),
  
  DATABASE_URL: Joi.string().required(),
  
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  
  RABBITMQ_URL: Joi.string().default('amqp://microservices:microservices123@localhost:5672'),
  
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  
  RATE_LIMIT_WINDOW_MS: Joi.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  CORS_ORIGIN: Joi.string().default('*'),
});

export const validateConfig = (
  schema: Joi.ObjectSchema,
  envVars: Record<string, any> = process.env
): any => {
  const { error, value } = schema.validate(envVars, {
    allowUnknown: true,
    stripUnknown: true,
  });

  if (error) {
    throw new Error(`Config validation error: ${error.message}`);
  }

  return value;
};

export const createConfig = <T extends BaseConfig>(
  additionalSchema: Joi.ObjectSchema = Joi.object(),
  envVars: Record<string, any> = process.env
): T => {
  const schema = baseSchema.concat(additionalSchema);
  return validateConfig(schema, envVars) as T;
};

export { baseSchema }; 
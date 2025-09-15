import pino from 'pino';
import { Environment } from '@microservices/shared';

export interface LoggerConfig {
  level: string;
  service: string;
  environment: Environment;
}

export const createLogger = (config: LoggerConfig) => {
  const isDevelopment = config.environment === Environment.DEVELOPMENT;
  
  return pino({
    name: config.service,
    level: config.level,
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    }),
    ...(!isDevelopment && {
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }),
  });
};

export type Logger = ReturnType<typeof createLogger>;

// Request logging middleware helper
export const createRequestLogger = (logger: Logger) => {
  return {
    logRequest: (req: any, res: any, responseTime?: number) => {
      logger.info({
        req: {
          method: req.method,
          url: req.url,
          headers: req.headers,
          query: req.query,
          params: req.params,
        },
        res: {
          statusCode: res.statusCode,
        },
        responseTime,
      }, 'Request processed');
    },
    
    logError: (error: Error, req?: any) => {
      logger.error({
        err: error,
        req: req ? {
          method: req.method,
          url: req.url,
          headers: req.headers,
        } : undefined,
      }, 'Request error');
    },
  };
}; 
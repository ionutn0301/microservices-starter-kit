export interface RabbitMQConfig {
  url: string;
  exchanges: {
    events: string;
    deadLetter: string;
  };
  queues: {
    [serviceName: string]: string;
  };
  retryOptions: {
    maxRetries: number;
    retryDelay: number;
  };
}

export const createRabbitMQConfig = (
  url: string = 'amqp://microservices:microservices123@localhost:5672',
  serviceName: string
): RabbitMQConfig => {
  return {
    url,
    exchanges: {
      events: 'microservices.events',
      deadLetter: 'microservices.dead-letter',
    },
    queues: {
      [serviceName]: `${serviceName}.queue`,
      deadLetter: `${serviceName}.dead-letter.queue`,
    },
    retryOptions: {
      maxRetries: 3,
      retryDelay: 5000,
    },
  };
};

export const getQueueName = (serviceName: string, eventType?: string): string => {
  const baseQueue = `${serviceName}.queue`;
  return eventType ? `${baseQueue}.${eventType}` : baseQueue;
}; 
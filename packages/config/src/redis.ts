export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  retryDelayOnFailover?: number;
  maxRetriesPerRequest?: number;
  lazyConnect?: boolean;
}

export const createRedisConfig = (
  host: string = 'localhost',
  port: number = 6379,
  options: Partial<RedisConfig> = {}
): RedisConfig => {
  return {
    host,
    port,
    password: options.password,
    db: options.db || 0,
    retryDelayOnFailover: options.retryDelayOnFailover || 100,
    maxRetriesPerRequest: options.maxRetriesPerRequest || 3,
    lazyConnect: options.lazyConnect !== false,
  };
};

export const getRedisUrl = (config: RedisConfig): string => {
  const auth = config.password ? `:${config.password}@` : '';
  return `redis://${auth}${config.host}:${config.port}/${config.db || 0}`;
}; 
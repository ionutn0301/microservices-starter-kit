export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

export const createDatabaseConfig = (
  url: string,
  options: Partial<DatabaseConfig> = {}
): DatabaseConfig => {
  return {
    url,
    maxConnections: options.maxConnections || 10,
    connectionTimeout: options.connectionTimeout || 60000,
    idleTimeout: options.idleTimeout || 300000,
  };
};

export const getDatabaseUrl = (serviceName: string, baseUrl?: string): string => {
  if (baseUrl) {
    return baseUrl;
  }
  
  // Default database naming convention
  const dbName = `${serviceName.replace('-', '_')}_db`;
  return `postgresql://microservices:microservices123@localhost:5432/${dbName}`;
}; 
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum ServiceNames {
  GATEWAY = 'gateway',
  AUTH = 'auth-service',
  USER = 'user-service',
  PRODUCT = 'product-service',
  PAYMENT = 'payment-service',
}

export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
} 
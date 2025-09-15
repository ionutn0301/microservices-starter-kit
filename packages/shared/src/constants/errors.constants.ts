export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  USER_NOT_FOUND: 'User not found',
  INVALID_TOKEN: 'Invalid or expired token',
  EMAIL_NOT_VERIFIED: 'Email not verified',
  PASSWORD_TOO_WEAK: 'Password does not meet requirements',
  ACCOUNT_LOCKED: 'Account is locked',
} as const;

export const USER_ERRORS = {
  PROFILE_NOT_FOUND: 'User profile not found',
  INVALID_USER_ID: 'Invalid user ID',
  UPDATE_FAILED: 'Failed to update user profile',
  DELETE_FAILED: 'Failed to delete user',
} as const;

export const PRODUCT_ERRORS = {
  NOT_FOUND: 'Product not found',
  SKU_ALREADY_EXISTS: 'SKU already exists',
  INVALID_PRICE: 'Invalid price',
  INSUFFICIENT_STOCK: 'Insufficient stock',
  CATEGORY_NOT_FOUND: 'Category not found',
  UPDATE_FAILED: 'Failed to update product',
  DELETE_FAILED: 'Failed to delete product',
} as const;

export const PAYMENT_ERRORS = {
  ORDER_NOT_FOUND: 'Order not found',
  PAYMENT_FAILED: 'Payment processing failed',
  INSUFFICIENT_FUNDS: 'Insufficient funds',
  INVALID_PAYMENT_METHOD: 'Invalid payment method',
  ORDER_ALREADY_PAID: 'Order already paid',
  REFUND_FAILED: 'Refund processing failed',
  INVALID_AMOUNT: 'Invalid payment amount',
} as const;

export const COMMON_ERRORS = {
  INTERNAL_SERVER_ERROR: 'Internal server error',
  VALIDATION_ERROR: 'Validation error',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  NOT_FOUND: 'Resource not found',
  RATE_LIMITED: 'Too many requests',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
} as const;

export const ALL_ERRORS = {
  ...AUTH_ERRORS,
  ...USER_ERRORS,
  ...PRODUCT_ERRORS,
  ...PAYMENT_ERRORS,
  ...COMMON_ERRORS,
} as const; 
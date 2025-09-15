export const AUTH_EVENTS = {
  USER_REGISTERED: 'auth.user.registered',
  USER_LOGIN: 'auth.user.login',
  USER_LOGOUT: 'auth.user.logout',
  PASSWORD_RESET_REQUESTED: 'auth.password.reset.requested',
  PASSWORD_RESET_COMPLETED: 'auth.password.reset.completed',
  EMAIL_VERIFICATION_REQUESTED: 'auth.email.verification.requested',
  EMAIL_VERIFIED: 'auth.email.verified',
} as const;

export const USER_EVENTS = {
  PROFILE_UPDATED: 'user.profile.updated',
  DELETED: 'user.deleted',
  PREFERENCES_UPDATED: 'user.preferences.updated',
} as const;

export const PRODUCT_EVENTS = {
  CREATED: 'product.created',
  UPDATED: 'product.updated',
  DELETED: 'product.deleted',
  INVENTORY_UPDATED: 'product.inventory.updated',
  LOW_STOCK_ALERT: 'product.inventory.low_stock',
} as const;

export const PAYMENT_EVENTS = {
  ORDER_CREATED: 'payment.order.created',
  ORDER_STATUS_UPDATED: 'payment.order.status.updated',
  PAYMENT_PROCESSED: 'payment.processed',
  PAYMENT_FAILED: 'payment.failed',
  REFUND_PROCESSED: 'payment.refund.processed',
} as const;

export const ALL_EVENTS = {
  ...AUTH_EVENTS,
  ...USER_EVENTS,
  ...PRODUCT_EVENTS,
  ...PAYMENT_EVENTS,
} as const; 
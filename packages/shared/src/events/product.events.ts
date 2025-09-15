export interface ProductCreatedEvent {
  productId: string;
  name: string;
  price: number;
  categoryId: string;
  timestamp: Date;
}

export interface ProductUpdatedEvent {
  productId: string;
  changes: Record<string, any>;
  timestamp: Date;
}

export interface ProductDeletedEvent {
  productId: string;
  name: string;
  timestamp: Date;
}

export interface InventoryUpdatedEvent {
  productId: string;
  previousQuantity: number;
  newQuantity: number;
  reason: string;
  timestamp: Date;
}

export interface LowStockAlertEvent {
  productId: string;
  name: string;
  currentQuantity: number;
  threshold: number;
  timestamp: Date;
} 
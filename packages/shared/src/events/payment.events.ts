import { OrderStatus, PaymentStatus, PaymentMethod } from '../types/payment.types';

export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  total: number;
  currency: string;
  timestamp: Date;
}

export interface OrderStatusUpdatedEvent {
  orderId: string;
  userId: string;
  previousStatus: OrderStatus;
  newStatus: OrderStatus;
  timestamp: Date;
}

export interface PaymentProcessedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  timestamp: Date;
}

export interface PaymentFailedEvent {
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reason: string;
  timestamp: Date;
}

export interface RefundProcessedEvent {
  refundId: string;
  paymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  timestamp: Date;
} 
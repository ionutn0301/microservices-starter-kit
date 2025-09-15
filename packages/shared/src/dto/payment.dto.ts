import { IsString, IsNumber, IsArray, IsEnum, IsObject, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '../types/payment.types';

export class CreateOrderDto {
  @IsArray()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsObject()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsOptional()
  @IsObject()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class OrderItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ShippingAddressDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsString()
  street: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  country: string;

  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class BillingAddressDto extends ShippingAddressDto {}

export class ProcessPaymentDto {
  @IsString()
  orderId: string;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @IsOptional()
  @IsObject()
  paymentDetails?: Record<string, any>;
} 
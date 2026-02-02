import { IsString, IsNumber, IsArray, IsEnum, IsObject, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../types/payment.types';

export class OrderItemDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod_abc123',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Quantity to order',
    example: 2,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ShippingAddressDto {
  @ApiProperty({
    description: 'Recipient first name',
    example: 'John',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Recipient last name',
    example: 'Doe',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main St',
  })
  @IsString()
  street: string;

  @ApiProperty({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State or province',
    example: 'NY',
  })
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Country',
    example: 'USA',
  })
  @IsString()
  country: string;

  @ApiProperty({
    description: 'Postal code',
    example: '10001',
  })
  @IsString()
  postalCode: string;

  @ApiPropertyOptional({
    description: 'Contact phone number',
    example: '+1-555-123-4567',
  })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class BillingAddressDto extends ShippingAddressDto {}

export class CreateOrderDto {
  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
    example: [{ productId: 'prod_abc123', quantity: 2 }],
  })
  @IsArray()
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Shipping address',
    type: ShippingAddressDto,
  })
  @IsObject()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiPropertyOptional({
    description: 'Billing address (defaults to shipping address if not provided)',
    type: BillingAddressDto,
  })
  @IsOptional()
  @IsObject()
  @Type(() => BillingAddressDto)
  billingAddress?: BillingAddressDto;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}

export class ProcessPaymentDto {
  @ApiProperty({
    description: 'Order ID to process payment for',
    example: 'order_xyz789',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Payment-specific details (card token, etc.)',
    example: { cardToken: 'tok_visa_4242' },
  })
  @IsOptional()
  @IsObject()
  paymentDetails?: Record<string, any>;
} 

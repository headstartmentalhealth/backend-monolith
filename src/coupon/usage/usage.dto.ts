import { Prisma } from '@prisma/client';
import {
  IsDecimal,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateCouponUsageDto {
  @IsNotEmpty()
  @IsUUID()
  coupon_id: string; // Coupon ID used by the user

  @IsNotEmpty()
  @IsUUID()
  user_id: string; // User ID who used the coupon

  @IsNotEmpty()
  @IsDecimal()
  discount_applied: Prisma.Decimal; // Discount applied
}

export class ValidateCouponUsageDto {
  @IsNotEmpty()
  @IsString()
  coupon_code: string; // Coupon ID used by the user

  @IsNotEmpty()
  @IsUUID()
  user_id: string; // User ID who used the coupon

  @IsOptional()
  @IsNumber()
  discount_applied?: number; // Discount applied
}

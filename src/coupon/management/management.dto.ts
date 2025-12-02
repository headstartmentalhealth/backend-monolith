import { BooleanOptions } from '@/generic/generic.utils';
import { PartialType } from '@nestjs/mapped-types';
import { CouponType } from '@prisma/client';
import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsEnum,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string; /** Unique coupon code */

  @IsNotEmpty()
  @IsEnum(CouponType)
  type: CouponType; /** Type of discount CouponType */

  @IsNotEmpty()
  @IsNumber()
  value: number; /** Discount value */

  @IsNotEmpty()
  @IsString() // Accepts strings as input
  start_date: string; /** Start date for coupon validity */

  @IsNotEmpty()
  @IsString() // Accepts strings as input
  end_date: string; /** Expiration date for coupon */

  @IsNotEmpty()
  @IsNumber()
  usage_limit: number; /** Maximum times the coupon can be used globally */

  @IsNotEmpty()
  @IsNumber()
  user_limit: number; /** Maximum times the coupon can be used per user */

  @IsNotEmpty()
  @IsNumber()
  min_purchase: number; /** Minimum purchase amount required to use the coupon */

  @IsNotEmpty()
  @IsUUID()
  business_id: string; /** Business ID associated with the coupon */
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  @IsBoolean()
  @IsOptional()
  is_active?: boolean;
}

export class FilterCouponsDto {
  @IsOptional()
  @IsEnum(BooleanOptions, {
    message: `Status must be one of: ${Object.keys(BooleanOptions).join(', ')}`,
  })
  is_active?: BooleanOptions;

  @IsString()
  @IsOptional()
  q?: string;

  @IsUUID()
  @IsOptional()
  business_id: string;
}

export class ApplyCouponDto {
  @IsString()
  email: string;

  @IsString()
  code: string;

  @IsString()
  amount: string;
}

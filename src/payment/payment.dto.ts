import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  PaymentStatus,
  PurchaseType,
  PaymentMethod,
  ProductType,
} from '@prisma/client';
import { MeasurementMetadataDto, QueryDto } from '@/generic/generic.dto';
import { Type } from 'class-transformer';

export class CreatePaymentDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  purchases: PurchaseItemDto[];

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  business_id: string;

  @IsString()
  @IsOptional()
  coupon_code?: string;

  @IsEnum(PaymentMethod)
  @IsOptional()
  payment_method: PaymentMethod;

  @IsUUID()
  @IsOptional()
  billing_id?: string;

  @IsOptional()
  metadata?: any;
}

class PurchaseItemDto {
  @IsUUID()
  @IsNotEmpty()
  purchase_id: string;

  @IsEnum(ProductType)
  @IsNotEmpty()
  purchase_type: ProductType;

  @IsInt()
  @IsNotEmpty()
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasurementMetadataDto)
  metadata?: MeasurementMetadataDto[];

  // @ValidateIf((o) => o.purchase_type === ProductType.TICKET)
  // @IsUUID()
  // @IsNotEmpty()
  // ticket_tier_id?: string; // Required only if purchase_type is TICKET
}

export class VerifyPaymentDto {
  @IsString()
  @IsOptional()
  payment_id?: string;
}

export class PaymentIdDto {
  @IsString()
  @IsOptional()
  payment_id?: string;
}

export class QueryPaymentsDto extends QueryDto {
  @IsEnum(PurchaseType, {
    message: `Purchase type must be one of: ${Object.keys(PurchaseType).join(', ')}`,
  })
  @IsOptional()
  purchase_type?: PurchaseType;

  @IsEnum(PaymentStatus)
  @IsOptional()
  payment_status?: PaymentStatus;

  @IsUUID()
  @IsOptional()
  business_id?: string;

  @IsString()
  @IsOptional()
  q?: string;
}

export class PaymentMetaDataDto {
  @IsOptional()
  @IsString()
  reason: string;

  @IsOptional()
  @IsString()
  business_id: string;
}

export class InitiateWithdrawalDto {
  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsNotEmpty()
  @IsString()
  currency: string;
}

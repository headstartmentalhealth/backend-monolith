import { PaymentMethod } from '@prisma/client';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsUUID,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsObject,
} from 'class-validator';
import { QueryDto } from '@/generic/generic.dto';

export class CreateSubscriptionDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsUUID()
  plan_price_id: string; // Plan price is related to the plan

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;

  @IsOptional()
  @IsUUID()
  billing_id?: string;

  @IsNotEmpty()
  @IsBoolean()
  auto_renew: boolean;

  @IsNotEmpty()
  @IsString()
  currency: string;
}

export class VerifySubscriptionDto {
  @IsNotEmpty()
  @IsUUID()
  payment_id: string;
}

export class RenewSubscriptionDto {
  @IsNotEmpty()
  @IsUUID()
  subscription_id: string;
}

export class UpgradeSubscriptionDto {
  @IsNotEmpty()
  @IsUUID()
  new_plan_price_id: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  payment_method: PaymentMethod;
}

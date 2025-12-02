import { SubscriptionPeriod } from '@prisma/client';
import { IsDecimal, IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSubscriptionPlanPriceDto {
  @IsUUID()
  @IsNotEmpty()
  subscription_plan_id: string;

  @IsDecimal()
  @IsNotEmpty()
  price: number;

  @IsEnum(SubscriptionPeriod)
  @IsNotEmpty()
  period: SubscriptionPeriod;
}

export class UpdateSubscriptionPlanPriceDto extends PartialType(
  CreateSubscriptionPlanPriceDto,
) {}

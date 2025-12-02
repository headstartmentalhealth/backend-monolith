import { QueryDto } from '@/generic/generic.dto';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { ProductStatus, SubscriptionPeriod } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDecimal,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class CreateSubscriptionPlanDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  slug: string;

  @IsNotEmpty()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID()
  multimedia_id?: string;

  @IsNotEmpty()
  @IsUUID()
  business_id: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;
}

export class UpdateSubscriptionPlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(36)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cover_image?: string;

  @IsNotEmpty()
  @IsString()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  multimedia_id?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;
}

export class FilterPlansDto {
  @IsOptional()
  @IsEnum(SubscriptionPeriod, {
    message: `Period must be one of: ${Object.keys(SubscriptionPeriod).join(', ')}`,
  })
  period?: SubscriptionPeriod;
}

export class FilterBusinessPlansDto extends QueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsUUID()
  @IsOptional()
  business_id: string;
}

export class CreateSubscriptionPlanPriceDto {
  @IsDecimal()
  price: number;

  @IsString()
  currency: string;

  @IsEnum(SubscriptionPeriod)
  period: SubscriptionPeriod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class CreateSubscriptionPlanRoleDto {
  @IsString()
  title: string;

  @IsString()
  role_id: string;

  @IsBoolean()
  @IsOptional()
  selected?: boolean;
}

export class CreateSubscriptionPlanDto2 {
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  slug: string;

  @IsString()
  business_id: string;

  @IsNotEmpty()
  @IsString()
  category_id?: string;

  @IsString()
  creator_id: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsUUID()
  multimedia_id?: string;

  @IsString()
  @IsOptional()
  cover_image?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;

  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionPlanPriceDto)
  @IsArray()
  subscription_plan_prices: CreateSubscriptionPlanPriceDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateSubscriptionPlanRoleDto)
  @IsArray()
  subscription_plan_roles: CreateSubscriptionPlanRoleDto[];
}

export class UpdateSubscriptionPlanPriceDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsDecimal()
  price: number;

  @IsString()
  currency: string;

  @IsEnum(SubscriptionPeriod)
  period: SubscriptionPeriod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class UpdateSubscriptionPlanRoleDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  title: string;

  @IsString()
  role_id: string;

  @IsOptional()
  @IsBoolean()
  selected?: boolean;
}

export class UpdateSubscriptionPlanDto2 {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(36)
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  cover_image?: string;

  @IsOptional()
  @IsUUID()
  multimedia_id?: string;

  @IsOptional()
  @IsUUID()
  category_id?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status: ProductStatus;

  @ValidateNested({ each: true })
  @Type(() => UpdateSubscriptionPlanPriceDto)
  @IsArray()
  @IsOptional()
  subscription_plan_prices: UpdateSubscriptionPlanPriceDto[];

  @ValidateNested({ each: true })
  @Type(() => UpdateSubscriptionPlanRoleDto)
  @IsArray()
  @IsOptional()
  subscription_plan_roles?: UpdateSubscriptionPlanRoleDto[];
}

export class FilterPlanDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

export class FilterSubscriptionPlanDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsUUID()
  @IsOptional()
  id?: string;
}

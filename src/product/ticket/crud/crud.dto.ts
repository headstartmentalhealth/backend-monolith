import { QueryDto } from '@/generic/generic.dto';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { PartialType, OmitType } from '@nestjs/mapped-types';
import {
  EventType,
  ProductStatus,
  TicketTierStatus,
  ProductType,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class BaseTicketTierDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsNotEmpty()
  original_amount: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  quantity?: number;

  @IsNumber()
  @IsOptional()
  remaining_quantity?: number;

  @IsNumber()
  @IsOptional()
  max_per_purchase?: number;

  @IsBoolean()
  @IsOptional()
  default_view?: boolean;

  @IsEnum(TicketTierStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: TicketTierStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class CreateTicketTierDto extends BaseTicketTierDto {}

export class UpdateTicketTierDto extends PartialType(BaseTicketTierDto) {
  @IsUUID()
  @IsOptional()
  id?: string;
}

export class BaseTicketDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsOptional()
  metadata?: any;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;

  @IsUUID()
  @IsNotEmpty()
  multimedia_id: string;

  @IsOptional()
  @IsString()
  event_time?: string;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  event_start_date: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  event_end_date: Date;

  @IsString()
  @IsNotEmpty()
  event_location: string;

  @IsEnum(EventType)
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  event_type: EventType;

  @IsString()
  @IsOptional()
  auth_details?: string;

  // 🔹 Make required and validate each
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketTierDto)
  @ArrayMinSize(1) // ✅ ensures at least one tier is provided
  @IsNotEmpty()
  ticket_tiers: CreateTicketTierDto[];
}

export class CreateTicketDto extends BaseTicketDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTicketTierDto)
  @ArrayMinSize(1) // ✅ again ensures required in the override
  @IsNotEmpty()
  override ticket_tiers: CreateTicketTierDto[];
}

export class UpdateTicketDto extends PartialType(
  OmitType(BaseTicketDto, ['ticket_tiers'] as const),
) {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateTicketTierDto)
  @IsOptional()
  ticket_tiers?: UpdateTicketTierDto[];
}

export class FilterProductDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;

  @IsUUID()
  @IsOptional()
  business_id: string;

  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  min_price?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  max_price?: number;

  @IsString()
  @IsOptional()
  currency?: string;
}

export class TicketTierIdDto {
  @IsUUID()
  @IsNotEmpty()
  ticket_tier_id: string;
}

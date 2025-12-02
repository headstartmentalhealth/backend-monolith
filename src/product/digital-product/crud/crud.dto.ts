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

export class CreateDigitalProductDto {
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

  @IsUUID()
  @IsNotEmpty()
  multimedia_zip_id: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  original_price?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class UpdateDigitalProductDto extends PartialType(
  CreateDigitalProductDto,
) {}

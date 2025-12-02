import { QueryDto } from '@/generic/generic.dto';
import { OtherCurrencyDto } from '@/product/course/crud/crud.dto';
import { PartialType } from '@nestjs/mapped-types';
import {
  PhysicalProductGender,
  PhysicalProductType,
  ProductStatus,
  ProductType,
} from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

//
// --- Nested DTO for Physical Product ---
//
export class PhysicalProductDto {
  @IsOptional()
  @IsArray()
  sizes?: any[]; // You can define a more specific type later, e.g., Array<{ label: string; value: string }>

  @IsOptional()
  @IsArray()
  colors?: any[];

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsInt()
  @IsNotEmpty()
  stock: number; // stocks available

  @IsEnum(PhysicalProductType)
  @IsOptional()
  @Transform(({ value }) => value?.toLowerCase())
  type?: PhysicalProductType;

  @IsOptional()
  @IsArray()
  measurements?: any[];

  @IsEnum(PhysicalProductGender)
  @IsNotEmpty()
  gender: PhysicalProductGender;

  @IsOptional()
  @IsInt()
  estimated_production_time?: number;

  @IsOptional()
  @IsInt()
  min_required?: number;

  // ✅ New property for multiple multimedia IDs
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  multimedia_ids?: string[];
}

export class CreatePhysicalProductDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(36)
  slug: string;

  @IsString()
  @IsNotEmpty()
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

  //
  // --- Physical Product Nested Field ---
  //
  @ValidateNested()
  @Type(() => PhysicalProductDto)
  @IsNotEmpty()
  details: PhysicalProductDto;
}

export class UpdatePhysicalProductDto extends PartialType(
  CreatePhysicalProductDto,
) {}

export class AddPhysicalProductMedia {
  @IsNotEmpty()
  @IsArray()
  multimedia_ids: string[];
}

export class ProductDto {
  @IsNotEmpty()
  @IsUUID()
  product_id: string;
}

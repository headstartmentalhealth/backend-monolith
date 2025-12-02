import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { ProductStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { QueryDto } from '@/generic/generic.dto';
import { Type } from 'class-transformer';

export class CreateCourseDto {
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
  metadata?: any; // JSON data

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
  original_price: number;

  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class UpdateCourseDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsNumber()
  @IsOptional()
  original_price: number;

  @IsString()
  @IsOptional()
  @MaxLength(36)
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsOptional()
  metadata?: any; // JSON data

  @IsUUID()
  @IsOptional()
  category_id?: string;

  @IsUUID()
  @IsOptional()
  multimedia_id?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class FilterCourseDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus;
}

export class BulkCreateCourseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportCourseDto)
  courses: ImportCourseDto[];
}

export class ImportCourseDto {
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

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  original_price: number;

  @IsString()
  @IsOptional()
  keywords?: string;

  @IsOptional()
  metadata?: any;

  @IsString()
  @IsNotEmpty()
  multimedia_url: string;

  @IsString()
  @IsNotEmpty()
  category_name: string;

  @IsEnum(ProductStatus)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  status?: ProductStatus = ProductStatus.DRAFT;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OtherCurrencyDto)
  @IsOptional()
  other_currencies?: OtherCurrencyDto[];
}

export class OtherCurrencyDto {
  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsNumber()
  @IsNotEmpty()
  price: number;

  @IsNumber()
  @IsOptional()
  original_price?: number;
}

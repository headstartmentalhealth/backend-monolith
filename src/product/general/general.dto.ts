import { QueryDto } from '@/generic/generic.dto';
import { ProductStatus, ProductType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

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
}

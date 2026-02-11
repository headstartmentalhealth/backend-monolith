import {
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  IsUrl,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { ResourceType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { QueryDto } from '@/generic/generic.dto';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ResourceType)
  @IsNotEmpty()
  @Transform(({ value }) => value?.toUpperCase())
  resource_type: ResourceType;

  @IsUrl()
  @IsOptional()
  content_url?: string;

  @IsUrl()
  @IsOptional()
  cover_image?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  age_range?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : value))
  minutes?: number;
}

export class UpdateResourceDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ResourceType)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  resource_type?: ResourceType;

  @IsUrl()
  @IsOptional()
  content_url?: string;

  @IsUrl()
  @IsOptional()
  cover_image?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  age_range?: string;

  @IsString()
  @IsOptional()
  topic?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value) : value))
  minutes?: number;
}

export class FilterResourceDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsEnum(ResourceType)
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase())
  resource_type?: ResourceType;
}

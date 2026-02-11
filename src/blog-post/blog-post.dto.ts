import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNotEmpty,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { QueryDto } from '@/generic/generic.dto';

export class CreateBlogPostDto {
  @IsString()
  @IsOptional()
  author_id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsUrl()
  @IsOptional()
  cover_image?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsDateString()
  @IsOptional()
  published_at?: Date;
}

export class UpdateBlogPostDto {
  @IsString()
  @IsOptional()
  author_id?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsUrl()
  @IsOptional()
  cover_image?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsDateString()
  @IsOptional()
  published_at?: Date;
}

export class FilterBlogPostDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsBoolean()
  @IsOptional()
  is_published?: boolean;

  @IsString()
  @IsOptional()
  category?: string;
}

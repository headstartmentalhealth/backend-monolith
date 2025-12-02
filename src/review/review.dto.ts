// create-review.dto.ts
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { QueryDto } from '@/generic/generic.dto';

export class CreateReviewDto {
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsNotEmpty()
  product_id: string;
}

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}

export class QueryReviewsDto extends QueryDto {
  @IsUUID()
  @IsOptional()
  product_id?: string;

  @IsString()
  @IsOptional()
  q?: string;
}

export class AverageRatingDto {
  product_id: string;

  averageRating: number;

  totalReviews: number;
}

export class FetchReviewAvgDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;
}

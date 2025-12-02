import { QueryDto } from '@/generic/generic.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateProductCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}

export class FilterProductCategoryDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

import { MeasurementMetadataDto, QueryDto } from '@/generic/generic.dto';
import { ProductType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsEnum(ProductType)
  @IsNotEmpty()
  product_type: ProductType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  metadata?: any;
}

export class UpdateCartItemDto {
  @IsInt()
  @Min(0)
  quantity: number; // If 0, item should be removed
}

export class RemoveCartItemsDto {
  @IsUUID()
  @IsNotEmpty()
  user_id: string;

  @IsArray()
  @IsNotEmpty()
  product_ids: string[];
}

export class FilterCartDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;

  @IsUUID()
  @IsOptional()
  business_id: string;
}

export class AddMultipleToCartItemDto {
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @IsEnum(ProductType)
  @IsNotEmpty()
  product_type: ProductType;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MeasurementMetadataDto)
  metadata?: MeasurementMetadataDto[];
  // {
  //   "metadata": {
  //     "customer_name": "Jane Doe",
  //     "upper_body": {
  //       "bust_circumference": { "value": 34, "unit": "inch" },
  //       "shoulder_width": { "value": 15, "unit": "inch" }
  //     },
  //     "lower_body": {
  //       "waist_circumference": { "value": 28, "unit": "inch" },
  //       "hip_circumference": { "value": 36, "unit": "inch" }
  //     },
  //     "full_body": {
  //       "height": { "value": 165, "unit": "cm" },
  //       "dress_length": { "value": 145, "unit": "cm" }
  //     }
  //   }
  // }[]
}

export class AddMultipleToCartDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddMultipleToCartItemDto)
  items: AddMultipleToCartItemDto[];
}

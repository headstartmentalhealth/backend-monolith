import {
  IsNotEmpty,
  IsUUID,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';

export class BusinessAnalyticsDto {
  @IsNotEmpty()
  @IsUUID()
  business_id: string;
}

export class ProductRevenueMonthlyDto {
  @IsOptional()
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}

import { PartialType } from '@nestjs/mapped-types';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  Length,
  IsBoolean,
} from 'class-validator';

export class CreateBillingInformationDto {
  @IsNotEmpty()
  @IsString()
  address: string;

  @IsNotEmpty()
  @IsString()
  state: string;

  @IsNotEmpty()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  apartment?: string;

  @IsNotEmpty()
  @IsString()
  @Length(5, 11)
  postal_code: string;

  @IsNotEmpty()
  @IsString()
  @Length(2, 2)
  country: string;

  @IsOptional()
  @IsBoolean()
  selected?: boolean;
}

export class UpdateBillingInformationDto extends PartialType(
  CreateBillingInformationDto,
) {}

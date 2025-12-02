import { Injectable } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsDecimal,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { UUID } from 'crypto';

export class IdDto {
  @IsUUID()
  id: string;
}

export class TypeDto {
  @IsString()
  type: string;
}

export class IdDtoAlias {
  @IsString()
  id: string;
}

@ValidatorConstraint({ async: true })
@Injectable()
export class UniqueColumnConstraint implements ValidatorConstraintInterface {
  async validate(
    value: any,
    validationArguments?: ValidationArguments,
  ): Promise<boolean> {
    return true;
  }
}

export class Pagination {
  @IsNumber()
  limit: number;

  @IsNumber()
  page: number;
}

export class QueryDto {
  @IsDateString()
  @IsOptional()
  // { message: 'Start date must be a valid ISO 8601 date string' }
  startDate?: string;

  @IsDateString()
  @IsOptional()
  // { message: 'End date must be a valid ISO 8601 date string' }
  endDate?: string;

  @IsObject({ each: true })
  @IsOptional()
  pagination: Pagination;
}

export class EmailDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(320)
  email: string;
}

export class TZ {
  tz: string;
}

export class BusinessDto {
  @IsNotEmpty()
  @IsString()
  business_id: string;
}

export class UserDto {
  @IsNotEmpty()
  @IsUUID()
  user_id: string;
}

export enum ChartType {
  PIE_CHART = 'pie-chart',
  BAR_CHART = 'bar-chart',
}

export class ChartDto {
  @IsNotEmpty()
  @IsEnum(ChartType, {
    message: `chart type must be of the following: ${Object.values(ChartType).join(', ')}`,
  })
  chart_type: ChartType;
}

export class CurrencyDto {
  @IsString()
  @IsNotEmpty()
  currency: string = 'NGN';
}

class MeasurementFieldDto {
  @IsOptional()
  @IsNumber()
  value?: number;

  @IsOptional()
  @IsString()
  unit?: string;
}

class UpperBodyDto {
  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  bust_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  shoulder_width?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  armhole_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  sleeve_length?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  bicep_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  wrist_circumference?: MeasurementFieldDto;
}

class LowerBodyDto {
  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  waist_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  hip_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  thigh_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  knee_circumference?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  trouser_length?: MeasurementFieldDto;
}

class FullBodyDto {
  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  height?: MeasurementFieldDto;

  @ValidateNested()
  @Type(() => MeasurementFieldDto)
  @IsOptional()
  dress_length?: MeasurementFieldDto;
}

export class MeasurementMetadataDto {
  @IsOptional()
  @IsString()
  customer_name?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  // Upper Body
  @IsOptional()
  @IsDecimal()
  bust_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  shoulder_width?: Decimal;

  @IsOptional()
  @IsDecimal()
  armhole_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  sleeve_length?: Decimal;

  @IsOptional()
  @IsDecimal()
  bicep_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  wrist_circumference?: Decimal;

  // Lower Body
  @IsOptional()
  @IsDecimal()
  waist_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  hip_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  thigh_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  knee_circumference?: Decimal;

  @IsOptional()
  @IsDecimal()
  trouser_length?: Decimal;

  // Full Body
  @IsOptional()
  @IsDecimal()
  height?: Decimal;

  @IsOptional()
  @IsDecimal()
  dress_length?: Decimal;
}

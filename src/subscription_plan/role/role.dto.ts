import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';

export class CreateSubscriptionPlanRoleDto {
  @IsUUID()
  @IsNotEmpty()
  subscription_plan_id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;
}

export class UpdateSubscriptionPlanRoleDto extends PartialType(
  CreateSubscriptionPlanRoleDto,
) {
  @IsOptional()
  @IsBoolean()
  selected: boolean;
}

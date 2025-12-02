import { Role } from '@/generic/generic.data';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UUID } from 'crypto';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsString()
  @IsNotEmpty()
  user_group: Role;

  @IsString()
  @IsOptional()
  user_id?: string;

  @IsString()
  @IsOptional()
  link?: string;
}

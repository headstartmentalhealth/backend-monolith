import { QueryDto } from '@/generic/generic.dto';
import { Action } from '@prisma/client';
import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsObject,
  IsIP,
  IsDateString,
  IsNumber,
} from 'class-validator';

export class CreateLogDto {
  @IsUUID()
  @IsOptional()
  user_id?: string;

  @IsEnum(Action)
  action: Action;

  @IsString()
  entity: string;

  @IsUUID()
  @IsOptional()
  entity_id?: string;

  @IsObject()
  metadata: any;

  @IsOptional()
  @IsIP()
  ip_address?: string;

  @IsOptional()
  @IsString()
  user_agent?: string;
}

export class FilterLogDto extends QueryDto {
  @IsString()
  @IsOptional()
  q?: string;
}

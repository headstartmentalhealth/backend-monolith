import { QueryDto } from '../generic/generic.dto';
import { Injectable, Query } from '@nestjs/common';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

@Injectable()
export class CreateRoleGroupDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class CreateRoleDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsNotEmpty()
  @IsUUID()
  role_group_id: string; // Assuming this is required to associate with a RoleGroup
}

export class RoleQueryDto extends QueryDto {
  @IsOptional()
  @IsUUID()
  role_group_id?: string;
}
